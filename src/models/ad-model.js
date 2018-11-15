'use strict'
const {AdTypeEnums} = require('../constants/enum')

module.exports = global.DB.model('ad', global.DB.Schema({
  userId: {
    type: String,
    index: true
  },
  channelId: {
    type: Number,
    index: true
  },
  adSetId: String,
  campaignId: String,
  fbId: String,
  fbAdSetId: String,
  fbCampaignId: String,
  fbAdAccountId: String,
  adlabels: Object,
  bid_amount: Number,
  adType: {
    type: String,
    enum: AdTypeEnums
  },
  creative: Object,
  creative_id: String,
  display_sequence: Number,
  execution_options: Object,
  name: String,
  status: {
    type: String,
    index: true
  },
  effective_status: String,
  createdAt: {
    type: Date,
    default: Date.now()
  },
  updatedAt: Date,
  syncAt: Date,
  synced: {
    type: Boolean,
    default: false
  },
  oldData: Object,
  error: [
    {
      retry: {
        type: Boolean,
        default: false
      },
      message: String,
      sub_code: String,
      code: String,
      time: {
        type: Date,
        default: Date.now
      }
    }
  ]
}))
