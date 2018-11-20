'use strict'

const {
  BaseService, Util
} = require('@kennynguyen/bigbom-core')
const AdSetModel = require('../models/adset-model')
const FlattenObj = Util.flattenObj()

class AdSetService extends BaseService {
  async create (doc) {
    const data = {
      name: doc.adSetName,
      campaignId: doc.campaignId,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'IMPRESSIONS',
      abTestMode: 'BIGBOM_FUNNEL_TEST',
      targeting: {
        'age_min': 18,
        'age_max': 24,
        'geo_locations': {
          'countries': [
            'VN'
          ]
        }
      },
      bid_strategy: 'LOWEST_COST_WITH_BID_CAP',
      bid_amount: doc.bid_amount || undefined,
      lifetime_budget: doc.lifetime_budget || undefined,
      daily_budget: doc.daily_budget || undefined,
      promoted_object: {
        'pixel_id': '2020362751627389',
        'custom_event_type': 'SEARCH'
      },
      status: 'ACTIVE',
      end_time: doc.end_time
    }
    data.start_time = doc.start_time ? new Date(doc.start_time) : Date.now()
    data.fbAdAccountId = doc.fbAdAccountId
    data.userId = doc.userId
    return super.create(data)
  }

  async updateMany (condition, body, option) {
    const unset = {}
    if (body.lifetime_budget) {
      unset.daily_budget = ''
    } else if (body.daily_budget) {
      unset.lifetime_budget = ''
    }
    const update = {
      $set: FlattenObj(body),
      $unset: unset
    }
    return super.updateMany(condition, update)
  }
}

module.exports = new AdSetService(AdSetModel)
