"use strict";
__filename = "background/others.js";
define([ "require", "exports", "./store", "./browser", "./utils", "./settings", "./i18n", "./normalize_urls", "./normalize_urls", "./open_urls" ], (require, exports, store_1, browser_1, BgUtils_, settings_, i18n_1, normalize_urls_1, normalize_urls_2, open_urls_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  BgUtils_ = __importStar(BgUtils_);
  settings_ = __importStar(settings_);
  store_1.updateHooks_.showActionIcon = value => {
    const api = browser_1.browser_.action;
    if (!api) {
      store_1.updateHooks_.showActionIcon = void 0;
      return;
    }
    store_1.set_needIcon_(value);
    browser_1.import2("/background/action_icon.js").then(m => {
      m.toggleIconBuffer_();
    });
    Promise.resolve(i18n_1.extTrans_("name")).then(title => {
      value || (title += "\n\n" + i18n_1.extTrans_("noActiveState"));
      api.setTitle({
        title
      });
    });
  };
  settings_.ready_.then(() => {
    store_1.settingsCache_.showActionIcon ? store_1.updateHooks_.showActionIcon(true, "showActionIcon") : store_1.set_setIcon_(store_1.blank_);
    store_1.settingsCache_.showContextMenu !== false && setupContextMenus_(true);
    setupAlarms_();
    browser_1.import2("/background/side_panel.js").then(m => {
      m.ensureSidePanelConfigured_();
    }, store_1.blank_);
  });
  const MENU_IDS = {
    searchSelection: "vim-plus-search-selection",
    copyLink: "vim-plus-copy-link",
    excludeSite: "vim-plus-exclude-site",
    openOptions: "vim-plus-open-options",
    openSidePanel: "vim-plus-open-side-panel",
    readingList: "vim-plus-reading-list",
    bookmark: "vim-plus-bookmark"
  };
  const setupContextMenus_ = enable => {
    const menus = browser_1.browser_.contextMenus;
    if (!menus) {
      return;
    }
    menus.removeAll(() => {
      browser_1.runtimeError_();
      if (!enable) {
        return;
      }
      const mk = (id, title, contexts) => {
        menus.create({
          id,
          title,
          contexts
        }, browser_1.runtimeError_);
      };
      mk(MENU_IDS.searchSelection, "Search selection with Vim+", [ "selection" ]);
      mk(MENU_IDS.copyLink, "Copy link URL (Vim+)", [ "link" ]);
      mk(MENU_IDS.excludeSite, "Exclude this site in Vim+", [ "page" ]);
      mk(MENU_IDS.readingList, "Add to Reading List (Vim+)", [ "page", "link" ]);
      mk(MENU_IDS.bookmark, "Toggle bookmark (Vim+)", [ "page" ]);
      mk(MENU_IDS.openSidePanel, "Open Vim+ side panel", [ "page", "action", "selection", "link", "editable" ]);
      mk(MENU_IDS.openOptions, "Vim+ Options", [ "page", "action" ]);
    });
  };
  store_1.updateHooks_.showContextMenu = value => {
    setupContextMenus_(!!value);
  };
  {
    const menus = browser_1.browser_.contextMenus;
    menus && menus.onClicked.addListener((info, tab) => {
      switch (info.menuItemId) {
       case MENU_IDS.openOptions:
        browser_1.browser_.runtime.openOptionsPage();
        break;

       case MENU_IDS.openSidePanel:
        // Context-menu click is a valid user gesture — open with windowId (global panel).
        browser_1.import2("/background/side_panel.js").then(m => {
          tab ? m.openSidePanelImmediate_(tab.id, tab.windowId) : m.openSidePanelImmediate_();
        }, store_1.blank_);
        break;

       case MENU_IDS.searchSelection:
        {
          const text = (info.selectionText || "").trim();
          if (!text) {
            break;
          }
          open_urls_1.openUrlReq({
            u: text,
            r: -1
 /* ReuseType.newFg */          });
          break;
        }

       case MENU_IDS.copyLink:
        {
          const url = info.linkUrl;
          if (!url) {
            break;
          }
          Promise.resolve(store_1.copy_(url)).then(store_1.blank_, store_1.blank_);
          break;
        }

       case MENU_IDS.excludeSite:
        {
          if (!tab || !tab.url) {
            break;
          }
          const url = tab.url;
          const m = /^(https?:\/\/[^/]+)/.exec(url);
          if (!m) {
            break;
          }
          const pattern = `:${m[1]}/`;
          const rules = store_1.settingsCache_.exclusionRules.slice();
          if (!rules.some(r => r.pattern === pattern)) {
            rules.push({
              pattern,
              passKeys: ""
            });
            settings_.set_("exclusionRules", rules);
          }
          break;
        }

       case MENU_IDS.readingList:
        {
          if (!tab) {
            break;
          }
          const rl = browser_1.browser_.readingList;
          const url = info.linkUrl || tab.url || "";
          if (!rl || !/^https?:/.test(url)) {
            break;
          }
          rl.addEntry({
            title: (tab.title || url).slice(0, 255),
            url,
            hasBeenRead: false
          }).then(store_1.blank_, store_1.blank_);
          break;
        }

       case MENU_IDS.bookmark:
        if (!tab || !tab.url || !browser_1.browser_.bookmarks) {
          break;
        }
        browser_1.Q_(browser_1.browser_.bookmarks.search, {
          url: tab.url
        }).then(found => {
          found && found.length ? browser_1.Q_(browser_1.browser_.bookmarks.remove, found[0].id).then(store_1.blank_, store_1.blank_) : browser_1.Q_(browser_1.browser_.bookmarks.create, {
            title: tab.title || tab.url,
            url: tab.url
          }).then(store_1.blank_, store_1.blank_);
        }, store_1.blank_);
        break;
      }
    });
  }
  const setupAlarms_ = () => {
    const alarms = browser_1.browser_.alarms;
    if (!alarms) {
      return;
    }
    alarms.create("vim-plus-tick", {
      periodInMinutes: 1
    });
    alarms.onAlarm.addListener(alarm => {
      if (alarm.name !== "vim-plus-tick") {
        return;
      }
      try {
        const session = browser_1.browser_.storage && browser_1.browser_.storage.session;
        session && session.get("recency").then(store_1.blank_, store_1.blank_);
      } catch (_a) {}
    });
  };
  (() => {
    const omnibox = browser_1.browser_.omnibox;
    if (!omnibox) {
      return;
    }
    let colon2 = ": ", msg_inited = false, openColon = "Open: ";
    const onDel = omnibox.onDeleteSuggestion;
    let inputTime, last = null, firstResultUrl = "", lastSuggest = null, timer = 0, subInfoMap = null, maxChars = 128 /* OmniboxData.DefaultMaxChars */ , suggestions = null, cleanTimer = 0, defaultSuggestionType = 0 /* FirstSugType.Default */ , matchType = 0 /* CompletersNS.MatchType.Default */ , matchedSugTypes = 0 /* CompletersNS.SugType.Empty */;
    const maxResults = 12;
    const normalizeInput = input => {
      input = input.trim().replace(BgUtils_.spacesRe_, " ");
      if (store_1.vomnibarBgOptions_.actions.includes("icase")) {
        const prefix = /^:[WBH] /.test(input) ? 3 : 0;
        input = prefix ? input.slice(0, prefix) + input.slice(prefix).toLowerCase() : input.toLowerCase();
      }
      return input;
    };
    function clean() {
      lastSuggest && (lastSuggest.suggest_ = null);
      subInfoMap = suggestions = lastSuggest = last = null;
      cleanTimer && clearTimeout(cleanTimer);
      timer && clearTimeout(timer);
      inputTime = matchType = matchedSugTypes = cleanTimer = timer = 0;
      firstResultUrl = "";
      BgUtils_.resetRe_();
    }
    function tryClean() {
      const delta = Date.now() - inputTime;
 // safe for time changes
            if (delta > 5e3 || delta < -5e3 /* GlobalConsts.ToleranceOfNegativeTimeDelta */) {
        return clean();
      }
      cleanTimer = setTimeout(tryClean, 3e4);
    }
    function onTimer() {
      timer = 0;
      const arr = lastSuggest;
      if (!arr || arr.sent_) {
        return;
      }
      lastSuggest = null;
      if (arr.suggest_) {
        const now = Date.now();
 // safe for time changes
                now < inputTime && (inputTime = now - 1e3);
        return onInput(arr.key_, arr.suggest_);
      }
    }
    function onComplete(suggest, response, autoSelect, newMatchType, newMatchedSugTypes) {
      // Note: in https://chromium.googlesource.com/chromium/src/+/master/chrome/browser/autocomplete/keyword_extensions_delegate_impl.cc#167 ,
      // the block of `case extensions::NOTIFICATION_EXTENSION_OMNIBOX_SUGGESTIONS_READY:`
      if (!suggest.suggest_) {
        lastSuggest === suggest && (lastSuggest = null);
        return;
      }
      lastSuggest = null;
      let defaultDesc, notEmpty = response.length > 0, sug = notEmpty ? response[0] : null;
      matchType = newMatchType;
      matchedSugTypes = newMatchedSugTypes;
      suggestions = [];
      const urlDict = new Set;
      const showTypeLetter = ` ${store_1.omniPayload_.t} `.includes(" type-letter ");
      for (let i = 0, di = autoSelect ? 0 : 1, len = response.length; i < len; i++) {
        const sugItem = response[i], {title, u: rawUrl, e: type} = sugItem;
        let url = rawUrl, desc = "", hasSessionId = sugItem.s != null, canBeDeleted = !(autoSelect && i === 0) && (type === "tab" ? sugItem.s !== store_1.curTabId_ : type === "history" && !hasSessionId);
        url = BgUtils_.encodeAsciiURI_(url, 1);
        url.startsWith("file") && (url = normalize_urls_2.decodeFileURL_(url));
        url = url.replace(/%20/g, " ");
        urlDict.has(url) ? url = `:${i + di} ${url}` : urlDict.add(url);
        canBeDeleted && (desc = ` ~${i + di}~`);
        desc = (title || showTypeLetter ? (title ? title + " <dim>" : "<dim>") + (showTypeLetter ? `[${sugItem.e[0].toUpperCase()}] ` : "") + (title ? "-</dim> <url>" : "</dim><url>") : "<url>") + sugItem.textSplit + "</url>" + (desc && `<dim>${desc}</dim>`);
        const msg = {
          content: url,
          description: desc
        };
        canBeDeleted && (msg.deletable = true);
        if (canBeDeleted || hasSessionId) {
          subInfoMap || (subInfoMap = new Map);
          subInfoMap.has(url) || subInfoMap.set(url, {
            type_: type,
            sessionId_: hasSessionId ? sugItem.s : null,
            url_: rawUrl
          });
        }
        suggestions.push(msg);
      }
      last = suggest.key_;
      if (autoSelect) {
        if (sug.e === "search") {
          let text = sug.p;
          defaultDesc = (text && `<dim>${BgUtils_.escapeText_(text) + colon2}</dim>`) + `<url>${sug.textSplit}</url>`;
          defaultSuggestionType = 2 /* FirstSugType.search */;
          if (sug = response[1]) {
            switch (sug.e) {
             case "math":
              suggestions[1].description = `${sug.textSplit} = <url><match>${sug.t}</match></url>`;
              break;
            }
          }
        } else {
          defaultSuggestionType = 3 /* FirstSugType.plainOthers */;
          defaultDesc = suggestions[0].description;
        }
      } else if (defaultSuggestionType !== 1 /* FirstSugType.defaultOpen */) {
        defaultDesc = `<dim>${openColon}</dim><url>%s</url>`;
        defaultSuggestionType = 1 /* FirstSugType.defaultOpen */;
      }
      if (autoSelect) {
        firstResultUrl = response[0].u;
        subInfoMap && suggestions.length > 0 && firstResultUrl !== suggestions[0].content && subInfoMap.set(firstResultUrl, subInfoMap.get(suggestions[0].content));
        suggestions.shift();
      }
      defaultDesc && browser_1.browser_.omnibox.setDefaultSuggestion({
        description: defaultDesc
      });
      suggest.suggest_(suggestions);
      BgUtils_.resetRe_();
      return;
    }
    function onInput(key, suggest) {
      key = normalizeInput(key);
      if (lastSuggest) {
        let same = key === lastSuggest.key_;
        lastSuggest.suggest_ = same ? suggest : null;
        if (same) {
          return;
        }
      }
      if (key === last) {
        suggestions && suggest(suggestions);
        return;
      }
      if (matchType === 1 /* CompletersNS.MatchType.emptyResult */ && key.startsWith(last)) {
        // avoid Chrome showing results from its inner search engine because of `suggest` being destroyed
        suggest([]);
        return;
      }
      lastSuggest = {
        suggest_: suggest,
        key_: key,
        sent_: false
      };
      if (timer) {
        return;
      }
      const now = Date.now(), delta = store_1.omniPayload_.i + inputTime - now;
 /** it's made safe by {@see #onTimer} */      if (delta > 30 && delta < 3e3) {
        // in case of system time jumping
        timer = setTimeout(onTimer, delta);
        return;
      }
      lastSuggest.sent_ = true;
      cleanTimer || (cleanTimer = setTimeout(tryClean, 3e4));
      inputTime = now;
      subInfoMap = suggestions = null;
      firstResultUrl = "";
      const type = matchType < 2 /* MatchType.someMatches */ || !key.startsWith(last) ? 0 /* SugType.Empty */ : matchType === 3 /* MatchType.searchWanted */ ? key.includes(" ") ? 0 /* SugType.Empty */ : 8 /* SugType.search */ : matchedSugTypes;
      store_1.Completion_.filter_(key, {
        o: "omni",
        t: type,
        r: maxResults,
        c: maxChars,
        f: 1
 /* CompletersNS.QueryFlags.AddressBar */      }, onComplete.bind(null, lastSuggest));
    }
    function onEnter(text, disposition) {
      const arr = lastSuggest;
      if (arr && arr.suggest_) {
        arr.suggest_ = onEnter.bind(null, text, disposition);
        if (arr.sent_) {
          return;
        }
        timer && clearTimeout(timer);
        return onTimer();
      }
      text = normalizeInput(text);
      if (last === null && text) {
        // need a re-computation
        // * may has been cleaned, or
        // * search `v `"t.e abc", and then input "t.e abc", press Down to select `v `"t.e abc", and then press Enter
        return store_1.Completion_.filter_(text, {
          o: "omni",
          t: 0 /* SugType.Empty */ ,
          r: 3,
          c: maxChars,
          f: 1
 /* CompletersNS.QueryFlags.AddressBar */        }, (sugs, autoSelect) => autoSelect ? open(sugs[0].u, disposition, sugs[0].s) : open(text, disposition));
      }
      firstResultUrl && text === last && (text = firstResultUrl);
      const info = subInfoMap === null || subInfoMap === void 0 ? void 0 : subInfoMap.get(text), sessionId = info === null || info === void 0 ? void 0 : info.sessionId_;
      clean();
      return open(info ? info.url_ : text, disposition, sessionId);
    }
    function open(text, disposition, sessionId) {
      text ? text[0] === ":" && /^:([1-9]|1[0-2]) /.test(text) && (text = text.slice(text[2] === " " ? 3 : 4)) : text = normalize_urls_1.convertToUrl_("");
      text.slice(0, 7).toLowerCase() === "file://" && (text = BgUtils_.getImageExtRe_().test(text) ? normalize_urls_1.formatVimiumUrl_("show image " + text, false, 0 /* Urls.WorkType.Default */) : text);
      return sessionId != null ? store_1.reqH_[7 /* kFgReq.gotoSession */ ]({
        s: sessionId
      }) : open_urls_1.openUrlReq({
        u: text,
        r: disposition === "currentTab" ? 0 /* ReuseType.current */ : disposition === "newForegroundTab" ? -1 /* ReuseType.newFg */ : -2
 /* ReuseType.newBg */      });
    }
    omnibox.onInputStarted.addListener(() => {
      browser_1.getCurWnd(false, wnd => {
        const width = wnd && wnd.width;
        maxChars = width ? Math.floor((width - 160) / 7.72 /* OmniboxData.MeanWidthOfChar */) : 128 /* OmniboxData.DefaultMaxChars */;
      });
      if (!msg_inited) {
        msg_inited = true;
        Promise.resolve(i18n_1.extTrans_("i18n")).then(() => {
          i18n_1.i18nLang_() !== "en" && Promise.resolve(i18n_1.trans_("colon")).then(colon => {
            colon2 = colon + i18n_1.trans_("NS") || colon2;
            openColon = i18n_1.trans_("OpenC") || openColon;
          });
        });
      }
      if (cleanTimer) {
        return clean();
      }
    });
    omnibox.onInputChanged.addListener(onInput);
    omnibox.onInputEntered.addListener(onEnter);
    onDel.addListener(text => {
      const ind = parseInt(text.slice(text.lastIndexOf("~", text.length - 2) + 1)) - 1;
      const url = suggestions && suggestions[ind].content, info = url && subInfoMap ? subInfoMap.get(url) : null, type = info && info.type_;
      if (!type) {
        console.log("Error: want to delete a suggestion but no related info found (may spend too long before deleting).");
        return;
      }
      store_1.reqH_[25 /* kFgReq.removeSug */ ]({
        t: type,
        s: info.sessionId_,
        u: info.url_
      });
    });
  })();
  (() => {
    let status = 0, listened = false, refreshTimer = 0;
    const protocol = store_1.IsEdg_ ? "edge:" : "chrome:", ntp = store_1.IsEdg_ ? "" : protocol + "//newtab/", ntp2 = store_1.IsEdg_ ? "" : protocol + "//new-tab-page/";
    const onCommitted = nav => {
      nav.frameId === 0 && nav.url.startsWith(protocol) && status & (store_1.IsEdg_ || !nav.url.startsWith(ntp) && !nav.url.startsWith(ntp2) ? 1 : 2) && !refreshTimer && browser_1.runContentScriptsOn_(nav.tabId);
    };
    browser_1.watchPermissions_([ {
      origins: [ "chrome://*/*" ]
    }, store_1.IsEdg_ ? null : {
      origins: [ "chrome://new-tab-page/*" ]
    } ], function onChange(allowList) {
      status = (allowList[0] ? 1 : 0) + (allowList[1] ? 2 : 0);
      status & 1 && !store_1.settingsCache_.allBrowserUrls && (status ^= 1);
      if (listened !== !!status) {
        const webNav = browser_1.browserWebNav_();
        if (!webNav) {
          return false;
        }
        // tabs.onUpdated can fire very often
                webNav.onCommitted[(listened = !listened) ? "addListener" : "removeListener"](onCommitted);
      }
      refreshTimer = refreshTimer || status && setTimeout(() => {
        status ? browser_1.Tabs_.query({
          url: protocol + "//*/*"
        }, tabs => {
          refreshTimer = 0;
          for (const tab of tabs || []) {
            !store_1.framesForTab_.has(tab.id) && status & (tab.url.startsWith(ntp) || tab.url.startsWith(ntp2) ? 2 : 1) && browser_1.runContentScriptsOn_(tab.id);
          }
          return browser_1.runtimeError_();
        }) : refreshTimer = 0;
      }, 120);
      status && !store_1.updateHooks_.allBrowserUrls && (store_1.updateHooks_.allBrowserUrls = onChange.bind(null, allowList, false));
    });
  })();
  // According to tests: onInstalled will be executed after 0 ~ 16 ms if needed
    store_1.installation_ && Promise.all([ store_1.installation_, settings_.ready_ ]).then(([details]) => {
    const reason = details && details.reason;
    const oldVer = reason === "install" ? "" : reason === "update" && details.previousVersion || "none";
    if (oldVer === "none") {
      return;
    }
    setTimeout(() => {
      browser_1.Tabs_.query({
        status: "complete"
      }, tabs => {
        const allowedRe = /^(file|ftps?|https?):/;
        for (const tab of tabs) {
          allowedRe.test(tab.url) && !store_1.framesForTab_.has(tab.id) && browser_1.runContentScriptsOn_(tab.id);
        }
      });
      console.log("%cVim+%c has been %cinstalled%c with %o at %c%s%c.", "color:red", "color:auto", "color:#0c85e9", "color:auto", details, "color:#0c85e9", BgUtils_.now(), "color:auto");
      store_1.CONST_.DisallowIncognito_ && console.log("Sorry, but some commands of Vim+ require the permission to run in incognito mode.");
      if (!oldVer) {
        const delay = () => {
          if (store_1.onInit_ || store_1.restoreSettings_) {
            ++tick < 25 && setTimeout(delay, 200);
            return;
          }
          open_urls_1.focusOrLaunch_({
            u: store_1.CONST_.OptionsPage_ + "#installed"
          });
        };
        let tick = 0;
        delay();
        return;
      }
      settings_.postUpdate_("vomnibarPage");
      if (parseFloat(oldVer) >= parseFloat(store_1.CONST_.VerCode_) && (oldVer >= "1.99.98" || store_1.CONST_.VerCode_ < "1.99.98")) {
        return;
      }
      settings_.postUpdate_("newTabUrl");
      if (!store_1.settingsCache_.notifyUpdate) {
        return;
      }
      let noteId = "vimium_c-upgrade-notification";
      Promise.all([ i18n_1.trans_("Upgrade"), i18n_1.trans_("upgradeMsg", [ store_1.CONST_.VerName_ ]), i18n_1.trans_("upgradeMsg2"), i18n_1.trans_("clickForMore") ]).then(([upgrade, msg, msg2, clickForMore]) => {
        const args = {
          type: "basic",
          iconUrl: store_1.Origin2_ + "icons/icon128.png",
          title: "Vim+ " + upgrade,
          message: msg + msg2 + "\n\n" + clickForMore
        };
        store_1.CurCVer_ >= 70 /* BrowserVer.Min$NotificationOptions$$silent */ && (args.silent = true);
        const browserNotifications = browser_1.browser_.notifications;
        browserNotifications && browserNotifications.create(noteId, args, notificationId => {
          let err;
          if (err = browser_1.runtimeError_()) {
            return err;
          }
          noteId = notificationId || noteId;
          browserNotifications.onClicked.addListener(function callback(id) {
            if (id !== id) {
              return;
            }
            browserNotifications.clear(id);
            open_urls_1.focusOrLaunch_({
              u: normalize_urls_1.convertToUrl_("vimium://release")
            });
            browserNotifications.onClicked.removeListener(callback);
          });
        });
      });
    }, 500);
  });
  setTimeout(() => {
    const doc = globalThis.document;
    doc && doc.body && (doc.body.innerText = "");
    BgUtils_.resetRe_();
    globalThis.a = null;
    globalThis.cb = b => {
      globalThis.a = b;
      console.log("%o", b);
    };
  }, 1e3);
});