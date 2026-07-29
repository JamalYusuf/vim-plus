"use strict";
__filename = "background/completion_utils.js";
define([ "require", "exports", "./store", "./browser", "./utils", "./settings", "./normalize_urls", "./tools", "./browsing_data_manager" ], (require, exports, store_1, browser_1, BgUtils_, settings_, normalize_urls_1, tools_1, browsing_data_manager_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.requireNormalOrIncognitoTabs_ = exports.calcBestFaviconSource_only_cr_ = exports.sortBy0 = exports.shortenUrl = exports.highlight = exports.cutTitle = exports.prepareHTML_ = exports.get2ndArg = exports.ComputeRelevancy = exports.ComputeRecency = exports.ComputeWordRelevancy = exports.getWordRelevancy_ = exports.match2_ = exports.RegExpCache_ = exports.SearchKeywords_ = exports.MatchCacheManager_ = exports.sync_maxScoreP_ = exports.sync_timeAgo_ = exports.sync_queryTerms_ = exports.setupQueryTerms = exports.clearTabsInNormal_ = exports.maxScoreP_ = exports.tabsInNormal = void 0;
  BgUtils_ = __importStar(BgUtils_);
  settings_ = __importStar(settings_);
  const emptyScores_ = [ 0, 0 ];
  let tabsInNormal = null;
  exports.tabsInNormal = tabsInNormal;
  let cachedTabs_ = null;
  let tabType_ = 0 /* TabCacheType.none */;
  let allRecords_ = [];
  let queryTerms, isForAddressBar, maxChars;
  let usePlainText;
  let timeAgo_ = 0, maxScoreP_ = 3 /* RankingEnums.maximumScore */;
  exports.maxScoreP_ = maxScoreP_;
  const clearTabsInNormal_ = () => {
    exports.tabsInNormal = tabsInNormal = null;
  };
  exports.clearTabsInNormal_ = clearTabsInNormal_;
  const setupQueryTerms = (_newQueryArr, _newForAddressBar, _newMaxChars) => {
    queryTerms = _newQueryArr;
    isForAddressBar = _newForAddressBar;
    usePlainText = false;
    maxChars = _newMaxChars;
  };
  exports.setupQueryTerms = setupQueryTerms;
  const sync_queryTerms_ = _newQueryArr => {
    queryTerms = _newQueryArr;
  };
  exports.sync_queryTerms_ = sync_queryTerms_;
  const sync_timeAgo_ = _newTimeAgo => {
    timeAgo_ = _newTimeAgo;
  };
  exports.sync_timeAgo_ = sync_timeAgo_;
  const sync_maxScoreP_ = _newMaxScoreP => {
    exports.maxScoreP_ = maxScoreP_ = _newMaxScoreP;
  };
  exports.sync_maxScoreP_ = sync_maxScoreP_;
  exports.MatchCacheManager_ = {
    current_: null,
    newMatch_: null,
    timer_: 0,
    _tabTimer: 0,
    update_(showThoseInBlocklist) {
      let found = null, now = 0, full_query = queryTerms.join(" ");
      for (let records = allRecords_, ind = full_query ? records.length : 0; 0 <= --ind; ) {
        if (!records[ind].showThoseInBlockList_ && showThoseInBlocklist) {
          continue;
        }
        let q1 = records[ind].query_, i1 = 0, i2 = 0;
        for (;i1 < q1.length && i2 < queryTerms.length; i2++) {
          queryTerms[i2].includes(q1[i1]) && i1++;
        }
        if (i1 >= q1.length) {
          found = records[ind];
          break;
        }
      }
      exports.MatchCacheManager_.current_ = found;
      if (found && (store_1.omniPayload_.i < 200 || !found.history_ || found.history_.length > 1e3) && (now = performance.now()) - found.time_ < Math.max(300, store_1.omniPayload_.i * 1.3)) {
        exports.MatchCacheManager_.newMatch_ = found;
        found.query_ = queryTerms.slice(0);
      } else if (!full_query || found && full_query === found.query_.join(" ") || !(full_query.length > 4 || /\w\S|[^\x00-\x80]/.test(full_query))) {
        exports.MatchCacheManager_.newMatch_ = null;
      } else {
        exports.MatchCacheManager_.newMatch_ = {
          query_: queryTerms.slice(0),
          showThoseInBlockList_: showThoseInBlocklist,
          time_: now || performance.now(),
          history_: found && found.history_,
          bookmarks_: found && found.bookmarks_
        };
        allRecords_.push(exports.MatchCacheManager_.newMatch_);
        exports.MatchCacheManager_.timer_ || (exports.MatchCacheManager_.timer_ = setInterval(exports.MatchCacheManager_._didTimeout, 6e3 /* GlobalConsts.MatchCacheLifeTime */));
      }
    },
    _didTimeout() {
      let records = allRecords_, ind = -1, min_time = performance.now() - 5983;
      while (++ind < records.length && records[ind].time_ < min_time) {}
      ind++;
      if (ind < records.length) {
        records.splice(0, ind);
      } else {
        records.length = 0;
        clearInterval(exports.MatchCacheManager_.timer_);
        exports.MatchCacheManager_.timer_ = 0;
      }
    },
    clear_(type) {
      for (const record of allRecords_) {
        type < 2 /* MatchCacheType.kBookmarks */ ? record.history_ = null : type < 3 /* MatchCacheType.kTabs */ ? record.bookmarks_ = null : cachedTabs_ = null;
      }
    },
    cacheTabs_(tabs) {
      if (cachedTabs_ === tabs) {
        return;
      }
      if (exports.MatchCacheManager_._tabTimer) {
        clearTimeout(exports.MatchCacheManager_._tabTimer);
        exports.MatchCacheManager_._tabTimer = 0;
      }
      cachedTabs_ = tabs;
      if (tabs) {
        browsing_data_manager_1.normalizeUrlAndTitles_(tabs);
        exports.MatchCacheManager_._tabTimer = setTimeout(exports.MatchCacheManager_.cacheTabs_, 3e3 /* GlobalConsts.TabCacheLifeTime */ , null);
      }
    }
  };
  exports.SearchKeywords_ = {
    _searchKeywordMaxLength: 0,
    _timer: 0,
    isPrefix_() {
      const key = queryTerms[0], arr = store_1.searchEngines_.keywords;
      if (arr === null) {
        exports.SearchKeywords_._timer = exports.SearchKeywords_._timer || setTimeout(exports.SearchKeywords_._buildSearchKeywords, 67);
        return true;
      }
      return !(key.length >= exports.SearchKeywords_._searchKeywordMaxLength) && arr.includes("\n" + key);
    },
    /** Chrome omnibar-like: list engines whose keywords start with `prefix` (e.g. `!g`, `gh`). */
    matchingKeys_(prefix, limit) {
      if (!prefix || limit < 1) {
        return [];
      }
      const arr = store_1.searchEngines_.keywords;
      if (arr === null) {
        exports.SearchKeywords_._timer = exports.SearchKeywords_._timer || setTimeout(exports.SearchKeywords_._buildSearchKeywords, 67);
        exports.SearchKeywords_._buildSearchKeywords();
      }
      const keys = (store_1.searchEngines_.keywords || "").split("\n");
      const out = [];
      const lower = prefix.toLowerCase();
      for (const key of keys) {
        if (!key) {
          continue;
        }
        if (key.toLowerCase().startsWith(lower) || lower[0] === "!" && key.toLowerCase() === lower.slice(1)) {
          out.push(key);
          if (out.length >= limit) {
            break;
          }
        }
      }
      return out;
    },
    _buildSearchKeywords() {
      let arr = BgUtils_.keys_(store_1.searchEngines_.map).sort(), max = 0, last = "", dedup = [];
      for (let ind = arr.length; 0 <= --ind; ) {
        const key = arr[ind];
        if (!last.startsWith(key)) {
          let j = key.length;
          max = j > max ? j : max;
          last = key;
          dedup.push(key);
        }
      }
      store_1.searchEngines_.keywords = "\n" + dedup.join("\n");
      exports.SearchKeywords_._searchKeywordMaxLength = max;
      exports.SearchKeywords_._timer = 0;
    }
  };
  exports.RegExpCache_ = {
    parts_: null,
    starts_: null,
    words_: null,
    buildParts_() {
      const d = exports.RegExpCache_.parts_ = [];
      exports.RegExpCache_.starts_ = exports.RegExpCache_.words_ = null;
      for (const s of queryTerms) {
        d.push(new RegExp(BgUtils_.escapeAllForRe_(s), /** has lower */ s !== s.toUpperCase() && /** no upper */ s.toLowerCase() === s ? "i" : ""));
      }
    },
    buildOthers_() {
      const ss = exports.RegExpCache_.starts_ = [], ws = exports.RegExpCache_.words_ = [];
      for (const partRe of exports.RegExpCache_.parts_) {
        const start = "\\b" + partRe.source, flags = partRe.flags;
        ss.push(new RegExp(start, flags));
        ws.push(new RegExp(start + "\\b", flags));
      }
    },
    fixParts_(s, isShortUrl) {
      if (!exports.RegExpCache_.parts_) {
        return;
      }
      s = BgUtils_.escapeAllForRe_(isShortUrl ? s : s.slice(0, -1));
      exports.RegExpCache_.parts_[0] = new RegExp(isShortUrl ? s : s + "(?:/|$)", exports.RegExpCache_.parts_[0].flags);
    }
  };
  const match2_ = (s1, s2) => {
    for (let word of exports.RegExpCache_.parts_) {
      if (!word.test(s1) && !word.test(s2)) {
        return false;
      }
    }
    return true;
  };
  exports.match2_ = match2_;
  const getWordRelevancy_ = (url, title) => {
    let titleCount = 0, titleScore = 0, urlCount = 0, urlScore = 0, useTitle = !!title;
    exports.RegExpCache_.starts_ || exports.RegExpCache_.buildOthers_();
    for (let term = 0, len = queryTerms.length; term < len; term++) {
      let a = scoreTerm_(term, url);
      urlScore += a[0];
      urlCount += a[1];
      if (useTitle) {
        a = scoreTerm_(term, title);
        titleScore += a[0];
        titleCount += a[1];
      }
    }
    urlScore = urlScore / maxScoreP_ * normalizeDifference_(urlCount, url.length);
    if (titleCount === 0) {
      return title ? urlScore / 2 : urlScore;
    }
    titleScore = titleScore / maxScoreP_ * normalizeDifference_(titleCount, title.length);
    return urlScore < titleScore ? titleScore : (urlScore + titleScore) / 2;
  };
  exports.getWordRelevancy_ = getWordRelevancy_;
  const normalizeDifference_ = (a, b) => a < b ? a / b : b / a;
  const scoreTerm_ = (term, str) => {
    let count = 0, score = 0;
    count = str.split(exports.RegExpCache_.parts_[term]).length;
    if (count < 1) {
      return emptyScores_;
    }
    score = 1 /* RankingEnums.anywhere */;
    if (exports.RegExpCache_.starts_[term].test(str)) {
      score += 1 /* RankingEnums.startOfWord */;
      exports.RegExpCache_.words_[term].test(str) && (score += 1 /* RankingEnums.wholeWord */);
    }
    return [ score, (count - 1) * queryTerms[term].length ];
  };
  const ComputeWordRelevancy = sug => exports.getWordRelevancy_(sug.t, sug.title);
  exports.ComputeWordRelevancy = ComputeWordRelevancy;
  const ComputeRecency = lastAccessedTime => {
    const score = (lastAccessedTime - timeAgo_) / 18144e5 /* TimeEnums.timeCalibrator */;
    return score < 0 ? 0 : score < 1 ? score * score * .666667 /* RankingEnums.recCalibrator */ : score < 1.000165 /* TimeEnums.futureTimeTolerance */ ? .666446 /* TimeEnums.futureTimeScore */ : 0;
  };
  exports.ComputeRecency = ComputeRecency;
  const ComputeRelevancy = (text, title, lastVisitTime) => {
    const recencyScore = exports.ComputeRecency(lastVisitTime), wordRelevancy = exports.getWordRelevancy_(text, title);
    return recencyScore <= wordRelevancy ? wordRelevancy : (wordRelevancy + recencyScore) / 2;
  };
  exports.ComputeRelevancy = ComputeRelevancy;
  const get2ndArg = (_s, score) => score;
  exports.get2ndArg = get2ndArg;
  const prepareHTML_ = sug => {
    isForAddressBar || sug.v !== void 0 || (sug.v = exports.calcBestFaviconSource_only_cr_(sug.u));
    if (sug.textSplit != null) {
      sug.t === sug.u && (sug.t = "");
      return;
    }
    sug.title = exports.cutTitle(sug.title);
    const text = sug.t;
    let range, str = normalize_urls_1.decodeFileURL_(text, sug.u);
    if (str.length !== text.length) {
      range =  getMatchRangesWithOffset(text, str[0] === "\\" ? 5 : text.charAt(7) === "/" && text.substr(9, 3).toLowerCase() === "%3a" ? 10 : 8);
    } else {
      str = exports.shortenUrl(text);
      range = getMatchRanges(str);
    }
    sug.t = text.length !== sug.u.length ? str : "";
    sug.textSplit =  cutUrl(str, range, text.length - str.length, isForAddressBar ? maxChars - 13 - Math.min(sug.title.length, 40) : maxChars);
  };
  exports.prepareHTML_ = prepareHTML_;
  const cutTitle = (title, knownRange) => {
    let cut = title.length > maxChars + 40;
    cut && (title = BgUtils_.unicodeRSubstring_(title, 0, maxChars + 39));
    return exports.highlight(cut ? title + "\u2026" : title, knownRange || getMatchRanges(title));
  };
  exports.cutTitle = cutTitle;
  const highlight = (str, ranges) => {
    if (usePlainText) {
      return str;
    }
    if (ranges.length === 0) {
      return BgUtils_.escapeText_(str);
    }
    let out = "", end = 0;
    for (let _i = 0; _i < ranges.length; _i += 2) {
      const start = ranges[_i], end2 = ranges[_i + 1];
      if (start >= str.length) {
        continue;
      }
      out += BgUtils_.escapeText_(str.slice(end, start));
      out += "<match>";
      out += BgUtils_.escapeText_(str.slice(start, end2));
      out += "</match>";
      end = end2;
    }
    return out + BgUtils_.escapeText_(str.slice(end));
  };
  exports.highlight = highlight;
  const shortenUrl = url => {
    const i = BgUtils_.IsURLHttp_(url);
    return !i || i >= url.length ? url : url.slice(i, url.length - +(url.endsWith("/") && !url.endsWith("://")));
  };
  exports.shortenUrl = shortenUrl;
  const getMatchRangesWithOffset = (str, offset1) => {
    const range = getMatchRanges(str);
    for (let i = 0; i < range.length; ) {
      if (range[i + 1] <= offset1) {
        range.splice(i, 2);
      } else {
        range[i] = Math.max(range[i] - offset1, 0);
        range[i + 1] -= offset1;
        i += 2;
      }
    }
    return range;
  };
  const getMatchRanges = str => {
    const ranges = [];
    for (let i = 0, len = queryTerms.length; i < len; i++) {
      let matchedEnd, index = 0, textPosition = 0;
      const splits = str.split(exports.RegExpCache_.parts_[i]), last = splits.length - 1, tl = queryTerms[i].length;
      for (;index < last; index++, textPosition = matchedEnd) {
        matchedEnd = (textPosition += splits[index].length) + tl;
        ranges.push([ textPosition, matchedEnd ]);
      }
    }
    if (ranges.length === 0) {
      return ranges;
    }
    if (ranges.length === 1) {
      return ranges[0];
    }
    ranges.sort(exports.sortBy0);
    const mergedRanges = ranges[0];
    for (let i = 1, j = 1, len = ranges.length; j < len; j++) {
      const range = ranges[j];
      if (mergedRanges[i] >= range[0]) {
        mergedRanges[i] < range[1] && (mergedRanges[i] = range[1]);
      } else {
        mergedRanges.push(range[0], range[1]);
        i += 2;
      }
    }
    return mergedRanges;
  };
  const sortBy0 = (a, b) => a[0] - b[0];
  exports.sortBy0 = sortBy0;
  // deltaLen may be: 0, 1, 7/8/9
    const cutUrl = (str, ranges, deltaLen, maxLen) => {
    let out = "", end = str.length, cutStart = end, slice = "";
    end <= maxLen || (deltaLen > 1 ? cutStart = str.indexOf("/") + 1 || end : (cutStart = str.indexOf(":")) < 0 ? cutStart = end : BgUtils_.protocolRe_.test(str.slice(0, cutStart + 3).toLowerCase()) ? cutStart = str.indexOf("/", cutStart + 4) + 1 || end : cutStart += 22);
    if (cutStart < end && ranges.length) {
      for (let i = ranges.length, start = end + 8; (i -= 2) > -4 && start >= cutStart; start = i < 0 ? 0 : ranges[i]) {
        const subEndInLeft = i < 0 ? cutStart : ranges[i + 1], delta = start - 20 - Math.max(subEndInLeft, cutStart);
        if (delta > 0) {
          end -= delta;
          if (end <= maxLen) {
            cutStart = subEndInLeft + (maxLen - end);
            break;
          }
        }
      }
    }
    end = 0;
    for (let i = 0; end < maxLen && i < ranges.length; i += 2) {
      const start = ranges[i], temp = Math.max(end, cutStart), delta = start - 20 - temp;
      if (delta > 0) {
        maxLen += delta;
        slice = BgUtils_.unicodeRSubstring_(str, end, temp + 11);
        out += usePlainText ? slice : BgUtils_.escapeText_(slice);
        out += "\u2026";
        slice = BgUtils_.unicodeLSubstring_(str, start - 8, start);
        out += usePlainText ? slice : BgUtils_.escapeText_(slice);
      } else if (end < start) {
        slice = str.slice(end, start);
        out += usePlainText ? slice : BgUtils_.escapeText_(slice);
      }
      end = ranges[i + 1];
      slice = str.slice(start, end);
      if (usePlainText) {
        out += slice;
        continue;
      }
      out += "<match>";
      out += BgUtils_.escapeText_(slice);
      out += "</match>";
    }
    slice = str.length <= maxLen ? str.slice(end) : BgUtils_.unicodeRSubstring_(str, end, maxLen - 1 > end ? maxLen - 1 : end + 10);
    return out + (usePlainText ? slice : BgUtils_.escapeText_(slice)) + (str.length <= maxLen ? "" : "\u2026");
  };
  exports.calcBestFaviconSource_only_cr_ = url => {
    const pos0 = browsing_data_manager_1.HistoryManager_.sorted_ && url.startsWith("http") ? browsing_data_manager_1.HistoryManager_.binarySearch_(url) : -1, mostHigh = pos0 < 0 ? ~pos0 - 1 : pos0, arr = mostHigh < 0 ? [] : store_1.historyCache_.history_;
    let slashInd = url.indexOf(":") + 3, low = 0, left = 0, u = "", e = "", m = 0, h = 0;
    for (;low <= mostHigh && (slashInd = url[slashInd] === "/" ? slashInd + 1 : url.indexOf("/", slashInd + 1) + (left ? 0 : 1)) > 0; left = slashInd) {
      for (u = url.slice(left, slashInd), h = mostHigh; low <= h; ) {
        m = low + h >>> 1;
        e = arr[m].u.slice(left);
        if (e > u) {
          h = m - 1;
        } else {
          if (e === u) {
            return left ? arr[m].u : "";
          }
          low = m + 1;
        }
      }
      if (low <= mostHigh && left) {
        u = arr[low].u;
        if (u[slashInd] === "/" && u.length <= ++slashInd) {
          return u;
        }
      }
    }
    return "";
  };
  const requireNormalOrIncognitoTabs_ = (wantInCurrentWindow, flags, func, query, __tabs) => {
    let wndIncognito = store_1.curIncognito_;
    {
      exports.tabsInNormal = tabsInNormal = wndIncognito !== 2 /* IncognitoType.true */ && !(flags & 2048 /* CompletersNS.QueryFlags.IncognitoTabs */);
      let newType = (tabsInNormal ? 2 /* TabCacheType.onlyNormal */ : 0) | (wantInCurrentWindow ? 1 /* TabCacheType.currentWindow */ : 0);
      tabType_ !== newType && (cachedTabs_ = null, tabType_ = newType);
      const tabs = __tabs || cachedTabs_;
      exports.MatchCacheManager_.cacheTabs_(tabs);
      if (tabs) {
        func(query, tabs);
      } else {
        const cb = func.bind(null, query);
        wantInCurrentWindow ? (flags & 512 /* CompletersNS.QueryFlags.EvenHiddenTabs */ ? browser_1.getCurTabs : browser_1.getCurShownTabs_)(cb) : browser_1.Tabs_.query({}, cb);
      }
    }
  };
  exports.requireNormalOrIncognitoTabs_ = requireNormalOrIncognitoTabs_;
  tools_1.TabRecency_.onWndChange_ = () => {
    cachedTabs_ && (tabType_ & 1 /* TabCacheType.currentWindow */ || !(tabType_ & 2 /* TabCacheType.onlyNormal */) !== (store_1.curIncognito_ === 2 /* IncognitoType.true */)) && 
    // ignore IncognitoType.mayFalse on old Chrome - the line below does not harm
    exports.MatchCacheManager_.cacheTabs_(null);
  };
  settings_.ready_.then(() => {
    settings_.postUpdate_("searchEngines", null);
  });
  globalThis.MatchCacheManager = exports.MatchCacheManager_;
});