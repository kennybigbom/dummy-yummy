'use strict'

const {
  BaseService, Util
} = require('@kennynguyen/bigbom-core')
const CampaignModel = require('../models/campaign-model')
const FlattenObj = Util.flattenObj()

class CampaignService extends BaseService {
  async create (doc) {
    const data = {
      channelId: 1,
      fbAdAccountId: 'Dummy_9999999999999',
      name: `Dummy_${doc.campaignName}`,
      objective: 'CONVERSIONS',
      buying_type: 'AUCTION',
      optimization: doc.optimization,
      isDummy: true,
      status: 'ACTIVE',
      userId: doc.userId
    }
    return super.create(data)
  }

  async update (id, update) {
    update.name = update.campaignName
    update.optimization['startedAt'] = Date.now()
    return super.updateOne({
      _id: id,
      isDummy: true
    }, FlattenObj(update))
  }
}

module.exports = new CampaignService(CampaignModel)
