// ==UserScript==
// @name         Github PR Templates
// @namespace    https://github.com/*
// @version      0.1
// @description  allows you to select a PR template from a dropdown menu on the PR page
// @author       NathanRedblur
// @license      MIT
// @supportURL   https://github.com/nathanredblur/GreasyForkScripts
// @updateURL    https://github.com/nathanredblur/GreasyForkScripts/raw/main/GithubTemplates/GithubTemplates.user.js
// @downloadURL  https://github.com/nathanredblur/GreasyForkScripts/raw/main/GithubTemplates/GithubTemplates.user.js
// @match        https://github.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

// docs http://greasemonkey.win-start.de/toc/index.html
// insp https://chromewebstore.google.com/detail/github-pr-templates/cpebkokcapgjobabnjpnnndbgbjddool

// Helpers
const zipObject = (props, values) => {
  return props.reduce((prev, prop, i) => {
    return Object.assign(prev, { [prop]: values[i] });
  }, {});
};

function addGlobalStyle(css) {
  var head, style;
  head = document.getElementsByTagName("head")[0];
  if (!head) {
    return;
  }
  style = document.createElement("style");
  style.type = "text/css";
  style.innerHTML = css;
  head.appendChild(style);
}

const dropdownTemplate = `
<div class="discussion-sidebar-item js-discussion-sidebar-item">
    <div class="discussion-sidebar-heading text-bold">
        Template
    </div>
    <div class="js-issue-sidebar-form">
        <details id="template-selector" class="pr-template-select select-menu details-overlay details-reset">
            <summary data-view-component="true" class="select-menu-button branch btn-sm btn"><i>Template:</i>
                <span class="css-truncate css-truncate-target" data-menu-button="" title="">{{current-committish}}</span>
            </summary>
            <div class="SelectMenu">
                <div class="SelectMenu-modal">
                    <header class="SelectMenu-header">
                        <span class="SelectMenu-title">Choose a template</span>
                        <button class="SelectMenu-closeButton" type="button" data-toggle-for="template-selector">
                            <svg aria-label="Close menu"
                                 aria-hidden="false"
                                 role="img"
                                 height="16"
                                 viewBox="0 0 16 16"
                                 width="16"
                                 data-view-component="true"
                                 class="octicon octicon-x">
                                <path fill-rule="evenodd"
                                      d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"></path>
                            </svg>
                        </button>
                    </header>

                    <input-demux
                            data-action="tab-container-change:input-demux#storeInput tab-container-changed:input-demux#updateInput"
                            data-catalyst="">
                        <div class="SelectMenu-filter">
                            <input data-target="input-demux.source"
                                   id="context-committish-filter-field-template"
                                   class="SelectMenu-input form-control"
                                   aria-owns="ref-list-branches-template"
                                   data-controls-ref-menu-id="ref-list-branches-template"
                                   autofocus=""
                                   autocomplete="off"
                                   aria-label="Find a template"
                                   placeholder="Find a template"
                                   type="text"
                                   data-lpignore="true">
                        </div>

                        <ref-selector type="tags"
                                      data-action="
                                  input-entered:ref-selector#inputEntered
                                  tab-selected:ref-selector#tabSelected
                                  focus-list:ref-selector#focusFirstListMember
                                "
                                      data-targets="input-demux.sinks"
                                      query-endpoint="null"
                                      cache-key="{{cache-key}}"
                                      default-branch="{{default-template64}}"
                                      name-with-owner="{{name-with-owner64}}"
                                      current-committish="{{current-committish64}}"
                                      prefetch-on-mouseover="">
                            <template data-target="ref-selector.fetchFailedTemplate">
                                <div class="SelectMenu-message" data-index="{{ index }}">Could not load templates</div>
                            </template>

                            <template data-target="ref-selector.noMatchTemplate">
                                <div class="SelectMenu-message" data-index="{{ index }}">Nothing to show</div>
                            </template>

                            <template data-target="ref-selector.itemTemplate">
                                <a href="#"
                                   class="SelectMenu-item"
                                   role="menuitemradio"
                                   rel="nofollow"
                                   aria-checked="{{ isCurrent }}"
                                   data-index="{{ index }}"
                                   data-ref-name="{{ refName }}"
                                   data-toggle-for="template-selector">
                                    <svg aria-hidden="true"
                                         height="16"
                                         viewBox="0 0 16 16"
                                         width="16"
                                         data-view-component="true"
                                         class="octicon octicon-check SelectMenu-icon SelectMenu-icon--check">
                                        <path fill-rule="evenodd"
                                              d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
                                    </svg>
                                    <span class="flex-1 css-truncate css-truncate-overflow {{ isFilteringClass }}">{{ refName }}</span>
                                    <span hidden="{{ isNotDefault }}"
                                          class="Label Label--secondary flex-self-start">default</span>
                                    <input name="selected-template"
                                           type="radio"
                                           value="{{ refName }}"
                                           checked="{{ isCurrent }}"
                                           hidden/>
                                </a>
                            </template>

                            <div data-target="ref-selector.listContainer" role="menu" class="SelectMenu-list">
                                <div class="SelectMenu-loading pt-3 pb-0 overflow-hidden" aria-label="Menu is loading">
                                    <svg style="box-sizing: content-box; color: var(--color-icon-primary);"
                                         width="32"
                                         height="32"
                                         viewBox="0 0 16 16"
                                         fill="none"
                                         data-view-component="true"
                                         class="anim-rotate">
                                        <circle cx="8"
                                                cy="8"
                                                r="7"
                                                stroke="currentColor"
                                                stroke-opacity="0.25"
                                                stroke-width="2"
                                                vector-effect="non-scaling-stroke"></circle>
                                        <path d="M15 8a7.002 7.002 0 00-7-7"
                                              stroke="currentColor"
                                              stroke-width="2"
                                              stroke-linecap="round"
                                              vector-effect="non-scaling-stroke"></path>
                                    </svg>
                                </div>
                            </div>
                        </ref-selector>
                    </input-demux>
                </div>
            </div>
        </details>
    </div>
</div>
`;

