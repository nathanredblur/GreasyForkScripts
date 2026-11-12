// ==UserScript==
// @name         Toggl calculate amount
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  calculate automatically the amount
// @author       NathanRedblur
// @license      MIT
// @supportURL   https://github.com/nathanredblur/GreasyForkScripts
// @updateURL    https://github.com/nathanredblur/GreasyForkScripts/raw/main/Toggl/Toggl.user.js
// @downloadURL  https://github.com/nathanredblur/GreasyForkScripts/raw/main/Toggl/Toggl.user.js
// @match        https://track.toggl.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=toggl.com
// @grant        none
// ==/UserScript==

// Helper function to trigger native events in react
// https://stackoverflow.com/questions/23892547
const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype,
  'value').set;

const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
  window.HTMLTextAreaElement.prototype,
  'value').set;

const triggerNativeEventFor = (element, { event, value }) => {
  if (element.tagName === "TEXTAREA") nativeTextAreaValueSetter.call(element, value);
  if (element.tagName === "INPUT") nativeInputValueSetter.call(element, value);
  const eventObj = new Event(event, { bubbles: true });
  element.dispatchEvent(eventObj);
}

// save in local storage
const prefix = "togglPlus_";
const saveToLocalStorage = (key, value) => {
  localStorage.setItem(prefix + key
    , JSON.stringify(value));
}

// get from local storage
const getFromLocalStorage = (key) => {
  const value = localStorage.getItem(prefix + key);
  return value ? JSON.parse(value) : null;
}

(function () {
  'use strict';

  const init = () => {
    const calculateAmount = (row) => {
      const rate = parseFloat(document.getElementById("rate").value);
      const quantityInput = row.querySelector("td:nth-child(2) input")
      const amountInput = row.querySelector("td:nth-child(3) input")

      if (quantityInput && amountInput) {
        let quantity = parseFloat(quantityInput.value);
        if (isNaN(quantity)) return;
        // round up to not decimal values (e.g. 7.47 -> 8)
        quantity = Math.ceil(quantity);
        const total = quantity * rate;

        triggerNativeEventFor(quantityInput, { event: "input", value: quantity });
        triggerNativeEventFor(amountInput, { event: "input", value: total.toFixed(2) });
      }
    }

    const calculateAllAmounts = (evt) => {
      if (evt) evt.preventDefault();
      const rows = document.querySelectorAll("table tbody tr");
      rows.forEach(row => {
        calculateAmount(row);
      });
    }

    // set and get invoice id from local storage
    const injectSaveInvoiceId = (fieldName, name) => {
      const inputElement = document.querySelector(`[name='${fieldName}'`);
      const value = getFromLocalStorage(name);
      if (value) {
        triggerNativeEventFor(inputElement, { event: "input", value: value });
      }

      inputElement.addEventListener("change", (e) => {
        saveToLocalStorage(name, e.target.value);
      });
    }

    const injectHourlyRateInput = () => {
      const currencyInput = document.querySelector("input[id='meta:currency'")
      currencyInput.setAttribute("style", "width: 100px;");
      const input = document.createElement("input");
      input.type = "number";
      input.id = "rate";
      input.placeholder = "Rate";
      input.value = 29;
      input.style.width = "100px";
      currencyInput.insertAdjacentElement("afterend", input);

      input.addEventListener("change", (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
          calculateAllAmounts();
        }
      });
    }

    const addCalculateButton = () => {
      const button = document.createElement("button");
      button.innerHTML = "Calculate";
      button.addEventListener("click", calculateAllAmounts);
      document.querySelector("table").insertAdjacentElement("afterend", button);
    }

    injectHourlyRateInput();
    addCalculateButton();
    injectSaveInvoiceId("meta:id", "invoiceId");
    injectSaveInvoiceId("billedTo:address", "billedToAddress");
    injectSaveInvoiceId("payTo:address", "payToAddress");
    calculateAllAmounts();
  }

  const onUrlChange = () => {
    const isTargetPage = location.href.includes("/invoice/summary");
    if (isTargetPage) init()
  }

  // init script
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      onUrlChange();
    }
  }).observe(document, { subtree: true, childList: true });

  onUrlChange();
})();

