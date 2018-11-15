'use strict'

const {
  BaseService, _, HttpError, Util
} = require('@kennynguyen/bigbom-core')
const AdSetModel = require('../models/adset-model')
const FB = require('@kennynguyen/bigbom-iads-core')
const Const = require('../constants/common')
const CampaignService = require('./campaign-service')
const Moment = require('moment')
const rpcClientIAdsAds = require('../grpc/rpc-client-iads-ads')

class FbAdSetService extends BaseService {
  create (doc) {
    return new Promise(async (resolve, reject) => {
      try {
        const campaignId = doc.campaignId
        const campaign = await CampaignService.findById(campaignId)
        if (!campaign) {
          return reject(HttpError(404, 'CampaignNotFound'))
        }
        /** Either daily_budget or lifetime_budget is required */
        if (!!doc.daily_budget + !!doc.lifetime_budget !== 1) {
          return reject(HttpError(403, 'Either_daily_budget_or_lifetime_budget'))
        }
        let minDailyBudget // Dollar
        /** If is_autobid is true */
        if (doc.is_autobid) {
          switch (doc.billing_event) {
            case 'IMPRESSIONS':
              minDailyBudget = 0.5
              break
            case 'CLICKS':
            case 'LINK_CLICKS':
            case 'PAGE_LIKES':
            case 'VIDEO_VIEWS':
              minDailyBudget = 2.5
              break
            case 'APP_INSTALLS':
            case 'OFFER_CLAIMS':
            case 'POST_ENGAGEMENT':
              minDailyBudget = 40
              break
            default:
              minDailyBudget = 0
              break
          }
        } else {
          if (doc.bid_strategy !== 'LOWEST_COST_WITHOUT_CAP' && !doc.bid_amount) {
            return reject(HttpError(403, 'BidAmount'))
          }
          const bidAmount = doc.bid_amount
          if (doc.billing_event === 'NONE') {
            minDailyBudget = 0
          } else if (doc.billing_event === 'IMPRESSIONS') {
            minDailyBudget = bidAmount
          } else {
            minDailyBudget = bidAmount * 5
          }
        }
        let dailyBudget = 0
        if (doc.daily_budget) {
          dailyBudget = doc.daily_budget
          delete doc.end_time
        } else {
          // end_time is required
          if (!doc.end_time) {
            return reject(HttpError(403, 'end_time'))
          }
          // Calculate for duration from start_time to end_time
          const startTime = doc.start_time ? Moment(doc.start_time) : Moment()
          const diffTime = Moment(doc.end_time)
            .diff(startTime)
          const duration = Moment.duration(diffTime)
            .asDays()
          /* istanbul ignore else */
          if (duration <= 0) {
            return reject(HttpError(403, 'DurationIsInvalid'))
          }
          /* istanbul ignore next */
          dailyBudget = doc.lifetime_budget / duration
        }
        // Check if budget is too low
        if (dailyBudget <= minDailyBudget) {
          return reject(HttpError(403, 'BudgetIsTooLow'))
        }
        // Special countries: Australia, Austria, Belgium, Canada, Denmark, Finland, France, Germany, Greece, Hong Kong, Israel, Italy, Japan, Netherlands, New Zealand, Norway, Singapore, South Korea, Spain, Sweden, Switzerland, Taiwan, United Kingdom, United States of America
        doc.status = 'DRAFT'
        doc.fbAdAccountId = campaign.fbAdAccountId
        const result = await super.create(doc)
        resolve(result)
      } catch (e) {
        global.Logger.error(e)
        reject(e)
      }
    })
  }

  updateOne (conditions, update, options) {
    return new Promise(async (resolve, reject) => {
      try {
        const item = await this.findOne(conditions)
        if (!item) {
          throw HttpError(404, 'NotFoundOrDenied')
        }
        update.updatedAt = Date.now()
        if (item.oldData) {
          delete item.oldData
        }
        update.oldData = item
        super.updateById(item._id, update, options).then(async result => {
          if (result.fbId) {
            const docInQueue = Object.assign(update, {
              _id: item._id,
              fbAdAccountId: item.fbAdAccountId,
              fbId: item.fbId
            })
            // Add to queue
            global.Queue.enQueue(Const.REDIS_ADSET_QUEUE, {
              action: 'update',
              data: docInQueue
            }).then().catch()
          }
          resolve(result)
        }).catch(e => {
          reject(e)
        })
      } catch (e) {
        global.Logger.error(e)
        reject(e)
      }
    })
  }

  getListAdSetUnpublished (campaignId, options) {
    const conditions = {
      fbCampaignId: {
        $exists: true
      },
      status: 'DRAFT'
    }
    if (campaignId) {
      conditions.campaignId = campaignId
    }
    return this.find(conditions, null, options)
  }

  async getAccessToken (adAccountId) {
    try {
      return await global.Redis.hget(Const.REDIS_ACCESS_TOKEN, adAccountId)
    } catch (e) {
      global.Logger.error(e)
      throw e
    }
  }