const dropdownStyle = `
.ui_selector, .TnITTtw-ui_selector {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, Ubuntu, sans-serif;
  display: inline-block;
}

.ui_selector .select, .TnITTtw-ui_selector .TnITTtw-select {
  color: #000;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  border: 1px solid rgba(200, 199, 204, 0.5);
  padding: 10px 15px;
  width: 201px;
  -webkit-user-select: none;
  cursor: pointer;
  border-radius: 11px;
  display: inline-block;
  background-image: -webkit-linear-gradient(top, #FAFAFA, #F6F6F6);
  background-image: -moz-linear-gradient(top, #FAFAFA, #F6F6F6);
  background-size: auto 48px;
  background-position: 0px -11px;
  box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.10);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.dark-mode .ui_selector .select, 
.TnITTtw-dark-mode .TnITTtw-ui_selector .TnITTtw-select {
  background-image: -webkit-linear-gradient(top, #4A4A49, #40403F);
  background-image: -moz-linear-gradient(top, #4A4A49, #40403F);
  color: #FFF;
  border-color: #747473;
}

.ui_selector .select:hover,
.TnITTtw-ui_selector .TnITTtw-select:hover {
  color: #424242;
  background-image: -webkit-linear-gradient(top, #FAFAFA, #FAFAFA);
  background-image: -moz-linear-gradient(top, #FAFAFA, #FAFAFA);
}

.ui_selector .select:active,
.TnITTtw-ui_selector .TnITTtw-select:active {
  color: #6d6d72;
  background-image: -webkit-linear-gradient(top, #F6F6F6, #F6F6F6);
  background-image: -moz-linear-gradient(top, #F6F6F6, #F6F6F6);
}

.dark-mode .ui_selector .select:hover,
.dark-mode .ui_selector .select:active,
.TnITTtw-dark-mode .TnITTtw-ui_selector .TnITTtw-select:hover,
.TnITTtw-dark-mode .TnITTtw-ui_selector .TnITTtw-select:active {
  background-image: -webkit-linear-gradient(top, #4A4A49, #4A4A49);
  background-image: -moz-linear-gradient(top, #4A4A49, #4A4A49);
  color: #FFF;
  border-color: #747473;
}

.ui_selector .select .detected-ico,
.TnITTtw-ui_selector .TnITTtw-select .TnITTtw-detected-ico {
  display: inline-block;
}

.ui_selector .active, .ui_selector .active:hover, .ui_selector .active:active,
.TnITTtw-ui_selector .TnITTtw-active, .TnITTtw-ui_selector .TnITTtw-active:hover, .TnITTtw-ui_selector .TnITTtw-active:active {
  box-shadow: 0 -1px 15px -10px rgba(0, 0, 0, 0.85) !important;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  background: #F3F3F3;
}

.sliding-text,
.TnITTtw-sliding-text {
  position: relative;
}

.ui_selector .options,
.TnITTtw-ui_selector .TnITTtw-options {
  margin-left: 0px;
  margin-top: -4px;
  background: #fff;
  border: 1px solid rgba(200, 199, 204, 0.5);
  width: 231px;
  overflow: hidden;
  max-height: 313px;
  position: absolute;
  font-size: 12px;
  box-shadow: 0 2px 10px rgb(0 0 0 / 25%);
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  display: none;
}

.ui_selector .options.standalone,
.TnITTtw-ui_selector .TnITTtw-options.TnITTtw-standalone {
  border-radius: 11px;
  margin-top: 16px;
}

/* for now, it can only be on the top */
.ui_selector .options-arrow,
.TnITTtw-ui_selector .TnITTtw-options-arrow {
  display: none;
  position: absolute;
  width: 32px !important;
  height: 18px !important;
  background-image: url(chrome-extension://bajjgpkcifmakkoinedcdnhcggobelej/res/images/ui/tt-dropdown-arrow.png);
  background-size: 32px 18px;
  transform: rotate(180deg);
  margin-top: -1px;
}

.dark-mode .ui_selector .options-arrow,
.TnITTtw-dark-mode .TnITTtw-ui_selector .TnITTtw-options-arrow {
  background-image: url(chrome-extension://bajjgpkcifmakkoinedcdnhcggobelej/res/images/ui/tt-dropdown-arrow-dark.png);
}

.dark-mode .ui_selector .options,
.TnITTtw-dark-mode .TnITTtw-ui_selector .TnITTtw-options {
  background: #525251;
}

.ui_selector .options ul,
.TnITTtw-ui_selector .TnITTtw-options ul {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 232px;
}

.ui_selector .options ul li,
.TnITTtw-ui_selector .TnITTtw-options ul li {
  padding: 10px 0px;
  -webkit-user-select: none;
  text-align: center;
  font-size: 17px;
  -webkit-transition: all 600ms cubic-bezier(0.23, 1, 0.32, 1);
  margin: 0 10px;
  border-radius: 6px;
  position: relative;
}

.dark-mode .options ul li,
.TnITTtw-dark-mode .TnITTtw-options ul li {
  color: #fff;
}

.ui_selector .options ul li:last-child,
.TnITTtw-ui_selector .TnITTtw-options ul li:last-child {
  margin-bottom: 16px;
}

.ui_selector .options ul li.option:first-child,
.ui_selector .options ul li.option_selected:first-child,
.TnITTtw-ui_selector .TnITTtw-options ul li.TnITTtw-option:first-child,
.TnITTtw-ui_selector .TnITTtw-options ul li.TnITTtw-option_selected:first-child {
  margin-top: 16px;
}

.ui_selector .options ul li.whenHover,
.TnITTtw-ui_selector .TnITTtw-options ul li.TnITTtw-whenHover {
  cursor: pointer;
  background: #f3f3f3;
  text-align: center;
}

.dark-mode .ui_selector .options ul li.whenHover,
.TnITTtw-dark-mode .TnITTtw-ui_selector .TnITTtw-options ul li.TnITTtw-whenHover {
  background: rgba(255, 255, 255, 0.5);
}

.ui_selector .options ul li.option_selected,
.TnITTtw-ui_selector .TnITTtw-options ul li.TnITTtw-option_selected {
  cursor: pointer;
  background-image: linear-gradient(145deg, #01EF92, #00D8FB),
  linear-gradient(35deg, rgba(1, 239, 146, 0.25), rgba(0, 216, 251, 0.25)) !important;
  color: #fff;
  font-weight: 600;
}

.ui_selector .options ul .group,
.ui_selector .options ul .group:hover,
.ui_selector .options ul .group.whenHover,
.TnITTtw-ui_selector .TnITTtw-options ul .TnITTtw-group,
.TnITTtw-ui_selector .TnITTtw-options ul .TnITTtw-group:hover,
.TnITTtw-ui_selector .TnITTtw-options ul .TnITTtw-group.whenHover {
  padding: 16px 10px;
  color: #8e8e93;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
  text-align: center;
  cursor: default;
  background: #FFF;
}

.dark-mode .ui_selector .options ul .group,
.dark-mode .ui_selector .options ul .group:hover,
.dark-mode .ui_selector .options ul .group.whenHover,
.TnITTtw-dark-mode .TnITTtw-ui_selector .TnITTtw-options ul .TnITTtw-group,
.TnITTtw-dark-mode .TnITTtw-ui_selector .TnITTtw-options ul .TnITTtw-group:hover,
.TnITTtw-dark-mode .TnITTtw-ui_selector .TnITTtw-options ul .TnITTtw-group.TnITTtw-whenHover {
  color: #98989D;
  background: #525251;
}

.group-element,
.TnITTtw-group-element {
  width: 153px;
}

.options .dd-search,
.TnITTtw-options .TnITTtw-dd-search {
  border-bottom: 1px solid rgba(200, 199, 204, 0.5);
}

.dark-mode .options .dd-search,
.TnITTtw-dark-mode .TnITTtw-options .TnITTtw-dd-search {
  border-bottom-color: #747473;
}

.dd-search .dd-input,
.TnITTtw-dd-search .TnITTtw-dd-input {
  padding: 16px;
  padding-left: calc(16px * 3);
  width: 168px;
  border: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, Ubuntu, sans-serif;
  text-align: left;
  color: #000;
  font-size: 17px;
  background-image: url(chrome-extension://bajjgpkcifmakkoinedcdnhcggobelej/res/images/ui/searchfield-icon.png);
  background-position: 16px;
  background-size: 16px;
  background-repeat: no-repeat;
  margin: 0;
  height: auto;
}

.dark-mode .dd-search .dd-input,
.TnITTtw-dark-mode .TnITTtw-dd-search .TnITTtw-dd-input {
  color: #FFF;
  background-color: #525251;
}

.dd-search .dd-input:focus,
.TnITTtw-dd-search .TnITTtw-dd-input:focus {
  -webkit-transition: all 275ms cubic-bezier(0.23, 1, 0.32, 1);
  outline: none;
  text-align: left;
}

.dd-input::-webkit-input-placeholder,
.TnITTtw-dd-input::-webkit-input-placeholder {
  color: #8e8e93;
}

.search-failed-plaque,
.TnITTtw-search-failed-plaque {
  text-align: center;
  padding: 20px;
  color: #8e8e93;
  font-size: 17px;
  font-weight: 600;
}

.dark-mode .search-failed-plaque,
.TnITTtw-dark-mode .TnITTtw-search-failed-plaque {
  color: #98989D;
}

.rm-recent,
.TnITTtw-rm-recent {
  position: absolute;
  width: 10px;
  height: 10px;
  background-image: url(chrome-extension://bajjgpkcifmakkoinedcdnhcggobelej/res/images/ui/regular-lang-remove.png);
  background-size: 10px 10px;
  top: 15px;
  right: 10px;
}

.rm-recent:hover,
.TnITTtw-rm-recent:hover {
  background-image: url(chrome-extension://bajjgpkcifmakkoinedcdnhcggobelej/res/images/ui/hover-lang-remove.png);
}

.rm-recent:active,
.TnITTtw-rm-recent:active {
  background-image: url(chrome-extension://bajjgpkcifmakkoinedcdnhcggobelej/res/images/ui/down-lang-remove.png);
}

.option_selected .rm-recent,
.TnITTtw-option_selected .TnITTtw-rm-recent {
  background-image: url(chrome-extension://bajjgpkcifmakkoinedcdnhcggobelej/res/images/ui/down-active-lang-remove.png);
}

.option_selected .rm-recent:hover,
.TnITTtw-option_selected .TnITTtw-rm-recent:hover {
  background-image: url(chrome-extension://bajjgpkcifmakkoinedcdnhcggobelej/res/images/ui/hover-active-lang-remove.png);
}

.option_selected .rm-recent:active,
.TnITTtw-option_selected .TnITTtw-rm-recent:active {
  background-image: url(chrome-extension://bajjgpkcifmakkoinedcdnhcggobelej/res/images/ui/down-active-lang-remove.png);
}

.TnITTtw-hidden {
  display: none;
}
`;

