// ==UserScript==
// @name         Unlock Admin Features
// @match        https://192.168.1.1:8000/cgi-bin/indexmain.cgi
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Show the hidden admin menus in the router's web panel
// @author       NathanRedblur
// @icon         https://www.google.com/s2/favicons?sz=64&domain=1.1
// @grant        none
// @supportURL   https://github.com/nathanredblur/GreasyForkScripts
// @updateURL    https://github.com/nathanredblur/GreasyForkScripts/raw/main/Router/UnlockAdminFeatures.user.js
// @downloadURL  https://github.com/nathanredblur/GreasyForkScripts/raw/main/Router/UnlockAdminFeatures.user.js
// ==/UserScript==

(function() {
    'use strict';
    Object.defineProperty(window, 'display_mask', { value: "FFF FFF FFF FFF FFF FFF FFF FFF FFF"});
})();
