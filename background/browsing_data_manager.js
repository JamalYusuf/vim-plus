"use strict";
__filename = "background/browsing_data_manager.js";
define([ "require", "exports", "./store", "./browser", "./utils", "./settings", "./completion_utils" ], function(require, exports, store_1, browser_1, BgUtils_, settings_, completion_utils_1) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.UrlDecoder_ = exports.BlockListFilter_ = exports.TestNotBlocked_ = exports.getRecentSessions_ = exports.normalizeUrlAndTitles_ = exports.HistoryManager_ = exports.BookmarkManager_ = exports.parseDomainAndScheme_ = exports.titleIgnoreListRe_ = exports.omniBlockList_ = void 0;
  BgUtils_ = __importStar(BgUtils_);
  settings_ = __importStar(settings_);
  const WithTextDecoder = true /* BrowserVer.MinEnsuredTextEncoderAndDecoder */;
  const _decodeFunc = decodeURIComponent;
  let decodingEnabled, decodingJobs, decodingIndex = -1, dataUrlToDecode_ = "1";
  let charsetDecoder_ = null;
  let omniBlockList_ = null, blockListRe_ = null, omniBlockPath = false;
  exports.omniBlockList_ = omniBlockList_;
  let titleIgnoreListRe_ = null;
  exports.titleIgnoreListRe_ = titleIgnoreListRe_;
  const parseDomainAndScheme_ = url => {
    let d, i, scheme = url.slice(0, 5);
    if (scheme === "https") {
      d = 8 /* Urls.SchemeId.HTTPS */;
    } else if (scheme === "http:") {
      d = 7 /* Urls.SchemeId.HTTP */;
    } else {
      if (!scheme.startsWith("ftp")) {
        return null;
      }
      d = 6 /* Urls.SchemeId.FTP */;
    }
    i = url.indexOf("/", d);
    url = url.slice(d, i < 0 ? url.length : i);
    return {
      domain_: url,
      scheme_: d
    };
  };
  exports.parseDomainAndScheme_ = parseDomainAndScheme_;
  const _onBookmarksImport = [ () => {
    browser_1.browser_.bookmarks.onCreated.removeListener(exports.BookmarkManager_.Delay_);
  }, () => {
    browser_1.browser_.bookmarks.onCreated.addListener(exports.BookmarkManager_.Delay_);
    exports.BookmarkManager_.Delay_();
  } ];
  let _onBookmarkPermissionChange = allowList => {
    store_1.bookmarkCache_.bookmarks_ = [];
    store_1.bookmarkCache_.dirs_ = [];
    exports.BookmarkManager_._didLoad(allowList[0] ? 0 /* BookmarkStatus.notInited */ : 3 /* BookmarkStatus.revoked */);
  };
  exports.BookmarkManager_ = {
    currentSearch_: null,
    _timer: 0,
    _listened: false,
    expiredUrls_: 0,
    onLoad_: null,
    _didLoad(newStatus) {
      const callback = exports.BookmarkManager_.onLoad_;
      exports.BookmarkManager_.onLoad_ = null;
      store_1.bookmarkCache_.status_ = newStatus;
      callback && callback();
    },
    Listen_() {
      const bBm = browser_1.browser_.bookmarks;
      bBm.onCreated.addListener(exports.BookmarkManager_.Delay_);
      bBm.onRemoved.addListener(exports.BookmarkManager_.Expire_);
      bBm.onChanged.addListener(exports.BookmarkManager_.Expire_);
      bBm.onMoved.addListener(exports.BookmarkManager_.Delay_);
      bBm.onImportBegan.addListener(_onBookmarksImport[0]);
      bBm.onImportEnded.addListener(_onBookmarksImport[1]);
    },
    refresh_() {
      const bBm = browser_1.browser_.bookmarks;
      if (_onBookmarkPermissionChange) {
        browser_1.watchPermissions_([ {
          permissions: [ "bookmarks" ]
        } ], _onBookmarkPermissionChange);
        _onBookmarkPermissionChange = null;
      }
      if (!bBm) {
        exports.BookmarkManager_._didLoad(3 /* BookmarkStatus.revoked */);
        return;
      }
      store_1.bookmarkCache_.status_ = 1 /* BookmarkStatus.initing */;
      if (exports.BookmarkManager_._timer) {
        clearTimeout(exports.BookmarkManager_._timer);
        exports.BookmarkManager_._timer = 0;
      }
      try {
        bBm.getTree(exports.BookmarkManager_.readTree_);
      } catch (// permission revoked
      _a) {
        // permission revoked
        exports.BookmarkManager_._didLoad(3 /* BookmarkStatus.revoked */);
      }
    },
    readTree_(tree) {
      let iterPath_ = "", iterPid_ = "", iterDepth_ = 0;
      store_1.bookmarkCache_.bookmarks_ = [];
      store_1.bookmarkCache_.dirs_ = [];
      completion_utils_1.MatchCacheManager_.clear_(2 /* MatchCacheType.kBookmarks */);
      const traverseBookmark_ = (bookmark, index) => {
        const rawTitle = bookmark.title, id = bookmark.id;
        const title = rawTitle || id, path = iterPath_ + "/" + title;
        if (bookmark.children) {
          store_1.bookmarkCache_.dirs_.push({
            id_: id,
            path_: path,
            title_: title
          });
          const oldPath = iterPath_, oldPid = iterPid_;
          2 < ++iterDepth_ && (iterPath_ = path);
          iterPid_ = id;
          bookmark.children.forEach(traverseBookmark_);
          --iterDepth_;
          iterPath_ = oldPath;
          iterPid_ = oldPid;
          return;
        }
        const url = bookmark.url, jsScheme = "javascript:", isJS = url.startsWith(jsScheme);
        store_1.bookmarkCache_.bookmarks_.push({
          id_: id,
          path_: path,
          title_: title,
          t: isJS ? jsScheme : url,
          visible_: blockListRe_ !== null ? exports.TestNotBlocked_(url, omniBlockPath ? path : rawTitle) : 1 /* kVisibility.visible */ ,
          u: isJS ? jsScheme : url,
          pid_: iterPid_,
          ind_: index,
          jsUrl_: isJS ? url : null,
          jsText_: isJS ? BgUtils_.DecodeURLPart_(url) : null
        });
      };
      if (!tree) {
        exports.BookmarkManager_._didLoad(3 /* BookmarkStatus.revoked */);
        return browser_1.runtimeError_();
      }
      tree.forEach(traverseBookmark_);
      exports.BookmarkManager_._didLoad(2 /* BookmarkStatus.inited */);
      setTimeout(() => exports.UrlDecoder_.decodeList_(store_1.bookmarkCache_.bookmarks_), 50);
      if (!exports.BookmarkManager_._listened) {
        setTimeout(exports.BookmarkManager_.Listen_, 0);
        exports.BookmarkManager_._listened = true;
      }
    },
    Delay_() {
      const Later_ = () => {
        const last = performance.now() - store_1.bookmarkCache_.stamp_;
        if (store_1.bookmarkCache_.status_ !== 0 /* BookmarkStatus.notInited */) {
          return;
        }
        if (last >= 59900 || last < -5e3 /* GlobalConsts.ToleranceOfNegativeTimeDelta */) {
          exports.BookmarkManager_._timer = exports.BookmarkManager_.expiredUrls_ = 0;
          // not remove bookmark URLs from urlDecodingDict_ but load new ones, so that there need less decoding actions
                    exports.BookmarkManager_.refresh_();
        } else {
          exports.BookmarkManager_._timer = setTimeout(Later_, 3e4 /* InnerConsts.bookmarkFurtherDelay */);
        }
      };
      store_1.bookmarkCache_.stamp_ = performance.now();
      if (store_1.bookmarkCache_.status_ !== 2 /* BookmarkStatus.inited */) {
        return;
      }
      exports.BookmarkManager_._timer = setTimeout(Later_, 6e4 /* InnerConsts.bookmarkBasicDelay */);
      store_1.bookmarkCache_.status_ = 0 /* BookmarkStatus.notInited */;
    },
    Expire_(id, info) {
      const arr = store_1.bookmarkCache_.bookmarks_, title = info && info.title;
      let i = arr.findIndex(j => j.id_ === id);
      if (i >= 0) {
        const cur = arr[i], url = cur.u, url2 = info && info.url;
        decodingEnabled && (title == null ? url !== cur.t || !info : url2 != null && url !== url2) && store_1.urlDecodingDict_.has(url) && exports.HistoryManager_.sorted_ && exports.HistoryManager_.binarySearch_(url) < 0 && store_1.urlDecodingDict_.delete(url);
        if (title != null) {
          cur.path_ = cur.path_.slice(0, -cur.title_.length) + (title || cur.id_);
          cur.title_ = title || cur.id_;
          if (url2) {
            cur.u = url2;
            cur.t = exports.UrlDecoder_.decodeURL_(url2, cur);
            exports.UrlDecoder_.continueToWork_();
          }
          blockListRe_ !== null && (cur.visible_ = exports.TestNotBlocked_(cur.jsUrl_ || cur.u, omniBlockPath ? cur.path_ : cur.title_));
          store_1.bookmarkCache_.stamp_ = performance.now();
        } else {
          arr.splice(i, 1);
          for (let j = info ? i : arr.length; j < arr.length; j++) {
            arr[j].pid_ === cur.pid_ && arr[j].ind_--;
          }
          info || exports.BookmarkManager_.Delay_();
 // may need to re-add it in case of lacking info
                }
        return;
      }
      if (!store_1.bookmarkCache_.dirs_.find(dir => dir.id_ === id)) {
        return;
      }
 // "new" items which haven't been read are changed
            if (/* a folder is removed */ title == null && !exports.BookmarkManager_.expiredUrls_ && decodingEnabled) {
        const dict = store_1.urlDecodingDict_, bs = exports.HistoryManager_.binarySearch_;
        for (const {u: url} of exports.HistoryManager_.sorted_ ? arr : []) {
          dict.has(url) && bs(url) < 0 && dict.delete(url);
        }
        exports.BookmarkManager_.expiredUrls_ = 1;
      }
      exports.BookmarkManager_.Delay_();
    }
  };
  store_1.set_findBookmark_((titleOrPath, isId) => {
    if (store_1.bookmarkCache_.status_ < 2 /* CompletersNS.BookmarkStatus.inited */) {
      const defer = BgUtils_.deferPromise_();
      exports.BookmarkManager_.onLoad_ = defer.resolve_;
      exports.BookmarkManager_.refresh_();
      return defer.promise_.then(store_1.findBookmark_.bind(0, titleOrPath, isId));
    }
    const maybePath = !isId && titleOrPath.includes("/");
    const nodes = maybePath ? (titleOrPath + "").replace(/\\\/?|\//g, s => s.length > 1 ? "/" : "\n").split("\n").filter(i => i) : [];
    if (!titleOrPath || maybePath && !nodes.length) {
      return Promise.resolve(false);
    }
    if (isId) {
      return Promise.resolve(store_1.bookmarkCache_.bookmarks_.find(i => i.id_ === titleOrPath) || store_1.bookmarkCache_.dirs_.find(i => i.id_ === titleOrPath) || null);
    }
    const path2 = maybePath ? "/" + nodes.slice(1).join("/") : "", path1 = maybePath ? "/" + nodes[0] + path2 : "";
    for (const item of store_1.bookmarkCache_.bookmarks_) {
      if (maybePath && (item.path_ === path1 || item.path_ === path2) || item.title_ === titleOrPath) {
        return Promise.resolve(item);
      }
    }
    for (const item of store_1.bookmarkCache_.dirs_) {
      if (maybePath && (item.path_ === path1 || item.path_ === path2) || item.title_ === titleOrPath) {
        return Promise.resolve(item);
      }
    }
    let lastFound = null;
    for (const item of store_1.bookmarkCache_.bookmarks_) {
      if (item.title_.includes(titleOrPath)) {
        if (lastFound) {
          lastFound = null;
          break;
        }
        lastFound = item;
      }
    }
    return Promise.resolve(lastFound);
  });
  const finalUseHistory = callback => {
    callback && callback();
  };
  exports.HistoryManager_ = {
    sorted_: false,
    loadingTimer_: 0,
    _callbacks: null,
    use_(callback) {
      if (exports.HistoryManager_._callbacks) {
        callback && exports.HistoryManager_._callbacks.push(callback);
        return;
      }
      store_1.historyCache_.lastRefresh_ = Date.now();
 // safe for time changes
            exports.HistoryManager_._callbacks = callback ? [ callback ] : [];
      if (exports.HistoryManager_.loadingTimer_) {
        return;
      }
      browser_1.browser_.history.search({
        text: "",
        maxResults: 2e4 /* InnerConsts.historyMaxSize */ ,
        startTime: 0
      }, history => {
        setTimeout(exports.HistoryManager_._Init, 0, history);
      });
    },
    _Init(arr) {
      exports.HistoryManager_._Init = null;
      let localOnChrome = true, trim = exports.HistoryManager_.trimURLAndTitleWhenTooLong_, j_ind = 0;
      for (const j of arr) {
        let url = j.url;
        url.length > 2e3 /* GlobalConsts.MaxHistoryURLLength */ && (url = trim(url, j));
        arr[j_ind++] = {
          t: url,
          title_: localOnChrome ? j.title : j.title || "",
          time_: j.lastVisitTime,
          visible_: 1 /* kVisibility.visible */ ,
          u: url
        };
      }
      if (blockListRe_) {
        for (const k of arr) {
          exports.TestNotBlocked_(k.t, k.title_) === 0 /* CompletersNS.kVisibility.hidden */ && (k.visible_ = 0 /* kVisibility.hidden */);
        }
      }
      setTimeout(() => {
        setTimeout(() => {
          const arr1 = store_1.historyCache_.history_;
          for (let i = arr1.length - 1; 0 < i; ) {
            const j = arr1[i], url = j.u, text = j.t = exports.UrlDecoder_.decodeURL_(url, j), isSame = text.length >= url.length;
            while (0 <= --i) {
              const k = arr1[i], url2 = k.u;
              if (url2.length >= url.length || !url.startsWith(url2)) {
                break;
              }
              k.u = url.slice(0, url2.length);
              const decoded = isSame ? url2 : exports.UrlDecoder_.decodeURL_(url2, k);
              // handle the case that j has been decoded in another charset but k hasn't
                            k.t = isSame || decoded.length < url2.length ? text.slice(0, decoded.length) : decoded;
            }
          }
          exports.HistoryManager_.parseDomains_ && setTimeout(() => {
            exports.HistoryManager_.parseDomains_ && exports.HistoryManager_.parseDomains_(store_1.historyCache_.history_);
          }, 200);
        }, 100);
        store_1.historyCache_.history_.sort((a, b) => a.u > b.u ? 1 : -1);
        exports.HistoryManager_.sorted_ = true;
        browser_1.browser_.history.onVisitRemoved.addListener(exports.HistoryManager_.OnVisitRemoved_);
        browser_1.browser_.history.onVisited.addListener(exports.HistoryManager_.OnPageVisited_);
      }, 100);
      store_1.historyCache_.history_ = arr, exports.HistoryManager_.use_ = finalUseHistory;
      exports.HistoryManager_._callbacks && exports.HistoryManager_._callbacks.length > 0 && setTimeout(ref => {
        for (const f of ref) {
          f();
        }
      }, 1, exports.HistoryManager_._callbacks);
      exports.HistoryManager_._callbacks = null;
    },
    OnPageVisited_(newPage) {
      let url = newPage.url;
      url.length > 2e3 /* GlobalConsts.MaxHistoryURLLength */ && (url = exports.HistoryManager_.trimURLAndTitleWhenTooLong_(url, newPage));
      const updateCount = ++store_1.historyCache_.updateCount_, i = exports.HistoryManager_.binarySearch_(url);
      i < 0 && store_1.historyCache_.toRefreshCount_++;
      (updateCount > 59 || updateCount > 10 && Date.now() - store_1.historyCache_.lastRefresh_ > 3e5) && // safe for time change
      exports.HistoryManager_.refreshInfo_();
      exports.HistoryManager_._DidOnVisit(newPage, url, i);
    },
    _DidOnVisit(newPage, url, index) {
      const time = newPage.lastVisitTime, title = newPage.title, j = index >= 0 ? store_1.historyCache_.history_[index] : {
        t: "",
        title_: title,
        time_: time,
        visible_: blockListRe_ !== null ? exports.TestNotBlocked_(url, title) : 1 /* kVisibility.visible */ ,
        u: url
      };
      let slot, domain = exports.parseDomainAndScheme_(url);
      if (domain === null) {} else if ((slot = store_1.historyCache_.domains_.get(domain.domain_)) !== void 0) {
        slot.time_ = time;
        index < 0 && (slot.count_ += j.visible_);
        domain.scheme_ > 6 && (slot.https_ = domain.scheme_ === 8 /* Urls.SchemeId.HTTPS */ ? 1 : 0);
      } else {
        store_1.historyCache_.domains_.set(domain.domain_, {
          time_: time,
          count_: j.visible_,
          https_: domain.scheme_ === 8 /* Urls.SchemeId.HTTPS */ ? 1 : 0
        });
      }
      if (index >= 0) {
        j.time_ = time;
        if (title && title !== j.title_ && (titleIgnoreListRe_ === null || !titleIgnoreListRe_.test(title.slice(0, 100 /* GlobalConsts.MaxLengthToCheckIgnoredTitles */)))) {
          j.title_ = title;
          completion_utils_1.MatchCacheManager_.timer_ !== 0 && completion_utils_1.MatchCacheManager_.clear_(1 /* MatchCacheType.kHistory */);
          if (blockListRe_ !== null) {
            const newVisible = exports.TestNotBlocked_(url, title);
            if (j.visible_ !== newVisible) {
              j.visible_ = newVisible;
              slot !== void 0 && (slot.count_ += newVisible || -1);
            }
          }
        }
        return;
      }
      j.t = exports.UrlDecoder_.decodeURL_(url, j);
      store_1.historyCache_.history_.splice(~index, 0, j);
      completion_utils_1.MatchCacheManager_.timer_ !== 0 && completion_utils_1.MatchCacheManager_.clear_(1 /* MatchCacheType.kHistory */);
    },
    OnVisitRemoved_(toRemove) {
      decodingJobs.length = 0;
      const d = store_1.urlDecodingDict_;
      completion_utils_1.MatchCacheManager_.clear_(1 /* MatchCacheType.kHistory */);
      if (toRemove.allHistory) {
        store_1.historyCache_.history_ = [];
        store_1.historyCache_.domains_ = new Map;
        const toKeep = [];
        for (const i of store_1.bookmarkCache_.bookmarks_) {
          const decoded = d.get(i.u);
          decoded !== void 0 && toKeep.push([ i.u, decoded ]);
        }
        if (toKeep.length) {
          store_1.set_urlDecodingDict_(new Map(toKeep));
        } else {
          d.clear();
          for (const [k, v] of toKeep) {
            d.set(k, v);
          }
        }
        return;
      }
      const bs = exports.HistoryManager_.binarySearch_;
      const {history_: h, domains_: domains} = store_1.historyCache_;
      let entry;
      for (const j of toRemove.urls) {
        const i = bs(j);
        if (i >= 0) {
          if (h[i].visible_) {
            const item = exports.parseDomainAndScheme_(j);
            item && (entry = domains.get(item.domain_)) && --entry.count_ <= 0 && domains.delete(item.domain_);
          }
          h.splice(i, 1);
          d.delete(j);
        }
      }
    },
    trimURLAndTitleWhenTooLong_(url, history) {
      // should be idempotent
      const colon = url.lastIndexOf(":", 9), hasHost = colon > 0 && url.substr(colon, 3) === "://", title = history.title;
      url = url.slice(0, (hasHost ? url.indexOf("/", colon + 4) : colon) + 320 /* GlobalConsts.TrimmedURLPathLengthWhenURLIsTooLong */) + "\u2026";
      title && title.length > 160 /* GlobalConsts.TrimmedTitleLengthWhenURLIsTooLong */ && (history.title = BgUtils_.unicodeRSubstring_(title, 0, 160 /* GlobalConsts.TrimmedTitleLengthWhenURLIsTooLong */));
      return url;
    },
    refreshInfo_() {
      const i = Date.now();
 // safe for time change
            if (store_1.historyCache_.toRefreshCount_ <= 0) {} else {
        if (i < store_1.historyCache_.lastRefresh_ + 1e3 && i >= store_1.historyCache_.lastRefresh_) {
          return;
        }
        setTimeout(browser_1.browser_.history.search, 50, {
          text: "",
          maxResults: Math.min(999, store_1.historyCache_.updateCount_ + 10),
          startTime: i < store_1.historyCache_.lastRefresh_ ? i - 3e5 : store_1.historyCache_.lastRefresh_
        }, exports.HistoryManager_.OnRefreshedInfo_);
      }
      store_1.historyCache_.lastRefresh_ = i;
      store_1.historyCache_.toRefreshCount_ = store_1.historyCache_.updateCount_ = 0;
      return exports.UrlDecoder_.continueToWork_();
    },
    parseDomains_(history) {
      exports.HistoryManager_.parseDomains_ = null;
      const d = store_1.historyCache_.domains_;
      for (const {u: url, time_: time, visible_: visible} of history) {
        const item = exports.parseDomainAndScheme_(url);
        if (item === null) {
          continue;
        }
        const {domain_: domain, scheme_: scheme} = item, slot = d.get(domain);
        if (slot !== void 0) {
          slot.time_ < time && (slot.time_ = time);
          slot.count_ += visible;
          scheme > 6 && (slot.https_ = scheme === 8 /* Urls.SchemeId.HTTPS */ ? 1 : 0);
        } else {
          d.set(domain, {
            time_: time,
            count_: visible,
            https_: scheme === 8 /* Urls.SchemeId.HTTPS */ ? 1 : 0
          });
        }
      }
    },
    OnRefreshedInfo_(history) {
      const arr = store_1.historyCache_.history_, bs = exports.HistoryManager_.binarySearch_;
      if (arr.length <= 0 || !exports.HistoryManager_.sorted_) {
        return;
      }
      for (const info of history) {
        let url = info.url;
        url.length > 2e3 /* GlobalConsts.MaxHistoryURLLength */ && (url = exports.HistoryManager_.trimURLAndTitleWhenTooLong_(url, info));
        const j = bs(url);
        if (j >= 0) {
          const item = arr[j], title = info.title;
          if (title && title !== item.title_) {
            exports.HistoryManager_._DidOnVisit(info, url, j);
            info.title = item.title_;
          }
        } else {
          exports.HistoryManager_._DidOnVisit(info, url, j);
        }
      }
    },
    binarySearch_(u) {
      let e = "", a = store_1.historyCache_.history_, h = a.length - 1, l = 0, m = 0;
      while (l <= h) {
        m = l + h >>> 1;
        e = a[m].u;
        if (e > u) {
          h = m - 1;
        } else {
          if (e === u) {
            return m;
          }
          l = m + 1;
        }
      }
      // if e > u, then l == h + 1 && l == m
      // else if e < u, then l == h + 1 && l == m + 1
      // (e < u ? -2 : -1) - m = (e < u ? -1 - 1 - m : -1 - m) = (e < u ? -1 - l : -1 - l)
      // = -1 - l = ~l
            return ~l;
    }
  };
  const normalizeUrlAndTitles_ = tabs => {
    const arr = store_1.historyCache_.history_;
    const checkIgnoredTitles = !!arr && arr.length > 0 && exports.HistoryManager_.sorted_ && titleIgnoreListRe_ !== null;
    let title, urlToTitleMap;
    for (const tab of tabs) {
      let url = tab.url;
      url.length > 2e3 /* GlobalConsts.MaxHistoryURLLength */ && (url = tab.url = exports.HistoryManager_.trimURLAndTitleWhenTooLong_(url, tab));
      if (checkIgnoredTitles && (title = tab.title) && titleIgnoreListRe_.test(title.slice(0, 100 /* GlobalConsts.MaxLengthToCheckIgnoredTitles */))) {
        let cached = urlToTitleMap === null || urlToTitleMap === void 0 ? void 0 : urlToTitleMap.get(url);
        if (cached === void 0) {
          const j = exports.HistoryManager_.binarySearch_(url);
          cached = j >= 0 ? arr[j].title_ : "";
          (urlToTitleMap || (urlToTitleMap = new Map)).set(url, cached);
        }
        cached && (tab.title = cached);
      }
    }
  };
  exports.normalizeUrlAndTitles_ = normalizeUrlAndTitles_;
  const getRecentSessions_ = (expected, showBlocked, callback) => {
    const browserSession = browser_1.browserSessions_();
    if (!browserSession) {
      callback([]);
      return;
    }
    // timer for session/history edge cases
        // Some browsers may return more session items when no `maxResults` but still require `maxResults <= 25` if it exists,
    browserSession.getRecentlyClosed({
      maxResults: Math.min(Math.round(expected * 1.2), +browserSession.MAX_SESSION_RESULTS || 25, 25)
    }, sessions => {
      let t, arr2 = [], anyWindow = 0;
      const procStart = Date.now() - performance.now();
      for (const item of sessions || []) {
        let entry = item.tab, wnd = null;
        if (!entry) {
          if (!(wnd = item.window) || !wnd.tabs || !wnd.tabs.length) {
            continue;
          }
          anyWindow = 1;
          entry = wnd.tabs.find(i => i.active) || wnd.tabs[0];
          wnd.sessionId || (wnd = null);
        }
        exports.normalizeUrlAndTitles_([ entry ]);
        const {url, title} = entry;
        if (!showBlocked && !exports.TestNotBlocked_(url, title)) {
          continue;
        }
        t = (t = item.lastModified, t < /* as ms: 1979-07 */ 3e11 && t > /* as ms: 1968-09 */ -4e10 ? t * 1e3 : t);
        const wndId = entry.windowId;
 // can be 0 on Chrome 112 for Ubuntu 22
                arr2.push({
          u: url,
          title_: title,
          visit_: t,
          sessionId_: [ wndId, (wnd || entry).sessionId, wnd ? wnd.tabs.length : 0 ],
          label_: wnd ? ` +${wnd.tabs.length > 1 ? wnd.tabs.length - 1 : ""}` : wndId && wndId !== store_1.curWndId_ && t > procStart ? " +" : ""
        });
      }
      anyWindow ? // for GC
      setTimeout(callback, 0, arr2) : callback(arr2);
      return browser_1.runtimeError_();
    });
  };
  exports.getRecentSessions_ = getRecentSessions_;
  const TestNotBlocked_ = (url, title) => blockListRe_.test(title) || blockListRe_.test(url) ? 0 /* kVisibility.hidden */ : 1 /* kVisibility.visible */;
  exports.TestNotBlocked_ = TestNotBlocked_;
  exports.BlockListFilter_ = {
    IsExpectingHidden_(query) {
      if (omniBlockList_) {
        for (const word of query) {
          for (let phrase of omniBlockList_) {
            phrase = phrase.trim();
            if (word.includes(phrase) || phrase.length > 9 && word.length + 2 >= phrase.length && phrase.includes(word)) {
              return true;
            }
          }
        }
      }
      return false;
    },
    UpdateAll_() {
      const d = store_1.historyCache_.domains_, mayBlock = blockListRe_ !== null;
      if (store_1.bookmarkCache_.bookmarks_) {
        for (const k of store_1.bookmarkCache_.bookmarks_) {
          k.visible_ = mayBlock ? exports.TestNotBlocked_(k.jsUrl_ || k.u, omniBlockPath ? k.path_ : k.title_) : 1 /* kVisibility.visible */;
        }
      }
      if (!store_1.historyCache_.history_) {
        return;
      }
      for (const k of store_1.historyCache_.history_) {
        const newVisible = mayBlock ? exports.TestNotBlocked_(k.u, k.title_) : 1 /* kVisibility.visible */;
        if (k.visible_ !== newVisible) {
          k.visible_ = newVisible;
          const domain = exports.parseDomainAndScheme_(k.u);
          const slot = domain && d.get(domain.domain_);
          slot && (slot.count_ += newVisible || -1);
        }
      }
    }
  };
  exports.UrlDecoder_ = {
    decodeURL_(a, o) {
      if (a.length >= 400 || a.lastIndexOf("%") < 0) {
        return a;
      }
      try {
        return _decodeFunc(a);
      } catch (_a) {}
      return store_1.urlDecodingDict_.get(a) || (o && decodingJobs.push(o), a);
    },
    decodeList_(a) {
      const dict = store_1.urlDecodingDict_, jobs = decodingJobs;
      let j, s, i = -1, l = a.length;
      for (;;) {
        try {
          while (++i < l) {
            j = a[i];
            s = j.u;
            j.t = s.length >= 400 || s.lastIndexOf("%") < 0 ? s : _decodeFunc(s);
          }
          break;
        } catch (_a) {
          j.t = dict.get(s) || (jobs.push(j), s);
        }
      }
      exports.UrlDecoder_.continueToWork_();
    },
    continueToWork_() {
      if (decodingJobs.length === 0 || decodingIndex !== -1) {
        return;
      }
      decodingIndex = 0;
      setTimeout( doDecoding_, 17);
    }
  };
  const doDecoding_ = xhr => {
    let text, end = decodingJobs.length;
    if (!dataUrlToDecode_ || decodingIndex >= end) {
      decodingJobs.length = 0, decodingIndex = -1;
      WithTextDecoder && (charsetDecoder_ = null);
      return;
    }
    if (WithTextDecoder) {
      end = Math.min(decodingIndex + 32, end);
      charsetDecoder_ = charsetDecoder_ || new TextDecoder(dataUrlToDecode_);
    }
    for (;decodingIndex < end; decodingIndex++) {
      const url = decodingJobs[decodingIndex], isStr = typeof url === "string", str = isStr ? url : url.u;
      if (text = store_1.urlDecodingDict_.get(str)) {
        isStr || (url.t = text);
        continue;
      }
      if (!WithTextDecoder) {
        xhr || (xhr =  createXhr_());
        xhr.open("GET", dataUrlToDecode_ + str, true);
        xhr.send();
        return;
      }
      text = str.replace(/%[a-f\d]{2}(?:%[a-f\d]{2})+/gi, doDecodePart_);
      text = text.length !== str.length ? text : str;
      typeof url !== "string" ? store_1.urlDecodingDict_.set(url.u, url.t = text) : store_1.urlDecodingDict_.set(url, text);
    }
    if (WithTextDecoder) {
      if (decodingIndex < decodingJobs.length) {
        setTimeout(doDecoding_, 4);
      } else {
        decodingJobs.length = 0;
        decodingIndex = -1;
        charsetDecoder_ = null;
      }
    }
  };
  const doDecodePart_ = text => {
    const arr = new Uint8Array(text.length / 3);
    for (let i = 1, j = 0; i < text.length; i += 3) {
      arr[j++] = parseInt(text.substr(i, 2), 16);
    }
    return charsetDecoder_.decode(arr);
  };
  const createXhr_ = () => {
    const xhr = new XMLHttpRequest;
    xhr.responseType = "text";
    xhr.onload = function() {
      if (decodingIndex < 0) {
        return;
      }
 // disabled by the outsides
            const url = decodingJobs[decodingIndex++];
      const text = this.responseText;
      typeof url !== "string" ? store_1.urlDecodingDict_.set(url.u, url.t = text) : store_1.urlDecodingDict_.set(url, text);
      if (decodingIndex < decodingJobs.length) {
        doDecoding_(xhr);
      } else {
        decodingJobs.length = 0;
        decodingIndex = -1;
      }
    };
    return xhr;
  };
  const filterInOptList = newList => {
    const arr = [];
    for (let line of newList.split("\n")) {
      line && line.trim() && line[0] !== "#" && arr.push(line);
    }
    return arr;
  };
  /** @see {@link ../pages/options_ext.ts#isExpectingHidden_} */  store_1.updateHooks_.omniBlockList = newList => {
    const arr = newList ? filterInOptList(newList) : [];
    blockListRe_ = arr.length > 0 ? new RegExp(arr.map(BgUtils_.escapeAllForRe_).join("|"), "") : null;
    omniBlockPath = arr.join("").includes("/");
    exports.omniBlockList_ = omniBlockList_ = arr.length > 0 ? arr : null;
    (store_1.historyCache_.history_ || store_1.bookmarkCache_.bookmarks_.length) && setTimeout(exports.BlockListFilter_.UpdateAll_, 100);
  };
  store_1.updateHooks_.titleIgnoreList = newList => {
    exports.titleIgnoreListRe_ = titleIgnoreListRe_ = null;
    newList = newList && filterInOptList(newList).join("\n").replace(/\\\n/g, "").replace(/\n/g, "|");
    if (newList) {
      let str = newList.replace(/^\/\|?/, ""), hasPrefix = str.length < newList.length;
      const tail = hasPrefix ? /\|?\/([a-z]{0,16})$/.exec(str) : null;
      tail && !tail.index || (exports.titleIgnoreListRe_ = titleIgnoreListRe_ = BgUtils_.makeRegexp_(tail ? str.slice(0, tail.index) : str, tail ? tail[1].replace("g", "") : ""));
    }
  };
  settings_.ready_.then(() => {
    settings_.postUpdate_("omniBlockList");
    settings_.postUpdate_("titleIgnoreList");
  });
  store_1.updateHooks_.localeEncoding = charset => {
    let enabled = !!charset && !(charset = charset.toLowerCase()).startsWith("utf");
    const oldUrl = dataUrlToDecode_;
    if (WithTextDecoder) {
      dataUrlToDecode_ = enabled ? charset : "";
      if (dataUrlToDecode_ === oldUrl) {
        return;
      }
      try {
        new TextDecoder(dataUrlToDecode_);
      } catch (_a) {
        enabled = false;
      }
    } else {
      const newDataUrl = enabled ? "data:text/plain;charset=" + charset + "," : "";
      if (newDataUrl === oldUrl) {
        return;
      }
      dataUrlToDecode_ = newDataUrl;
    }
    if (enabled) {
      oldUrl !== "1" && setTimeout(() => {
        store_1.historyCache_.history_ && exports.UrlDecoder_.decodeList_(store_1.historyCache_.history_);
        return exports.UrlDecoder_.decodeList_(store_1.bookmarkCache_.bookmarks_);
      }, 100);
    } else {
      store_1.urlDecodingDict_.clear();
      decodingJobs && (decodingJobs.length = 0);
    }
    if (decodingEnabled === enabled) {
      return;
    }
    decodingJobs = enabled ? [] : {
      length: 0,
      push: store_1.blank_
    };
    decodingEnabled = enabled;
    decodingIndex = -1;
  };
  settings_.postUpdate_("localeEncoding");
  store_1.Completion_.removeSug_ = (url, type, callback) => {
    switch (type) {
     case "tab":
      completion_utils_1.MatchCacheManager_.cacheTabs_(null);
      browser_1.removeTabsOrFailSoon_(+url, succeed => {
        succeed && completion_utils_1.MatchCacheManager_.cacheTabs_(null);
        callback(succeed);
      });
      break;

     case "history":
      const found = !exports.HistoryManager_.sorted_ || exports.HistoryManager_.binarySearch_(url) >= 0;
      browser_1.browser_.history.deleteUrl({
        url
      });
      found && completion_utils_1.MatchCacheManager_.clear_(1 /* MatchCacheType.kHistory */);
      callback(found);
      break;
    }
  };
  store_1.Completion_.isExpectingHidden_ = exports.BlockListFilter_.IsExpectingHidden_;
  Object.assign(globalThis, {
    BookmarkManager_: exports.BookmarkManager_,
    HistoryManager_: exports.HistoryManager_,
    BlockListFilter_: exports.BlockListFilter_,
    UrlDecoder_: exports.UrlDecoder_
  });
});