class GithubRepository {
  constructor() {
    this.url = new URL(window.location);
    const [, nameWithOwner, , branch] = this.url.pathname.match(
      /\/(.+)\/compare\/(.+\.\.\.)?(.+)/
    );
    this.nameWithOwner = nameWithOwner;
    this.branch = branch;
    this.defaultTemplate = "default";
    this.project = "pr-templates";
    this.localStoragePath = `${this.nameWithOwner}:${this.project}`;
    this.localStoragePathFull = `ref-selector:${this.localStoragePath}:tag`;
    this.cacheKey = this.project;
    this.baseURL = `https://github.com/${this.nameWithOwner}`;
    this.currentCommittish = this.url.searchParams.get("template") || "default";
    this.templates = {};
    this.user = document.querySelector("meta[name=user-login]").content;
    this.userBaseUrl = `https://github.com/${this.user}/${this.user}`;
  }

  attachDropdown = () => {
    Promise.resolve()
      .then(() => this.loadTemplates())
      .then(this.generateDropdown)
      .then(this.insertDropdown)
      .then(this.activateDropdown)
      .catch(console.error);
  };

  loadTemplates = () => {
    return Promise.all([
      this.fetchDefaultTemplate(),
      this.fetchCustomTemplates(),
      this.fetchUserTemplates(),
    ])
      .then(([defaultTemplate, customTemplates, userTemplates]) => {
        if (defaultTemplate) {
          this.templates["default"] = defaultTemplate;
        }

        Object.assign(this.templates, customTemplates, userTemplates);
        const refs = Object.keys(this.templates);

        localStorage.setItem(
          this.localStoragePathFull,
          JSON.stringify({ refs, cacheKey: this.cacheKey })
        );
      })
      .catch(console.error);
  };

