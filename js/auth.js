/* Local demo auth: inline validation, password visibility, and clear errors. */
(function () {
  "use strict";

  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function readUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      return null;
    }
  }

  function setFieldError(input, errorNode, message) {
    if (!errorNode || !input) return;
    if (message) {
      errorNode.textContent = message;
      errorNode.hidden = false;
      input.setAttribute("aria-invalid", "true");
    } else {
      errorNode.textContent = "";
      errorNode.hidden = true;
      input.removeAttribute("aria-invalid");
    }
  }

  function setFormError(errorNode, message) {
    if (!errorNode) return;
    if (message) {
      errorNode.textContent = message;
      errorNode.hidden = false;
      errorNode.focus();
    } else {
      errorNode.textContent = "";
      errorNode.hidden = true;
    }
  }

  function validateEmail(input, errorNode) {
    var value = input.value.trim();
    if (!value) {
      setFieldError(input, errorNode, "Enter your email address.");
      return false;
    }
    if (!emailPattern.test(value)) {
      setFieldError(input, errorNode, "Enter a valid email address.");
      return false;
    }
    setFieldError(input, errorNode, "");
    return true;
  }

  function validateRequiredPassword(input, errorNode, minLength, label) {
    if (!input.value) {
      setFieldError(input, errorNode, "Enter your password.");
      return false;
    }
    if (minLength && input.value.length < minLength) {
      setFieldError(input, errorNode, label + " must be at least " + minLength + " characters.");
      return false;
    }
    setFieldError(input, errorNode, "");
    return true;
  }

  document.querySelectorAll("[data-password-toggle]").forEach(function (button) {
    var target = document.getElementById(button.getAttribute("data-password-toggle"));
    var iconUse = button.querySelector("use");
    if (!target) return;

    button.addEventListener("click", function () {
      var show = target.type === "password";
      target.type = show ? "text" : "password";
      button.setAttribute("aria-label", show ? "Hide password" : "Show password");
      button.setAttribute("aria-pressed", show ? "true" : "false");
      if (iconUse) iconUse.setAttribute("href", show ? "#i-eye-off" : "#i-eye");
      target.focus();
    });
  });

  var loginForm = document.getElementById("loginForm");
  if (loginForm) {
    var loginEmail = document.getElementById("loginEmail");
    var loginPassword = document.getElementById("loginPassword");
    var loginEmailError = document.getElementById("loginEmailError");
    var loginPasswordError = document.getElementById("loginPasswordError");
    var loginFormError = document.getElementById("loginFormError");
    var authSuccess = document.getElementById("authSuccess");

    var params = new URLSearchParams(window.location.search);
    if (params.get("created") === "1") {
      if (authSuccess) authSuccess.hidden = false;
      var savedUser = readUser();
      if (savedUser && savedUser.email) loginEmail.value = savedUser.email;
      window.history.replaceState({}, "", window.location.pathname);
    }

    loginEmail.addEventListener("blur", function () {
      validateEmail(loginEmail, loginEmailError);
    });
    loginPassword.addEventListener("blur", function () {
      validateRequiredPassword(loginPassword, loginPasswordError, 0);
    });
    loginEmail.addEventListener("input", function () {
      if (loginEmail.getAttribute("aria-invalid") === "true") {
        validateEmail(loginEmail, loginEmailError);
      }
      setFormError(loginFormError, "");
    });
    loginPassword.addEventListener("input", function () {
      if (loginPassword.getAttribute("aria-invalid") === "true") {
        validateRequiredPassword(loginPassword, loginPasswordError, 0);
      }
      setFormError(loginFormError, "");
    });

    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();
      setFormError(loginFormError, "");

      var emailValid = validateEmail(loginEmail, loginEmailError);
      var passwordValid = validateRequiredPassword(
        loginPassword,
        loginPasswordError,
        0
      );
      if (!emailValid || !passwordValid) {
        (emailValid ? loginPassword : loginEmail).focus();
        return;
      }

      var user = readUser();
      if (
        user &&
        user.email === loginEmail.value.trim() &&
        user.password === loginPassword.value
      ) {
        try {
          localStorage.setItem("isLoggedIn", "true");
        } catch (error) {
          /* The dashboard still works without the flag. */
        }
        window.location.href = "index.html";
        return;
      }

      setFormError(
        loginFormError,
        "We couldn't match that email and password. Check them and try again, or create an account."
      );
    });
  }

  var signupForm = document.getElementById("signupForm");
  if (signupForm) {
    var signupEmail = document.getElementById("signupEmail");
    var signupPassword = document.getElementById("signupPassword");
    var signupConfirm = document.getElementById("signupConfirm");
    var signupEmailError = document.getElementById("signupEmailError");
    var signupPasswordError = document.getElementById("signupPasswordError");
    var signupConfirmError = document.getElementById("signupConfirmError");
    var signupFormError = document.getElementById("signupFormError");

    function validateConfirm() {
      if (!signupConfirm.value) {
        setFieldError(signupConfirm, signupConfirmError, "Confirm your password.");
        return false;
      }
      if (signupConfirm.value !== signupPassword.value) {
        setFieldError(signupConfirm, signupConfirmError, "Passwords do not match.");
        return false;
      }
      setFieldError(signupConfirm, signupConfirmError, "");
      return true;
    }

    signupEmail.addEventListener("blur", function () {
      validateEmail(signupEmail, signupEmailError);
    });
    signupPassword.addEventListener("blur", function () {
      validateRequiredPassword(signupPassword, signupPasswordError, 6, "Password");
    });
    signupConfirm.addEventListener("blur", validateConfirm);

    signupEmail.addEventListener("input", function () {
      if (signupEmail.getAttribute("aria-invalid") === "true") {
        validateEmail(signupEmail, signupEmailError);
      }
      setFormError(signupFormError, "");
    });
    signupPassword.addEventListener("input", function () {
      if (signupPassword.getAttribute("aria-invalid") === "true") {
        validateRequiredPassword(signupPassword, signupPasswordError, 6, "Password");
      }
      if (signupConfirm.getAttribute("aria-invalid") === "true") validateConfirm();
      setFormError(signupFormError, "");
    });
    signupConfirm.addEventListener("input", function () {
      if (signupConfirm.getAttribute("aria-invalid") === "true") validateConfirm();
      setFormError(signupFormError, "");
    });

    signupForm.addEventListener("submit", function (event) {
      event.preventDefault();
      setFormError(signupFormError, "");

      var emailValid = validateEmail(signupEmail, signupEmailError);
      var passwordValid = validateRequiredPassword(
        signupPassword,
        signupPasswordError,
        6,
        "Password"
      );
      var confirmValid = validateConfirm();

      if (!emailValid || !passwordValid || !confirmValid) {
        var firstInvalid = !emailValid
          ? signupEmail
          : !passwordValid
            ? signupPassword
            : signupConfirm;
        firstInvalid.focus();
        return;
      }

      try {
        localStorage.setItem(
          "user",
          JSON.stringify({
            email: signupEmail.value.trim(),
            password: signupPassword.value,
          })
        );
      } catch (error) {
        setFormError(
          signupFormError,
          "This browser could not save the account. Check that local storage is available and try again."
        );
        return;
      }

      window.location.href = "login.html?created=1";
    });
  }
})();