  async createFBAdSet (item) {
    try {
      const doc = item.data
      const adAccountId = doc.fbAdAccountId
      const accessToken = await this.getAccessToken(adAccountId)
      if (!accessToken || accessToken === 'null') {
        this.sendQueue(Const.REDIS_ADSET_QUEUE, item.action, item.data)
        throw HttpError(403, 'MissingAccessTokenOrExpired')
      }
      try {
        const id = doc._id
        const fbCampaignId = doc.fbCampaignId
        const fields = Const.CreateFields
        const params = {}
        fields.forEach(field => {
          if (doc[field]) {
            params[field] = doc[field]
          }
        })
        params.status = 'ACTIVE'
        const fb = new FB(accessToken, adAccountId)
        const result = await fb.createAdSet(fbCampaignId, params)
        const adSet = await this.updateById(id, {
          status: 'ACTIVE',
          fbId: result.id
        })
        /* istanbul ignore else */
        if (adSet) {
          rpcClientIAdsAds.updateFbAdSetId(id, {
            fbAdSetId: result.id,
            fbCampaignId: fbCampaignId
          }).then().catch()
        }
        return result.id
      } catch (e) {
        this.handleAccessTokenExpired(doc.fbAdAccountId, e)
        this.retryAndUpdateError(item, e.response).then().catch()
        throw e
      }
    } catch (e) {
      global.Logger.error(e)
      throw e
    }
  }

  async updateFBAdSet (item) {
    try {
      const doc = item.data
      const adAccountId = doc.fbAdAccountId
      const accessToken = await this.getAccessToken(adAccountId)
      if (!accessToken || accessToken === 'null') {
        this.sendQueue(Const.REDIS_ADSET_QUEUE, item.action, item.data)
        throw HttpError(403, 'MissingAccessTokenOrExpired')
      }
      try {
        const fields = Const.UpdateFields
        const params = {}
        fields.forEach(field => {
          if (doc[field]) {
            params[field] = doc[field]
          }
        })
        const fb = new FB(accessToken, adAccountId)
        const result = await fb.updateAdSet(doc.fbId, params)
        if (result.success && (doc.bid_amount !== doc.oldData['bid_amount'])) {
          const condition = {
            adSetId: doc._id,
            fbAdSetId: doc.fbId
          }
          const update = {
            bid_amount: doc.bid_amount
          }
          rpcClientIAdsAds.updateMany(condition, update).then().catch()
        }
        return result
      } catch (e) {
        this.findById(doc._id).then(adSet => {
          this.updateById(doc._id, {
            $set: adSet.oldData
          }).then().catch()
        }).catch(e => {
          throw e
        })
        this.handleAccessTokenExpired(doc.fbAdAccountId, e)
        throw e
      }
    } catch (e) {
      global.Logger.error(e)
      throw e
    }
  }

  async retryAndUpdateError (item, response) {
    try {
      const data = item.data
      const adSet = Object.assign({}, data)
      let subCode = 0
      let message = ''
      let code = 0
      let retry = false
      response = response || 'error'
      /* istanbul ignore else */
      if (response.error) {
        subCode = response.error.error_subcode
        message = response.error.error_user_msg || response.error.message || undefined
        if (Const.RetryCode.includes(code) || Const.RetryCode.includes(subCode)) {
          code = response.error.code
          if (data.error.length > 3) {
            /* istanbul ignore else */
            retry = true
          } else {
            this.sendQueue(Const.REDIS_ADSET_QUEUE, item.action, item.data)
          }
        }
      }
      const obj = {
        sub_code: subCode || '999999',
        message: message || response,
        code: code || '999',
        retry: retry
      }
      adSet.status = 'ERROR'
      return await super.updateById(adSet._id, {
        status: 'ERROR',
        $push: {
          error: obj
        }
      })
    } catch (e) {
      global.Logger.error(e)
      throw e
    }
  }

  getSyncFields (after) {
    after = after ? `.after(${after})` : ''
    return [`adsets.limit(${Const.FB_GET_LIMIT})${after}{id, adset_schedule, effective_status, attribution_spec, bid_amount, bid_strategy, ` +
    'billing_event, campaign_id, daily_budget, destination_type, end_time, lifetime_budget, name, optimization_goal, pacing_type, promoted_object, start_time, status, targeting}']
  }

