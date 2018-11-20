'use strict'
const CampaignService = require('./campaign-service')
const AdSetService = require('./adset-service')
const AdService = require('./ad-service')

class Service {
  async create (body) {
    const campaign = await CampaignService.create(body)
    const adSetNumber = body.adSetNumber
    for (let i = 0; i < adSetNumber; i++) {
      body.campaignId = campaign._id
      body.adSetName = `Dummy_AdSetName_${i + 1}`
      const adSets = await AdSetService.create(body)
      const adNumber = body.adNumber
      for (let j = 0; j < adNumber; j++) {
        body.adSetId = adSets._id
        body.adName = `Dummy_AdName_${i + 1}`
        await AdService.create(body)
      }
    }
    return campaign
  }

  async update (id, body) {
    const campaign = await CampaignService.update(id, body)
    await AdSetService.updateMany({
      campaignId: id
    }, body)
    return campaign
  }

}

module.exports = new Service()