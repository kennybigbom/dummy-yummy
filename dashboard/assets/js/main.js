function renderFormEdit (is) {
  var formEdit = $(is).closest('li').next()
  if (formEdit[0].firstChild) {
    formEdit.show()
  }
  var id = $(is).attr('at')
  getCampaignById(id, function (err, res) {
    let mode = res.optimization.mode
    res.mode = [{
      des: 'Yes',
      value: 1
    }, {
      des: 'No',
      value: 0
    }, {
      des: 'Watch Only',
      value: 2
    }]
    res.mode = res.mode.map(function (item) {
      if (item.value === mode) {
        item.checked = 'checked'
      }
      return item
    })

    let level = res.optimization.level
    res.level = [{
      des: 'AdSet',
      value: 2
    }, {
      des: 'Ad',
      value: 1
    }]
    res.level = res.level.map(function (item) {
      if (item.value === level) {
        item.checked = 'checked'
      }
      return item
    })

    let strategy = res.optimization.strategy
    res.strategy = [{
      des: 'Disable Ads',
      value: 1
    }, {
      des: 'Adjust Bidding Amount',
      value: 2
    }]
    res.amount = res.lifetime_budget || res.daily_budget
    res.strategy = res.strategy.map(function (item) {
      if (strategy.indexOf(item.value) !== -1) {
        item.checked = 'checked'
      }
      return item
    })
    render('#3-editCampaign', res, `[data-id=${id}]`)
  })
}

$(document).ready(function () {
  var env = window.localStorage.getItem('env')
  if (env) {
    $('#selectENV').val(env).change()
  }
  handleLogin()
  getCampaigns()

  $(this).on('click', '#createBtnSubmit', function () {
    try {
      var campaignName = $('#campaignName').val()
      var adSetNumber = $('#adSetNumber').val()
      var adNumber = $('#adNumber').val()
      var value = $('#select option:selected').val()
      var amount = $('#budget').val()
      var start_time = $('#start_time').val()
      var end_time = $('#end_time').val()
      var optm = Number($('input[name="optm"]:checked').val())
      var level = Number($('input[name="level"]:checked').val())
      var limit = $('#testingLimit').val()
      var expected = $('#expected').val()
      var strategy = $('input[name="strategy"]:checked').map(function () {
        return Number($(this).val())
      }).get()

      const obj = {
        'campaignName': campaignName || '',
        'adSetNumber': adSetNumber || 1,
        'adNumber': adNumber || 1,
        'start_time': start_time || Date.now(),
        'end_time': end_time || undefined,
        'optimization': {
          'mode': optm || 1,
          'level': level || 1,
          'limit': limit || undefined,
          'expected': expected || undefined,
          'strategy': strategy || undefined
        }
      }
      if (Number(value) === 1) {
        obj.daily_budget = amount
      } else {
        obj.lifetime_budget = amount
      }
      createCampaign(obj)
      return true
    } catch (err) {
      console.error('LoginButton', err)
    }
  })

  $(this).on('click', '#editBtnSubmit', function () {
    try {
      var id = $(this).closest('[data-id]').data('id')
      var campaignName = $('#edit-campaignName').val()
      var amount = $('#edit-amount').val()
      var start_time = $('#edit-start_time').val()
      var end_time = $('#edit-end_time').val()
      var optm = Number($('input[name="edit-optm"]:checked').val())
      var level = Number($('input[name="edit-level"]:checked').val())
      var limit = $('#edit-testingLimit').val()
      var expected = $('#edit-expected').val()
      var strategy = $('input[name="edit-strategy"]:checked').map(function () {
        return Number($(this).val())
      }).get()

      const obj = {
        'campaignName': campaignName || '',
        'bid_amount': amount || undefined,
        'start_time': start_time || Date.now(),
        'end_time': end_time || undefined,
        'optimization': {
          'mode': optm,
          'level': level || 1,
          'limit': limit || undefined,
          'expected': expected || undefined,
          'strategy': strategy || undefined
        }
      }
      editCampaign(id, obj)
      return true
    } catch (err) {
      console.error('LoginButton', err)
    }
  })

  $(this).on('click', '#createCampaign', function () {
    var layerCreateCampaign = $('#form-createCampaign')
    layerCreateCampaign.toggle()
  })

  $(this).on('click', '#editCampaign', function () {
    renderFormEdit(this)
  })

  $(this).on('click', '#li-editCampaign', function () {
    renderFormEdit(this)
  })

  $(this).on('click', '#closeFormEdit', function () {
    var parent = $(this).closest('[data-id]')
    parent.hide()
  })

  $(this).on('click', '#closeFormCreate', function () {
    var createCampaign = $('#form-createCampaign')
    createCampaign.hide()
  })

  $(this).on('click', '#deleteCampaign', function () {
    if (confirm('Are you sure about delete this campaign?')) {
      var id = $(this).attr('at')
      deleteCampaigns(id)
    }
  })

  $(this).on('click', '#logout', function () {
    window.localStorage.removeItem('bbToken')
    window.location.replace('page-login.html')
  })
})
