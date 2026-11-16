// ==UserScript==
// @name         Fix vimium-c next and prev
// @namespace    http://tampermonkey.net/
// @version      2026-11-16
// @description  This fixes the ]] and [[ shortcuts for next page in aliexpress pages
// @author       @NathaRedblur
// @match        https://*.aliexpress.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=aliexpress.com
// @grant        none
// @supportURL   https://github.com/nathanredblur/GreasyForkScripts
// @updateURL    https://github.com/nathanredblur/GreasyForkScripts/raw/main/AliExpress/VimiumPagination.user.js
// @downloadURL  https://github.com/nathanredblur/GreasyForkScripts/raw/main/AliExpress/VimiumPagination.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Vimium-C's [[ and ]] match links by text; AliExpress renders icon-only buttons.
    const labels = {
        '.comet-pagination-prev button': '<',
        '.comet-pagination-next button': '>',
    };

    function updatePagination() {
        for (const [selector, label] of Object.entries(labels)) {
            const button = document.querySelector(selector);
            if (button && button.textContent !== label) {
                button.textContent = label;
            }
        }
    }

    // Pagination is lazy-loaded on scroll and re-rendered on page change.
    new MutationObserver(updatePagination).observe(document.body, { childList: true, subtree: true });
    updatePagination();
})();
