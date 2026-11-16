// ==UserScript==
// @name         Sura easy password
// @namespace    http://tampermonkey.net/
// @version      2024-09-05
// @description  disable on screen keyboard for password in sura login page
// @author       Nathanredblur
// @match        https://login.sura.com/sso/servicelogin.aspx*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sura.com
// @grant        none
// @run-at document-start
// @supportURL   https://github.com/nathanredblur/GreasyForkScripts
// @updateURL    https://github.com/nathanredblur/GreasyForkScripts/raw/main/SuraLogin/EasyPassword.user.js
// @downloadURL  https://github.com/nathanredblur/GreasyForkScripts/raw/main/SuraLogin/EasyPassword.user.js
// ==/UserScript==

(function() {
    'use strict';

    window.__defineGetter__('innerWidth', function(){
        return 480
    });
    console.log("set window.innerWidth", window.innerWidth)
})();
