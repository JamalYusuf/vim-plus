"use strict";
__filename = "background/browser.js";
define([ "require", "exports", "./store", "./utils" ], (require, exports, store_1, utils_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.import2 = exports.runContentScriptsOn_ = exports.executeScript_ = exports.watchPermissions_ = exports.isRefusingIncognito_ = exports.removeTempTab = exports.downloadFile = exports.makeTempWindow_r = exports.makeWindow = exports.openMultiTabs = exports.tabsCreate = exports.selectWndIfNeed = exports.selectWnd = exports.selectTab = exports.removeTabsOrFailSoon_ = exports.set_getFindCSS_cr_ = exports.getFindCSS_cr_ = exports.Qs_ = exports.R_ = exports.Q_ = exports.normalizeExtOrigin_ = exports.selectIndexFrom = exports.selectFrom = exports.getCurWnd = exports.isNotHidden_ = exports.getCurShownTabs_ = exports.getCurTabs = exports.getCurTab = exports.isTabMuted = exports.getTabUrl = exports.getGroupId = exports.tabsUpdate = exports.tabsGet = exports.runtimeError_ = exports.browserWebNav_ = exports.browserSessions_ = exports.Windows_ = exports.Tabs_ = exports.browser_ = void 0;
  exports.browser_ = chrome;
  exports.Tabs_ = exports.browser_.tabs;
  exports.Windows_ = exports.browser_.windows;
  const browserSessions_ = () => exports.browser_.sessions;
  exports.browserSessions_ = browserSessions_;
  const browserWebNav_ = () => exports.browser_.webNavigation;
  exports.browserWebNav_ = browserWebNav_;
  const runtimeError_ = () => exports.browser_.runtime.lastError;
  exports.runtimeError_ = runtimeError_;
  exports.tabsGet = exports.Tabs_.get;
  exports.tabsUpdate = exports.Tabs_.update;
  exports.getGroupId = i => {
    const id = i.groupId;
    return id !== -1 && id != null ? id : null;
  };
  exports.getTabUrl = tab_may_pending => tab_may_pending.url || tab_may_pending.pendingUrl || "";
  exports.isTabMuted = maybe_muted => maybe_muted.mutedInfo.muted;
  exports.getCurTab = exports.Tabs_.query.bind(null, {
    active: true,
    lastFocusedWindow: true
  });
  exports.getCurTabs = exports.Tabs_.query.bind(null, {
    lastFocusedWindow: true
  });
  exports.getCurShownTabs_ = exports.getCurTabs;
  exports.isNotHidden_ = () => true;
  exports.getCurWnd = (populate, callback) => {
    const args = {
      populate
    };
    return store_1.curWndId_ >= 0 ? exports.Windows_.get(store_1.curWndId_, args, callback) : exports.Windows_.getCurrent(args, callback);
  };
  const selectFrom = tabs => tabs[exports.selectIndexFrom(tabs)];
  exports.selectFrom = selectFrom;
  const selectIndexFrom = tabs => {
    for (let i = tabs.length; 0 < --i; ) {
      if (tabs[i].active) {
        return i;
      }
    }
    return 0;
  };
  exports.selectIndexFrom = selectIndexFrom;
  const normalizeExtOrigin_ = url => /^(edge-)?extension:/.test(url) ? store_1.CONST_.BrowserProtocol_ + "-" + url.slice(url.indexOf("ext")) : url;
  exports.normalizeExtOrigin_ = normalizeExtOrigin_;
  exports.Q_ = function(func) {
    const arr = [].slice.call(arguments, 1);
    const {promise_, resolve_} = utils_1.deferPromise_();
    arr.push(res => {
      const err = exports.runtimeError_();
      resolve_(err ? void 0 : res != null ? res : null);
      return err;
    });
    func.apply(void 0, arr);
    return promise_;
  };
  const R_ = resolve => resolve !== store_1.blank_ ? () => {
    const error = exports.runtimeError_();
    resolve(!error);
    return error;
  } : exports.runtimeError_;
  exports.R_ = R_;
  // another Q_ for "safe" APIs which always succeeds
    exports.Qs_ = function(func) {
    const arr = [].slice.call(arguments, 1);
    return new Promise(resolve => {
      arr.push(resolve);
      func.apply(0, arr);
    });
  };
  const doesIgnoreUrlField_ = (url, incognito) => {
    const type = store_1.newTabUrls_.get(url);
    return type === 1 /* Urls.NewTabType.browser */ || type === 2 /* Urls.NewTabType.cNewNTP */ && !(!store_1.IsEdg_ && !incognito);
  };
  const set_getFindCSS_cr_ = newGet => {
    exports.getFindCSS_cr_ = newGet;
  };
  exports.set_getFindCSS_cr_ = set_getFindCSS_cr_;
  const removeTabsOrFailSoon_ = (ids, callback) => {
    const returnOnce = ok => {
      const curCb = callback;
      if (curCb) {
        callback = null;
        ok && clearTimeout(timer);
        curCb && curCb(ok);
      }
    };
    if (callback === exports.runtimeError_) {
      exports.Tabs_.remove(ids, callback);
      return;
    }
    const kTabsRemoveTimeout = 1500, timer = setTimeout(returnOnce, kTabsRemoveTimeout, false);
    exports.Tabs_.remove(ids, () => {
      const error = exports.runtimeError_();
      returnOnce(!error);
      return error;
    });
  };
  exports.removeTabsOrFailSoon_ = removeTabsOrFailSoon_;
  //#region actions
    const selectTab = (tabId, callback) => {
    exports.tabsUpdate(tabId, {
      active: true
    }, callback);
  };
  exports.selectTab = selectTab;
  const selectWnd = tab => {
    tab && exports.Windows_.update(tab.windowId, {
      focused: true
    });
    return exports.runtimeError_();
  };
  exports.selectWnd = selectWnd;
  const selectWndIfNeed = tab => {
    tab && tab.windowId !== store_1.curWndId_ && exports.selectWnd(tab);
    return exports.runtimeError_();
  };
  exports.selectWndIfNeed = selectWndIfNeed;
  /* if not args.url, then "openerTabId" must not in args */
  const tabsCreate = (args, callback, evenIncognito) => {
    let {url} = args;
    if (url) {
      doesIgnoreUrlField_(url, store_1.curIncognito_ === 2 /* IncognitoType.true */) && 
      // if another extension manages the NTP, this line still works
      delete args.url;
    } else {
      url = store_1.newTabUrl_f;
      store_1.curIncognito_ === 2 /* IncognitoType.true */ && (evenIncognito === -1 ? url.includes("pages/blank.html") && url.startsWith(store_1.Origin2_) : !evenIncognito && url.startsWith(location.protocol)) || doesIgnoreUrlField_(url, store_1.curIncognito_ === 2 /* IncognitoType.true */) || (args.url = url);
      args.url || delete args.url;
    }
    return exports.Tabs_.create(args, callback);
  };
  exports.tabsCreate = tabsCreate;
  /** the order is [A,B,C; A,B,C; ...]; require urls.length === 0 || args.url === urls[0] */  const openMultiTabs = (options, count, evenIncognito, urls, doesGroup, curTab, callback) => {
    const cb1 = newTab => {
      if (exports.runtimeError_()) {
        callback && callback();
        return exports.runtimeError_();
      }
      options.index = newTab.index;
      options.windowId = newTab.windowId;
      groupId != null && exports.Tabs_.group({
        tabIds: newTab.id,
        groupId
      });
      callback && callback(newTab);
      options.active = false;
      const hasIndex = options.index != null, loopSize = urls ? urls.length : 1;
      const onOtherTabs = groupId != null ? t2 => (t2 && exports.Tabs_.group({
        tabIds: t2.id,
        groupId
      }), exports.runtimeError_()) : exports.runtimeError_;
      urls.length > 1 && (urls[0] = options.url);
      for (let i = 0; i < count; i++) {
        for (let j = i > 0 ? 0 : 1; j < loopSize; j++) {
          urls.length > 1 && (options.url = urls[j]);
          hasIndex && ++options.index;
          exports.Tabs_.create(options, onOtherTabs);
        }
      }
    };
    let groupId;
    doesGroup = doesGroup !== false;
    groupId = curTab != null ? exports.getGroupId(curTab) : null;
    doesGroup || groupId == null || delete options.index;
    groupId = doesGroup && groupId != null && exports.Tabs_.group ? groupId : void 0;
    exports.tabsCreate(options, cb1, evenIncognito);
  };
  exports.openMultiTabs = openMultiTabs;
  const makeWindow = (options, state, callback) => {
    const focused = options.focused !== false, kM = "minimized";
    state = state ? state === kM === focused || options.type === "popup" || state === "normal" || state === "docked" ? "" : state : "";
    if (state && !state.includes("fullscreen")) {
      options.state = state;
      state = "";
    }
    options.focused = true;
    let url = options.url;
    url || options.tabId != null || (url = options.url = store_1.newTabUrl_f);
    typeof url === "string" && doesIgnoreUrlField_(url, options.incognito) && delete options.url;
    exports.Windows_.create(options, state || !focused || callback ? wnd => {
      callback && callback(wnd);
      if (!state && focused || !wnd) {
        return exports.runtimeError_();
      }
      const opt = focused ? {} : {
        focused: false
      };
      state && (opt.state = state);
      exports.Windows_.update(wnd.id, opt);
    } : exports.runtimeError_);
  };
  exports.makeWindow = makeWindow;
  const makeTempWindow_r = (tabId, incognito, callback) => {
    const options = {
      type: "normal",
      focused: false,
      incognito,
      state: "minimized",
      tabId
    };
    exports.Windows_.create(options, callback);
  };
  exports.makeTempWindow_r = makeTempWindow_r;
  const downloadFile = (url, filename) => {
    if (url.startsWith("data:")) {
      return store_1.runOnTee_(4 /* kTeeTask.Download */ , {
        u: url,
        t: filename || ""
      }, null).then(i => !!i);
    }
    return exports.Q_(exports.browser_.permissions.contains, {
      permissions: [ "downloads" ]
    }).then(permitted => {
      if (!permitted) {
        return false;
      }
      const opts = {
        url
      };
      if (filename) {
        const extRe = /\.[a-z\d]{1,4}(?=$|[?&])/i;
        filename = utils_1.DecodeURLPart_(filename);
        filename = filename[0] === "#" ? filename.slice(1) : filename;
        filename = filename.replace(/[\r\n]+/g, " ").replace(/[/\\?%*:|"<>_]+/g, "_");
        if (!extRe.test(filename)) {
          const arr = extRe.exec(url);
          filename += arr ? arr[0] : url.includes(".") ? "" : ".bin";
        }
        opts.filename = filename;
      }
      const q = exports.Q_(exports.browser_.downloads.download, opts);
      return q.then(() => true);
    });
  };
  exports.downloadFile = downloadFile;
  const removeTempTab = tabId => {
    exports.Tabs_.remove(tabId, exports.runtimeError_);
    return;
  };
  exports.removeTempTab = removeTempTab;
  const isRefusingIncognito_ = url => {
    url = url.slice(0, 99).toLowerCase();
    // https://cs.chromium.org/chromium/src/url/url_constants.cc?type=cs&q=kAboutBlankWithHashPath&g=0&l=12
        return store_1.newTabUrls_.get(url) !== 1 /* Urls.NewTabType.browser */ && (url.startsWith("about:") ? url !== "about:blank" : url.startsWith("chrome:") ? !url.startsWith("chrome://downloads") : url.startsWith(store_1.CONST_.BrowserProtocol_) && !(typeof store_1.CONST_.NtpNewTab_ !== "string" ? store_1.CONST_.NtpNewTab_.test(url) : url.startsWith(store_1.CONST_.NtpNewTab_)) || store_1.IsEdg_ && /^(edge|extension):/.test(url) && !url.startsWith("edge://downloads"));
  };
  exports.isRefusingIncognito_ = isRefusingIncognito_;
  const watchPermissions_ = (queries, onChange) => {
    const browserPermissions_ = exports.browser_.permissions;
    const promise = Promise.all(queries.map(i => i && exports.Q_(exports.browser_.permissions.contains, i)));
    const ids = queries.map(i => i && (i.permissions || i.origins)[0]);
    promise.then(allowList => {
      let listenAdd = false, listenRemove = false;
      const didChange = (added, changes) => {
        let related = !changes;
        if (changes) {
          const newPermissions = changes.permissions;
          for (const permission of newPermissions || []) {
            const ind = ids.indexOf(permission);
            ind >= 0 && (allowList[ind] = added, related = true);
          }
          for (const origin of (!newPermissions || newPermissions.length <= 0) && changes.origins || []) {
            if (origin !== "chrome://*/*") {
              const ind = ids.indexOf(origin);
              ind >= 0 && (allowList[ind] = added, related = true);
            } else {
              for (let ind = 0; ind < ids.length; ind++) {
                (ids[ind] || "").startsWith("chrome://") && (allowList[ind] = added, related = true);
              }
            }
          }
        }
        if (!related) {
          return;
        }
        onChange(allowList, true) === false && (listenAdd = listenRemove = false);
        listenAdd !== allowList.includes(false) && browserPermissions_.onAdded[(listenAdd = !listenAdd) ? "addListener" : "removeListener"](onAdded);
        listenRemove !== allowList.includes(true) && browserPermissions_.onRemoved[(listenRemove = !listenRemove) ? "addListener" : "removeListener"](onRemoved);
      };
      const onAdded = didChange.bind(null, true), onRemoved = didChange.bind(null, false);
      allowList.includes(false) || allowList.includes(true) ? didChange(true) : onChange(allowList, false);
    });
  };
  exports.watchPermissions_ = watchPermissions_;
  const executeScript_ = (tabId, frameId, files, func, args, callback) => {
    {
      const toRun = {
        files: func ? void 0 : files,
        func,
        args,
        target: frameId >= 0 ? {
          tabId,
          frameIds: [ frameId ]
        } : {
          tabId,
          allFrames: true
        },
        injectImmediately: true
      };
      exports.browser_.scripting.executeScript(toRun, callback || exports.runtimeError_);
    }
  };
  exports.executeScript_ = executeScript_;
  const runContentScriptsOn_ = tabId => {
    const offset = store_1.Origin2_.length - 1;
    exports.executeScript_(tabId, -1, store_1.CONST_.ContentScripts_.slice(0, -1).map(i => i.slice(offset)));
    return;
  };
  exports.runContentScriptsOn_ = runContentScriptsOn_;
  const import2 = path => Promise.resolve(__moduleMap[path.split("/").slice(-1)[0].replace(".js", "")]);
  exports.import2 = import2;
  //#endregion actions
    store_1.bgIniting_ < 6 /* BackendHandlersNS.kInitStat.FINISHED */ && store_1.set_installation_(new Promise(resolve => {
    const ev = exports.browser_.runtime.onInstalled;
    let onInstalled = details => {
      const cb = onInstalled;
      cb && (onInstalled = null, resolve(details), ev.removeListener(cb));
    };
    ev.addListener(onInstalled);
    setTimeout(onInstalled, 6e3, null);
  }));
});