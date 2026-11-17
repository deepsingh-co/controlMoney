/* Add-expense form: inline validation and local save. */
(function () {
  "use strict";

  var form = document.getElementById("expenseForm");
  if (!form) return;

  var amountInput = document.getElementById("amount");
  var dateInput = document.getElementById("date");
  var categoryInputs = form.querySelectorAll('input[name="category"]');
  var amountError = document.getElementById("amountError");
  var categoryError = document.getElementById("categoryError");
  var dateError = document.getElementById("dateError");

  function localDateValue() {
    var now = new Date();
    var local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  if (dateInput) dateInput.value = localDateValue();

  function setError(input, errorNode, message) {
    if (!errorNode) return;
    if (message) {
      errorNode.textContent = message;
      errorNode.hidden = false;
      if (input) input.setAttribute("aria-invalid", "true");
    } else {
      errorNode.textContent = "";
      errorNode.hidden = true;
      if (input) input.removeAttribute("aria-invalid");
    }
  }

  function setCategoryError(message) {
    categoryInputs.forEach(function (input) {
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    });
    setError(null, categoryError, message);
  }

  function validateAmount() {
    var raw = amountInput.value.trim();
    var amount = Number(raw);
    if (!raw) {
      setError(amountInput, amountError, "Enter an amount.");
      return false;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(amountInput, amountError, "Amount must be greater than zero.");
      return false;
    }
    if (amount > 1000000000) {
      setError(amountInput, amountError, "That amount looks too large.");
      return false;
    }
    setError(amountInput, amountError, "");
    return true;
  }

  function validateCategory() {
    var checked = form.querySelector('input[name="category"]:checked');
    if (!checked) {
      setCategoryError("Choose a category.");
      return false;
    }
    setCategoryError("");
    return true;
  }

  function validateDate() {
    if (!dateInput.value) {
      setError(dateInput, dateError, "Choose a date.");
      return false;
    }
    var parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput.value);
    if (!parts) {
      setError(dateInput, dateError, "Enter a valid date.");
      return false;
    }
    var parsed = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
    if (
      parsed.getFullYear() !== Number(parts[1]) ||
      parsed.getMonth() !== Number(parts[2]) - 1 ||
      parsed.getDate() !== Number(parts[3])
    ) {
      setError(dateInput, dateError, "Enter a valid date.");
      return false;
    }
    setError(dateInput, dateError, "");
    return true;
  }

  if (amountInput) {
    amountInput.addEventListener("input", function () {
      if (amountInput.getAttribute("aria-invalid") === "true") validateAmount();
    });
    amountInput.addEventListener("blur", validateAmount);
  }

  categoryInputs.forEach(function (input) {
    input.addEventListener("change", function () {
      if (categoryError && !categoryError.hidden) validateCategory();
    });
  });

  if (dateInput) {
    dateInput.addEventListener("change", function () {
      if (dateInput.getAttribute("aria-invalid") === "true") validateDate();
    });
    dateInput.addEventListener("blur", function () {
      if (dateInput.value) validateDate();
    });
  }

  document.querySelectorAll(".preset-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      amountInput.value = button.getAttribute("data-amount");
      validateAmount();
      amountInput.focus();
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var amountValid = validateAmount();
    var categoryValid = validateCategory();
    var dateValid = validateDate();

    if (!amountValid || !categoryValid || !dateValid) {
      var firstInvalid = !amountValid
        ? amountInput
        : !categoryValid
          ? form.querySelector('input[name="category"]')
          : dateInput;
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    var checkedCategory = form.querySelector('input[name="category"]:checked');
    var newExpense = {
      amount: Math.round(Number(amountInput.value) * 100) / 100,
      category: checkedCategory.value,
      date: dateInput.value,
    };

    var saved = [];
    try {
      saved = JSON.parse(localStorage.getItem("expenses") || "[]");
    } catch (error) {
      saved = [];
    }
    if (!Array.isArray(saved)) saved = [];
    saved.push(newExpense);

    try {
      localStorage.setItem("expenses", JSON.stringify(saved));
    } catch (error) {
      setError(
        amountInput,
        amountError,
        "This browser could not save the expense. Check that storage is available."
      );
      amountInput.focus();
      return;
    }

    window.location.href = "index.html?added=1";
  });
})();