  async handleSyncFBAdSets (item, after) {
    try {
      const data = item.data
      const campaign = data['campaign']
      const fbAdAccountId = campaign.fbAdAccountId
      const accessToken = await this.getAccessToken(fbAdAccountId)
      if (!accessToken || accessToken === 'null') {
        this.sendQueue(Const.REDIS_ADSET_QUEUE, item.action, item.data)
        throw HttpError(403, 'MissingAccessTokenOrExpired')
      }
      const userId = campaign.userId
      const fbCampaignId = campaign.fbId
      const fb = new FB(accessToken, fbAdAccountId)
      const result = await fb.getCampaign(fbCampaignId, this.getSyncFields(after))
      /* istanbul ignore else */
      if (result['_data']) {
        const fbAdSets = _.cloneDeep(result['_data']['adsets'])
        if (!_.isEmpty(fbAdSets)) {
          this.saveDataSyncAdSets(campaign, fbAdSets.data)
          this.saveFbAdSetToRedis(fbCampaignId, fbAdSets.data).then().catch()
          if (fbAdSets.paging.next) {
            const after = fbAdSets.paging['cursors'].after
            this.handleSyncFBAdSets(item, after).then().catch()
          } else {
            this.deleteAdSetsNotInFb(fbCampaignId, fbAdAccountId, userId).then().catch()
          }
        } else {
          this.deleteAdSetsNotInFb(fbCampaignId, fbAdAccountId, userId).then().catch()
        }
      }
      return true
    } catch (e) {
      this.handleAccessTokenExpired(item['data'].campaign.fbAdAccountId, e)
      global.Logger.error(e)
      throw e
    }
  }

  sendQueue (queue, data, action) {
    try {
      global.Queue.enQueue(queue, {
        action: action,
        data: data
      }).then().catch()
    } catch (e) {
      global.Logger.error(e)
      throw e
    }
  }

  async saveFbAdSetToRedis (fbId, fbAdSets) {
    try {
      let arr = await global.Redis.hget(Const.FB_SYNC_ADSETS, fbId) || []
      const adSets = fbAdSets.map(item => item.id)
      if (typeof arr === 'string') {
        arr = JSON.parse(arr)
      }
      arr = _.union(arr, adSets)
      global.Redis.hset(Const.FB_SYNC_ADSETS, fbId, JSON.stringify(arr)).then().catch()
      return true
    } catch (e) {
      global.Logger.error(e)
      throw e
    }
  }

  async deleteAdSetsNotInFb (fbCampaignId, fbAdAccountId, userId) {
    try {
      let bbAdSets = await super.find({
        fbCampaignId: fbCampaignId,
        userId: userId,
        fbAdAccountId: fbAdAccountId
      }) || []
      bbAdSets = bbAdSets.map(item => item.fbId)
      const adSets = JSON.parse((await global.Redis.hget(Const.FB_SYNC_ADSETS, fbCampaignId)) || '[]')
      const minusObject = _.difference(bbAdSets, adSets)
      super.deleteMany({
        userId: userId,
        fbId: {
          $in: minusObject
        }
      }).then().catch()
      const objDeleteIds = {
        userId: userId,
        fbAdSetIds: minusObject
      }
      this.sendQueue(Const.REDIS_AD_QUEUE, objDeleteIds, 'delete')
      global.Redis.hdel(Const.FB_SYNC_ADSETS, fbCampaignId).then().catch()
    } catch (e) {
      global.Logger.error(e)
      throw e
    }
  }

  saveDataSyncAdSets (campaign, adSets) {
    try {
      adSets.forEach(async item => {
        const fbAdSetId = item.id
        const docInQueue = Object.assign({}, item, {
          campaignId: campaign._id,
          fbAdAccountId: campaign.fbAdAccountId,
          userId: campaign.userId,
          fbCampaignId: item.campaign_id,
          fbId: fbAdSetId,
          syncAt: Date.now()
        })

        let adSet = await super.findOne({
          fbId: fbAdSetId, userId: campaign.userId
        })
        if (_.isEmpty(adSet)) {
          docInQueue.synced = true
          adSet = await super.create(docInQueue)
        } else {
          adSet = await super.updateById(adSet._id, docInQueue)
        }

        if (adSet) {
          // Add to queue
          const fields = `ads.limit(${Const.FB_GET_LIMIT}){id, bid_amount, creative, adset_id, campaign_id, effective_status, name, status}`
          const dataSync = {
            adSet: adSet,
            fields: [fields]
          }
          this.sendQueue(Const.REDIS_AD_QUEUE, dataSync, 'sync')
        }
      })
    } catch (e) {
      global.Logger.error(e)
      throw e
    }
  }

  async handledSyncDeleteAdSets (data) {
    try {
      const userId = data.userId
      const objDeleteIds = data.fbCampaignId
      /* istanbul ignore else */
      if (objDeleteIds) {
        super.deleteMany({
          userId: userId,
          fbCampaignId: objDeleteIds
        }).then().catch()
      }
      return true
    } catch (e) {
      global.Logger.error(e)
      throw e
    }
  }

  handleAccessTokenExpired (adAccountId, response) {
    if (Util.isAccessTokenExpired(response)) {
      global.Redis.hset(Const.REDIS_ACCESS_TOKEN, adAccountId, null).then().catch(e => global.Logger.error(e))
    }
  }
}

module.exports = new FbAdSetService(AdSetModel)
