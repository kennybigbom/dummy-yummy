'use strict'
const {
  TestingLevel, OptimizationMode, Strategy
} = require('../constants/common')
module.exports = global.DB.model('campaign', global.DB.Schema({
  userId: {
    type: String,
    index: true
  },
  channelId: {
    type: Number,
    index: true
  },
  groupId: {
    type: String,
    index: true
  },
  fbAdAccountId: String,
  fbId: String,
  name: String,
  adlabels: Object,
  bid_strategy: String,
  boosted_object_id: String,
  brand_lift_studies: Object,
  budget_rebalance_flag: Boolean,
  budget_remaining: Number,
  buying_type: String,
  can_create_brand_lift_study: Boolean,
  can_use_spend_cap: Boolean,
  configured_status: String,
  created_time: Date,
  daily_budget: Number,
  effective_status: String,
  lifetime_budget: Number,
  objective: String,
  recommendations: Object,
  source_campaign_id: String,
  spend_cap: Number,
  start_time: Date,
  stop_time: Date,
  updated_time: Date,
  oldData: Object,
  error: Array,
  status: {
    type: String,
    index: true
  },
  category: String,
  abTesting: String,
  abTestingValue: Number,
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
  optimization: {
    startedAt: Date,
    mode: {
      type: Number,
      enum: OptimizationMode
    },
    level: {
      type: Number,
      enum: TestingLevel
    },
    limit: Number,
    expected: Number,
    strategy: [Number]
  },
  disconnect: Boolean,
  isDummy: Boolean
}))
