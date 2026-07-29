"use strict";
__filename = "background/filter_tabs.js";
define([ "require", "exports", "./store", "./utils", "./browser", "./ports", "./exclusions", "./run_commands" ], (require, exports, store_1, BgUtils_, browser_1, ports_1, Exclusions, run_commands_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.findLastVisibleWindow_ = exports.sortTabsByCond_ = exports.filterTabsByCond_ = exports.testBoolFilter_ = exports.mayRequireActiveTab = exports.getNecessaryCurTabInfo = exports.getTabsIfRepeat_ = exports.getNearArrIndex = exports.findNearShownTab_ = exports.tryLastActiveTab_ = exports.onShownTabsIfRepeat_ = exports.getTabRange = void 0;
  BgUtils_ = __importStar(BgUtils_);
  Exclusions = __importStar(Exclusions);
  const getTabRange = (current, total, countToAutoLimitBeforeScale, /** must be positive */ extraCount) => innerGetTabRange(current, total, countToAutoLimitBeforeScale, store_1.cRepeat, extraCount, store_1.get_cOptions().limited, store_1.get_cOptions().filter);
  exports.getTabRange = getTabRange;
  const innerGetTabRange = (current, total, countToAutoLimitBeforeScale, count, extraCount, limited, filter) => {
    const dir = count > 0;
    extraCount && (count += dir ? extraCount : -extraCount);
    const end = current + count;
    return end <= total && end > -2 ? dir ? [ current, end ] : [ end + 1, current + 1 ] : limited === false || (limited == null || limited === "auto") && (Math.abs(count) < (countToAutoLimitBeforeScale || total) * 2 /* GlobalConsts.ThresholdToAutoLimitTabOperation */ || count < 10 || filter && limited == null) ? Math.abs(count) < total ? dir ? [ total - count, total ] : [ 0, -count ] : [ 0, total ] : dir ? [ current, total ] : [ 0, current + 1 ];
  };
  const onShownTabsIfRepeat_ = (allInRange, noSelf, callback, curOrTabs, resolve, isUsable) => {
    const onTabs = shownTabs => {
      if (!shownTabs || !shownTabs.length) {
        resolve(0);
        return browser_1.runtimeError_();
      }
      let ind = browser_1.selectIndexFrom(shownTabs);
      const [start, end] = limitCount ? [ 0, shownTabs.length ] : exports.getTabRange(ind, shownTabs.length, 0, noSelf);
      if (limitCount) {
        run_commands_1.overrideCmdOptions({
          limited: false
        }, true);
        run_commands_1.overrideOption("$limit", store_1.cRepeat);
        store_1.set_cRepeat(store_1.cRepeat > 0 ? 9999 /* GlobalConsts.CommandCountLimit */ : -9999 /* GlobalConsts.CommandCountLimit */);
      }
      callback(shownTabs, allInRange ? [ start, ind, end ] : [ ind + 1 === end || store_1.cRepeat > 0 && start !== ind ? start : end - 1, ind, end ], resolve);
    };
    const filter = store_1.get_cOptions().filter;
    const limitCount = filter && /(^|[&+])limit(ed)?=count\b/.test(filter + "");
    if (curOrTabs) {
      if (curOrTabs.length === 0 || Math.abs(store_1.cRepeat) > 1 || limitCount) {
        if (curOrTabs.length === 0 || limitCount) {
          const windowId = curOrTabs[0] ? curOrTabs[0].windowId : store_1.curWndId_;
          (windowId >= 0 ? browser_1.Q_(browser_1.Windows_.get, windowId, {
            populate: true
          }) : browser_1.Q_(browser_1.getCurWnd, true)).then(wnd => {
            onTabs(wnd ? wnd.tabs : []);
          });
        } else {
          onTabs(curOrTabs);
        }
      } else {
        noSelf ? curOrTabs[0].index + store_1.cRepeat < 0 ? browser_1.getCurShownTabs_(onTabs) : browser_1.Tabs_.query({
          windowId: curOrTabs[0].windowId,
          index: curOrTabs[0].index + store_1.cRepeat
        }, theOther => {
          theOther && theOther.length && (isUsable === true || browser_1.isNotHidden_(theOther[0]) && (!isUsable || isUsable(theOther[0]))) && (!filter || exports.filterTabsByCond_(curOrTabs[0], theOther, filter).length > 0) ? store_1.cRepeat < 0 ? callback([ theOther[0], curOrTabs[0] ], [ 0, 1, allInRange ? 2 : 1 ], resolve) : callback([ curOrTabs[0], theOther[0] ], [ allInRange ? 0 : 1, 0, 2 ], resolve) : browser_1.getCurShownTabs_(onTabs);
          return browser_1.runtimeError_();
        }) : callback(curOrTabs, [ 0, 0, 1 ], resolve);
      }
    } else {
      resolve(0);
    }
  };
  exports.onShownTabsIfRepeat_ = onShownTabsIfRepeat_;
  const tryLastActiveTab_ = () => {
    let indMax = 0, tabId = -1;
    store_1.recencyForTab_.forEach((v, i) => {
      v > indMax && i !== store_1.curTabId_ && (indMax = v, tabId = i);
    });
    return tabId;
  };
  exports.tryLastActiveTab_ = tryLastActiveTab_;
  const findNearShownTab_ = (curTab, rightSide, known) => {
    let nearIndex;
    return curTab && (curTab.index || rightSide) ? known && known[nearIndex = Math.max(known.indexOf(curTab), 0) + (rightSide ? 1 : -1)] && browser_1.isNotHidden_(known[nearIndex]) ? Promise.resolve(known[nearIndex]) : browser_1.Q_(browser_1.Tabs_.query, {
      windowId: curTab.windowId,
      index: curTab.index + (rightSide ? 1 : -1)
    }).then(nearTabs => {
      if (!nearTabs || !nearTabs[0]) {
        return null;
      }
      if (browser_1.isNotHidden_(nearTabs[0])) {
        return nearTabs[0];
      }
      return (known && known.length > 2 ? Promise.resolve(known.filter(browser_1.isNotHidden_)) : browser_1.Q_(browser_1.getCurShownTabs_)).then(tabs => tabs && tabs.length ? tabs[exports.getNearArrIndex(tabs, curTab.index + (rightSide ? 1 : -1), rightSide)] : null);
    }) : Promise.resolve(null);
  };
  exports.findNearShownTab_ = findNearShownTab_;
  const getNearArrIndex = (tabs, tabIndex, goRight) => {
    for (let i = tabs.length > 1 ? 0 : 1; i < tabs.length; i++) {
      if (tabs[i].index >= tabIndex) {
        return tabs[i].index === tabIndex || goRight ? i : i > 0 ? i - 1 : 0;
      }
    }
    return tabs.length - 1;
  };
  exports.getNearArrIndex = getNearArrIndex;
  /** @argument count may be 0 */  const getTabsIfRepeat_ = (count, callback_r) => {
    Math.abs(count) === 1 ? browser_1.getCurTab(cur => {
      const newInd = cur[0].index + count;
      newInd >= 0 ? browser_1.Tabs_.query({
        windowId: cur[0].windowId,
        index: newInd
      }, other => {
        other && other[0] ? callback_r(count > 0 ? [ cur[0], other[0] ] : [ other[0], cur[0] ]) : browser_1.getCurTabs(callback_r);
        return browser_1.runtimeError_();
      }) : browser_1.getCurTabs(callback_r);
    }) : browser_1.getCurTabs(callback_r);
  };
  exports.getTabsIfRepeat_ = getTabsIfRepeat_;
  const getNecessaryCurTabInfo = filter => {
    if (!filter) {
      return null;
    }
    const wanted = exports.mayRequireActiveTab(filter);
    return wanted > 2 ? browser_1.Q_(browser_1.getCurTab).then(tabs => tabs && tabs[0] || null) : wanted ? Promise.resolve(ports_1.getPortUrl_(null, wanted > 1)).then(url => url ? {
      url
    } : null) : null;
  };
  exports.getNecessaryCurTabInfo = getNecessaryCurTabInfo;
  const mayRequireActiveTab = filter => {
    let ret = 0;
    for (const item of (filter + "").split(/[&+]/)) {
      const rawKey = item.split("=", 1)[0], key = rawKey.includes(".") ? "" : rawKey || item;
      const val = item.slice(key ? key.length + 1 : 0);
      if (key && val === "same" && key !== "hidden" && !key.startsWith("discard")) {
        return 3;
      }
      if (!val && key) {
        if (key.startsWith("title") || key === "group") {
          return 3;
        }
        ret = key === "hash" ? 2 : ret || (key === "host" || key === "url" ? 1 : 0);
      }
    }
    return ret;
  };
  exports.mayRequireActiveTab = mayRequireActiveTab;
  const parseBool = (val, only) => {
    val = val && val.toLowerCase();
    return val === "" || val === "1" || val === "true" ? !only || null : val === "only" || val !== "0" && val !== "false" && null;
  };
  const testBoolFilter_ = (filter, key, only) => {
    const item = filter ? (filter + "").split(/[&+]/).find(i => i.startsWith(key)) : null;
    const val = item ? item.slice(1 + key.length) : null;
    return val !== null ? parseBool(val, only) : null;
  };
  exports.testBoolFilter_ = testBoolFilter_;
  const makeStringMatcher = (val, str) => {
    const lastSlash = val && val[0] === "/" ? val.lastIndexOf("/") : 0;
    const strRe = lastSlash > 1 && /^[a-z]+$/.test(val.slice(lastSlash + 1)) ? BgUtils_.makeRegexp_(val.slice(1, lastSlash), val.slice(lastSlash + 1).replace(/g/g, ""), 0) : null;
    const lower = !strRe && !!str && str.toLowerCase();
    return strRe ? (str = null, x => strRe.test(x || "")) : str ? str === lower ? x => !!x && x.toLowerCase().includes(lower) : x => !!x && x.includes(str) : null;
  };
  const filterTabsByCond_ = (activeTab, tabs, filter, extraOutputs) => {
    var _a;
    let limit = 0, min = 0, max = 0;
    const conditions = [];
    for (let item of (filter + "").split(/[&+]/)) {
      const rawKey = item.split("=", 1)[0], directHost = rawKey.includes("."), neg = !directHost && rawKey.endsWith("!");
      const key = directHost ? "" : (neg ? rawKey.slice(0, -1) : rawKey) || item;
      const rawVal = item.slice(directHost ? 0 : rawKey.length + (item.charAt(rawKey.length + 1) === "=" ? 2 : 1));
      const val = rawVal && BgUtils_.DecodeURLPart_(rawVal);
      const wantSame = val === "same" || val === "cur" || val === "current";
      let cond = null;
      switch (key) {
       case "title":
       case "title*":
        const titleMatcher = makeStringMatcher(val, val || activeTab && activeTab.title);
        cond = titleMatcher ? tab => titleMatcher(tab.title) : null;
        break;

       case "url":
       case "urlhash":
       case "url+hash":
       case "url-hash":
       case "hash":
        let matcher = null;
        if (key === "url" && val) {
          matcher = Exclusions.createSimpleUrlMatcher_(val);
        } else {
          const url = activeTab ? browser_1.getTabUrl(activeTab) : null;
          const useHash = key.includes("hash");
          matcher = url ? Exclusions.createSimpleUrlMatcher_(":" + (useHash ? url : url.split("#", 1)[0])) : null;
        }
        const smartCase = !!matcher && matcher.t === 2 /* kMatchUrl.StringPrefix */ && val === val.toLowerCase();
        cond = matcher ? tab => Exclusions.matchSimply_(matcher, smartCase ? browser_1.getTabUrl(tab).toLowerCase() : browser_1.getTabUrl(tab)) : cond;
        break;

       case "title+url":
        const strMatcher = val && makeStringMatcher(val, val);
        cond = strMatcher ? tab => strMatcher(tab.title) || strMatcher(browser_1.getTabUrl(tab)) : cond;
        break;

       case "host":
       case "":
        const host = val || (key && activeTab ? (_a = BgUtils_.safeParseURL_(browser_1.getTabUrl(activeTab))) === null || _a === void 0 ? void 0 : _a.host : "");
        cond = host ? tab => {
          var _a;
          return host === ((_a = BgUtils_.safeParseURL_(browser_1.getTabUrl(tab))) === null || _a === void 0 ? void 0 : _a.host);
        } : cond;
        break;

       case "active":
        const active = parseBool(val, 1);
        cond = active != null ? tab => tab.active === active : cond;
        break;

       case "new":
       case "old":
       case "visited":
        const visited = parseBool(val) === (key !== "new");
        cond = tab => store_1.recencyForTab_.has(tab.id) === visited;

       case "discarded":
       case "discard":
        const discarded = !wantSame && parseBool(val, 1);
        cond = discarded != null ? tab => tab.discarded === discarded : cond;
        break;

       case "group":
        const group = val || (activeTab ? browser_1.getGroupId(activeTab) != null ? browser_1.getGroupId(activeTab) + "" : "" : null);
        cond = group != null ? tab => {
          var _a;
          return ((_a = browser_1.getGroupId(tab)) !== null && _a !== void 0 ? _a : "") + "" === group;
        } : cond;
        break;

       case "hidden":
        const hidden = null;
        cond = hidden != null ? tab => browser_1.isNotHidden_(tab) !== hidden : cond;
        break;

       case "highlight":
       case "highlighted":
        const highlighted = wantSame ? activeTab ? activeTab.highlighted : null : parseBool(val);
        cond = highlighted != null ? tab => tab.highlighted === highlighted : cond;
        break;

       case "incognito":
        const incognito = wantSame ? activeTab ? activeTab.incognito : null : parseBool(val);
        cond = incognito != null ? tab => tab.incognito === incognito : cond;
        break;

       case "pinned":
        const pinned = wantSame ? activeTab ? activeTab.pinned : null : parseBool(val, 1);
        cond = pinned != null ? tab => tab.pinned === pinned : cond;
        break;

       case "mute":
       case "muted":
        {
          const muted = wantSame ? activeTab ? browser_1.isTabMuted(activeTab) : null : parseBool(val);
          cond = muted != null ? tab => browser_1.isTabMuted(tab) === muted : cond;
        }
        break;

       case "audible":
       case "audio":
        {
          const audible = wantSame ? activeTab ? activeTab.audible : null : parseBool(val);
          cond = audible != null ? tab => tab.audible === audible : cond;
        }
        break;

       case "min":
       case "max":
       case "limit":
       case "limited":
        const intVal = val === "count" ? store_1.get_cOptions().$limit || store_1.cRepeat : parseInt(val) || 0;
        key === "min" ? min = intVal : key === "max" ? max = intVal : limit = intVal || 1;
        cond = () => true;
        break;

       default:
        break;
      }
      cond && conditions.push([ cond, neg ]);
    }
    extraOutputs && (extraOutputs.known = conditions.length > 0);
    if (conditions.length === 0) {
      return tabs.slice(0);
    }
    const oriTabs = tabs;
    let newTabs = tabs.filter(tab => {
      for (const item of conditions) {
        if (item[0](tab) === item[1]) {
          return false;
        }
      }
      return true;
    });
    const newLen = newTabs.length;
    if (!newLen || min > 0 && newLen < min || max > 0 && newLen > max) {
      store_1.get_cOptions() && store_1.get_cOptions().$else || ports_1.showHUD(newLen ? `${newLen} tabs found but expect ${newLen < min ? min : max}` : "No tabs matched the filter parameter");
      return [];
    }
    if (limit) {
      let oriCurInd = activeTab ? oriTabs.indexOf(activeTab) : -1;
      if (oriCurInd < 0) {
        const cur = activeTab ? activeTab.id : store_1.curTabId_;
        oriCurInd = oriTabs.findIndex(i => i.id === cur);
      }
      if (oriCurInd >= 0) {
        const near = newTabs.findIndex(i => oriTabs.indexOf(i) >= oriCurInd);
        const doesInsert = near >= 0 && oriTabs.indexOf(newTabs[near]) > oriCurInd;
        doesInsert && newTabs.splice(near, 0, null);
        const range = innerGetTabRange(near >= 0 ? near : newLen - 1, newLen, 0, store_1.cRepeat > 0 ? limit : -limit, doesInsert ? 1 : 0, false);
        newTabs = newTabs.slice(range[0], range[1]);
        doesInsert && (newTabs = newTabs.filter(i => !!i));
      } else {
        newTabs = limit > 0 ? newTabs.slice(0, limit) : newTabs.slice(-limit);
      }
    }
    return newTabs;
  };
  exports.filterTabsByCond_ = filterTabsByCond_;
  const sortTabsByCond_ = (allTabs, sortOpt) => {
    const refreshInd = (i, ind) => {
      i.ind = ind;
    };
    const compareStr = (a, b) => a < b ? -1 : a > b ? 1 : 0;
    const list = allTabs.map((i, ind) => ({
      tab: i,
      ind,
      time: null,
      rhost: null,
      group: browser_1.getGroupId(i),
      pinned: i.pinned
    }));
    let scale, work = -1, changed = false;
    for (let key of (sortOpt instanceof Array ? sortOpt.slice(0) : (sortOpt === true ? "time" : sortOpt + "").split(/[, ]+/g)).reverse()) {
      scale = key[0] === "r" && key[1] !== "e" || key[0] === "-" ? (key = key.slice(1), 
      -1) : 1;
      if (key.includes("time") && !key.includes("creat") || key.includes("recen")) {
        list[0].time == null && list.forEach(i => {
          const id = i.tab.id, recency = store_1.recencyForTab_.get(id);
          i.time = id === store_1.curTabId_ ? 1 : recency != null ? recency : id + 2;
        });
        work = 1;
      } else if (key.startsWith("host") || key === "url") {
        list[0].rhost || list.forEach(i => {
          const url = i.tab.url, start = url.indexOf("://") + 3, end = start > 3 ? url.indexOf("/", start) : 0;
          if (end < start) {
            i.rhost = url;
            return;
          }
          const host = url.slice(start, end), colon = host.lastIndexOf(":");
          const isIPv6 = colon > 0 && host.lastIndexOf(":", colon - 1) > 0;
          i.rhost = isIPv6 ? host : host.slice(0, colon > 0 ? colon : host.length).split(".").reverse().join(".") + (colon > 0 ? " " + host.slice(1) : "");
        });
        work = key === "url" ? 3 : 2;
      } else {
        work = key === "title" ? 4 : key.includes("creat") || key === "id" ? 5 : key === "window" ? 6 : key === "index" ? 7 : key === "reverse" ? (scale = -1, 
        7) : -1;
      }
      if (work < 0) {
        continue;
      }
      list.sort((a, b) => (work === 1 ? a.time - b.time : work < 4 ? compareStr(a.rhost, b.rhost) || (work === 3 ? compareStr(a.tab.url, b.tab.url) : 0) : work === 4 ? compareStr(a.tab.title, b.tab.title) : work === 5 ? a.tab.id - b.tab.id : work === 6 ? a.tab.windowId - b.tab.windowId : a.ind - b.ind) * scale || (a.group != null ? b.group != null ? 0 : -1 : b.group != null ? 1 : 0) || a.ind - b.ind);
      list.forEach(refreshInd);
      changed = true;
    }
    if (changed && list.some(i => i.group != null)) {
      const group_min_index = new Map;
      for (const {group, ind} of list) {
        group == null || group_min_index.has(group) || group_min_index.set(group, ind);
      }
      list.sort((a, b) => {
        const ind_a = a.group != null ? group_min_index.get(a.group) : a.ind;
        const ind_b = b.group != null ? group_min_index.get(b.group) : b.ind;
        return ind_a - ind_b || a.ind - b.ind;
      });
    }
    if (changed) {
      list.forEach(refreshInd);
      list.sort((a, b) => a.pinned !== b.pinned ? a.pinned ? -1 : 1 : a.ind - b.ind);
    }
    return changed ? list.map(i => i.tab) : allTabs;
  };
  exports.sortTabsByCond_ = sortTabsByCond_;
  const findLastVisibleWindow_ = async (wndType, alsoCur, incognito, curWndId, noMin) => {
    const filter = wnd => (!wndType || wnd.type === wndType) && (incognito == null || wnd.incognito === incognito) && (noMin || wnd.state !== "minimized");
    if (store_1.lastWndId_ >= 0) {
      const wnd = await browser_1.Q_(browser_1.Windows_.get, store_1.lastWndId_);
      if (wnd && filter(wnd)) {
        return wnd;
      }
      store_1.set_lastWndId_(-1 /* GlobalConsts.WndIdNone */);
    }
    const otherTabs = [];
    {
      const curIds = (await browser_1.Q_(browser_1.getCurTabs) || []).map(tab => tab.id);
      curIds.push(store_1.curTabId_);
      store_1.recencyForTab_.forEach((time, tabId) => {
        curIds.includes(tabId) || otherTabs.push([ tabId, time ]);
      });
      otherTabs.sort((i, j) => j[1] - i[1]);
    }
    if (otherTabs.length > 0) {
      let tab = await browser_1.Qs_(browser_1.Tabs_.get, otherTabs[0][0]);
      if (!tab) {
        const lastActive = otherTabs.find(i => store_1.framesForTab_.has(i[0]));
        tab = lastActive && await browser_1.Qs_(browser_1.Tabs_.get, lastActive[0]);
      }
      const wnd = tab && await browser_1.Qs_(browser_1.Windows_.get, tab.windowId);
      if (wnd && filter(wnd)) {
        return wnd;
      }
    }
    const allWnds = await browser_1.Qs_(browser_1.Windows_.getAll), matches = allWnds.filter(filter);
    const otherWnds = matches.filter(i => i.id !== curWndId);
    otherWnds.sort((i, j) => j.id - i.id);
    const wnd2 = otherWnds.length > 0 ? otherWnds[0] : null;
    if (wnd2) {
      return wnd2;
    }
    if (alsoCur) {
      return allWnds.find(w => w.id === curWndId) || allWnds.find(w => w.focused) || null;
    }
    return [ matches, allWnds.find(i => i.id === curWndId) ];
  };
  exports.findLastVisibleWindow_ = findLastVisibleWindow_;
});