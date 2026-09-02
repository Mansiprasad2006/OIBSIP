(function () {
  'use strict';

  var display = document.getElementById('display');
  var historyEl = document.getElementById('history');
  var keys = document.querySelectorAll('.key');

  // ---- Calculator state ----
  var currentValue = '0';   // what the user is currently typing
  var previousValue = null; // the value held over from the last operator
  var pendingOperator = null; // '+', '−', '×', '÷'
  var awaitingNewValue = false; // true right after an operator or equals
  var isError = false;

  function render() {
    display.textContent = currentValue;
    display.classList.toggle('is-error', isError);

    if (isError) {
      historyEl.textContent = '';
      return;
    }

    if (pendingOperator && previousValue !== null) {
      historyEl.textContent = previousValue + ' ' + pendingOperator;
    } else {
      historyEl.textContent = '';
    }
  }

  function resetAll() {
    currentValue = '0';
    previousValue = null;
    pendingOperator = null;
    awaitingNewValue = false;
    isError = false;
  }

  function inputDigit(digit) {
    if (isError) {
      resetAll();
    }

    if (awaitingNewValue) {
      currentValue = digit;
      awaitingNewValue = false;
    } else {
      currentValue = currentValue === '0' ? digit : currentValue + digit;
    }
  }

  function inputDecimal() {
    if (isError) {
      resetAll();
    }

    if (awaitingNewValue) {
      currentValue = '0.';
      awaitingNewValue = false;
      return;
    }

    if (currentValue.indexOf('.') === -1) {
      currentValue += '.';
    }
  }

  function backspace() {
    if (isError) {
      resetAll();
      return;
    }

    if (awaitingNewValue) {
      return;
    }

    if (currentValue.length <= 1 || (currentValue.length === 2 && currentValue.startsWith('-'))) {
      currentValue = '0';
    } else {
      currentValue = currentValue.slice(0, -1);
    }
  }

  // Performs the arithmetic for two operands and one operator.
  // Returns a number, or the string 'DIV_ZERO' as a sentinel for division by zero.
  function compute(a, b, operator) {
    switch (operator) {
      case '+':
        return a + b;
      case '−':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        if (b === 0) {
          return 'DIV_ZERO';
        }
        return a / b;
      default:
        return b;
    }
  }

  // Rounds off floating point noise (e.g. 0.1 + 0.2) without hurting real precision.
  function cleanNumber(num) {
    return parseFloat(num.toPrecision(12)).toString();
  }

  function chooseOperator(operator) {
    if (isError) {
      resetAll();
    }

    if (pendingOperator && !awaitingNewValue) {
      // A calculation is already pending and the user typed a new number:
      // resolve it first so operators chain sequentially (5 + 3 × 2 -> 16).
      var result = compute(parseFloat(previousValue), parseFloat(currentValue), pendingOperator);

      if (result === 'DIV_ZERO') {
        showError();
        return;
      }

      previousValue = cleanNumber(result);
      currentValue = previousValue;
    } else {
      previousValue = currentValue;
    }

    pendingOperator = operator;
    awaitingNewValue = true;
  }

  function calculateEquals() {
    if (isError) {
      return;
    }

    if (pendingOperator === null || previousValue === null) {
      return;
    }

    var result = compute(parseFloat(previousValue), parseFloat(currentValue), pendingOperator);

    if (result === 'DIV_ZERO') {
      showError();
      return;
    }

    currentValue = cleanNumber(result);
    previousValue = null;
    pendingOperator = null;
    awaitingNewValue = true;
  }

  function showError() {
    isError = true;
    currentValue = 'Error: Div by 0';
    previousValue = null;
    pendingOperator = null;
    awaitingNewValue = true;
  }

  function clearAll() {
    resetAll();
  }

  // ---- Event wiring (no inline onclick anywhere) ----
  keys.forEach(function (key) {
    key.addEventListener('click', function () {
      var num = key.getAttribute('data-num');
      var op = key.getAttribute('data-op');
      var action = key.getAttribute('data-action');

      if (num !== null) {
        inputDigit(num);
      } else if (op !== null) {
        chooseOperator(op);
      } else if (action === 'decimal') {
        inputDecimal();
      } else if (action === 'backspace') {
        backspace();
      } else if (action === 'clear') {
        clearAll();
      } else if (action === 'equals') {
        calculateEquals();
      }

      render();
    });
  });

  // Optional keyboard support, wired the same way (addEventListener only).
  document.addEventListener('keydown', function (event) {
    var key = event.key;

    if (key >= '0' && key <= '9') {
      inputDigit(key);
    } else if (key === '.') {
      inputDecimal();
    } else if (key === '+') {
      chooseOperator('+');
    } else if (key === '-') {
      chooseOperator('−');
    } else if (key === '*') {
      chooseOperator('×');
    } else if (key === '/') {
      event.preventDefault();
      chooseOperator('÷');
    } else if (key === 'Enter' || key === '=') {
      calculateEquals();
    } else if (key === 'Backspace') {
      backspace();
    } else if (key === 'Escape') {
      clearAll();
    } else {
      return;
    }

    render();
  });

  render();
})();
