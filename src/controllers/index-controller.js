'use strict'
const Service = require('../services/index-service')
const CampaignService = require('../services/campaign-service')
const Fields = [
  'userId',
  'channelId',
  'synced',
  'fbId',
  'fbAdAccountId',
  'name',
  'adlabels',
  'bid_strategy',
  'boosted_object_id',
  'brand_lift_studies',
  'budget_rebalance_flag',
  'budget_remaining',
  'buying_type',
  'can_create_brand_lift_study',
  'can_use_spend_cap',
  'configured_status',
  'created_time',
  'daily_budget',
  'effective_status',
  'lifetime_budget',
  'objective',
  'recommendations',
  'source_campaign_id',
  'spend_cap',
  'start_time',
  'stop_time',
  'updated_time',
  'status',
  'category',
  'abTesting',
  'abTestingValue',
  'expectedPrice',
  'createdAt',
  'updatedAt',
  'syncAt',
  'optimization',
  'error'].join(' ')

class Controller {
  async getList (ctx) {
    try {
      const userId = ctx.state.auth.id
      const conditions = Object.assign({}, ctx.queries, {
        userId: userId
      })
      const options = ctx.paging
      options.select = Fields
      const result = await CampaignService.getList(conditions, options)
      return ctx.send(result)
    } catch (err) {
      global.Logger.error(err)
      return ctx.errorHandle(err, 400, 'GetListError')
    }
  }

  async create (ctx) {
    try {
      const userId = ctx.state.auth.id
      const body = ctx.request.body
      body['userId'] = userId
      const result = await Service.create(body)
      console.log(result)
      return ctx.send(result, 201)
    } catch (err) {
      console.log(err)
      return ctx.errorHandle(err, 400, 'CreateError')
    }
  }

  async update (ctx) {
    try {
      const id = ctx.params.id
      const body = ctx.request.body
      const result = await Service.update(id, body)
      return ctx.send(result, 201)
    } catch (err) {
      console.log(err)
      return ctx.errorHandle(err, 400, 'CreateError')
    }
  }

  async deleteById (ctx) {
    try {
      const userId = ctx.state.auth.id
      const id = ctx.params.id
      const campaign = await CampaignService.findOne({
        _id: id,
        userId: userId,
        isDummy: true
      })
      if (!campaign) {
        return ctx.errorHandle(new Error(), 404, 'NotFoundOrDenied')
      }
      const result = await CampaignService.updateById(id, {
        status: 'DELETED',
        updatedAt: Date.now(),
        disconnect: true
      })
      if (result) {
        return ctx.send({
          success: true
        })
      } else {
        return ctx.errorHandle(new Error(), 404, 'NotFoundOrDenied')
      }
    } catch (err) {
      global.Logger.error(err)
      return ctx.errorHandle(err, 400, 'DeleteError')
    }
  }

  async getById (ctx) {
    try {
      const userId = ctx.state.auth.id
      const id = ctx.params.id
      const result = await CampaignService.findById(id, Fields)
      if (result && result.userId === userId) {
        return ctx.send(result)
      } else {
        return ctx.errorHandle(new Error(), 404, 'NotFoundOrDenied')
      }
    } catch (err) {
      global.Logger.error(err)
      return ctx.errorHandle(err, 400, 'GetDetailError')
    }
  }
}

module.exports = new Controller()