  fetchDefaultTemplate = () => {
    return this.fetchTemplate(".github/pull_request_template.md");
  };

  processGithubData = (data, prefix = "") => {
    const templateUrls = [];
    const templateBaseNames = [];
    data.payload.tree.items.map((item) => {
      templateUrls.push(item.path);
      templateBaseNames.push(`${prefix}${prefix ? "-" : ""}${item.name}`);
    });

    return Promise.all(templateUrls.map(this.fetchTemplate)).then((templates) =>
      zipObject(templateBaseNames, templates)
    );
  };

  fetchCustomTemplates = () => {
    return this.fetchGithub(
      `/tree/${this.branch}/.github/PULL_REQUEST_TEMPLATE`
    )
      .then((res) => res.json())
      .then(this.processGithubData);
  };

  fetchUserTemplates = () => {
    return this.fetchGithub(
      "/tree/main/.github/PULL_REQUEST_TEMPLATE",
      this.userBaseUrl
    )
      .then((res) => res.json())
      .then((data) => {
        return this.processGithubData(data, "user");
      });
  };

  fetchGithub = (path, base = this.baseURL) => {
    return fetch(`${base}${path}`, { credentials: "same-origin" }).then(
      (res) => {
        if (!res.ok) return Promise.resolve({ text: () => "" });
        return res;
      }
    );
  };

