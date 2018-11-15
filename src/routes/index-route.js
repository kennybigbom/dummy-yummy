'use strict'

const CampaignController = require('../controllers/campaign-controller')
/** @member {Object} */
const CampaignValidation = require('../validations/fb-campaign-validation')

const detailRoute = require('./detail-route')
const CampaignGroupRoute = require('./group-route')

module.exports = [
  {
    path: '/',
    handler: {
      post: [
        async (ctx, next) => {
          await CampaignValidation.check(ctx, 'create', next)
        },
        async ctx => {
          await CampaignController.create(ctx)
        }
      ],
      get: async ctx => {
        await CampaignController.getList(ctx)
      }
    }
  },
  {
    path: '/:id',
    routes: detailRoute
  },
  {
    path: '/enums',
    handler: async ctx => {
      await CampaignController.getEnums(ctx)
    }
  },
  {
    path: '/groups',
    routes: CampaignGroupRoute
  },
  {
    path: '/sync',
    handler: {
      post: async ctx => {
        await CampaignController.syncCampaigns(ctx)
      }
    }
  },
  {
    path: '/sync/:adAccount',
    handler: {
      get: async ctx => {
        await CampaignController.getCampaignsFromFB(ctx)
      }
    }
  }
]
