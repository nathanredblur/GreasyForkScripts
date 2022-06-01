// ==UserScript==
// @name         Linkedin Message Templates
// @namespace    https://github.com/nathanredblur
// @version      0.1
// @description  Paste a predefined message template into the message box.
// @author       NathanRedblur
// @license      MIT
// @supportURL   https://github.com/nathanredblur/GreasyForkScripts
// @updateURL    https://github.com/nathanredblur/GreasyForkScripts/raw/main/Linkedin/MessageTemplates.user.js
// @downloadURL  https://github.com/nathanredblur/GreasyForkScripts/raw/main/Linkedin/MessageTemplates.user.js
// @match        https://www.linkedin.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linkedin.com
// @grant        none
// ==/UserScript==

// TODO: make templates customizables using localStorage

(function() {
  'use strict';

  const responseTemplate = `
      <p>Hi [recruiterName],</p>
      <p><br></p>
      <p>Thank you for reaching out with this awesome opportunity!</p>
      <p><br></p>
      <p>Please let me inform you that my current salary expectation is 120k&nbsp;$US  per year in a remote position, and I'm not interested to work in software development companies, just enterprises with his own product.</p>
      <p><br></p>
      <p>Let me know if your proposal fulfills my expectations, and I will be happy to discuss in detail this opportunity.</p>
      <p><br></p>
      <p>Thank you for your time and I wish you a wonderful day.</p>
  `

  const typeTemplate = (template) => {
      const inputText = document.querySelector(".msg-form__contenteditable");
      const recruiterName = document.querySelector(".msg-entity-lockup__entity-title").innerText
      const text = template.replace("[recruiterName]", recruiterName);
      inputText.innerHTML = text;

      setTimeout(function() {
          inputText.focus();
          inputText.dispatchEvent(new Event('input', {
              bubbles: true,
              cancelable: true,
          }))
      }, 0);
  }

  const createButton = ({name, container, action}) => {
      const html = `
      <li class="conversations-quick-replies__reply">
        <button class="conversations-quick-replies__reply-button artdeco-button artdeco-button--2 artdeco-button--secondary p0" type="button">
          <span aria-hidden="true" class="ml2 mr3">${name}</span>
        </button>
      </li>`

      container.insertAdjacentHTML("beforeend", html)
      const button = container.querySelector("li:last-child > .conversations-quick-replies__reply-button")
      button.addEventListener("click", () => {
          action(name)
      })
  }


  const addTemplate = () => {
      const qrList = document.querySelector(".conversations-quick-replies__container");
      qrList.style.flexWrap = "wrap";
      createButton({
          name: "Recruiter",
          container: qrList,
          action: () => typeTemplate(responseTemplate),
      })
  }

  const onUrlChange = () => {
      const isMessagePage = location.href.includes("/messaging/thread/")
      if (isMessagePage) addTemplate()
  }

  // init script
  let lastUrl = location.href;
  new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
          lastUrl = url;
          onUrlChange();
      }
  }).observe(document, {subtree: true, childList: true});

  onUrlChange();
})();