$(document).ready(function () {
  $(this).on('click', '#loginBtnSubmit', function () {
    try {
      var email = $('#loginEmail')
      var password = $('#loginPassword')
      var emailVal = email.val()
      var passwordVal = password.val()
      login(emailVal, passwordVal)
    } catch (err) {
      alert('Error: Login button')
      console.error('LoginButton', err)
    }
  })
})