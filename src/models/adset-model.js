'user strict'
const {
  AbTestModeEnums, BidStrategy
} = require('../constants/common')

module.exports = global.DB.model('adSet', global.DB.Schema({
  userId: {
    type: String,
    index: true
  },
  campaignId: {
    type: String,
    index: true
  },
  channel: Number,
  fbAdAccountId: String,
  fbCampaignId: String,
  fbId: String,
  name: String,
  adlabels: Object,
  adset_schedule: Object,
  attribution_spec: Object,
  bid_amount: Number,
  bid_strategy: {
    type: String,
    enum: BidStrategy
  },
  effective_status: String,
  billing_event: String,
  campaign_spec: Object,
  creative_sequence: Object,
  daily_budget: Number,
  daily_imps: Number,
  daily_min_spend_target: Number,
  daily_spend_cap: Number,
  destination_type: String,
  end_time: Date,
  execution_options: Object,
  frequency_control_specs: Object,
  is_dynamic_creative_optimization: Boolean,
  lifetime_budget: Number,
  lifetime_imps: Number,
  lifetime_min_spend_target: Number,
  lifetime_spend_cap: Number,
  optimization_goal: String,
  pacing_type: Object,
  promoted_object: Object,
  rf_prediction_id: String,
  start_time: Date,
  targeting: Object,
  time_based_ad_rotation_id_blocks: Object,
  time_based_ad_rotation_intervals: Object,
  status: {
    type: String,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  updatedAt: Date,
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
  ],
  syncAt: Date,
  synced: {
    type: Boolean,
    default: false
  },
  early_winner_declaration_enabled: Boolean,
  abTestMode: {
    type: String,
    enum: AbTestModeEnums
  }
}))
