'use strict'

const {
  BaseApp
} = require('@kennynguyen/bigbom-core')
const path = require('path')

module.exports = (env, cb) => {
  /* istanbul ignore next */
  if (typeof cb !== 'function') {
    cb = () => {}
  }
  const option = {
    component: ['db'],
    useRoute: true,
    env: env,
    __: __dirname,
    rootPath: path.join(__dirname, '..')
  }
  BaseApp(option, (err, appIns) => {
    /* istanbul ignore if */
    if (err) {
      cb(err)
    } else {
      cb(null, appIns)
    }
  })
}
