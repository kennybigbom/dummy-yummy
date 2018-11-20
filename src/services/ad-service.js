'use strict'

const {
  BaseService
} = require('@kennynguyen/bigbom-core')
const AdModel = require('../models/ad-model')

class AdService extends BaseService {
  async create (doc) {
    const data = {
      name: doc.adName,
      adSetId: doc.adSetId,
      status: 'ACTIVE',
      creative: {
        'object_story_spec': {
          'page_id': '106804576706029',
          'instagram_actor_id': '872345032831992',
          'link_data': {
            'link': 'https://bigbom.com/',
            'attachment_style': 'link',
            'picture': 'https://scontent.xx.fbcdn.net/v/t45.1600-4/44445835_6107524960628_6429321048587501568_n.png?_nc_cat=100&_nc_ht=scontent.xx&oh=99cb8e8423030a05f62aa2d6309c3f35&oe=5C4959B5',
            'call_to_action': {
              'type': 'LEARN_MORE'
            }
          }
        }
      }
    }
    data.fbAdAccountId = doc.fbAdAccountId
    data.userId = doc.userId
    return super.create(data)
  }
}

module.exports = new AdService(AdModel)
