'use strict'

const {
  BaseService
} = require('@kennynguyen/bigbom-core')
const AdSetModel = require('../models/adset-model')

class AdSetService extends BaseService {
}

module.exports = new AdSetService(AdSetModel)
