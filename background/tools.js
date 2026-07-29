"use strict";
__filename = "background/tools.js";
define([ "require", "exports", "./store", "./utils", "./browser", "./normalize_urls", "./parse_urls", "./settings", "./ports", "./ui_css", "./i18n", "./run_commands", "./open_urls", "./tab_commands" ], (require, exports, store_1, BgUtils_, browser_1, normalize_urls_1, parse_urls_1, settings_, ports_1, ui_css_1, i18n_1, run_commands_1, open_urls_1, tab_commands_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.TabRecency_ = exports.FindModeHistory_ = exports.Marks_ = exports.ContentSettings_ = void 0;
  BgUtils_ = __importStar(BgUtils_);
  settings_ = __importStar(settings_);
  exports.ContentSettings_ = {
    makeKey_(contentType, url) {
      return "vimiumContent|" + contentType + (url ? "|" + url : "");
    },
    complain_(contentType, url) {
      let bcs = browser_1.browser_.contentSettings;
      try {
        bcs && bcs.images.get({
          primaryUrl: "https://127.0.0.1/"
        }, browser_1.runtimeError_);
      } catch (// Chrome 89 would throw an exception if .cs was disabled after being used
      _a) {
        // Chrome 89 would throw an exception if .cs was disabled after being used
        bcs = null;
      }
      if (!bcs) {
        ports_1.showHUD("Has not permitted to set contentSettings");
        setTimeout(() => {
          open_urls_1.focusOrLaunch_({
            u: store_1.CONST_.OptionsPage_ + "#optionalPermissions"
          });
        }, 800);
        return true;
      }
      if (!bcs[contentType] || /^[A-Z]/.test(contentType) || !bcs[contentType].get) {
        ports_1.showHUD(i18n_1.trans_("unknownCS", [ contentType ]));
        return true;
      }
      if (!url.startsWith("read:") && BgUtils_.protocolRe_.test(url) && !url.startsWith(store_1.CONST_.BrowserProtocol_)) {
        return false;
      }
      ports_1.complainLimits(i18n_1.trans_("changeItsCS"));
      return true;
    },
    parsePattern_(pattern, level) {
      if (pattern.startsWith("file:")) {
        const a = 1;
        if (a) {
          ports_1.complainLimits(a === 1 ? i18n_1.trans_("setFileCS", [ 56 /* BrowserVer.MinFailToToggleImageOnFileURL */ ]) : i18n_1.trans_("setFolderCS"));
          return [];
        }
        return [ pattern.split(/[?#]/, 1)[0] ];
      }
      if (pattern.startsWith("ftp")) {
        ports_1.complainLimits(i18n_1.trans_("setFTPCS"));
        return [];
      }
      let result, info = pattern.match(/^([^:]+:\/\/)([^\/]+)/), hosts = normalize_urls_1.hostRe_.exec(info[2]), host = hosts[3] + (hosts[4] || "");
      pattern = info[1];
      result = [ pattern + host + "/*" ];
      if (level < 2 || BgUtils_.isIPHost_(hosts[3], 0)) {
        return result;
      }
      hosts = null;
      const [arr, partsNum] = BgUtils_.splitByPublicSuffix_(host), end = Math.min(arr.length - partsNum, level - 1);
      for (let j = 0; j < end; j++) {
        host = host.slice(arr[j].length + 1);
        result.push(pattern + host + "/*");
      }
      result.push(pattern + "*." + host + "/*");
      end === arr.length - partsNum && pattern === "http://" && result.push("https://*." + host + "/*");
      return result;
    },
    hasOtherOrigins_(frames) {
      let last;
      for (const {s: {url_: url}} of frames.ports_) {
        let cur = new URL(url).host;
        if (last && last !== cur) {
          return true;
        }
        last = cur;
      }
      return false;
    },
    Clear_(contentType, incognito) {
      const bcs = browser_1.browser_.contentSettings, cs = bcs[contentType], kIncognito = "incognito_session_only", kRegular = "regular";
      if (incognito != null) {
        cs.clear({
          scope: incognito ? kIncognito : kRegular
        });
        return;
      }
      cs.clear({
        scope: kRegular
      });
      cs.clear({
        scope: kIncognito
      }, browser_1.runtimeError_);
      settings_.setInLocal_(exports.ContentSettings_.makeKey_(contentType), null);
    },
    clearCS_(options, port) {
      const ty = options.type ? "" + options.type : "images";
      if (!exports.ContentSettings_.complain_(ty, "http://a.cc/")) {
        exports.ContentSettings_.Clear_(ty, port ? port.s.incognito_ : store_1.curIncognito_ === 2 /* IncognitoType.true */);
        ports_1.showHUDEx(port, "csCleared", 0, [ [ ty[0].toUpperCase() + ty.slice(1) ] ]);
        return true;
      }
      return false;
    },
    toggleCS_(options, count, tabs, resolve) {
      const ty = options.type ? "" + options.type : "images", tab = tabs[0];
      options.incognito ? exports.ContentSettings_.ensureIncognito_(count, ty, tab, resolve) : exports.ContentSettings_.toggleCurrent_(ty, count, tab, options.action === "reopen", resolve);
    },
    toggleCurrent_(contentType, count, tab, reopen, resolve) {
      const pattern = normalize_urls_1.removeComposedScheme_(tab.url);
      if (exports.ContentSettings_.complain_(contentType, pattern)) {
        resolve(0);
        return;
      }
      browser_1.browser_.contentSettings[contentType].get({
        primaryUrl: pattern,
        incognito: tab.incognito
      }, opt => {
        exports.ContentSettings_.setAllLevels_(contentType, pattern, count, {
          scope: tab.incognito ? "incognito_session_only" : "regular",
          setting: opt && opt.setting === "allow" ? "block" : "allow"
        }, err => {
          if (err) {
            resolve(0);
            return;
          }
          if (!tab.incognito) {
            const key = exports.ContentSettings_.makeKey_(contentType);
            settings_.getInLocal_(key) !== 1 && settings_.setInLocal_(key, 1);
          }
          let arr, couldNotRefresh = !browser_1.browserSessions_() || (arr = store_1.framesForTab_.get(tab.id)) && arr.ports_.length > 1 && exports.ContentSettings_.hasOtherOrigins_(arr);
          tab.incognito || reopen ? tab_commands_1.reopenTab_(tab) : tab.index > 0 ? tab_commands_1.reopenTab_(tab, couldNotRefresh ? 0 : 2) : browser_1.getCurWnd(true, wnd => {
            wnd && wnd.type === "normal" ? tab_commands_1.reopenTab_(tab, couldNotRefresh ? 0 : wnd.tabs.length > 1 ? 2 : 1) : browser_1.Tabs_.reload(run_commands_1.getRunNextCmdBy(0 /* kRunOn.otherCb */));
            return browser_1.runtimeError_();
          });
        });
      });
    },
    ensureIncognito_(count, contentType, tab, resolve) {
      if (store_1.CONST_.DisallowIncognito_) {
        ports_1.complainLimits(i18n_1.trans_("setIncogCS"));
        resolve(0);
        return;
      }
      const pattern = normalize_urls_1.removeComposedScheme_(tab.url);
      if (exports.ContentSettings_.complain_(contentType, pattern)) {
        resolve(0);
        return;
      }
      browser_1.browser_.contentSettings[contentType].get({
        primaryUrl: pattern,
        incognito: true
      }, opt => {
        if (browser_1.runtimeError_()) {
          browser_1.browser_.contentSettings[contentType].get({
            primaryUrl: pattern
          }, opt2 => {
            if (opt2 && opt2.setting === "allow") {
              resolve(1);
              return;
            }
            const wndOpt = {
              type: "normal",
              incognito: true,
              focused: false,
              url: "about:blank"
            };
            browser_1.Windows_.create(wndOpt, wnd => {
              const leftTabId = wnd.tabs[0].id;
              return exports.ContentSettings_.setAndUpdate_(count, contentType, tab, pattern, wnd.id, true, () => {
                browser_1.Tabs_.remove(leftTabId);
              });
            });
          });
          return browser_1.runtimeError_();
        }
        if (opt && opt.setting === "allow" && tab.incognito) {
          return exports.ContentSettings_.updateTab_(tab);
        }
        browser_1.Windows_.getAll(wnds => {
          wnds = wnds.filter(wnd => wnd.incognito && wnd.type === "normal");
          if (!wnds.length) {
            console.log("%cContentSettings.ensure", "color:red", "get incognito content settings", opt, " but can not find an incognito window.");
            return;
          }
          const preferred = open_urls_1.preferLastWnd(wnds);
          if (opt && opt.setting === "allow") {
            return exports.ContentSettings_.updateTab_(tab, preferred.id);
          }
          const wndId = tab.windowId, isIncNor = tab.incognito && wnds.some(wnd => wnd.id === wndId);
          return exports.ContentSettings_.setAndUpdate_(count, contentType, tab, pattern, isIncNor ? void 0 : preferred.id);
        });
      });
    },
    // `callback` must be executed
    setAndUpdate_(count, contentType, tab, pattern, wndId, syncState, callback) {
      const cb = exports.ContentSettings_.updateTabAndWindow_.bind(null, tab, wndId, callback);
      return exports.ContentSettings_.setAllLevels_(contentType, pattern, count, {
        scope: "incognito_session_only",
        setting: "allow"
      }, syncState && wndId !== tab.windowId ? err => {
        if (err) {
          return cb(err);
        }
        browser_1.Windows_.get(tab.windowId, cb);
      } : cb);
    },
    setAllLevels_(contentType, url, count, settings, callback) {
      let left, has_err = false;
      const ref = browser_1.browser_.contentSettings[contentType], func = () => {
        const err = browser_1.runtimeError_();
        err && console.log("[%o]", Date.now(), err);
        if (has_err) {
          return err;
        }
        --left;
        has_err = !!err;
        (has_err || left === 0) && setTimeout(callback, 0, has_err);
        return err;
      }, arr = exports.ContentSettings_.parsePattern_(url, count | 0);
      left = arr.length;
      if (left <= 0) {
        return callback(true);
      }
      BgUtils_.safer_(settings);
      for (const pattern of arr) {
        ref.set(Object.assign({
          primaryPattern: pattern
        }, settings), func);
      }
    },
    updateTabAndWindow_(tab, wndId, callback, oldWnd) {
      oldWnd !== true && exports.ContentSettings_.updateTab_(tab, wndId);
      callback && callback();
      if (oldWnd === true) {
        run_commands_1.runNextCmd(0);
        return;
      }
      wndId && browser_1.Windows_.update(wndId, {
        focused: true,
        state: oldWnd ? oldWnd.state : void 0
      });
    },
    updateTab_(tab, newWindowId) {
      tab.active = true;
      if (typeof newWindowId === "number" && tab.windowId !== newWindowId) {
        tab.index = void 0;
        tab.windowId = newWindowId;
      }
      tab_commands_1.reopenTab_(tab);
    }
  };
  exports.Marks_ = {
    set_({l: local, n: markName, s: scroll, u: url}, incognito, tabId) {
      if (local && scroll[0] === 0 && scroll[1] === 0) {
        if (scroll.length === 2) {
          const i = url.indexOf("#");
          i > 0 && i < url.length - 1 && (scroll = [ 0, 0, url.slice(i) ]);
        } else {
          (scroll[2] || "").length < 2 && (// '#' or (wrongly) ''
          scroll = [ 0, 0 ]);
        }
      }
      tabId = tabId >= 0 ? tabId : -1;
      const sc2 = incognito ? scroll : scroll.length !== 2 || scroll[0] || scroll[1] ? scroll.length !== 2 || scroll[1] > 524287 || scroll[0] > 8191 ? scroll : Math.max(0, scroll[0]) | Math.max(0, scroll[1]) << 13 : 0;
      const key = exports.Marks_.getLocationKey_(markName, local ? url : "");
      const val = local ? sc2 : sc2 ? {
        s: sc2,
        t: tabId,
        u: url.slice(0, 8192)
      } : {
        t: tabId,
        u: url.slice(0, 8192)
      };
      incognito ? (store_1.incognitoMarkCache_ || (IncognitoWatcher_.watch_(), store_1.set_incognitoMarkCache_(new Map))).set(key, val) : settings_.setInLocal_(key, val);
    },
    goToMark_(exOpts, request, port, lastKey) {
      const {n: markName} = request, key = exports.Marks_.getLocationKey_(markName, request.l ? request.u : "");
      const stored = port.s.incognito_ && (store_1.incognitoMarkCache_ === null || store_1.incognitoMarkCache_ === void 0 ? void 0 : store_1.incognitoMarkCache_.get(key)) || settings_.getInLocal_(key);
      let parsed = typeof stored === "number" ? [ stored & 8191, stored >>> 13 ] : typeof stored === "string" ? JSON.parse(stored) : stored ? stored instanceof Array ? stored.slice(0) : {
        url: stored.u,
        tabId: stored.t,
        scroll: typeof stored.s !== "number" ? stored.s || [ 0, 0 ] : [ stored.s & 8191, stored.s >>> 13 ]
      } : stored;
      typeof stored === "string" && exports.Marks_.set_({
        l: request.l,
        n: markName,
        s: parsed instanceof Array ? parsed : parsed.scroll || [ 0, 0 ],
        u: request.u
      }, false, port.s.tabId_);
      if (!parsed && request.s) {
        try {
          const pos = JSON.parse(request.s);
          if (pos && typeof pos === "object") {
            const scrollX = +pos.scrollX, scrollY = +pos.scrollY;
            scrollX >= 0 && scrollY >= 0 && (parsed = [ scrollX | 0, scrollY | 0, "" + (pos.hash || "") ]);
          }
        } catch (_a) {}
      }
      if (!parsed) {
        ports_1.showHUDEx(port, "noMark", 0, [ [ request.l ? "Local" : "Global" ], markName ]);
        run_commands_1.runNextCmdBy(0, exOpts);
        return;
      }
      const fallback = run_commands_1.parseFallbackOptions(exOpts);
      if (parsed instanceof Array) {
        fallback && (fallback.$else = null);
        exports.Marks_.goToInContent_(port.s.tabId_, null, port, true, markName, parsed, 0, fallback, lastKey);
        return;
      }
      fallback && (fallback.$else = fallback.$then);
      const tabId = parsed.tabId, wait = exOpts.wait, rawPrefix = exOpts.prefix, rawUrl = parsed.url, markInfo = {
        n: markName,
        a: !!exOpts.parent && !rawPrefix,
        p: true,
        q: open_urls_1.parseOpenPageUrlOptions(exOpts),
        s: parsed.scroll || [ 0, 0 ],
        t: tabId,
        u: rawUrl,
        f: fallback,
        w: typeof wait === "number" ? Math.min(Math.max(0, wait || 0), 2e3) : wait
      };
      markInfo.p = !!rawPrefix || rawPrefix == null && !markInfo.a && markInfo.s[1] === 0 && markInfo.s[0] === 0 && !!BgUtils_.IsURLHttp_(rawUrl) && (!rawUrl.includes("#") || request.u.startsWith(rawUrl));
      exports.Marks_.CompareUrls_(request.u, rawUrl, markInfo) ? exports.Marks_.goToInContent_(port.s.tabId_, null, port, false, markName, markInfo.s, 0, fallback, lastKey) : tabId >= 0 && store_1.framesForTab_.has(tabId) ? browser_1.tabsGet(tabId, exports.Marks_.checkTab_.bind(0, markInfo, lastKey)) : open_urls_1.focusOrLaunch_(markInfo);
    },
    CompareUrls_(tabUrl, markUrl, markInfo) {
      const curU = tabUrl.split("#", 1)[0], wantedU = markUrl.split("#", 1)[0];
      return curU === wantedU || !!markInfo.p && curU.startsWith(wantedU.endsWith("/") || wantedU.includes("?") ? wantedU : wantedU + "/") || !!markInfo.a && wantedU.startsWith(curU.endsWith("/") || curU.includes("?") ? curU : curU + "/");
    },
    checkTab_(mark, lastKey, tab) {
      const url = browser_1.getTabUrl(tab);
      if (exports.Marks_.CompareUrls_(url, mark.u, mark)) {
        const useCur = tab.id === store_1.curTabId_;
        useCur || browser_1.selectTab(tab.id, browser_1.selectWndIfNeed);
        exports.Marks_.scrollTab_(mark, tab.id, useCur ? lastKey : 0 /* kKeyCode.None */ , true);
      } else {
        open_urls_1.focusOrLaunch_(mark);
      }
    },
    getLocationKey_(markName, url) {
      return url ? "vimiumMark|" + parse_urls_1.prepareReParsingPrefix_(url.slice(0, 499).split("#", 1)[0]) + (url.length > 1 ? "|" + markName : "") : "vimiumGlobalMark|" + markName;
    },
    goToInContent_(tabId, frames, port, local, name, scroll, wait, fallback, lastKey) {
      port = !frames || !frames.top_ || frames.top_.s.flags_ & 512 /* Frames.Flags.ResReleased */ ? port : frames.top_;
      if (port) {
        const args = {
          g: !local,
          s: scroll,
          t: "",
          f: fallback || {},
          w: wait || 0
        };
        Promise.resolve(name && i18n_1.transEx_("mNormalMarkTask", [ [ "mJumpTo" ], [ local ? "Local" : "Global" ], name ])).then(tip => {
          args.t = tip || "";
          if (lastKey) {
            store_1.set_cKey(lastKey);
            store_1.focusAndExecuteOn_(port, 19 /* kFgCmd.goToMark */ , args, 1, 1);
          } else {
            run_commands_1.portSendFgCmd(port, 19 /* kFgCmd.goToMark */ , true, args, 1);
          }
        });
      } else {
        browser_1.executeScript_(tabId, 0, null, (x, y) => {
          window.scrollTo(x, y);
        }, [ scroll[0], scroll[1] ], fallback ? () => {
          run_commands_1.runNextCmdBy(1, fallback);
          return browser_1.runtimeError_();
        } : null);
      }
    },
    scrollTab_(markInfo, tabId, lastKey, notANewTab) {
      const frames = store_1.framesForTab_.get(tabId), wait = markInfo.w;
      ports_1.waitForPorts_(frames).then(() => {
        exports.Marks_.goToInContent_(tabId, frames, null, false, markInfo.n, markInfo.s, notANewTab || wait === false ? 0 : typeof wait !== "number" ? 200 : wait, markInfo.f, lastKey);
      });
      markInfo.t !== tabId && markInfo.n && exports.Marks_.set_({
        l: false,
        n: markInfo.n,
        s: markInfo.s,
        u: markInfo.u
      }, store_1.curIncognito_ === 2 /* IncognitoType.true */ , tabId);
    },
    clear_(url) {
      const key_start = exports.Marks_.getLocationKey_("", url);
      let num = 0;
      store_1.storageCache_.forEach((_, key) => {
        if (key.startsWith(key_start)) {
          num++;
          settings_.setInLocal_(key, null);
        }
      });
      const storage2 = store_1.incognitoMarkCache_;
      storage2 && storage2.forEach((_, key) => {
        if (key.startsWith(key_start)) {
          num++;
          storage2.delete(key);
        }
      });
      ports_1.showHUDEx(store_1.cPort, "markRemoved", 0, [ num, [ url === "#" ? "allLocal" : url ? "Local" : "Global" ], [ num !== 1 ? "have" : "has" ] ]);
      return num;
    }
  };
  exports.FindModeHistory_ = {
    list_: null,
    timer_: 0,
    init_() {
      const str = store_1.storageCache_.get("findModeRawQueryList") || "";
      exports.FindModeHistory_.list_ = str ? str.split("\n") : [];
      exports.FindModeHistory_.init_ = null;
    },
    query_(incognito, query, nth) {
      const a = exports.FindModeHistory_;
      a.init_ && a.init_();
      const list = incognito ? store_1.incognitoFindHistoryList_ || (IncognitoWatcher_.watch_(), 
      store_1.set_incognitoFindHistoryList_(a.list_.slice(0))) : a.list_;
      if (!query) {
        return (list[list.length - (nth || 1)] || "").replace(/\r/g, "\n");
      }
      query = query.replace(/\n/g, "\r");
      if (incognito) {
        a.refreshIn_(query, list, true);
        return;
      }
      query = BgUtils_.unicodeRSubstring_(query, 0, 99);
      const str = a.refreshIn_(query, list);
      str && settings_.setInLocal_("findModeRawQueryList", str);
      store_1.incognitoFindHistoryList_ && a.refreshIn_(query, store_1.incognitoFindHistoryList_, true);
    },
    refreshIn_(query, list, skipResult) {
      const ind = list.lastIndexOf(query);
      if (ind >= 0) {
        if (ind === list.length - 1) {
          return;
        }
        list.splice(ind, 1);
      } else {
        list.length >= 50 /* GlobalConsts.MaxFindHistory */ && list.shift();
      }
      list.push(query);
      if (!skipResult) {
        return list.join("\n");
      }
    },
    removeAll_(incognito) {
      if (incognito) {
        store_1.incognitoFindHistoryList_ && store_1.set_incognitoFindHistoryList_([]);
        return;
      }
      exports.FindModeHistory_.init_ = null;
      exports.FindModeHistory_.list_ = [];
      settings_.setInLocal_("findModeRawQueryList", "");
    }
  };
  const IncognitoWatcher_ = {
    watching_: false,
    timer_: 0,
    watch_() {
      if (IncognitoWatcher_.watching_) {
        return;
      }
      browser_1.Windows_.onRemoved.addListener(IncognitoWatcher_.OnWndRemoved_);
      IncognitoWatcher_.watching_ = true;
    },
    OnWndRemoved_() {
      if (!IncognitoWatcher_.watching_) {
        return;
      }
      IncognitoWatcher_.timer_ = IncognitoWatcher_.timer_ || setTimeout(IncognitoWatcher_.TestIncognitoWnd_, 34);
    },
    TestIncognitoWnd_() {
      IncognitoWatcher_.timer_ = 0;
      for (let frames of store_1.framesForTab_.values()) {
        if (frames.cur_.s.incognito_) {
          return;
        }
      }
      browser_1.Windows_.getAll(wnds => {
        wnds.some(wnd => wnd.incognito) || IncognitoWatcher_.cleanI_();
      });
    },
    cleanI_() {
      store_1.set_incognitoFindHistoryList_(null);
      store_1.set_incognitoMarkCache_(null);
      browser_1.Windows_.onRemoved.removeListener(IncognitoWatcher_.OnWndRemoved_);
      IncognitoWatcher_.watching_ = false;
    }
  };
  const noneWnd = store_1.curWndId_, cache = store_1.recencyForTab_;
  exports.TabRecency_ = {
    rCompare_(a, b) {
      return cache.get(b.id) - cache.get(a.id);
    },
    onWndChange_: store_1.blank_
  };
  let lastSaveRecencyTime = 0;
  function onTabActivated(info) {
    const tabId = info.tabId, frames = store_1.framesForTab_.get(tabId);
    frames && frames.flags_ & 512 /* Frames.Flags.ResReleased */ && ports_1.refreshPorts_(frames, 0);
    ports_1.resetInnerKeepAliveTick_();
    if (info.windowId !== store_1.curWndId_) {
      browser_1.Windows_.get(info.windowId, maybeOnBgWndActiveTabChange);
      return;
    }
    const now = performance.now();
    if (now - store_1.lastVisitTabTime_ > 666 /* GlobalConsts.MinStayTimeToRecordTabRecency */) {
      const monoNow = store_1.os_ === 1 /* kOS.linuxLike */ ? Date.now() : now;
      cache.set(store_1.curTabId_, monoNow);
    }
    store_1.set_lastVisitTabTime_(now);
    store_1.set_curTabId_(tabId);
    ui_css_1.MediaWatcher_.resume_();
 // not block onActivated listener
    }
  function maybeOnBgWndActiveTabChange(wnd) {
    if (!wnd || !wnd.focused) {
      return browser_1.runtimeError_();
    }
    const newWndId = wnd.id;
    if (newWndId !== store_1.curWndId_) {
      store_1.set_lastWndId_(store_1.curWndId_);
      store_1.set_curWndId_(newWndId);
    }
    browser_1.Tabs_.query({
      windowId: newWndId,
      active: true
    }, tabs => {
      tabs && tabs.length > 0 && newWndId === store_1.curWndId_ && onFocusChanged(tabs);
    });
  }
  function onFocusChanged(tabs) {
    if (!tabs || tabs.length === 0) {
      return browser_1.runtimeError_();
    }
    let a = tabs[0], current = a.windowId, last = store_1.curWndId_;
    if (current !== last) {
      store_1.set_curWndId_(current);
      store_1.set_lastWndId_(last);
    }
    store_1.set_curIncognito_(a.incognito ? 2 /* IncognitoType.true */ : 0 /* IncognitoType.ensuredFalse */ /* IncognitoType.mayFalse */);
    exports.TabRecency_.onWndChange_();
    onTabActivated({
      tabId: a.id,
      windowId: current
    });
  }
  browser_1.Tabs_.onActivated.addListener(onTabActivated);
  browser_1.Windows_.onFocusChanged.addListener(windowId => {
    if (windowId === noneWnd) {
      return;
    }
    // here windowId may pointer to a devTools window on C45 - see BrowserVer.Min$windows$APIsFilterOutDevToolsByDefault
        browser_1.Tabs_.query({
      windowId,
      active: true
    }, onFocusChanged);
  });
  browser_1.Tabs_.onRemoved.addListener(tabId => {
    const existing = store_1.framesForTab_.delete(tabId);
    cache.delete(tabId);
    const kAliveIfOnlyAnyAction = true /* BrowserVer.MinBgWorkerAliveIfOnlyAnyAction */;
    !kAliveIfOnlyAnyAction && tabId === store_1.lastKeptTabId_ && existing && ports_1.tryToKeepAliveIfNeeded_mv3_non_ff(tabId);
  });
  settings_.ready_.then(() => {
    browser_1.getCurTab(tabs => {
      store_1.set_lastVisitTabTime_(performance.now());
      const a = tabs && tabs[0];
      if (!a) {
        return browser_1.runtimeError_();
      }
      store_1.set_curTabId_(a.id);
      store_1.set_curWndId_(a.windowId);
      store_1.set_curIncognito_(a.incognito ? 2 /* IncognitoType.true */ : 0 /* IncognitoType.ensuredFalse */ /* IncognitoType.mayFalse */);
      const sessionStorage = browser_1.browser_.storage.session;
      const kRecencyField = "recency";
      sessionStorage && sessionStorage.get(kRecencyField).then(rawConf => {
        const oldRec = rawConf && rawConf[kRecencyField];
        if (oldRec) {
          const delta = BgUtils_.recencyBase_() - oldRec.b;
          for (const [k, v] of oldRec.e) {
            cache.set(k, v - delta);
          }
        }
        sessionStorage.remove(kRecencyField);
        store_1.set_saveRecency_(() => {
          if (lastSaveRecencyTime == store_1.lastVisitTabTime_) {
            return;
          }
          lastSaveRecencyTime = store_1.lastVisitTabTime_;
          const recency = {
            e: Array.from(cache.entries()),
            b: BgUtils_.recencyBase_()
          };
          sessionStorage.set({
            [kRecencyField]: recency
          });
        });
      }, store_1.blank_);
    });
    const items = [];
    for (const i of [ "images", "plugins", "javascript", "cookies" ]) {
      store_1.storageCache_.get(exports.ContentSettings_.makeKey_(i)) != null && items.push(i);
    }
    items.length && browser_1.browser_.contentSettings && setTimeout(() => {
      for (const i of items) {
        exports.ContentSettings_.Clear_(i);
      }
    }, 100);
  });
  store_1.updateHooks_.vomnibarOptions = options => {
    const defaultOptions = settings_.defaults_.vomnibarOptions, payload = store_1.omniPayload_;
    let isSame = true;
    let {actions, maxMatches, queryInterval, styles, sizes} = defaultOptions;
    if (options !== defaultOptions && options && typeof options === "object") {
      const newMaxMatches = Math.max(3, Math.min(options.maxMatches | 0 || maxMatches, 25 /* GlobalConsts.MaxLimitOfVomnibarMatches */)), rawNewActions = options.actions, newActions = rawNewActions ? rawNewActions.replace(/[,\s]+/g, " ").trim() : "", newInterval = +options.queryInterval, newSizes = ((options.sizes || "") + "").trim(), rawNewStyles = options.styles, newStyles = rawNewStyles instanceof Array ? rawNewStyles : ((rawNewStyles || "") + "").trim(), newQueryInterval = Math.max(0, Math.min(newInterval >= 0 ? newInterval : queryInterval, 1200));
      isSame = maxMatches === newMaxMatches && queryInterval === newQueryInterval && newSizes === sizes && actions === newActions && styles === newStyles;
      if (!isSame) {
        actions = newActions;
        maxMatches = newMaxMatches;
        queryInterval = newQueryInterval;
        sizes = newSizes;
        styles = newStyles;
      }
      options.actions = newActions;
      options.maxMatches = newMaxMatches;
      options.queryInterval = newQueryInterval;
      options.sizes = newSizes;
      options.styles = newStyles;
    }
    let finalStyles = styles instanceof Array ? styles.join(" ") : styles;
    store_1.settingsCache_.vomnibarOptions = isSame ? defaultOptions : options;
    payload.n = maxMatches;
    payload.i = queryInterval;
    payload.s = sizes;
    payload.t = finalStyles;
    ui_css_1.MediaWatcher_.update_(0 /* MediaNS.kName.PrefersReduceMotion */ , 1);
    ui_css_1.MediaWatcher_.update_(1 /* MediaNS.kName.PrefersColorScheme */ , 1);
    settings_.broadcastOmniConf_({
      n: maxMatches,
      i: queryInterval,
      s: sizes,
      t: payload.t
    });
    store_1.vomnibarBgOptions_.actions = actions.split(" ");
    const sizes2 = sizes.split(",");
    const heightIfEmpty = Math.max(24, Math.min(sizes2.length && +sizes2[0] || 77 /* VomnibarNS.PixelData.OthersIfEmpty */ , 320));
    const baseHeightIfNotEmpty = Math.max(24, Math.min(heightIfEmpty + (sizes2.length > 1 && +sizes2[1] || 3 /* VomnibarNS.PixelData.OthersIfEmpty */), 320));
    const itemHeight = Math.max(14, Math.min(sizes2.length > 2 && +sizes2[2] || 48 /* VomnibarNS.PixelData.Item */ , 120));
    store_1.vomnibarBgOptions_.maxBoxHeight_ = maxMatches * itemHeight + baseHeightIfNotEmpty;
  };
});