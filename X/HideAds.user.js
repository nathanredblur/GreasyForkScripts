// ==UserScript==
// @name         Ocultar Ads en X.com (Twitter)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Oculta los tweets de anuncios (AD/Promoted) en x.com/twitter.com
// @author       redblur-ai
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @supportURL   https://github.com/nathanredblur/GreasyForkScripts
// @updateURL    https://github.com/nathanredblur/GreasyForkScripts/raw/main/X/HideAds.user.js
// @downloadURL  https://github.com/nathanredblur/GreasyForkScripts/raw/main/X/HideAds.user.js
// ==/UserScript==

(function() {
    'use strict';

    function ocultarAds() {
        // Todos los divs/tweets que puedan ser AD (busca el texto "Ad" interno)
        document.querySelectorAll('article').forEach(function(tweet) {
            // Busca algún descendiente con texto "Ad"
            if (
                Array.from(tweet.querySelectorAll("div"))
                .some(div => div.textContent.trim() === 'Ad')
            ) {
                tweet.style.display = "none";
            }
        });
    }

    // Ejecuta inicialmente y luego cada vez que haya cambios (por AJAX)
    const observer = new MutationObserver(ocultarAds);
    observer.observe(document.body, {childList: true, subtree: true});
    ocultarAds();
})();
