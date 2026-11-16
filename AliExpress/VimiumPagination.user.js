// ==UserScript==
// @name         Fix vimium-c next and prev
// @namespace    http://tampermonkey.net/
// @version      2025-11-09
// @description  This fixes the ]] and [[ shortcuts for next page in aliexpres pages
// @author       @NathaRedblur
// @match        https://es.aliexpress.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=aliexpress.com
// @grant        none
// @supportURL   https://github.com/nathanredblur/GreasyForkScripts
// @updateURL    https://github.com/nathanredblur/GreasyForkScripts/raw/main/AliExpress/VimiumPagination.user.js
// @downloadURL  https://github.com/nathanredblur/GreasyForkScripts/raw/main/AliExpress/VimiumPagination.user.js
// ==/UserScript==

(function() {
    'use strict';

    function updatePagination() {
        // Find prev button
        const prevButton = document.querySelector('.comet-pagination-prev button');
        if (prevButton) {
            prevButton.textContent = '<';
        }

        // Find next button
        const nextButton = document.querySelector('.comet-pagination-next button');
        if (nextButton) {
            nextButton.textContent = '>';
        }
    }

    // Run on load
    updatePagination();

    // Run again after a short delay for dynamic content
    setTimeout(updatePagination, 1000);
    setTimeout(updatePagination, 3000);

})();