  fetchTemplate = (path) => {
    return this.fetchGithub(`/raw/${this.branch}/${path}`).then((res) =>
      res.text()
    );
  };

  generateDropdown = () => {
    return `${dropdownTemplate}`
      .replace("{{default-template}}", this.defaultTemplate)
      .replace("{{default-template64}}", btoa(this.defaultTemplate))
      .replace("{{name-with-owner64}}", btoa(this.localStoragePath))
      .replace("{{current-committish}}", this.currentCommittish)
      .replace("{{current-committish64}}", btoa(this.currentCommittish))
      .replace("{{cache-key}}", this.cacheKey);
  };

  insertDropdown = (dropdown) => {
    if (document.getElementById("template-selector")) {
      return;
    }

    addGlobalStyle(dropdownStyle);
    const sidebarContainer = document.querySelector(
      ".discussion-sidebar-item:nth-child(2)"
    );
    sidebarContainer.insertAdjacentHTML("afterend", dropdown);
  };

  activateDropdown = () => {
    const selector = document.querySelector("#template-selector");
    selector.addEventListener("click", this.onClick, true);
  };

  setPullRequestBody = (template) => {
    const textarea = document.getElementById("pull_request_body");
    textarea.value = this.templates[template];
  };

  updateTemplateSelector = (template, url) => {
    this.setTemplateSelectorRadio(template);
    this.setTemplateSelectorState(template, url);
    this.setTemplateSelectorLabel(template);
  };

