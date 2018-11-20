'use strict'
const Controller = require('../controllers/index-controller')

module.exports = [
  {
    path: '/',
    ignore: ['post', 'get'],
    handler: {
      get: async ctx => {
        await Controller.getList(ctx)
      },
      post: async ctx => {
        await Controller.create(ctx)
      }
    }
  },
  {
    path: '/:id',
    ignore: ['get', 'put', 'del'],
    handler: {
      get: async ctx => {
        await Controller.getById(ctx)
      },
      put: async ctx => {
        await Controller.update(ctx)
      },
      del: async ctx => {
        await Controller.deleteById(ctx)
      }
    }
  }
]
