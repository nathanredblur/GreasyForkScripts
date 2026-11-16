// ==UserScript==
// @name         Gmail - Sender Search & One-Click Bulk Delete (>50)
// @namespace    http://tampermonkey.net/
// @version      2.9
// @description  Adds aligned toolbar icons to search by sender and one-click delete all (>50) in search results
// @match        https://mail.google.com/*
// @noframes
// @grant        none
// @supportURL   https://github.com/nathanredblur/GreasyForkScripts
// @updateURL    https://github.com/nathanredblur/GreasyForkScripts/raw/main/Gmail/SenderBulkDelete.user.js
// @downloadURL  https://github.com/nathanredblur/GreasyForkScripts/raw/main/Gmail/SenderBulkDelete.user.js
// ==/UserScript==

(function () {
  'use strict';

  const SEARCH_BTN_ID = 'tm-btn-find-sender';
  const BULK_DELETE_BTN_ID = 'tm-btn-bulk-delete-all';

  function isElementVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return el.offsetParent !== null && rect.width > 0 && rect.height > 0;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function simulateRealClick(el) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const eventOptions = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    };

    el.dispatchEvent(new PointerEvent('pointerdown', eventOptions));
    el.dispatchEvent(new MouseEvent('mousedown', eventOptions));
    el.dispatchEvent(new PointerEvent('pointerup', eventOptions));
    el.dispatchEvent(new MouseEvent('mouseup', eventOptions));
    el.dispatchEvent(new MouseEvent('click', eventOptions));
  }

  function getOwnEmailAddress() {
    const accountBtn = document.querySelector('a[aria-label*="@"]');
    if (!accountBtn) return null;
    const match = accountBtn.getAttribute('aria-label').match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    return match ? match[1].toLowerCase() : null;
  }

  function getActiveSenderEmail() {
    const threadSenders = Array.from(document.querySelectorAll('[email]'))
      .filter(el => {
        if (el.closest('tr.zA')) return false;
        const container = el.parentElement;
        return container && isElementVisible(container);
      });

    if (threadSenders.length === 0) return null;

    const ownEmail = getOwnEmailAddress();
    const externalSender = threadSenders.find(el => {
      const addr = (el.getAttribute('email') || '').toLowerCase();
      return addr && addr !== ownEmail;
    });

    const targetEl = externalSender || threadSenders[0];
    return targetEl.getAttribute('email');
  }

  function isSearchResultsView() {
    return window.location.hash.startsWith('#search/');
  }

  function getActiveToolbar() {
    const toolbars = Array.from(document.querySelectorAll('div[gh="mtb"]'))
      .filter(isElementVisible);
    return toolbars.length > 0 ? toolbars[0] : null;
  }

  function getToolbarActionGroup() {
    const toolbar = getActiveToolbar();
    if (!toolbar) return null;

    const nativeButtons = Array.from(toolbar.querySelectorAll('div[role="button"]'))
      .filter(el => el.id !== SEARCH_BTN_ID && el.id !== BULK_DELETE_BTN_ID && isElementVisible(el));

    if (nativeButtons.length === 0) return null;

    const lastBtn = nativeButtons[nativeButtons.length - 1];
    const parent = lastBtn.parentElement;
    if (parent && parent.children.length === 1 && parent.parentElement) {
      return parent.parentElement;
    }
    return parent;
  }

  function createIconToolbarButton(id, icon, tooltip, onClick) {
    const btn = document.createElement('button');
    btn.id = id;
    btn.type = 'button';
    btn.setAttribute('title', tooltip);
    btn.setAttribute('aria-label', tooltip);
    btn.textContent = icon;

    Object.assign(btn.style, {
      width: '36px',
      height: '36px',
      padding: '0',
      border: 'none',
      background: 'transparent',
      borderRadius: '50%',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '15px',
      lineHeight: '1',
      cursor: 'pointer',
      userSelect: 'none',
      marginLeft: '4px',
      flexShrink: '0',
      verticalAlign: 'middle',
      position: 'relative',
      zIndex: '50',
      pointerEvents: 'auto',
      transition: 'background-color 0.15s ease, transform 0.1s ease'
    });

    btn.addEventListener('pointerenter', () => {
      btn.style.backgroundColor = 'rgba(32, 33, 36, 0.08)';
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.backgroundColor = 'transparent';
    });
    btn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });

    return btn;
  }

  /**
   * Executes search natively through Gmail's top search bar input (with hash fallback).
   */
  function handleSearchBySender() {
    const email = getActiveSenderEmail();
    if (!email) return;

    const query = `from:(${email})`;
    const searchInput = document.querySelector('input[name="q"]');

    if (searchInput) {
      searchInput.focus();
      searchInput.value = query;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      }));
    }

    // Also update hash to ensure SPA navigation triggers reliably
    window.location.hash = '#search/' + encodeURIComponent(query);
  }

  function findNativeDeleteButton(toolbar) {
    const candidates = Array.from(toolbar.querySelectorAll('div[role="button"]'))
      .filter(el => el.id !== SEARCH_BTN_ID && el.id !== BULK_DELETE_BTN_ID && isElementVisible(el));

    return candidates.find(btn => {
      const attrs = [
        btn.getAttribute('aria-label'),
        btn.getAttribute('data-tooltip'),
        btn.getAttribute('title')
      ].filter(Boolean).map(s => s.toLowerCase().trim());

      return attrs.some(text => text === 'delete' || text === 'eliminar');
    });
  }

  async function handleBulkDeleteAll() {
    const toolbar = getActiveToolbar();
    if (!toolbar) return;

    const selectAllCheckbox = Array.from(toolbar.querySelectorAll('span[role="checkbox"], div[role="checkbox"]'))
      .find(isElementVisible);

    if (!selectAllCheckbox) return;

    if (selectAllCheckbox.getAttribute('aria-checked') !== 'true') {
      simulateRealClick(selectAllCheckbox);
      await sleep(350);
    }

    const bannerLinks = Array.from(document.querySelectorAll('span[role="link"]'))
      .filter(isElementVisible);

    const selectAllMatchingLink = bannerLinks.find(span => {
      const text = span.textContent.toLowerCase();
      return text.includes('select all') || text.includes('seleccionar todas');
    });

    if (selectAllMatchingLink) {
      simulateRealClick(selectAllMatchingLink);
      await sleep(350);
    }

    let deleteBtn = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      deleteBtn = findNativeDeleteButton(toolbar);
      if (deleteBtn) break;
      await sleep(150);
    }

    if (deleteBtn) {
      simulateRealClick(deleteBtn);
    }
  }

  function syncToolbarButtons() {
    const actionGroup = getToolbarActionGroup();
    if (!actionGroup) return;

    const activeSender = getActiveSenderEmail();
    const inSearchView = isSearchResultsView();

    actionGroup.style.display = 'inline-flex';
    actionGroup.style.alignItems = 'center';

    // --- Icon 1: Find all from sender ---
    let searchBtn = document.getElementById(SEARCH_BTN_ID);
    if (activeSender) {
      const tip = `Find all emails from ${activeSender}`;
      if (!searchBtn) {
        searchBtn = createIconToolbarButton(SEARCH_BTN_ID, '🔍', tip, handleSearchBySender);
      } else {
        searchBtn.setAttribute('title', tip);
        searchBtn.setAttribute('aria-label', tip);
      }
      if (!actionGroup.contains(searchBtn)) {
        actionGroup.appendChild(searchBtn);
      }
      searchBtn.style.display = 'inline-flex';
    } else if (searchBtn) {
      searchBtn.style.display = 'none';
    }

    // --- Icon 2: One-Click Select & Delete ALL (>50) ---
    let deleteAllBtn = document.getElementById(BULK_DELETE_BTN_ID);
    if (inSearchView) {
      if (!deleteAllBtn) {
        deleteAllBtn = createIconToolbarButton(
          BULK_DELETE_BTN_ID,
          '💥',
          'One-click: Select & Delete ALL matching emails (including >50)',
          handleBulkDeleteAll
        );
      }
      if (!actionGroup.contains(deleteAllBtn)) {
        actionGroup.appendChild(deleteAllBtn);
      }
      deleteAllBtn.style.display = 'inline-flex';
    } else if (deleteAllBtn) {
      deleteAllBtn.style.display = 'none';
    }
  }

  const observer = new MutationObserver(() => {
    syncToolbarButtons();
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
