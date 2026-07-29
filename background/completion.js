"use strict";
__filename = "background/completion.js";
define([ "require", "exports", "./store", "./browser", "./utils", "./normalize_urls", "./parse_urls", "./i18n", "./completion_utils", "./browsing_data_manager" ], function(require, exports, store_1, browser_1, BgUtils_, normalize_urls_1, parse_urls_1, i18n_1, completion_utils_1, browsing_data_manager_1) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  BgUtils_ = __importStar(BgUtils_);
  let matchType = 0 /* MatchType.plain */ , autoSelect = false, isForAddressBar = false, otherFlags = 0 /* CompletersNS.QueryFlags.None */ , maxResults = 0, maxTotal = 0, matchedTotal = 0, offset = 0, queryTerms = [ "" ], rawInput = "", rawMode = "", rawQuery = "", rawMore = "", rawComponents = 0 /* CompletersNS.QComponent.NONE */ , mayRawQueryChangeNextTime_ = false, wantInCurrentWindow = false, historyUrlToSkip = "", bookmarkUrlToSkip = "", allExpectedTypes = 0 /* SugType.Empty */ , showThoseInBlocklist = true;
  const Suggestion = function(type, url, text, title, computeRelevancy, extraData) {
    this.e = type;
    this.u = url;
    this.t = text;
    this.title = title;
    this.r = computeRelevancy(this, extraData);
    this.visit = 0;
  };
  const bookmarkEngine = {
    checkRevoked_(isFirst) {
      if (store_1.bookmarkCache_.status_ === 3 /* BookmarkStatus.revoked */ && !(allExpectedTypes & 6 /* SugType.kBookmark */)) {
        Promise.resolve(i18n_1.transEx_("bookmarksRevoked", [])).then(msg => {
          const sug = new Suggestion("bookm", store_1.CONST_.OptionsPage_ + "#optionalPermissions", "", msg, completion_utils_1.get2ndArg, isFirst ? 8 : 1.9);
          sug.textSplit = "\u2026";
          Completers.next_([ sug ], 1 /* SugType.kBookmark */);
        });
        return true;
      }
    },
    filter_(query, index) {
      if (queryTerms.length === 0) {
        if (index || store_1.bookmarkCache_.status_ !== 0 /* BookmarkStatus.notInited */) {
          bookmarkEngine.checkRevoked_(index == 0) || Completers.next_([], 1 /* SugType.kBookmark */);
          return;
        }
        browsing_data_manager_1.BookmarkManager_.onLoad_ = () => {
          query.o || bookmarkEngine.checkRevoked_() || Completers.next_([], 1 /* SugType.kBookmark */);
        };
      } else if (allExpectedTypes & 1 /* SugType.kBookmark */) {
        store_1.bookmarkCache_.status_ >= 2 /* BookmarkStatus.inited */ ? bookmarkEngine.performSearch_() : browsing_data_manager_1.BookmarkManager_.onLoad_ = () => {
          query.o || bookmarkEngine.performSearch_();
        };
      } else {
        Completers.next_([], 1 /* SugType.kBookmark */);
        if (index) {
          return;
        }
      }
      store_1.bookmarkCache_.status_ === 0 /* BookmarkStatus.notInited */ && browsing_data_manager_1.BookmarkManager_.refresh_();
    },
    performSearch_() {
      var _a;
      const isPath = queryTerms.some(str => str.charCodeAt(0) === 47 /* kCharCode.slash */), oldCache = (_a = completion_utils_1.MatchCacheManager_.current_) === null || _a === void 0 ? void 0 : _a.bookmarks_, newCache = completion_utils_1.MatchCacheManager_.newMatch_ ? [] : null, arr = oldCache && oldCache[0] === isPath ? oldCache[1] : store_1.bookmarkCache_.bookmarks_, len = arr.length;
      let resultLength, results = [];
      if (bookmarkEngine.checkRevoked_()) {
        return;
      }
      for (let ind = 0; ind < len; ind++) {
        const i = arr[ind];
        const title = isPath ? i.path_ : i.title_;
        if (!completion_utils_1.match2_(i.t, title)) {
          continue;
        }
        if (showThoseInBlocklist || i.visible_) {
          newCache !== null && newCache.push(i);
          if (bookmarkUrlToSkip && i.u.length < bookmarkUrlToSkip.length + 2 && bookmarkUrlToSkip === (i.u.endsWith("/") ? i.u.slice(0, -1) : i.u)) {
            continue;
          }
          results.push([ -completion_utils_1.getWordRelevancy_(i.t, i.title_), ind ]);
        }
      }
      newCache && (completion_utils_1.MatchCacheManager_.newMatch_.bookmarks_ = [ isPath, newCache ]);
      resultLength = results.length;
      matchedTotal += resultLength;
      if (resultLength) {
        results.sort(completion_utils_1.sortBy0);
        if (offset > 0 && !(allExpectedTypes & 6 /* SugType.kBookmark */)) {
          results = results.slice(offset, offset + maxResults);
          offset = 0;
        } else {
          resultLength > offset + maxResults && (results.length = offset + maxResults);
        }
      } else {
        allExpectedTypes ^= 1 /* SugType.kBookmark */;
      }
      const results2 = [], 
      /** inline of {@link #recencyScore_} */
      fakeTimeScore = otherFlags & 64 /* CompletersNS.QueryFlags.PreferBookmarks */ ? -.666446 /* TimeEnums.NegativeScoreForFakeBookmarkVisitTime */ : 0;
      for (let [score, ind] of results) {
        const i = arr[ind];
        fakeTimeScore && (
        /** inline of {@link #ComputeRelevancy} */
        score = score < fakeTimeScore ? score : (score + fakeTimeScore) / 2);
        const sug = new Suggestion("bookm", i.u, i.t, isPath ? i.path_ : i.title_, completion_utils_1.get2ndArg, -score);
        const historyIdx = otherFlags & 32 /* CompletersNS.QueryFlags.ShowTime */ && browsing_data_manager_1.HistoryManager_.sorted_ ? browsing_data_manager_1.HistoryManager_.binarySearch_(i.u) : -1;
        sug.visit = historyIdx < 0 ? 0 : store_1.historyCache_.history_[historyIdx].time_;
        results2.push(sug);
        if (i.jsUrl_ === null) {
          continue;
        }
        sug.u = i.jsUrl_;
        sug.title = completion_utils_1.cutTitle(isPath ? i.path_ : i.title_);
        sug.textSplit = "javascript: \u2026";
        sug.t = i.jsText_;
      }
      Completers.next_(results2, 1 /* SugType.kBookmark */);
    }
  }, historyEngine = {
    filter_(query, index) {
      if (!queryTerms.length && otherFlags & 1024 /* CompletersNS.QueryFlags.NoSessions */ || !(allExpectedTypes & 2 /* SugType.kHistory */)) {
        return Completers.next_([], 2 /* SugType.kHistory */);
      }
      const history = store_1.historyCache_.history_, someQuery = queryTerms.length > 0;
      if (history) {
        if (someQuery) {
          historyEngine.performSearch_();
          return;
        }
        (store_1.historyCache_.updateCount_ > 10 || store_1.historyCache_.toRefreshCount_ > 0) && browsing_data_manager_1.HistoryManager_.refreshInfo_();
      } else {
        const loadAllHistory = someQuery ? () => {
          query.o || historyEngine.performSearch_();
        } : null;
        if (someQuery && (isForAddressBar || browsing_data_manager_1.HistoryManager_.loadingTimer_)) {
          browsing_data_manager_1.HistoryManager_.loadingTimer_ > 0 && clearTimeout(browsing_data_manager_1.HistoryManager_.loadingTimer_);
          browsing_data_manager_1.HistoryManager_.loadingTimer_ = 0;
          browsing_data_manager_1.HistoryManager_.use_(loadAllHistory);
        } else {
          browsing_data_manager_1.HistoryManager_.loadingTimer_ || (browsing_data_manager_1.HistoryManager_.loadingTimer_ = setTimeout(() => {
            browsing_data_manager_1.HistoryManager_.loadingTimer_ = 0;
            browsing_data_manager_1.HistoryManager_.use_(loadAllHistory);
          }, someQuery ? 200 : 150));
          if (someQuery) {
            const curAll = Completers.suggestions_, len = curAll.length, someMatches = len > 0;
            Completers.callback_(someMatches && curAll[0].t === "search" ? [ curAll[0] ] : [], autoSelect && someMatches, 0 /* MatchType.Default */ , 0 /* SugType.Empty */ , len, rawMode, rawComponents);
          }
        }
        if (someQuery) {
          return;
        }
      }
      index === 0 ? completion_utils_1.requireNormalOrIncognitoTabs_(wantInCurrentWindow, otherFlags, historyEngine.loadTabs_, query) : browsing_data_manager_1.getRecentSessions_(offset + maxResults, showThoseInBlocklist, historyEngine.loadSessions_.bind(null, query));
    },
    performSearch_() {
      var _a;
      const firstTerm = queryTerms.length === 1 ? queryTerms[0] : "", onlyUseTime = firstTerm ? firstTerm[0] === "." ? /^\.[\da-zA-Z]+$/.test(firstTerm) ? 2 : 0 : (normalize_urls_1.convertToUrl_(firstTerm, null, -2 /* Urls.WorkType.KeepAll */), 
      normalize_urls_1.lastUrlType_ <= 2 /* Urls.Type.MaxOfInputIsPlainUrl */ ? normalize_urls_1.lastUrlType_ > 0 /* Urls.Type.Full */ ? 2 : 1 : 0) : 0, firstTermRe = onlyUseTime > 1 ? completion_utils_1.RegExpCache_.parts_[0] : null, newCache = completion_utils_1.MatchCacheManager_.newMatch_ ? [] : null, results = [ -1.1, -1.1 ], sugs = [], Match2 = completion_utils_1.match2_, isEncodedURL = onlyUseTime > 0 && firstTerm.includes("%") && !/[^\x21-\x7e]|%[^A-F\da-f]/.test(firstTerm);
      let maxNum = maxResults + offset, curMinScore = -1.1, i = 0, j = 0, matched = 0;
      historyUrlToSkip && maxNum++;
      for (j = maxNum; --j; ) {
        results.push(-1.1, -1.1);
      }
      maxNum = maxNum * 2 - 2;
      const history = ((_a = completion_utils_1.MatchCacheManager_.current_) === null || _a === void 0 ? void 0 : _a.history_) || store_1.historyCache_.history_;
      for (const len = history.length; i < len; i++) {
        const item = history[i];
        if ((onlyUseTime === 0 ? Match2(item.t, item.title_) : onlyUseTime === 1 ? (isEncodedURL ? item.u : item.t).startsWith(firstTerm) : firstTermRe.test(isEncodedURL ? item.u : item.t)) && (showThoseInBlocklist || item.visible_)) {
          newCache !== null && newCache.push(item);
          matched++;
          const score = onlyUseTime ? completion_utils_1.ComputeRecency(item.time_) || /* < 0.0002 */ 1e-16 * Math.max(0, item.time_) : completion_utils_1.ComputeRelevancy(item.t, item.title_, item.time_);
          if (score > curMinScore) {
            for (j = maxNum - 2; 0 <= j && results[j] < score; j -= 2) {
              results[j + 2] = results[j], results[j + 3] = results[j + 1];
            }
            results[j + 2] = score;
            results[j + 3] = i;
            curMinScore = results[maxNum];
          }
        }
      }
      newCache && (completion_utils_1.MatchCacheManager_.newMatch_.history_ = newCache);
      matchedTotal += matched;
      matched || (allExpectedTypes ^= 2 /* SugType.kHistory */);
      if (allExpectedTypes & 5 /* SugType.kHistory */) {
        i = 0;
      } else {
        i = offset * 2;
        offset = 0;
      }
      for (;i <= maxNum; i += 2) {
        const score = results[i];
        if (score <= 0) {
          break;
        }
        const item = history[results[i + 1]];
        if (item.u !== historyUrlToSkip) {
          const sug = new Suggestion("history", item.u, isEncodedURL ? item.u : item.t, item.title_, completion_utils_1.get2ndArg, score);
          sug.visit = item.time_;
          sugs.push(sug);
        }
      }
      browsing_data_manager_1.UrlDecoder_.continueToWork_();
      Completers.next_(sugs, 2 /* SugType.kHistory */);
    },
    loadTabs_(query, tabs) {
      if (query.o) {
        return;
      }
      const urlSet = new Set;
      for (const tab of tabs) {
        tab.incognito && completion_utils_1.tabsInNormal || urlSet.add(browser_1.getTabUrl(tab));
      }
      historyEngine.filterFill_([], query, urlSet, offset, urlSet.size);
    },
    loadSessions_(query, sessions) {
      if (query.o) {
        return;
      }
      const historyArr = [], idSet = new Set, urlSet = new Set;
      let i = -offset;
      sessions.some(item => {
        let key, url = item.u;
        key = url + "\n" + item.title_;
        if (idSet.has(key)) {
          return false;
        }
        idSet.add(key), urlSet.add(url);
        ++i > 0 && historyArr.push(item);
        return historyArr.length >= maxResults;
      }) ? historyEngine.filterFinish_(historyArr) : historyEngine.filterFill_(historyArr, query, urlSet, -i, 0);
    },
    filterFill_(historyArr, query, urlSet, cut, neededMore) {
      (0, browser_1.browser_.history.search)({
        text: "",
        maxResults: (offset + maxResults) * (showThoseInBlocklist ? 1 : 2) + neededMore
      }, rawArr2 => {
        for (const i of rawArr2) {
          i.url.length > 2e3 /* GlobalConsts.MaxHistoryURLLength */ && (i.url = browsing_data_manager_1.HistoryManager_.trimURLAndTitleWhenTooLong_(i.url, i));
        }
        store_1.historyCache_.history_ && browsing_data_manager_1.HistoryManager_.OnRefreshedInfo_(rawArr2);
        if (query.o) {
          return;
        }
        rawArr2 = rawArr2.filter(i => {
          let url = i.url;
          return !urlSet.has(url) && (showThoseInBlocklist || browsing_data_manager_1.TestNotBlocked_(i.url, i.title || "") !== 0 /* kVisibility.hidden */);
        });
        cut < 0 ? rawArr2.length = Math.min(rawArr2.length, maxResults - historyArr.length) : cut > 0 && (rawArr2 = rawArr2.slice(cut, cut + maxResults));
        let historyArr2 = rawArr2.map(i => ({
          u: i.url,
          title_: i.title || "",
          visit_: i.lastVisitTime,
          sessionId_: null,
          label_: null
        }));
        cut < 0 && (historyArr2 = historyArr.concat(historyArr2));
        historyEngine.filterFinish_(historyArr2);
      });
    },
    filterFinish_(historyArr) {
      const MakeSuggestion_ = (e, i, arr) => {
        const u = e.u, o = new Suggestion("history", u, browsing_data_manager_1.UrlDecoder_.decodeURL_(u, u), e.title_ || "", completion_utils_1.get2ndArg, (99 - i) / 100), sessionId = e.sessionId_;
        o.visit = e.visit_;
        sessionId && (o.s = sessionId, o.label = '<span class="undo">&#8630;</span>' + e.label_);
        arr[i] = o;
      };
      historyArr.forEach(MakeSuggestion_);
      offset = 0;
      browsing_data_manager_1.UrlDecoder_.continueToWork_();
      Completers.next_(historyArr, 2 /* SugType.kHistory */);
    }
  }, domainEngine = {
    filter_(query, index) {
      if (queryTerms.length !== 1 || !(allExpectedTypes & 16 /* SugType.domain */) || queryTerms[0].lastIndexOf("/", queryTerms[0].length - 2) >= 0) {
        return Completers.next_([], 16 /* SugType.domain */);
      }
      if (browsing_data_manager_1.HistoryManager_.parseDomains_) {
        if (!store_1.historyCache_.history_) {
          return index > 0 ? Completers.next_([], 16 /* SugType.domain */) : browsing_data_manager_1.HistoryManager_.use_(() => {
            query.o || domainEngine.filter_(query, 0);
          });
        }
        browsing_data_manager_1.HistoryManager_.parseDomains_(store_1.historyCache_.history_);
      }
      return domainEngine.performSearch_();
    },
    performSearch_() {
      const ref = store_1.historyCache_.domains_, oldMaxScoreP = completion_utils_1.maxScoreP_, ret_many = allExpectedTypes === 16 /* SugType.domain */ && autoSelect ? [] : null, // autoSelect means there's only 1 engine in mode
      word = queryTerms[0].replace("/", "").toLowerCase();
      const addExtraSlash = word.length === queryTerms[0].length;
      let matchedDomain, sugs = [], result = "", result_score = -1.1;
      completion_utils_1.sync_maxScoreP_(3 /* RankingEnums.maximumScore */);
      for (const domain of ref.keys()) {
        if (addExtraSlash ? !domain.includes(word) : !domain.endsWith(word)) {
          continue;
        }
        matchedDomain = ref.get(domain);
        if (showThoseInBlocklist || matchedDomain.count_ > 0) {
          const score = completion_utils_1.ComputeRelevancy(domain, "", matchedDomain.time_);
          ret_many ? ret_many.push({
            r: score,
            d: domain,
            m: matchedDomain
          }) : score > result_score && (result_score = score, result = domain);
        }
      }
      let isMainPart = result.length === word.length;
      if (result && !isMainPart) {
        if (!result.startsWith("www.") && !result.startsWith(word)) {
          let r2 = result.slice(result.indexOf(".") + 1);
          if (r2.includes(word)) {
            let d2;
            r2 = "www." + r2;
            if (d2 = ref.get(r2)) {
              if (showThoseInBlocklist || d2.count_ > 0) {
                result = r2;
                matchedDomain = d2;
              }
            } else if ((d2 = ref.get(r2 = "m." + r2)) && (showThoseInBlocklist || d2.count_ > 0) && (showThoseInBlocklist || d2.count_ > 0)) {
              result = r2;
              matchedDomain = d2;
            }
          }
        }
        let mainLen = result.startsWith(word) ? 0 : result.startsWith("www." + word) ? 4 : -1;
        if (mainLen >= 0) {
          const [arr, partsNum] = BgUtils_.splitByPublicSuffix_(result), i = arr.length - 1;
          if (partsNum > 1) {
            mainLen = result.length - mainLen - word.length - arr[i].length - 1;
            (!mainLen || partsNum === 3 && mainLen === arr[i - 1].length + 1) && (isMainPart = true);
          }
        }
      }
      if (result) {
        matchedTotal++;
        autoSelect = !offset && isMainPart || autoSelect;
        sugs = domainEngine.createDomainSug_(result, matchedDomain, 0, addExtraSlash);
      } else if (ret_many) {
        ret_many.sort(domainEngine.rsortByR_);
        matchedTotal = ret_many.length;
        matchedTotal > offset + maxResults && (ret_many.length = offset + maxResults);
        for (const i of ret_many) {
          sugs.push(domainEngine.createDomainSug_(i.d, i.m, i.r, addExtraSlash)[0]);
        }
      }
      completion_utils_1.sync_maxScoreP_(oldMaxScoreP);
      Completers.next_(sugs, 16 /* SugType.domain */);
    },
    createDomainSug_(key, matchedDomain, scoreInMany, extraSlash) {
      let useHttps = matchedDomain.https_ > 0, title = "";
      if (store_1.bookmarkCache_.status_ === 2 /* BookmarkStatus.inited */) {
        const re = new RegExp(`^https?://${BgUtils_.escapeAllForRe_(key)}/?$`);
        let matchedBookmarks = store_1.bookmarkCache_.bookmarks_.filter(item => re.test(item.u) && (showThoseInBlocklist || item.visible_));
        if (matchedBookmarks.length > 0) {
          const matched2 = matchedBookmarks.filter(i => i.u[4] === "s");
          useHttps = matched2.length > 0;
          matchedBookmarks = useHttps ? matched2 : matchedBookmarks;
          const matchedUrl = matchedBookmarks[0].u;
          bookmarkUrlToSkip = matchedUrl.endsWith("/") ? matchedUrl.slice(0, -1) : matchedUrl;
          title = matchedBookmarks[0].title_;
        }
      }
      const url = (useHttps ? "https://" : "http://") + key + "/";
      if (!scoreInMany) {
        historyUrlToSkip = url;
        if (offset > 0) {
          offset--;
          return [];
        }
      }
      const sug = new Suggestion("domain", url, extraSlash ? key : key + "/", "", completion_utils_1.get2ndArg, scoreInMany || 2);
      const ind = browsing_data_manager_1.HistoryManager_.sorted_ ? browsing_data_manager_1.HistoryManager_.binarySearch_(url) : -1;
      const item = ind > 0 ? store_1.historyCache_.history_[ind] : null;
      completion_utils_1.prepareHTML_(sug);
      if (item && (showThoseInBlocklist || item.visible_)) {
        sug.visit = item.time_;
        title = title || item.title_;
      }
      sug.title = completion_utils_1.cutTitle(title, []);
      --maxResults;
      return [ sug ];
    },
    rsortByR_(a, b) {
      return b.r - a.r;
    }
  }, kTabMarks = "audible audio muted unmuted active discarded incognito normal pinned visited new grouped ungrouped".split(" "), tabEngine = {
    filter_(query, index) {
      !(allExpectedTypes & 4 /* SugType.tab */) || index && (!queryTerms.length || otherFlags & 256 /* CompletersNS.QueryFlags.NoTabEngine */) ? Completers.next_([], 4 /* SugType.tab */) : completion_utils_1.requireNormalOrIncognitoTabs_(wantInCurrentWindow, otherFlags, tabEngine.performSearch_, query);
    },
    performSearch_(query, tabs0) {
      if (query.o) {
        return;
      }
      const curTabId = store_1.curTabId_, noFilter = queryTerms.length <= 0, hasOtherSuggestions = allExpectedTypes & 3 /* SugType.tab */ , treeMode = !!(otherFlags & 8 /* CompletersNS.QueryFlags.TabTree */) && wantInCurrentWindow && noFilter;
      let suggestions = [];
      let curTab, monoNow = 0;
      if (treeMode && !(otherFlags & 128 /* CompletersNS.QueryFlags.TabTreeFromStart */) && tabs0.length > offset && tabs0.length > maxTotal) {
        const treeMap = new Map;
        for (const tab of tabs0) {
          treeMap.set(tab.id, tab);
        }
        {
          curTab = treeMap.get(curTabId);
          let pId = curTab ? curTab.openerTabId : 0, pTab = pId ? treeMap.get(pId) : null, start = pTab ? tabs0.indexOf(pTab) : curTab ? tabs0.indexOf(curTab) - 1 : 0, i = pTab ? 0 : maxTotal / 2 | 0;
          for (;1 < --i && start > 0 && tabs0[start - 1].openerTabId === pId; start--) {}
          tabs0 = start > 0 ? tabs0.slice(start).concat(tabs0.slice(0, start)) : tabs0;
        }
      }
      const tabs = [], wndIds = [];
      const marks = (queryTerms.join("\n").match(/^:[a-z]+$/gm) || []).reduce((i, j) => {
        j = j.slice(1);
        for (let ind = 0; ind < kTabMarks.length; ind++) {
          kTabMarks[ind].startsWith(j) && (i |= 1 << ind);
        }
        return i;
      }, 0);
      curTab = !curTab && marks ? tabs0.filter(i => i.id === curTabId)[0] : curTab;
      const groupId = marks && curTab ? browser_1.getGroupId(curTab) : null;
      for (const tab of tabs0) {
        if (!wantInCurrentWindow && completion_utils_1.tabsInNormal && tab.incognito) {
          continue;
        }
        const url = browser_1.getTabUrl(tab);
        let text = tab.text || (tab.text = browsing_data_manager_1.UrlDecoder_.decodeURL_(url, tab.incognito ? "" : url));
        let title = tab.title;
        if (marks) {
          queryTerms.length === 1 && (text = title = "");
          if (tab.audible) {
            marks & 1 && (title += " :audible"), marks & 2 && (title += " :audio");
            marks & 12 && (browser_1.isTabMuted(tab) ? marks & 4 && (title += " :muted") : marks & 8 && (title += " :unmuted"));
          }
          marks & 16 && tab.active && !wantInCurrentWindow && (title += ":active");
          marks & 32 && tab.discarded && (title += " :discarded");
          marks & 192 && (tab.incognito ? marks & 64 && (title += " :incognito") : marks & 128 && (title += " :normal"));
          marks & 256 && tab.pinned && (title += " :pinned");
          marks & 1536 && (store_1.recencyForTab_.has(tab.id) ? marks & 512 && (title += " :visited") : marks & 1024 && (title += " :new"));
          marks & 6144 && (groupId && browser_1.getGroupId(tab) === groupId ? marks & 2048 && (title += " :grouped") : marks & 4096 && (title += " :ungrouped"));
        }
        if (noFilter || completion_utils_1.match2_(text, title)) {
          const wndId = tab.windowId;
          !wantInCurrentWindow && wndIds.lastIndexOf(wndId) < 0 && wndIds.push(wndId);
          tabs.push(tab);
        }
      }
      hasOtherSuggestions && tabs.length === 1 && tabs[0].id === curTabId && (tabs.length = 0);
      const matched = tabs.length;
      matchedTotal += matched;
      matched || (allExpectedTypes ^= 4 /* SugType.tab */);
      if (offset >= matched && !hasOtherSuggestions) {
        offset = 0;
        return Completers.next_(suggestions, 4 /* SugType.tab */);
      }
      wndIds.sort((a, b) => a - b);
      const treeLevels = treeMode ? new Map : null, curWndId = store_1.curWndId_;
      if (treeMode) {
        for (const tab of tabs) {
          // only from start to end, and should not execute nested queries
          const pid = tab.openerTabId, pLevel = pid && treeLevels.get(pid);
          treeLevels.set(tab.id, pLevel ? pLevel < 5 /* GlobalConsts.MaxTabTreeIndent */ ? pLevel + 1 : 5 /* GlobalConsts.MaxTabTreeIndent */ : 1);
        }
      }
      const timeOffset = otherFlags & 32 /* CompletersNS.QueryFlags.ShowTime */ ? BgUtils_.recencyBase_() : 0;
      const c = noFilter ? treeMode ? (_0, index) => 1 / index : (monoNow = performance.now(), 
      (_0, tabId) => store_1.recencyForTab_.get(tabId) || (otherFlags & 4 /* CompletersNS.QueryFlags.PreferNewOpened */ ? monoNow + tabId : -tabId)) : completion_utils_1.ComputeWordRelevancy;
      for (let ind = 0; ind < tabs.length; ) {
        const tab = tabs[ind++];
        const tabId = tab.id, level = treeMode ? treeLevels.get(tabId) : 1, url = browser_1.getTabUrl(tab), visit = store_1.recencyForTab_.get(tabId), suggestion = new Suggestion("tab", url, tab.text, tab.title, c, treeMode ? ind : tabId);
        let wndId = tab.windowId !== curWndId ? wndIds.indexOf(tab.windowId) + 1 + ":" : "";
        let id = tab.index + 1 + "", label = "";
        if (tab.active) {
          treeMode || curTabId !== tabId && tab.windowId !== curWndId || (suggestion.r = noFilter || !/^(?!:[a-z]+)/m.test(queryTerms.join("\n")) ? 1 << 31 : 0);
          id = `(${id})`;
        } else {
          visit || (id = `**${id}**`);
        }
        !completion_utils_1.tabsInNormal && tab.incognito && (label += "*");
        tab.discarded && (label += "~");
        tab.audible && (label += browser_1.isTabMuted(tab) ? "\u266a" : "\u266c");
        suggestion.visit = visit ? visit + timeOffset : 0;
        suggestion.s = tabId;
        suggestion.label = `#${wndId}${id}${label && " " + label}`;
        level > 1 && (suggestion.level = " level-" + level);
        suggestions.push(suggestion);
      }
      suggestions.sort(Completers.rSortByRelevancy_);
      let resultLength = suggestions.length, exceed = offset + maxResults - resultLength;
      if (hasOtherSuggestions || exceed < 0 || !noFilter) {
        if (offset > 0 && !hasOtherSuggestions) {
          suggestions = suggestions.slice(offset, offset + maxResults);
          resultLength = maxResults;
          offset = 0;
        } else {
          resultLength > offset + maxResults && (suggestions.length = resultLength = offset + maxResults);
        }
        for (let i = hasOtherSuggestions ? 0 : resultLength, end = Math.min(resultLength, 28); i < end; i++) {
          suggestions[i].r *= 8 / (i / 4 + 1);
        }
        !offset && Completers.suggestions_ && Completers.dedupPreviousAndMergeTo_(suggestions);
      } else if (offset > 0) {
        const exceededArr = suggestions.slice(0, exceed).map(i => Object.assign({}, i));
        for (let sug of exceededArr) {
          sug.label += "[r]";
        }
        suggestions = suggestions.slice(offset).concat(exceededArr);
        resultLength = suggestions.length;
        for (let i = 0; i < resultLength; i++) {
          suggestions[i].r = resultLength - i;
        }
        offset = 0;
      }
      browsing_data_manager_1.UrlDecoder_.continueToWork_();
      Completers.next_(suggestions, 4 /* SugType.tab */);
    }
  }, 
  /** List browser windows; selecting focuses that window (via its active tab). */
  windowEngine = {
    filter_(query, _index) {
      // Suggestions use type "tab" so existing vomnibar selection focuses the active tab (and window).
      browser_1.Windows_.getAll({
        populate: true
      }, wnds => {
        if (query.o || browser_1.runtimeError_()) {
          Completers.next_([], 4 /* SugType.tab */);
          return browser_1.runtimeError_();
        }
        const sugs = [];
        const list = (wnds || []).filter(w => w.type === "normal" || w.type === "popup");
        list.sort((a, b) => a.id - b.id);
        let n = 0;
        for (const wnd of list) {
          const tabs = wnd.tabs || [];
          const active = tabs.find(t => t.active) || tabs[0];
          if (!active) {
            continue;
          }
          const title = (active.title || "(untitled)").slice(0, 120);
          const url = browser_1.getTabUrl(active);
          const text = `window ${wnd.id} ${title} ${url}`;
          if (queryTerms.length && !completion_utils_1.match2_(text, title + " " + url)) {
            continue;
          }
          n++;
          const label = wnd.id === store_1.curWndId_ ? `(W${n})` : `W${n}`;
          const sug = new Suggestion("tab", url, text, title, completion_utils_1.get2ndArg, wnd.focused || wnd.id === store_1.curWndId_ ? 1e9 : 1e6 - n);
          sug.s = active.id;
          sug.label = `#${label}${wnd.incognito ? " *" : ""}${wnd.state === "minimized" ? " ~" : ""}`;
          sug.visit = store_1.recencyForTab_.get(active.id) || 0;
          sugs.push(sug);
        }
        matchedTotal += sugs.length;
        Completers.next_(offset > 0 && sugs.length > offset ? sugs.slice(offset, offset + maxResults) : sugs.slice(0, maxResults + offset), 4 /* SugType.tab */);
        browsing_data_manager_1.UrlDecoder_.continueToWork_();
      });
    }
  }, searchEngine = {
    _nestedEvalCounter: 0,
    filter_: store_1.blank_,
    preFilter_(query, failIfNull, oriPattern) {
      if (!(allExpectedTypes & 8 /* SugType.search */)) {
        return Completers.next_([], 8 /* SugType.search */);
      }
      let sug, pattern, q = queryTerms, keyword = q.length > 0 ? q[0] : "";
      if (q.length === 0) {} else {
        if (!failIfNull && keyword[0] === "\\" && keyword[1] !== "\\") {
          keyword.length > 1 ? q[0] = keyword.slice(1) : q.shift();
          keyword = rawQuery.slice(1).trimLeft();
          showThoseInBlocklist = !browsing_data_manager_1.omniBlockList_ || showThoseInBlocklist || browsing_data_manager_1.BlockListFilter_.IsExpectingHidden_([ keyword ]);
          if (offset) {
            offset--;
            return Completers.next_([], 8 /* SugType.search */);
          }
          sug = searchEngine.makeUrlSuggestion_(keyword, oriPattern);
          return Completers.next_([ sug ], 8 /* SugType.search */);
        }
        pattern = store_1.searchEngines_.map.get(keyword);
      }
      if (failIfNull) {
        if (!pattern) {
          return true;
        }
      } else {
        if (!pattern && !keyword.startsWith("vimium://")) {
          matchType === 0 /* MatchType.plain */ && q.length <= 1 && (matchType = q.length ? completion_utils_1.SearchKeywords_.isPrefix_() ? -2 /* MatchType.searching_ */ : 0 /* MatchType.plain */ : -1 /* MatchType.reset */);
          // Chrome-like: when typing an engine keyword prefix (!g, gh, …), list matching engines
                    if (q.length === 1 && keyword && !offset) {
            const keys = completion_utils_1.SearchKeywords_.matchingKeys_(keyword, Math.min(maxResults, 8));
            if (keys.length) {
              const sugs = [];
              for (const key of keys) {
                const eng = store_1.searchEngines_.map.get(key);
                if (!eng) {
                  continue;
                }
                const blank = eng.blank_ || eng.url_.split("$")[0];
                const sug = new Suggestion("search", blank || eng.url_, key + " ", eng.name_ + "  \xb7  " + key, completion_utils_1.get2ndArg, 9.5 - sugs.length * .05);
                sug.t = key + " ";
                sug.textSplit = BgUtils_.escapeText_(sug.t);
                sug.title = completion_utils_1.cutTitle(eng.name_ + "  \xb7  " + key, [ 0, eng.name_.length ]);
                sug.p = isForAddressBar ? key : "";
                sug.v = isForAddressBar ? "" : blank && blank.startsWith("http") ? blank : completion_utils_1.calcBestFaviconSource_only_cr_(blank || eng.url_);
                sugs.push(sug);
              }
              if (sugs.length) {
                matchType = -2 /* MatchType.searching_ */;
                return Completers.next_(sugs, 8 /* SugType.search */);
              }
            }
          }
          return Completers.next_([], 8 /* SugType.search */);
        }
        if (pattern && rawMore) {
          q.push(rawMore);
          offset = 0;
          rawQuery += " " + rawMore;
          rawMore = "";
          rawComponents &= -5 /* CompletersNS.QComponent.offset */;
        }
        q.length > 1 || (matchType = -1 /* MatchType.reset */);
      }
      if (q.length > 1 && pattern) {
        q.shift();
        if (rawQuery.length > 200 /* Consts.MaxCharsInQuery */) {
          q = rawQuery.split(" ");
          q.shift();
        }
      } else {
        pattern && (q = []);
      }
      showThoseInBlocklist = !browsing_data_manager_1.omniBlockList_ || showThoseInBlocklist && browsing_data_manager_1.BlockListFilter_.IsExpectingHidden_([ keyword ]);
      let url, indexes, text;
      if (pattern) {
        let res = normalize_urls_1.createSearch_(q, pattern.url_, pattern.blank_, []);
        text = url = res.url_;
        indexes = res.indexes_;
      } else {
        text = url = q.join(" ");
        indexes = [];
      }
      if (keyword === "~") {} else if (url.startsWith("vimium://")) {
        const ret = store_1.evalVimiumUrl_(url.slice(9), 1 /* Urls.WorkType.ActIfNoSideEffects */ , true);
        const getSug = searchEngine.plainResult_.bind(searchEngine, q, url, text, oriPattern || pattern, indexes);
        if (ret instanceof Promise) {
          return ret.then(searchEngine.onEvalUrl_.bind(searchEngine, query, oriPattern || pattern, getSug));
        }
        if (ret instanceof Array) {
          return searchEngine.onEvalUrl_(query, oriPattern || pattern, getSug, ret);
        }
        if (ret) {
          url = text = ret;
          indexes = [];
        }
      } else {
        url = normalize_urls_1.convertToUrl_(url, null, -2 /* Urls.WorkType.KeepAll */);
      }
      sug = searchEngine.plainResult_(q, url, text, oriPattern || pattern, indexes);
      return Completers.next_([ sug ], 8 /* SugType.search */);
    },
    onEvalUrl_(query, oriPattern, getSug, ret) {
      let sugs;
      if (query.o) {
        return;
      }
      switch (ret[1]) {
       case 5 /* Urls.kEval.paste */ :
       case 7 /* Urls.kEval.plainUrl */ :
        let pasted = ret[0];
        matchType = ret[1] === 7 /* Urls.kEval.plainUrl */ && queryTerms.length > 1 ? matchType : -1 /* MatchType.reset */;
        if (!pasted) {
          break;
        }
        rawQuery = "\\ " + pasted;
        rawMore = "";
        queryTerms = (rawQuery.length < 201 ? rawQuery : BgUtils_.unicodeRSubstring_(rawQuery, 0, 200 /* Consts.MaxCharsInQuery */).trim()).split(" ");
        queryTerms.length > 1 && (queryTerms[1] = parse_urls_1.fixCharsInUrl_(queryTerms[1], queryTerms.length > 2));
        completion_utils_1.sync_queryTerms_(queryTerms);
        return searchEngine.preFilter_(query, null, oriPattern);

       case 2 /* Urls.kEval.search */ :
        const newQuery = ret[0];
        queryTerms = newQuery.length > 1 || newQuery.length === 1 && newQuery[0] ? newQuery : queryTerms;
        completion_utils_1.sync_queryTerms_(queryTerms);
        const counter = searchEngine._nestedEvalCounter++;
        if (counter > 12) {
          break;
        }
        const subVal = searchEngine.preFilter_(query, true, oriPattern);
        counter <= 0 && (searchEngine._nestedEvalCounter = 0);
        if (subVal !== true) {
          return subVal;
        }
        break;

       case 0 /* Urls.kEval.math */ :
        ret[0] && (sugs = searchEngine.mathResult_(getSug(), ret));
        // no break;
        // no default:
            }
      Completers.next_(sugs || [ getSug() ], 8 /* SugType.search */);
    },
    plainResult_(q, url, text, pattern, indexes) {
      const sug = new Suggestion("search", url, text, (pattern ? pattern.name_ + ": " : "") + q.join(" "), completion_utils_1.get2ndArg, 9);
      if (q.length > 0 && pattern) {
        sug.t = searchEngine.makeText_(text, indexes);
        sug.title = completion_utils_1.cutTitle(sug.title, [ pattern.name_.length + 2, sug.title.length ]);
        sug.textSplit = completion_utils_1.highlight(sug.t, indexes);
      } else {
        sug.t = BgUtils_.DecodeURLPart_(completion_utils_1.shortenUrl(text));
        sug.title = completion_utils_1.cutTitle(sug.title, []);
        sug.textSplit = BgUtils_.escapeText_(sug.t);
      }
      sug.v = isForAddressBar ? "" : pattern && pattern.blank_ || completion_utils_1.calcBestFaviconSource_only_cr_(url);
      sug.p = isForAddressBar && pattern ? pattern.name_ : "";
      return sug;
    },
    mathResult_(stdSug, arr) {
      const result = arr[0], urlToCopy = "vimium://copy " + result;
      const sug = new Suggestion("math", stdSug.u, result, result, completion_utils_1.get2ndArg, 8);
      stdSug.u = urlToCopy;
      sug.title = `<match style="text-decoration: none;">${completion_utils_1.cutTitle(sug.title, [])}<match>`;
      sug.textSplit = BgUtils_.escapeText_(arr[2]);
      return [ stdSug, sug ];
    },
    makeText_(url, arr) {
      let i, str, ind, len = arr.length;
      str = BgUtils_.DecodeURLPart_(arr.length > 0 ? url.slice(0, arr[0]) : url);
      if (i = BgUtils_.IsURLHttp_(str)) {
        str = str.slice(i);
        i = 0;
      }
      if (arr.length <= 0) {
        return str;
      }
      ind = arr[0];
      while (arr[i] = str.length, len > ++i) {
        str += BgUtils_.DecodeURLPart_(url.slice(ind, arr[i]));
        ind = arr[i];
      }
      ind < url.length && (str += BgUtils_.DecodeURLPart_(url.slice(ind)));
      return str;
    },
    makeUrlSuggestion_(keyword, oriPattern) {
      const url = normalize_urls_1.convertToUrl_(keyword, null, -2 /* Urls.WorkType.KeepAll */), isSearch = normalize_urls_1.lastUrlType_ === 4 /* Urls.Type.Search */ , sug = new Suggestion("search", url, BgUtils_.DecodeURLPart_(completion_utils_1.shortenUrl(url)), "", completion_utils_1.get2ndArg, 9);
      sug.title = isSearch ? (oriPattern && oriPattern.name_ || "~") + ": " + completion_utils_1.cutTitle(keyword, [ 0, keyword.length ]) : completion_utils_1.cutTitle(keyword, []);
      sug.textSplit = BgUtils_.escapeText_(sug.t);
      sug.v = isForAddressBar ? "" : isSearch && oriPattern && ((oriPattern.blank_ || oriPattern.url_).startsWith("vimium:") ? store_1.CONST_.OptionsPage_ : oriPattern.blank_) || completion_utils_1.calcBestFaviconSource_only_cr_(url);
      sug.p = isForAddressBar && isSearch ? "~" : "";
      sug.n = 1;
      return sug;
    }
  }, Completers = {
    counter_: 0,
    sugTypes_: 0 /* SugType.Empty */ ,
    suggestions_: null,
    mostRecentQuery_: null,
    callback_: null,
    filter_(completers) {
      Completers.mostRecentQuery_ && (Completers.mostRecentQuery_.o = true);
      const query = Completers.mostRecentQuery_ = {
        o: false
      };
      Completers.sugTypes_ = 0 /* SugType.Empty */;
      allExpectedTypes &= completers[0];
      let i = 1, l = allExpectedTypes & -9 /* SugType.search */ ? completers.length : 2;
      Completers.suggestions_ = [];
      Completers.counter_ = l - 1;
      matchType = offset && -1 /* MatchType.reset */;
      if (completers[1] === searchEngine) {
        const ret = searchEngine.preFilter_(query);
        if (l < 3) {
          return;
        }
        if (ret) {
          ret.then(Completers._filter2.bind(null, completers, query, i));
          return;
        }
        i = 2;
      }
      Completers._filter2(completers, query, i);
    },
    _filter2(completers, query, i) {
      completion_utils_1.sync_timeAgo_(Date.now() - 18144e5 /* TimeEnums.timeCalibrator */);
 // safe for time change
            completion_utils_1.sync_maxScoreP_(3 /* RankingEnums.maximumScore */ * queryTerms.length || .01);
      if (queryTerms.indexOf("__proto__") >= 0) {
        queryTerms = queryTerms.join(" ").replace(/(^| )__proto__(?=$| )/g, " __proto_").trimLeft().split(" ");
        completion_utils_1.sync_queryTerms_(queryTerms);
      }
      completion_utils_1.MatchCacheManager_.update_(showThoseInBlocklist);
      queryTerms.sort(Completers.rSortQueryTerms_);
      completion_utils_1.RegExpCache_.buildParts_();
      for (;i < completers.length; i++) {
        completers[i].filter_(query, i - 1);
      }
    },
    rSortQueryTerms_(a, b) {
      return b.length - a.length || (a < b ? -1 : a === b ? 0 : 1);
    },
    dedupPreviousAndMergeTo_(suggestions) {
      const tabSugMap = new Map(suggestions.map(i => [ i.u, i ]));
      Completers.suggestions_ = Completers.suggestions_.filter(i => {
        const mapped = i.e === "search" ? void 0 : tabSugMap.get(i.u);
        mapped && mapped.r < i.r && (mapped.r = i.r);
        return !mapped;
      });
    },
    next_(newSugs, type) {
      let arr = Completers.suggestions_, num = newSugs.length;
      if (num > 0) {
        Completers.sugTypes_ |= type;
        Completers.suggestions_ = arr.length === 0 ? newSugs : arr.concat(newSugs);
        if (type === 8 /* SugType.search */) {
          autoSelect = true;
          maxResults -= num;
          matchedTotal += num;
        }
      }
      if (0 === --Completers.counter_) {
        arr = null;
        return Completers.finish_();
      }
    },
    finish_() {
      let suggestions = Completers.suggestions_;
      Completers.suggestions_ = null;
      suggestions.sort(Completers.rSortByRelevancy_);
      if (offset > 0) {
        suggestions = suggestions.slice(offset, offset + maxTotal);
        offset = 0;
      } else {
        suggestions.length > maxTotal && (suggestions.length = maxTotal);
      }
      completion_utils_1.RegExpCache_.words_ = completion_utils_1.RegExpCache_.starts_ = null;
      if (queryTerms.length > 0) {
        let s0 = queryTerms[0], s1 = completion_utils_1.shortenUrl(s0), cut = s0.length !== s1.length;
        if (cut || s0.endsWith("/") && s0.length > 1 && !s0.endsWith("//")) {
          cut && (queryTerms[0] = s1);
          completion_utils_1.RegExpCache_.fixParts_(queryTerms[0], cut);
        }
      }
      suggestions.forEach(completion_utils_1.prepareHTML_);
      const someMatches = suggestions.length > 0, newAutoSelect = autoSelect && someMatches, matched = matchedTotal, mayGoToAnotherMode = rawInput === ":", newMatchType = matchType < 0 /* MatchType.plain */ ? matchType !== -2 /* MatchType.searching_ */ || someMatches || mayGoToAnotherMode ? 0 /* MatchType.Default */ : 3 /* MatchType.searchWanted */ : showThoseInBlocklist ? queryTerms.length <= 0 || mayRawQueryChangeNextTime_ ? 0 /* MatchType.Default */ : someMatches ? 2 /* MatchType.someMatches */ : mayGoToAnotherMode ? 0 /* MatchType.Default */ : 1 /* MatchType.emptyResult */ : 0 /* MatchType.Default */ , realMode = rawMode, components = rawComponents, newSugTypes = newMatchType !== 2 /* MatchType.someMatches */ || mayGoToAnotherMode ? 0 /* SugType.Empty */ : Completers.sugTypes_, func = Completers.callback_;
      Completers.clearGlobals_();
      return func(suggestions, newAutoSelect, newMatchType, newSugTypes, matched, realMode, components);
    },
    clearGlobals_() {
      Completers.mostRecentQuery_ = Completers.callback_ = null;
      completion_utils_1.clearTabsInNormal_();
      completion_utils_1.setupQueryTerms(queryTerms = [], isForAddressBar = false, 0);
      rawInput = rawMode = rawQuery = rawMore = historyUrlToSkip = bookmarkUrlToSkip = "";
      completion_utils_1.RegExpCache_.parts_ = null;
      completion_utils_1.sync_maxScoreP_(3 /* RankingEnums.maximumScore */), completion_utils_1.sync_timeAgo_(0);
      matchType = Completers.sugTypes_ = otherFlags = maxResults = maxTotal = matchedTotal = 0;
      allExpectedTypes = 0 /* SugType.Empty */;
      rawComponents = 0 /* CompletersNS.QComponent.NONE */;
      autoSelect = false;
      mayRawQueryChangeNextTime_ = wantInCurrentWindow = false;
      showThoseInBlocklist = true;
    },
    getOffset_() {
      let ind, i, str = rawQuery;
      offset = 0;
      rawMore = "";
      if (str.length === 0 || (ind = (str = str.slice(-5)).lastIndexOf("+")) < 0 || ind !== 0 && str.charCodeAt(ind - 1) !== 32 /* kCharCode.space */) {
        return;
      }
      str = str.slice(ind);
      ind = rawQuery.length - str.length;
      if ((i = parseInt(str, 10)) >= 0 && "+" + i === str && i <= (ind > 0 ? 100 : 200)) {
        offset = i;
      } else if (str !== "+") {
        return;
      }
      rawQuery = rawQuery.slice(0, ind && ind - 1);
      rawMore = str;
      rawComponents |= 4 /* CompletersNS.QComponent.offset */;
    },
    rSortByRelevancy_(a, b) {
      return b.r - a.r;
    }
  }, knownCs = {
    __proto__: null,
    bookm: [ 1 /* SugType.kBookmark */ , bookmarkEngine ],
    domain: [ 16 /* SugType.domain */ , domainEngine ],
    history: [ 2 /* SugType.kHistory */ , historyEngine ],
    omni: [ 63 /* SugType.Full */ , searchEngine, domainEngine, historyEngine, bookmarkEngine, tabEngine ],
    search: [ 8 /* SugType.search */ , searchEngine ],
    tab: [ 4 /* SugType.tab */ , tabEngine ],
    window: [ 4 /* SugType.tab */ , windowEngine ]
  };
  const import2QuickActions_ = () => browser_1.import2("/background/quick_actions.js");
  store_1.Completion_.filter_ = (query, options, callback) => {
    query = query.trim();
    mayRawQueryChangeNextTime_ = false;
    // ":" quick actions (not single-letter modes like :b / :h / :t)
        if (query.startsWith(":") && !/^:[bBhHtTwWsSoOd](\s|$)/.test(query)) {
      import2QuickActions_().then(mod => {
        const q = query.slice(1).trim();
        // Full palette (not limited by vomnibar maxMatches); #list scrolls for the rest
                const max = 80;
        const rows = mod.matchQuickActions_(q, max);
        const sugs = rows.map((row, i) => {
          // text (t) must stay the short command so the bar stays clean when selecting
          const cat = row.cat || "Action";
          const iconType = typeof mod.qaIconType_ === "function" ? mod.qaIconType_(cat) : "search";
          const sug = new Suggestion("search", row.url, row.text, row.title, completion_utils_1.get2ndArg, 9 - i * .01);
          sug.textSplit = BgUtils_.escapeText_(row.text + "  \xb7  " + row.desc);
          sug.title = completion_utils_1.cutTitle(row.title, [ 0, Math.min(row.title.length, 56) ]);
          sug.label = cat;
          sug.p = ":";
          sug.n = 1;
          sug.e = iconType;
          return sug;
        });
        if (!sugs.length) {
          const sug = new Suggestion("search", "vimium://qa/a", ":a", "No match", completion_utils_1.get2ndArg, 1);
          sug.t = ":a";
          sug.textSplit = "Try :view :tab :hist :priv :win :nav :clip \xb7 or :gray :h1 :pin";
          sug.label = "Help";
          sug.p = ":";
          sugs.push(sug);
        }
        callback(sugs, true, 2 /* MatchType.someMatches */ , 8 /* SugType.search */ , sugs.length, "action", 2 /* CompletersNS.QComponent.query */);
      });
      return;
    }
    if (query && store_1.os_ > 1 /* kOS.MAX_NOT_WIN */ && (/^[A-Za-z]:[\\/]|^\\\\([\w$%.-]+([\\/]|$))?/.test(query) || query.slice(0, 5).toLowerCase() === "file:")) {
      ":/\\".includes(query[1]) && (query = (query[1] === ":" ? "" : "//") + query.slice(query[1] === ":" ? 0 : 2).replace(/\\+/g, "/"));
      query = query.replace(/\\/g, "/").toLowerCase();
      const start = query.indexOf("//") + 2;
      if (start >= 2 && start < query.length && query[start] !== "/") {
        const decodedHost = query.slice(start).split("/", 1)[0];
        if (decodedHost.includes("%")) {
          const host2 = BgUtils_.DecodeURLPart_(decodedHost);
          mayRawQueryChangeNextTime_ = host2 === decodedHost;
          query = query.slice(0, start) + host2 + query.slice(start + decodedHost.length);
        }
      }
    }
    rawInput = rawQuery = query && query.replace(BgUtils_.spacesRe_, " ");
    rawMode = "";
    rawComponents = 0 /* CompletersNS.QComponent.NONE */;
    Completers.getOffset_();
    query = rawQuery;
    queryTerms = query ? (query = query.length < 201 ? query : BgUtils_.unicodeRSubstring_(query, 0, 200 /* Consts.MaxCharsInQuery */).trimRight()).split(" ") : [];
    let maxChars = options.c | 0 || 128;
    maxChars && (
    // take CJK characters into consideration
    maxChars -= query.replace(/[\u2e80-\u2eff\u2f00-\u2fdf\u3000-\u303f\u31c0-\u31ef\u3200-\u9fbf\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef]/g, "aa").length - query.length);
    maxChars = Math.max(50 /* Consts.LowerBoundOfMaxChars */ , Math.min(maxChars, 320 /* Consts.UpperBoundOfMaxChars */));
    otherFlags = options.f;
    isForAddressBar = !!(otherFlags & 1 /* CompletersNS.QueryFlags.AddressBar */);
    maxTotal = maxResults = Math.min(Math.max(3, options.r | 0 || 10), 25);
    matchedTotal = 0;
    Completers.callback_ = callback;
    let arr = options.o === "bomni" ? (otherFlags |= 64 /* CompletersNS.QueryFlags.PreferBookmarks */ , 
    knownCs.omni) : knownCs[options.o], str = queryTerms.length >= 1 ? queryTerms[0] : "";
    let expectedTypes = options.t || 63 /* SugType.Full */ , allowedEngines = options.e || 63 /* SugType.Full */;
    arr === knownCs.tab && (wantInCurrentWindow = !!(otherFlags & 2 /* CompletersNS.QueryFlags.TabInCurrentWindow */));
    if (str.length === 2 && str[0] === ":") {
      str = str[1];
      const newArr = str === "b" ? knownCs.bookm : str === "h" ? knownCs.history : str === "t" || str === "T" || str === "w" || str === "W" ? (wantInCurrentWindow = str !== "t" && str !== "T", 
      otherFlags |= 0, otherFlags |= str === "T" ? 2048 /* CompletersNS.QueryFlags.IncognitoTabs */ : 0, 
      knownCs.tab) : str === "B" ? (otherFlags |= 64 /* CompletersNS.QueryFlags.PreferBookmarks */ , 
      knownCs.omni) : str === "H" ? (otherFlags |= 256 /* CompletersNS.QueryFlags.NoTabEngine */ , 
      knownCs.omni) : str === "d" ? knownCs.domain : str === "s" ? knownCs.search : str === "o" ? knownCs.omni : null;
      if (newArr) {
        arr = newArr;
        rawMode = queryTerms.shift();
        rawComponents |= 1 /* CompletersNS.QComponent.mode */;
        rawQuery = rawQuery.slice(3);
        allowedEngines = arr[0];
      }
    }
    if (queryTerms.length > 0 && ((str = queryTerms[0]).includes("\u3002") || str.includes("\uff1a")) && !mayRawQueryChangeNextTime_) {
      mayRawQueryChangeNextTime_ = queryTerms.length < 2;
      let newStr = parse_urls_1.fixCharsInUrl_(str, mayRawQueryChangeNextTime_);
      if (newStr !== str) {
        queryTerms[0] = newStr;
        rawQuery = newStr + rawQuery.slice(str.length);
        // if str looks like an filename extension, then generate a stricter `matchType`
        // - not so correct but the impact is quite little
                mayRawQueryChangeNextTime_ = mayRawQueryChangeNextTime_ && !/^[.\u3002]\w+([.\u3002]\w*)?$/.test(str);
      } else {
        mayRawQueryChangeNextTime_ = mayRawQueryChangeNextTime_ && str.includes("\uff1a") && !/\uff1a([^\/\d]|\d[^\0-\xff])/.test(str);
      }
    }
    showThoseInBlocklist = !browsing_data_manager_1.omniBlockList_ || !(otherFlags & 4096 /* CompletersNS.QueryFlags.NeverMasked */) && browsing_data_manager_1.BlockListFilter_.IsExpectingHidden_(queryTerms);
    allExpectedTypes = expectedTypes & allowedEngines;
    autoSelect = arr.length === 2;
    rawQuery && (rawComponents |= 2 /* CompletersNS.QComponent.query */);
    completion_utils_1.setupQueryTerms(queryTerms, isForAddressBar, maxChars);
    Completers.filter_(arr);
  };
  globalThis.Completers = Completers;
  Completers.knownCs = knownCs;
});