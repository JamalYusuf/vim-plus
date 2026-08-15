"use strict";
__filename = "background/page_handlers.js";
define([ "require", "exports", "./store", "./utils", "./browser", "./normalize_urls", "./parse_urls", "./settings", "./ports", "./exclusions", "./ui_css", "./key_mappings", "./quick_actions", "./run_commands", "./open_urls", "./frame_commands", "./side_panel" ], (require, exports, store_1, utils_1, browser_1, normalize_urls_1, parse_urls_1, settings_, ports_1, Exclusions, ui_css_1, key_mappings_1, quick_actions_1, run_commands_1, open_urls_1, frame_commands_1, side_panel_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.onReq = void 0;
  settings_ = __importStar(settings_);
  Exclusions = __importStar(Exclusions);
  const pageRequestHandlers_ = [ 
  /** kPgReq.settingsDefaults: */ () => [ settings_.defaults_, store_1.os_, store_1.CONST_.Platform_ ], 
  /** kPgReq.settingsCache: */ req => {
    if (store_1.restoreSettings_) {
      return store_1.restoreSettings_.then(pageRequestHandlers_[1 /* kPgReq.settingsCache */ ].bind(null, req, null));
    }
    const cache = {};
    for (const key in settings_.defaults_) {
      const val = store_1.settingsCache_[key];
      val !== settings_.defaults_[key] && (cache[key] = val);
    }
    return cache;
  }, 
  /** kPgReq.setSetting: */ req => {
    var _a, _b;
    if (store_1.restoreSettings_) {
      return store_1.restoreSettings_.then(pageRequestHandlers_[2 /* kPgReq.setSetting */ ].bind(null, req, null));
    }
    // in fact, allow unknown key
        const key = req.key, val = (_b = (_a = req.val) !== null && _a !== void 0 ? _a : settings_.defaults_[key]) !== null && _b !== void 0 ? _b : null;
    settings_.set_(key, val);
    const val2 = store_1.settingsCache_[key];
    return val2 !== val ? val2 : null;
  }, 
  /** kPgReq.updatePayload: */ req => {
    const val2 = settings_.updatePayload_(req.key, req.val);
    return val2 !== req.val ? val2 : null;
  }, 
  /** kPgReq.notifyUpdate: */ req => {
    settings_.broadcast_({
      N: 6 /* kBgReq.settingsUpdate */ ,
      d: req
    });
  }, 
  /** kPgReq.settingItem: */ req => store_1.settingsCache_[req.key], 
  /** kPgReq.runFgOn: */ id => {
    store_1.framesForTab_.has(id) || browser_1.runContentScriptsOn_(id);
  }, 
  /** kPgReq.keyMappingErrors: */ () => {
    const formatCmdErrors_ = errors => {
      let i, line, output = errors.length > 1 ? errors.length + " Errors:\n" : "Error: ";
      for (line of errors) {
        i = 0;
        output += line[0].replace(/%([a-z])/g, (_, s) => {
          ++i;
          return s === "c" ? "" : s === "s" || s === "d" ? line[i] : JSON.stringify(line[i]);
        });
        i + 1 < line.length && (output += " " + line.slice(i + 1).map(x => typeof x === "object" && x ? JSON.stringify(x) : x).join(" "));
        output += ".\n";
      }
      return output;
    };
    const errors = key_mappings_1.keyMappingErrors_;
    if (store_1.contentPayload_.l & 1 /* kKeyLayout.alwaysIgnore */ && !errors) {
      const nonASCII = arr => /[^ -\xff]/.test(arr.join(""));
      let res = nonASCII(Object.keys(store_1.keyFSM_)) ? 1 : 0;
      res |= store_1.mappedKeyRegistry_ && nonASCII(Object.keys(store_1.mappedKeyRegistry_)) ? 2 : 0;
      if (res) {
        res |= res & 2 || !store_1.mappedKeyRegistry_ || !nonASCII(Object.values(store_1.mappedKeyRegistry_)) ? 0 : 4;
        if (res & 2 || !(res & 4)) {
          return true;
        }
      }
    }
    return errors ? formatCmdErrors_(errors) : "";
  }, 
  /** kPgReq.parseCSS: */ req => {
    const port = ports_1.indexFrame(req[1], 0);
    port && port.s && (port.s.flags_ |= 44 /* Frames.Flags.hasFindCSS */);
    return ui_css_1.mergeCSS(req[0], -1 /* MergeAction.virtual */);
  }, 
  /** kPgReq.reloadCSS: */ req => {
    req && settings_.setInLocal_("isHC_f" /* GlobalConsts.kIsHighContrast */ , req.hc ? "1" : null);
    ui_css_1.reloadCSS_(2 /* MergeAction.rebuildAndBroadcast */);
  }, 
  /** kPgReq.convertToUrl: */ req => {
    const url = normalize_urls_1.convertToUrl_(req[0], null, req[1]);
    return [ url, normalize_urls_1.lastUrlType_ ];
  }, 
  /** kPgReq.updateMediaQueries: */ () => {
    ui_css_1.MediaWatcher_.RefreshAll_();
  }, 
  /** kPgReq.whatsHelp: */ () => {
    const cmdRegistry = store_1.keyToCommandMap_.get("?");
    let matched = cmdRegistry && cmdRegistry.alias_ === 8 /* kBgCmd.showHelp */ && cmdRegistry.background_ ? "?" : "";
    matched || store_1.keyToCommandMap_.forEach((item, key) => {
      item.alias_ === 8 /* kBgCmd.showHelp */ && item.background_ && (matched = matched && matched.length < key.length ? matched : key);
    });
    return matched;
  }, 
  /** kPgReq.checkNewTabUrl: */ url => {
    var _a;
    url = normalize_urls_1.convertToUrl_(url, null, 0 /* Urls.WorkType.Default */);
    return [ url, (_a = store_1.newTabUrls_.get(url)) !== null && _a !== void 0 ? _a : null ];
  }, 
  /** kPgReq.checkSearchUrl: */ str => {
    const map = new Map;
    parse_urls_1.parseSearchEngines_("k:" + str, map);
    const obj = map.get("k");
    if (obj == null) {
      return null;
    }
    const url2 = normalize_urls_1.convertToUrl_(obj.url_, null, -2 /* Urls.WorkType.KeepAll */);
    const fail = normalize_urls_1.lastUrlType_ > 2 /* Urls.Type.MaxOfInputIsPlainUrl */;
    return [ !fail, fail ? obj.url_ : url2.replace(/\s+/g, "%20") + (obj.name_ && obj.name_ !== "k" ? " " + obj.name_ : "") ];
  }, 
  /** kPgReq.focusOrLaunch: */ req => {
    open_urls_1.focusOrLaunch_(req);
  }, 
  /** kPgReq.showUrl: */ url => {
    let str1 = null;
    url.startsWith("vimium://") && (str1 = store_1.evalVimiumUrl_(url.slice(9), 1 /* Urls.WorkType.ActIfNoSideEffects */ , true));
    str1 = str1 !== null ? str1 : normalize_urls_1.convertToUrl_(url, null, -1 /* Urls.WorkType.ConvertKnown */);
    if (typeof str1 === "string") {
      str1 = parse_urls_1.findUrlInText_(str1, "whole");
      str1 = normalize_urls_1.reformatURL_(str1);
    }
    return str1;
  }, 
  /** kPgReq.shownHash: */ () => store_1.shownHash_ && store_1.shownHash_(), 
  /** kPgReq.substitute: */ req => store_1.substitute_(req[0], req[1]), 
  /** kPgReq.checkHarmfulUrl: */ url => open_urls_1.checkHarmfulUrl_(url), 
  /** kPgReq.actionInit: */ () => {
    const oldRef = store_1.curTabId_ >= 0 && store_1.framesForTab_.get(store_1.curTabId_) || null;
    const oldTabId = oldRef ? store_1.curTabId_ : -1, oldFrameId = oldRef ? oldRef.cur_.s.frameId_ : -1;
    const webNav = oldFrameId >= 0 && browser_1.browserWebNav_() || null;
    return Promise.all([ browser_1.Q_(browser_1.getCurTab).then(tabs => tabs && tabs.length ? tabs : oldTabId < 0 ? null : browser_1.Q_(browser_1.tabsGet, oldTabId).then(i => i && [ i ])), webNav ? browser_1.Q_(webNav.getFrame, {
      tabId: oldTabId,
      frameId: oldFrameId
    }) : null, store_1.restoreSettings_ ]).then(([_tabs, frameInfo]) => {
      var _a, _b, _c;
      const tab = _tabs && _tabs[0] || null, tabId = tab ? tab.id : store_1.curTabId_;
      const ref = (_a = store_1.framesForTab_.get(tabId)) !== null && _a !== void 0 ? _a : null;
      frameInfo && frameInfo.url && oldTabId === tabId && ref.cur_.s.frameId_ === oldFrameId && (ref.cur_.s.url_ = frameInfo.url);
      const url = tab ? browser_1.getTabUrl(tab) : ref && (ref.top_ || ref.cur_).s.url_ || "";
      tab && ref && ref.top_ && (ref.top_.s.url_ = url);
      const sender = !ref || ref.cur_.s.frameId_ && !utils_1.protocolRe_.test(ref.cur_.s.url_) ? null : ref.cur_.s;
      const notRunnable = !(ref || tab && url && tab.status === "loading" && /^(ht|s?f)tp/.test(url));
      const unknownExt = getUnknownExt(ref);
      const runnable = !notRunnable && !unknownExt;
      let hasSubDomain = 0;
      let extHost = runnable ? null : unknownExt || !url ? unknownExt : url.startsWith(location.protocol) && !url.startsWith(store_1.Origin2_) ? new URL(url).host : null;
      const extStat = extHost ? store_1.extAllowList_.get(extHost) : null;
      const mayAllow = !runnable && extStat != null && extStat !== true;
      mayAllow ? ref && (ref.unknownExt_ = -1) : extHost = null;
      if (runnable && ref && ref.ports_.length > 1 && url.startsWith("http")) {
        const topHost = (_b = utils_1.safeParseURL_(url)) === null || _b === void 0 ? void 0 : _b.host;
        if (topHost && !utils_1.isIPHost_(topHost, 0)) {
          const isTopHttp = url.startsWith("http:"), suffix = "." + topHost;
          for (const frame of ref.ports_) {
            const iframeUrl = frame !== (ref.top_ || ref.cur_) ? frame.s.url_ : null;
            const iframeHost = (iframeUrl === null || iframeUrl === void 0 ? void 0 : iframeUrl.startsWith("http")) ? (_c = utils_1.safeParseURL_(iframeUrl)) === null || _c === void 0 ? void 0 : _c.host : null;
            if (iframeHost && iframeHost.length > topHost.length && iframeHost.endsWith(suffix)) {
              hasSubDomain = isTopHttp || iframeHost.startsWith("http:") ? 2 : 1;
              if (hasSubDomain > 1) {
                break;
              }
            }
          }
        }
      }
      const topNotSelf = sender && sender.frameId_ ? ref.top_ : null;
      if (topNotSelf && !hasSubDomain && !(sender.flags_ & 512 /* Frames.Flags.ResReleased */)) {
        try {
          frame_commands_1.focusFrame(ref.cur_, true, 5 /* FrameMaskType.ForcedSelf */ , 1);
        } catch (_d) {}
      }
      return {
        ver: store_1.CONST_.VerName_,
        runnable,
        url,
        tabId,
        frameId: ref && (sender || ref.top_) ? (sender || ref.top_.s).frameId_ : 0,
        topUrl: topNotSelf === null || topNotSelf === void 0 ? void 0 : topNotSelf.s.url_,
        frameUrl: sender && sender.url_,
        lock: ref && ref.lock_ ? ref.lock_.status_ : null,
        status: sender ? sender.status_ : 0 /* Frames.Status.enabled */ ,
        hasSubDomain,
        unknownExt: extHost,
        exclusions: runnable ? {
          rules: store_1.settingsCache_.exclusionRules,
          onlyFirst: store_1.settingsCache_.exclusionOnlyFirstMatch,
          matchers: Exclusions.parseMatcher_(null),
          defaults: settings_.defaults_.exclusionRules
        } : null,
        os: store_1.os_,
        reduceMotion: store_1.contentPayload_.m
      };
    });
  }, 
  /** kPgReq.allowExt: */ ([tabId, extIdToAdd]) => {
    let list = store_1.settingsCache_.extAllowList, old = list.split("\n");
    if (old.indexOf(extIdToAdd) < 0) {
      const ind = old.indexOf("# " + extIdToAdd) + 1 || old.indexOf("#" + extIdToAdd) + 1;
      old.splice(ind ? ind - 1 : old.length, ind ? 1 : 0, extIdToAdd);
      list = old.join("\n");
      settings_.set_("extAllowList", list);
    }
    const frames = store_1.framesForTab_.get(tabId);
    frames && (frames.unknownExt_ = null);
    return browser_1.Q_(browser_1.browser_.tabs.get, tabId).then(tab => {
      const q = utils_1.deferPromise_();
      const cb = () => {
        run_commands_1.runNextOnTabLoaded({}, tab, q.resolve_);
        return browser_1.browser_.runtime.lastError;
      };
      tab ? browser_1.browser_.tabs.reload(tab.id, cb) : browser_1.browser_.tabs.reload(cb);
      return q.promise_;
    });
  }, 
  /** kPgReq.toggleStatus: */ ([url, tabId, frameId]) => {
    store_1.evalVimiumUrl_("status/" + url, 3 /* Urls.WorkType.EvenAffectStatus */);
    const port = ports_1.indexFrame(tabId, frameId) || ports_1.indexFrame(tabId, 0);
    const lock = port ? store_1.framesForTab_.get(tabId).lock_ : null;
    port && !lock && store_1.reqH_[10 /* kFgReq.checkIfEnabled */ ]({
      u: port.s.url_
    }, port);
    return [ port ? port.s.status_ : 0 /* Frames.Status.enabled */ , lock ? lock.status_ : null ];
  }, 
  /** kPgReq.parseMatcher: */ pattern => Exclusions.parseMatcher_(pattern)[0], 
  /** kPgReq.initHelp: */ (_, port) => frame_commands_1.initHelp({
    f: true
  }, port), 
  /** kPgReq.callApi: */ req => {
    const mName = req.module, fName = req.name, validFuncs = validApis[mName];
    if (!validApis.hasOwnProperty(mName) || !validFuncs.includes(fName)) {
      return [ void 0, {
        message: "refused"
      } ];
    }
    const module = browser_1.browser_[mName], arr = req.args;
    const func = module[fName];
    return new Promise(resolve => {
      arr.push(res => {
        const err = browser_1.runtimeError_();
        resolve(err ? [ void 0, err ] : [ parseErr(res), void 0 ]);
        return err;
      });
      func.apply(module, arr);
    });
  }, 
  /** kPgReq.selfTabId: */ (_, port) => port.s.tabId_, 
  /** kPgReq.getStorage: */ req => {
    let dict = utils_1.safeObj_();
    if (req) {
      const val = store_1.storageCache_.get(req);
      dict[req] = val != null ? val : null;
    } else {
      store_1.storageCache_.forEach((val, key) => {
        dict[key] = val;
      });
    }
    return dict;
  }, 
  /** kPgReq.setInLocal: */ ({key, val}) => {
    if (!key.includes("|")) {
      return;
    }
    settings_.setInLocal_(key, val);
  }, 
  /** kPgReq.updateOmniPayload: */ ({key, val}, port) => {
    const tabId = port && port.s && port.s.tabId_ || store_1.curTabId_;
    const omniPort = store_1.framesForOmni_.find(i => i.s.tabId_ === tabId);
    omniPort && omniPort.postMessage({
      N: 47 /* kBgReq.omni_updateOptions */ ,
      d: {
        [key]: val
      },
      v: store_1.omniConfVer_
    });
  }, 
  /** kPgReq.saveToSyncAtOnce: */ () => {
    store_1.settingsCache_.vimSync && store_1.updateHooks_.vimSync(true, "vimSync");
  }, 
  /** kPgReq.showInit: */ () => ({
    os: store_1.os_
  }), 
  /** kPgReq.reopenTab: */ req => {
    browser_1.tabsCreate({
      url: req.url
    });
    browser_1.browser_.tabs.remove(req.tabId);
  }, 
  /** kPgReq.checkAllowingAccess: */ () => Promise.all([ new Promise(resolve => {
    browser_1.browser_.extension.isAllowedIncognitoAccess(allowed => {
      resolve(allowed);
    });
  }), new Promise(resolve => {
    browser_1.browser_.extension.isAllowedFileSchemeAccess(allowed => {
      resolve(allowed);
    });
  }) ]), 
  /** kPgReq.sidePanelInit: */ () => browser_1.Q_(browser_1.getCurTab).then(tabs => {
    const tab = tabs && tabs[0];
    const tabId = tab ? tab.id : store_1.curTabId_;
    const url = tab ? browser_1.getTabUrl(tab) : "";
    let host = "";
    try {
      host = url && new URL(url).hostname || "";
    } catch (_a) {}
    const frames = store_1.framesForTab_.get(tabId);
    const status = frames ? frames.cur_.s.status_ : 0 /* Frames.Status.enabled */;
    let siteDisabled = false;
    if (url) {
      try {
        const dummySender = {
          tabId_: tabId,
          frameId_: 0,
          url_: url
        };
        siteDisabled = Exclusions.getExcluded_(url, dummySender) === "";
      } catch (_b) {
        siteDisabled = false;
      }
    }
    return {
      ver: store_1.CONST_.VerName_,
      status,
      url,
      tabId,
      host,
      runnable: !(!frames || !frames.cur_),
      siteDisabled
    };
  }), 
  /** kPgReq.keyBindingsList: */ () => {
    const out = [];
    store_1.keyToCommandMap_.forEach((item, key) => {
      if (!item || /^<v-.\w*>/.test(key)) {
        return;
      }
      out.push({
        key,
        command: item.command_
      });
    });
    out.sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
    return out;
  }, 
  /** kPgReq.recentTabs: */ () => browser_1.Q_(browser_1.browser_.tabs.query, {}).then(tabs => {
    if (!tabs) {
      return [];
    }
    const sorted = tabs.slice().sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    return sorted.slice(0, 80).map(t => ({
      id: t.id,
      title: t.title || "",
      url: t.url || "",
      active: !!t.active
    }));
  }), 
  /** kPgReq.readingListItems: */ () => {
    const rl = browser_1.browser_.readingList;
    if (!rl || !rl.query) {
      return Promise.resolve([]);
    }
    return rl.query({}).then(items => (items || []).slice(0, 30).map(i => ({
      title: i.title || "",
      url: i.url || "",
      hasBeenRead: !!i.hasBeenRead
    })), () => []);
  }, 
  /** kPgReq.runPageAction: */ req => {
    const tabId = req.tabId != null ? req.tabId : store_1.curTabId_;
    return browser_1.Q_(browser_1.tabsGet, tabId).then(tab => {
      if (!tab && req.action !== "runCommand") {
        return Promise.resolve({
          ok: false,
          message: "No tab"
        });
      }
      const t = tab;
      const url = tab ? browser_1.getTabUrl(tab) : "";
      switch (req.action) {
       case "help":
        {
          const port = t && t.id != null ? ports_1.indexFrame(t.id, 0) : null;
          if (!port) {
            open_urls_1.focusOrLaunch_({
              u: browser_1.browser_.runtime.getURL("pages/wiki.html#getting-started")
            });
            return Promise.resolve({
              ok: false,
              message: "No page connection \u2014 opened wiki"
            });
          }
          try {
            run_commands_1.executeExternalCmd({
              command: "showHelp",
              count: 1
            }, {
              tab: t,
              frameId: 0,
              id: browser_1.browser_.runtime.id
            });
            return Promise.resolve({
              ok: true,
              message: "Help"
            });
          } catch (_a) {
            open_urls_1.focusOrLaunch_({
              u: browser_1.browser_.runtime.getURL("pages/wiki.html#getting-started")
            });
            return Promise.resolve({
              ok: false,
              message: "Help failed \u2014 opened wiki"
            });
          }
        }

       case "wiki":
        open_urls_1.focusOrLaunch_({
          u: browser_1.browser_.runtime.getURL("pages/wiki.html#getting-started")
        });
        return Promise.resolve({
          ok: true,
          message: "Opening wiki\u2026"
        });

       case "options":
        open_urls_1.focusOrLaunch_({
          u: browser_1.browser_.runtime.getURL("pages/options.html")
        });
        return Promise.resolve({
          ok: true,
          message: "Opening options\u2026"
        });

       case "sidePanel":
        side_panel_1.openSidePanelImmediate_(t.id, t.windowId);
        return Promise.resolve({
          ok: true
        });

       case "readingList":
        {
          const rl = browser_1.browser_.readingList;
          if (!rl || !/^https?:/.test(url)) {
            return Promise.resolve({
              ok: false,
              message: "Reading List needs an http(s) page"
            });
          }
          const add = () => rl.addEntry({
            title: (t.title || url).slice(0, 255),
            url,
            hasBeenRead: false
          }).then(() => ({
            ok: true,
            message: "Added to Reading List"
          }), e => ({
            ok: false,
            message: e && e.message || "failed"
          }));
          if (rl.query && rl.removeEntry) {
            return rl.query({
              url
            }).then(found => {
              if (found && found.length) {
                return rl.removeEntry({
                  url
                }).then(() => ({
                  ok: true,
                  message: "Removed from Reading List"
                }), add);
              }
              return add();
            }, add);
          }
          return add();
        }

       case "readingListRemove":
        {
          const rl = browser_1.browser_.readingList;
          const target = req.command || url;
          if (!rl || !rl.removeEntry || !target) {
            return Promise.resolve({
              ok: false,
              message: "Cannot remove"
            });
          }
          return rl.removeEntry({
            url: target
          }).then(() => ({
            ok: true,
            message: "Removed from Reading List"
          }), e => ({
            ok: false,
            message: e && e.message || "failed"
          }));
        }

       case "bookmark":
        {
          const bookmarks = browser_1.browser_.bookmarks;
          if (!bookmarks) {
            return Promise.resolve({
              ok: false,
              message: "No bookmarks API"
            });
          }
          return browser_1.Q_(bookmarks.search, {
            url
          }).then(found => {
            if (found && found.length) {
              return browser_1.Q_(bookmarks.remove, found[0].id).then(() => ({
                ok: true,
                message: "Bookmark removed"
              }), () => ({
                ok: false,
                message: "remove failed"
              }));
            }
            return browser_1.Q_(bookmarks.create, {
              title: t.title || url,
              url
            }).then(() => ({
              ok: true,
              message: "Bookmarked"
            }), () => ({
              ok: false,
              message: "create failed"
            }));
          });
        }

       case "toggleGroup":
        {
          if (!browser_1.browser_.tabGroups) {
            return Promise.resolve({
              ok: false,
              message: "No tabGroups"
            });
          }
          const g = t.groupId;
          if (g != null && g !== -1) {
            return new Promise(resolve => {
              browser_1.Tabs_.ungroup([ t.id ], () => {
                resolve({
                  ok: true,
                  message: "Ungrouped"
                });
                return browser_1.runtimeError_();
              });
            });
          }
          return browser_1.Tabs_.group({
            tabIds: [ t.id ]
          }).then(() => ({
            ok: true,
            message: "Grouped"
          }), () => ({
            ok: false,
            message: "group failed"
          }));
        }

       case "disableOnce":
        try {
          t && t.id != null && run_commands_1.executeExternalCmd({
            command: "toggleSwitchTemp",
            options: {
              key: "enabled",
              value: false
            },
            count: 1
          }, {
            tab: t,
            frameId: 0,
            id: browser_1.browser_.runtime.id
          });
        } catch (_b) {}
        open_urls_1.focusOrLaunch_({
          u: "vimium://status/toggle-disabled"
        });
        return Promise.resolve({
          ok: true,
          message: "Vim+ disabled once on this tab"
        });

       case "disableSite":
       case "toggleSite":
        {
          // Toggle permanent exclude for current host (empty passKeys = fully off)
          let host = "";
          const rawUrl = url || t.url || "";
          try {
            host = new URL(rawUrl).hostname || "";
          } catch (_c) {
            const m = /^https?:\/\/([^/:]+)/i.exec(rawUrl);
            host = m && m[1] || "";
          }
          if (!host) {
            return Promise.resolve({
              ok: false,
              message: "No host for this page"
            });
          }
          const httpsPat = ":https://" + host + "/";
          const httpPat = ":http://" + host + "/";
          const rules = (store_1.settingsCache_.exclusionRules || []).slice();
          const isExactOff = r => r.passKeys === "" && (r.pattern === httpsPat || r.pattern === httpPat);
          const isOff = rules.some(isExactOff);
          if (isOff) {
            // Turn ON — remove only the exact full-site rules this toggle wrote
            const next = rules.filter(r => !isExactOff(r));
            settings_.set_("exclusionRules", next);
            const still = url ? Exclusions.getExcluded_(rawUrl, {
              tabId_: t.id,
              frameId_: 0,
              url_: rawUrl
            }) : null;
            return Promise.resolve({
              ok: true,
              siteDisabled: still === "",
              message: still === "" ? "Removed site toggle \u2014 a custom exclusion still applies (Options)" : "Vim+ ON for " + host
            });
          }
          rules.push({
            pattern: httpsPat,
            passKeys: ""
          });
          rules.some(r => r.pattern === httpPat) || rules.push({
            pattern: httpPat,
            passKeys: ""
          });
          settings_.set_("exclusionRules", rules);
          return Promise.resolve({
            ok: true,
            siteDisabled: true,
            message: "Vim+ OFF for " + host
          });
        }

       case "enable":
        open_urls_1.focusOrLaunch_({
          u: "vimium://status/enable"
        });
        return Promise.resolve({
          ok: true,
          message: "Enabled"
        });

       case "copyUrl":
        Promise.resolve(store_1.copy_(url || t.url || "")).then(store_1.blank_, store_1.blank_);
        return Promise.resolve({
          ok: true,
          message: "URL copied"
        });

       case "reload":
        browser_1.Tabs_.reload(t.id);
        return Promise.resolve({
          ok: true,
          message: "Reloading\u2026"
        });

       case "closeTab":
        browser_1.Tabs_.remove(t.id);
        return Promise.resolve({
          ok: true,
          message: "Tab closed"
        });

       case "duplicate":
        browser_1.Tabs_.duplicate(t.id);
        return Promise.resolve({
          ok: true,
          message: "Tab duplicated"
        });

       case "mute":
        {
          const muted = !!t.mutedInfo && t.mutedInfo.muted;
          return browser_1.Q_(browser_1.Tabs_.update, t.id, {
            muted: !muted
          }).then(() => ({
            ok: true,
            message: muted ? "Unmuted" : "Muted"
          }), () => ({
            ok: false,
            message: "mute failed"
          }));
        }

       case "pin":
        return browser_1.Q_(browser_1.Tabs_.update, t.id, {
          pinned: !t.pinned
        }).then(() => ({
          ok: true,
          message: t.pinned ? "Unpinned" : "Pinned"
        }), () => ({
          ok: false,
          message: "pin failed"
        }));

       case "runCommand":
        {
          const name = (req.command || "") + "";
          if (!name || !(name in key_mappings_1.availableCommands_)) {
            return Promise.resolve({
              ok: false,
              message: "Unknown command"
            });
          }
          run_commands_1.executeExternalCmd({
            command: name,
            count: 1
          }, {
            tab: t,
            frameId: 0,
            id: browser_1.browser_.runtime.id
          });
          return Promise.resolve({
            ok: true,
            message: "Ran " + name
          });
        }

       case "quickAction":
        {
          const id = (req.command || "") + "";
          if (!id) {
            return Promise.resolve({
              ok: false,
              message: "No action"
            });
          }
          const raw = quick_actions_1.runQuickAction_(id);
          return Promise.resolve(raw).then(pair => ({
            ok: true,
            message: pair && pair[0] || id
          }), e => ({
            ok: false,
            message: "Action failed: " + (e && e.message || e)
          }));
        }

       case "discard":
        return browser_1.Q_(browser_1.Tabs_.discard, t.id).then(() => ({
          ok: true,
          message: "Tab discarded (slept)"
        }), () => ({
          ok: false,
          message: "discard failed"
        }));

       case "copyTitle":
        Promise.resolve(store_1.copy_(t.title || "")).then(store_1.blank_, store_1.blank_);
        return Promise.resolve({
          ok: true,
          message: "Title copied"
        });

       case "showLastDownload":
       case "cycleWindows":
       case "openDownloads":
       case "openHistoryPage":
       case "openExtensions":
       case "openShortcuts":
        run_commands_1.executeExternalCmd({
          command: req.action,
          count: 1
        }, {
          tab: t,
          frameId: 0,
          id: browser_1.browser_.runtime.id
        });
        return Promise.resolve({
          ok: true,
          message: req.action
        });

       default:
        return Promise.resolve({
          ok: false,
          message: "Unknown action"
        });
      }
    });
  }, 
  /** kPgReq.commandCatalog: */ () => {
    try {
      return quick_actions_1.QUICK_ACTIONS.map(a => ({
        name: a.id,
        bg: true,
        title: a.title,
        cmd: a.cmd,
        cat: a.cat
      }));
    } catch (_a) {
      return [];
    }
  }, 
  /** kPgReq.closedSessions: */ () => {
    const sessions = browser_1.browserSessions_();
    if (!sessions || !sessions.getRecentlyClosed) {
      return Promise.resolve([]);
    }
    return browser_1.Q_(sessions.getRecentlyClosed, {
      maxResults: 25
    }).then(list => {
      if (!list) {
        return [];
      }
      const out = [];
      for (const item of list) {
        if (item.tab) {
          out.push({
            title: item.tab.title || item.tab.url || "Tab",
            url: item.tab.url || "",
            sessionId: item.tab.sessionId || "",
            isWindow: false
          });
        } else if (item.window && item.window.sessionId) {
          const tabs = item.window.tabs || [];
          out.push({
            title: `Window (${tabs.length} tabs)`,
            url: tabs[0] && tabs[0].url || "",
            sessionId: item.window.sessionId,
            isWindow: true
          });
        }
      }
      return out.filter(i => !!i.sessionId);
    }, () => []);
  }, 
  /** kPgReq.restoreSession: */ req => {
    const sessions = browser_1.browserSessions_();
    if (!sessions || !sessions.restore || !req.sessionId) {
      return Promise.resolve({
        ok: false,
        message: "Sessions API unavailable"
      });
    }
    return browser_1.Q_(sessions.restore, req.sessionId).then(() => ({
      ok: true,
      message: "Restored"
    }), () => ({
      ok: false,
      message: "Restore failed"
    }));
  } ];
  const validApis = {
    permissions: [ "contains", "request", "remove" ],
    tabs: [ "update", "remove" ]
  };
  const parseErr = err => ({
    message: err && err.message ? err.message + "" : JSON.stringify(err)
  });
  exports.onReq = (req, port) => pageRequestHandlers_[req.n](req.q, port);
  const getUnknownExt = frames => frames && typeof frames.unknownExt_ === "string" && store_1.extAllowList_.get(frames.unknownExt_) !== true ? frames.unknownExt_ : null;
});