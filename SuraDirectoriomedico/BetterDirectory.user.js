// ==UserScript==
// @name         Sura Directorio
// @namespace    https://directoriomedico.segurossura.com.co/*
// @version      0.1
// @description  Mejor diseño y pocos clicks para buscar un médico en el directorio de Sura
// @author       NathanRedblur
// @license      MIT
// @supportURL   https://github.com/nathanredblur/GreasyForkScripts
// @updateURL    https://github.com/nathanredblur/GreasyForkScripts/raw/main/Linkedin/MessageTemplates.user.js
// @downloadURL  https://github.com/nathanredblur/GreasyForkScripts/raw/main/Linkedin/MessageTemplates.user.js
// @match        https://directoriomedico.segurossura.com.co/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=segurossura.com.co
// @grant        none
// ==/UserScript==

// Helpers
function GM_addStyle(css) {
  const style = document.getElementById("GM_addStyleBy8626") || (function () {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.id = "GM_addStyleBy8626";
    document.head.appendChild(style);
    return style;
  })();
  const sheet = style.sheet;
  sheet.insertRule(css, (sheet.rules || sheet.cssRules || []).length);
}

/**
 * Wait for an element before resolving a promise
 * @param {String} querySelector - Selector of element to wait for
 * @param {Integer} timeout - Milliseconds to wait before timing out, or 0 for no timeout
 */
function waitForElement(querySelector, timeout) {
  return new Promise((resolve, reject) => {
    var timer = false;
    if (document.querySelectorAll(querySelector).length) return resolve();
    const observer = new MutationObserver(() => {
      if (document.querySelectorAll(querySelector).length) {
        observer.disconnect();
        if (timer !== false) clearTimeout(timer);
        return resolve();
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    if (timeout) timer = setTimeout(() => {
      observer.disconnect();
      reject();
    }, timeout);
  });
}

// listen url changes
const observeUrlChange = (cb) => {
  let oldHref = document.location.href;
  const body = document.querySelector("body");
  const observer = new MutationObserver(mutations => {
    if (oldHref !== document.location.href) {
      oldHref = document.location.href;
      cb()
    }
  });
  observer.observe(body, { childList: true, subtree: true });
};

(function () {
  'use strict';

  // set Cedula by default
  waitForElement("#idTipoDocumento", 3000).then(function () {
    document.getElementById("idTipoDocumento").value = "C";
  })

  const fireOnNewPage = () => {
    // set Medellin as default
    waitForElement("#idMunicipio > option[value='4292']", 3000).then(function () {
      const el = document.getElementById("idMunicipio");
      var event = new Event('change');
      el.value = "4292";
      el.dispatchEvent(event);
    })

    // add consulta + button
    if (window.location.hash == '#/redasegurado/S/N') {
      const button = document.createElement("button");
      button.innerHTML = "Consulta +";
      button.classList.add("btn", "btn-primary");
      button.style.marginTop = "10px";
      button.style.width = "100%";
      document.querySelector(".dm-general-filter").appendChild(button);
    }
  }

  observeUrlChange(fireOnNewPage)

  GM_addStyle(`
    .dm-cards-results {
       height: auto !important;
    }`)
})();