  setTemplateSelectorRadio = (template) => {
    const radio = document.querySelector(`input[value="${template}"]`);
    radio.checked = true;
    radio.dispatchEvent(new CustomEvent("change", { bubbles: true }));
  };

  setTemplateSelectorState = (template, url) => {
    const refSelector = document.querySelector(
      "#template-selector ref-selector"
    );

    if (template === "default") {
      url.searchParams.delete("template");
      refSelector.removeAttribute("current-committish");
    } else {
      url.searchParams.set("template", template);
      refSelector.setAttribute("current-committish", btoa(template));
    }

    refSelector.dispatchEvent(new CustomEvent("input-entered", { detail: "" }));
  };

  setTemplateSelectorLabel = (template) => {
    const span = document.querySelector("#template-selector summary span");
    span.innerHTML = template;
  };

  updateWindowLocation = (url) => {
    window.history.pushState(null, null, url);
  };

  onClick = (e) => {
    const item = e.target.closest(".SelectMenu-item");
    if (item) {
      const template = item.getAttribute("data-ref-name");
      const url = new URL(window.location);

      this.setPullRequestBody(template);
      this.updateTemplateSelector(template, url);
      this.updateWindowLocation(url);

      e.preventDefault();
    }
  };
}

const onLocationChange = (event) => {
  if (
    !event.target.location.href.match(
      /https?:\/\/github\.com\/.+\/compare\/.+$/
    )
  ) {
    return;
  }
  if (document.getElementById("template-selector")) {
    return;
  }

  const repository = new GithubRepository();
  repository.attachDropdown();
};

window.addEventListener("statechange", onLocationChange);
