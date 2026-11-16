// ==UserScript==
// @name         Linkedin Message Templates
// @namespace    https://github.com/nathanredblur
// @version      0.4
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

(function () {
    'use strict';

    const BUTTON_ATTR = 'data-message-template';

    const templates = {
        Recruiter: `Hi [recruiterName],

Thank you for reaching out with this awesome opportunity!

Please let me inform you that my current salary expectation is 120k $US per year in a remote position, and I'm not interested to work in software development companies, just enterprises with his own product.

Let me know if your proposal fulfills my expectations, and I will be happy to discuss in detail this opportunity.

Thank you for your time and I wish you a wonderful day.`,
    };

    const getRecruiterFirstName = () => {
        const title = document.querySelector('.msg-entity-lockup__entity-title');
        return title ? title.innerText.trim().split(/\s+/)[0] : '';
    };

    // LinkedIn's editor ignores direct innerHTML changes; execCommand goes through
    // the native input pipeline so the send button and draft state update.
    const typeTemplate = (form, template) => {
        const editor = form.querySelector('.msg-form__contenteditable');
        if (!editor) return;
        editor.focus();
        document.execCommand('selectAll');
        document.execCommand('insertText', false, template.replace('[recruiterName]', getRecruiterFirstName()));
    };

    const addButtons = (form) => {
        const actions = form.querySelector('.msg-form__left-actions');
        if (!actions || actions.querySelector(`[${BUTTON_ATTR}]`)) return;

        for (const [name, template] of Object.entries(templates)) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = name;
            button.setAttribute(BUTTON_ATTR, name);
            button.className = 'artdeco-button artdeco-button--1 artdeco-button--secondary ml1';
            button.addEventListener('click', () => typeTemplate(form, template));
            actions.append(button);
        }
    };

    const scan = () => {
        if (!location.pathname.startsWith('/messaging/')) return;
        document.querySelectorAll('form.msg-form').forEach(addButtons);
    };

    new MutationObserver(scan).observe(document.body, { subtree: true, childList: true });
    scan();
})();
