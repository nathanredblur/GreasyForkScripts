// ==UserScript==
// @name         Bitbucket Pipeline checker
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Notify when a pipeline in bitbucket has finished!
// @author       NathanRedblur
// @match        https://bitbucket-pipelines.prod.public.atl-paas.net/*
// @icon         https://www.google.com/s2/favicons?domain=atl-paas.net
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  var target = document.querySelector('.App');
  var started = false;
  var ephemeralState = 'undefined';
  var nRetry = 3;

  const retryFailed = () => {
      document.querySelector('[aria-haspopup]').click()
      document.querySelectorAll('[role="menuitem"]')?.[0].click()
  }

  const getByText = (text) => {
      const xpath = `//span[contains(., '${text}')]`;
      return document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null ).iterateNext();
  }

  const getProcessState = (text) => {
      const element = getByText(text)
      const state = element?.querySelector('span[data-state]')?.getAttribute('data-state') || 'undefined'
      return state;
  }

  const createMessage = (message) => {
      const myWindow = popupCenter();
      myWindow.document.write(`<p>${message}</p>`);
  }

  const popupCenter = ({url = "", title = "", w = 200, h = 100} = {}) => {
      // Fixes dual-screen position                             Most browsers      Firefox
      const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
      const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

      const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
      const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

      const systemZoom = width / window.screen.availWidth;
      const left = (width - w) / 2 / systemZoom + dualScreenLeft
      const top = (height - h) / 2 / systemZoom + dualScreenTop
      const newWindow = window.open("", title,
      `
      toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no,
      width=${w / systemZoom}, height=${h / systemZoom}, top=${top}, left=${left}
      `)

      if (window.focus) newWindow.focus();
      return newWindow;
  }

  var Observer = new MutationObserver(function(mutations) {
      const steps = document.querySelectorAll('span[data-state]').length
      const success = document.querySelectorAll('span[data-state="success"]').length
      const building = document.querySelectorAll('span[data-state="building"]').length

      if(!started) started = building > 0;

      const ps = getProcessState("Await Ephemeral Sandbox")
      if (ps !== ephemeralState) {
          if (ephemeralState === "building" && ps === "success") {
              createMessage(`Ephemeral is ready`)
          }
          ephemeralState = ps;
      }

      if (started && steps > 1 && building === 0) {
          started = false;
          if (steps == success) {
              createMessage(`Success: ${success}/${steps}`)
          } else {
              createMessage(`Fail: ${success}/${steps}`)
              if (nRetry > 0) {
                  retryFailed()
                  nRetry = nRetry -1;
              }
          }
      }
  });

  if (target) {
      Observer.observe(target, {
          childList: true,
          subtree:true
      });
  } else {
      console.error('target not found')
  }

})();