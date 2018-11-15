'use strict'
var endpoints = {
  local: 'http://localhost:8080',
  dev: 'https://dev-api.bigbom.net',
  uat: 'https://uat-api.bigbom.net'
}

var environment = ''
var currentUrl = window.location.href
if (currentUrl.indexOf('uat-api.bigbom.net') !== -1) {
  environment = 'uat'
} else if (currentUrl.indexOf('dev-api.bigbom.net') !== -1) {
  environment = 'dev'
} else {
  environment = 'local'
}

var Config = {
  endpoint: endpoints[environment]
}

var refreshTokenFlag

function callAPI (uri, data, method, callback) {
  if (!method) {
    method = 'GET'
  }
  var ajaxOptions = {
    type: method,
    url: Config.endpoint + uri,
    dataType: 'json',
    timeout: 10000,
    success: function (res, status) {
      callback(null, res)
    },
    error: function (xhr, errorType, error) {
      if (error === 'Forbidden' || xhr.status === 0) {
        handleLogin()
      }
      callback({
        status: xhr.status,
        statusText: xhr.statusText,
        response: xhr.responseJSON
      }, errorType)
    }
  }

  var bbToken = window.localStorage.getItem('bbToken')
  if (bbToken) {
    ajaxOptions.headers = {
      Authorization: 'Bearer ' + bbToken
    }
  }

  if (['POST', 'PUT'].indexOf(method) !== -1) {
    ajaxOptions.contentType = 'application/json'
    if (data) {
      ajaxOptions.data = JSON.stringify(data)
    }
  } else if (method === 'GET') {
    if (data) {
      ajaxOptions.data = data
    }
  }

  $.ajax(ajaxOptions)
}

function refreshToken () {
  callAPI('/authentication', null, 'GET', function (err, res) {
    if (err) {
      handleLogin(true)
    } else {
      window.localStorage.setItem('bbToken', res.token)
    }
  })
}

function handleLogin () {
  var bbToken = window.localStorage.getItem('bbToken')

  if (!bbToken) {
    window.location.replace('page-login.html')
    window.clearTimeout(refreshTokenFlag)
  } else {
    var current = window.location.href
    if (current.indexOf('index.html') === -1) {
      window.location.replace('index.html')
    }
  }
}

function login (email, password) {
  callAPI('/authentication', {
    email: email,
    password: password
  }, 'POST', function (err, res) {
    if (err) {
      var msg = err.response && err.response.message ? err.response.message : null
      if (msg === 'NotMatched') {
        alert('Error! Username/password is not matched!')
      } else {
        alert('Error! Invalid Data!')
      }
    } else {
      window.localStorage.setItem('bbToken', res.token)
      handleLogin()
    }
  })
}

function createCampaign (doc) {
  callAPI('/iads/dummys', doc,
    'POST', function (err, res) {
      if (err) {
        alert('Error ! Create campaign error')
      } else {
        alert('Success !!!')
        $('input[type=text]').val('')
        $('input[type=checkbox]').prop('checked', false);
        var layerCreateCampaign = $('#form-createCampaign')
        layerCreateCampaign.hide()
        getCampaigns()
      }
    })
}

function editCampaign (id, doc) {
  callAPI(`/iads/dummys/${id}`, doc,
    'PUT', function (err, res) {
      if (err) {
        alert('Error ! Upte campaign error')
      } else {
        alert('Success !!!')
        $('input[type=text]').val('')
        $('input[type=checkbox]').prop('checked', false);
        var parent = $(this).closest('[data-id]')
        parent.hide()
        getCampaigns()
      }
    })
}

function render (templateId, context, dest) {
  var source = $(templateId).html()
  var template = Handlebars.compile(source)
  var html = template(context)
  if (dest) {
    $(dest).html(html)
  } else {
    return html
  }
}

function getCampaigns () {
  callAPI('/iads/dummys?status=ACTIVE&isDummy=', null,
    'GET', function (err, res) {
      if (err) {
        getCampaigns()
      }
      render('#campaignList', res, '#campaignList1')
    })
}

function getCampaignById (id, cb) {
  callAPI(`/iads/dummys/${id}?status=ACTIVE&isDummy=`, null,
    'GET', function (err, res) {
      if (err) {
        alert('Get Campaigns Error')
      } else {
        cb(null, res)
      }
    })
}

function deleteCampaigns (id) {
  callAPI(`/iads/dummys/${id}`, null,
    'DELETE', function (err, res) {
      if (err) {
        alert('Delete Campaign Error')
      } else {
        var layerCreateCampaign = $('#form-createCampaign')
        layerCreateCampaign.hide()
        getCampaigns()
      }
    })
}