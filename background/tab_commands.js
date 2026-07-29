"use strict";
__filename = "background/tab_commands.js";
define([ "require", "exports", "./store", "./utils", "./browser", "./normalize_urls", "./parse_urls", "./ports", "./i18n", "./run_commands", "./clipboard", "./open_urls", "./frame_commands", "./filter_tabs", "./tools" ], (require, exports, store_1, BgUtils_, browser_1, normalize_urls_1, parse_urls_1, ports_1, i18n_1, run_commands_1, clipboard_1, open_urls_1, frame_commands_1, filter_tabs_1, tools_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.toggleBookmark = exports.showLastDownload = exports.dockWindow = exports.cycleWindows = exports.addToReadingList = exports.moveTabToGroup = exports.renameTabGroup = exports.collapseTabGroup = exports.toggleTabGroup = exports.openSidePanel = exports.toggleWindow = exports.onSessionRestored_ = exports.reopenTab_ = exports.toggleTabUrl = exports.togglePinTab = exports.toggleMuteTab = exports.removeTab = exports.reloadTab = exports.moveTabToNextWindow = exports.moveTabToNewWindow = exports.joinTabs = exports.copyWindowInfo = void 0;
  BgUtils_ = __importStar(BgUtils_);
  const abs = Math.abs;
  const notifyCKey = () => {
    store_1.cPort && frame_commands_1.focusFrame(store_1.cPort, false, 0 /* FrameMaskType.NoMaskAndNoFocus */ , 1);
  };
  const getDestIndex = tab => store_1.get_cOptions().end ? null : store_1.get_cOptions().position != null ? open_urls_1.newTabIndex(tab, store_1.get_cOptions().position, false, false) : store_1.get_cOptions().rightInOld != null ? tab.index + (store_1.get_cOptions().rightInOld ? 0 : 1) : tab.index + (store_1.get_cOptions().right !== false ? 1 : 0);
  const copyWindowInfo = resolve => {
    const filter = store_1.get_cOptions().filter;
    const keyword = store_1.get_cOptions().keyword;
    const rawDecoded = store_1.get_cOptions().decoded, decoded = rawDecoded != null ? rawDecoded : store_1.get_cOptions().decode, rawFormat = store_1.get_cOptions().format, type = store_1.get_cOptions().type;
    const wantNTabs = type === "tab" && (abs(store_1.cRepeat) > 1 || !!filter);
    const sed = clipboard_1.parseSedOptions_(store_1.get_cOptions());
    const opts2 = {
      d: decoded !== false,
      s: sed,
      k: keyword
    };
    if (type === "frame" && store_1.cPort && !rawFormat) {
      let p;
      if (store_1.cPort.s.flags_ & 128 /* Frames.Flags.otherExtension */) {
        store_1.cPort.postMessage({
          N: 3 /* kBgReq.url */ ,
          H: 18 /* kFgReq.copy */ ,
          U: 1,
          o: opts2
        });
        p = 1;
      } else {
        p = ports_1.requireURL_({
          H: 18 /* kFgReq.copy */ ,
          U: 1,
          o: opts2
        });
      }
      p !== 1 && (p && p instanceof Promise ? p.then(() => {
        resolve(1);
      }) : resolve(1));
      return;
    }
    // include those hidden on Firefox
        browser_1.Tabs_.query(type === "browser" ? {
      windowType: "normal"
    } : {
      active: type !== "window" && !wantNTabs || void 0,
      lastFocusedWindow: true
    }, tabs => {
      var _a;
      if ((!type || type !== "browser" && type !== "window" && type !== "tab" && typeof type === "string") && !rawFormat) {
        if (!tabs.length) {
          resolve(0);
          return;
        }
        const isRawUrl = !!type && /^raw.?url$/i.test(type);
        const s = type === "title" ? tabs[0].title : !type || type === "frame" || type === "url" || isRawUrl ? browser_1.getTabUrl(tabs[0]) : (((_a = BgUtils_.safeParseURL_(browser_1.getTabUrl(tabs[0]))) === null || _a === void 0 ? void 0 : _a[type]) || "") + "";
        const copyReq = type === "title" ? {
          s
        } : {
          u: s
        };
        copyReq.o = opts2;
        isRawUrl && (opts2.d = false);
        copyReq.n = run_commands_1.parseFallbackOptions(store_1.get_cOptions());
        store_1.reqH_[18 /* kFgReq.copy */ ](copyReq, store_1.cPort);
        return;
      }
      const incognito = store_1.cPort ? store_1.cPort.s.incognito_ : store_1.curIncognito_ === 2 /* IncognitoType.true */ , format = "" + (rawFormat || "${title}: ${url}"), join = store_1.get_cOptions().join, isPlainJSON = join === "json" && !rawFormat;
      if (wantNTabs) {
        const ind = tabs.length < 2 ? 0 : browser_1.selectIndexFrom(tabs), range = filter_tabs_1.getTabRange(ind, tabs.length);
        tabs = tabs.slice(range[0], range[1]);
      } else {
        tabs = tabs.filter(i => i.incognito === incognito);
      }
      if (filter) {
        const curId = store_1.cPort ? store_1.cPort.s.tabId_ : store_1.curTabId_;
        const activeTab = tabs.find(i => i.id === curId);
        tabs = filter_tabs_1.filterTabsByCond_(activeTab, tabs, filter);
      }
      if (!tabs.length) {
        resolve(0);
        return;
      }
      type === "browser" && tabs.sort((a, b) => a.windowId - b.windowId || a.index - b.index);
      const data = tabs.map(i => isPlainJSON ? {
        title: i.title,
        url: decoded ? BgUtils_.decodeUrlForCopy_(browser_1.getTabUrl(i)) : browser_1.getTabUrl(i)
      } : format.replace(/\$\{([^}]+)}/g, (_, names) => names.split("||").reduce((old, s1) => {
        var _a;
        let val;
        return old || (decoded && s1 === "url" ? BgUtils_.decodeUrlForCopy_(browser_1.getTabUrl(i)) : /^raw.?url$/i.test(s1) ? browser_1.getTabUrl(i) : s1 === "host" ? ((_a = BgUtils_.safeParseURL_(browser_1.getTabUrl(i))) === null || _a === void 0 ? void 0 : _a.host) || "" : s1 !== "__proto__" && (val = i[s1], 
        val && typeof val === "object" ? JSON.stringify(val) : val || ""));
      }, "")));
      Promise.resolve(store_1.copy_(data, join, sed, keyword)).then(result => {
        resolve(1);
        ports_1.showHUD(type === "tab" && tabs.length < 2 ? result : i18n_1.trans_("copiedWndInfo"), 15 /* kTip.noTextCopied */);
      });
    });
  };
  exports.copyWindowInfo = copyWindowInfo;
  const joinTabs = resolve => {
    // { time/recency, create/id } | "all"
    const sortOpt = store_1.get_cOptions().order != null ? store_1.get_cOptions().order : store_1.get_cOptions().sort;
    const windowsOpt = store_1.get_cOptions().windows;
    const onlyCurrent = windowsOpt === "current", allWindows = windowsOpt === "all";
    const onWindows = wnds => {
      const isCurTabIncognito = store_1.curIncognito_ === 2 /* IncognitoType.true */;
      wnds = onlyCurrent ? wnds : wnds.filter(wnd => wnd.incognito === isCurTabIncognito);
      const _cur0 = onlyCurrent ? wnds : wnds.filter(wnd => wnd.id === store_1.curWndId_);
      if (!onlyCurrent && !_cur0.length) {
        resolve(0);
        return;
      }
      const cb = curWnd => {
        let allTabs = [], push = j => {
          allTabs.push(j);
        };
        wnds.sort((i, j) => i.id - j.id).forEach(i => {
          i.tabs.forEach(push);
        });
        if (!allTabs.length) {
          resolve(0);
          return;
        }
        let filter = store_1.get_cOptions().filter;
        const curWndId = curWnd ? curWnd.id : store_1.curWndId_;
        const activeTab = allTabs.find(i => i.id === store_1.curTabId_) || (curWnd ? browser_1.selectFrom(curWnd.tabs) : allTabs[0]);
        if (onlyCurrent && abs(store_1.cRepeat) > 1 && allTabs.length > 1) {
          const ind = allTabs.findIndex(i => i.id === activeTab.id), range = filter_tabs_1.getTabRange(ind, allTabs.length);
          allTabs = allTabs.slice(range[0], range[1]);
        }
        if (filter) {
          const extra = {};
          allTabs = filter_tabs_1.filterTabsByCond_(activeTab, allTabs, filter, extra);
          filter = extra.known ? filter : null;
        }
        if (!allTabs.length) {
          resolve(0);
          return;
        }
        allTabs = sortOpt ? filter_tabs_1.sortTabsByCond_(allTabs, sortOpt) : allTabs;
        const pos = store_1.get_cOptions().position, goToBefore = pos === "before" || (pos + "").startsWith("prev");
        let start;
        if (filter && curWnd) {
          if (pos && typeof pos === "string" && pos !== "keep") {
            if (pos === "begin" || pos === "start") {
              start = curWnd.tabs.filter(i => i.pinned).length;
            } else if (pos !== "end") {
              allTabs.includes(activeTab) && allTabs.splice(allTabs.indexOf(activeTab), 1);
              goToBefore ? allTabs.push(activeTab) : allTabs.unshift(activeTab);
              start = Math.max(0, curWnd.tabs.findIndex(i => i.id === store_1.curTabId_) - allTabs.filter(i => i.windowId === curWndId && i.index < activeTab.index).length);
            } else {
              start = curWnd.tabs.length;
            }
            // Note: on Edge 84, the result of `tabs.move(number[], {index: number})` is (stable but) unpredictable
                    } else {
            start = allTabs.reduce((ind, i) => i.windowId === curWndId ? Math.min(i.index, ind) : ind, allTabs.length);
          }
        } else {
          start = curWnd ? curWnd.tabs.length : 0;
        }
        const fixGroup = allTabs.some(i => browser_1.getGroupId(i) != null);
        const useTabGroups = 1 /* Build.MV3 */;
        let group, todoLock = BgUtils_.deferPromise_(), todo = allTabs.length;
        const onOneTaskFinished = () => {
          todo--;
          todo === 0 && todoLock.resolve_(1);
          return browser_1.runtimeError_();
        };
        let i = fixGroup ? 0 : todo, j = 1;
        for (;i < allTabs.length; i = j, j = i + 1) {
          group = browser_1.getGroupId(allTabs[i]);
          if (group !== null) {
            for (;j < allTabs.length && browser_1.getGroupId(allTabs[j]) === group; j++) {}
            if (j > i + 1) {
              const firstId = allTabs[i].id, tabIds = allTabs.slice(i + 1, j).map(x => x.id);
              browser_1.Tabs_.ungroup(tabIds, onOneTaskFinished);
              todo++;
              todoLock.promise_.then(() => {
                browser_1.Tabs_.get(firstId, firstTab => {
                  if (!firstTab) {
                    return browser_1.runtimeError_();
                  }
                  const groupId = browser_1.getGroupId(firstTab);
                  browser_1.Tabs_.group(groupId !== null ? {
                    groupId,
                    tabIds
                  } : (tabIds.unshift(firstTab.id), {
                    tabIds
                  }));
                });
              });
            }
            if (useTabGroups && allTabs[i].windowId !== curWndId) {
              browser_1.browser_.tabGroups.move(group, {
                index: -1,
                windowId: curWndId
              }, onOneTaskFinished);
              todo++;
            }
          }
        }
        for (i = 0; i < allTabs.length; i++) {
          browser_1.Tabs_.move(allTabs[i].id, allTabs[i].windowId !== curWndId ? {
            windowId: curWndId,
            index: start + i
          } : {
            index: start + i
          }, onOneTaskFinished);
        }
        for (const tab of allTabs) {
          tab.pinned && tab.windowId !== curWndId && (browser_1.tabsUpdate(tab.id, {
            pinned: true
          }, onOneTaskFinished), todo++);
        }
        todoLock.promise_.then(resolve);
      };
      {
        const _curWnd = _cur0.length ? _cur0[0] : null;
        if (_curWnd && _curWnd.type === "popup" && _curWnd.tabs.length) {
          // always convert a popup window to a normal one
          const curTabId = browser_1.selectFrom(_curWnd.tabs).id;
          _curWnd.tabs = _curWnd.tabs.filter(i => i.id !== curTabId);
          browser_1.makeWindow({
            tabId: curTabId,
            incognito: _curWnd.incognito
          }, _curWnd.state, wnd2 => {
            if (wnd2) {
              store_1.set_curWndId_(wnd2.id);
              wnd2.tabs[0] && store_1.set_curTabId_(wnd2.tabs[0].id);
            }
            cb(wnd2);
          });
        } else {
          wnds = onlyCurrent || !_curWnd || allWindows || sortOpt && !windowsOpt ? wnds : wnds.filter(wnd => wnd.id !== _curWnd.id);
          cb(_curWnd);
        }
      }
    };
    if (onlyCurrent) {
      browser_1.getCurWnd(true, wnd => wnd ? onWindows([ wnd ]) : browser_1.runtimeError_());
    } else {
      store_1.set_cRepeat(1);
      browser_1.Windows_.getAll({
        populate: true,
        windowTypes: [ "normal", "popup" ]
      }, onWindows);
    }
  };
  exports.joinTabs = joinTabs;
  const moveTabToNewWindow = resolve => {
    const kInc = "hasIncog", all = !!store_1.get_cOptions().all;
    const moveTabToNewWindow0 = wnd => {
      var _a;
      const allTabs = wnd.tabs, total = allTabs.length;
      const focused = store_1.get_cOptions().focused !== false;
      const curInd = browser_1.selectIndexFrom(allTabs), activeTab = allTabs[curInd];
      if (!all && total <= 1 && (!total || activeTab.index === 0 && abs(store_1.cRepeat) > 1)) {
        resolve(0);
        return;
      }
      let range;
      range = all ? [ 0, total ] : total === 1 ? [ 0, 1 ] : filter_tabs_1.getTabRange(curInd, total);
      const filter = store_1.get_cOptions().filter;
      let tabs = allTabs.slice(range[0], range[1]);
      tabs = filter ? filter_tabs_1.filterTabsByCond_(activeTab, tabs, filter) : tabs;
      if (!tabs.length) {
        resolve(0);
        return;
      }
      // Snapshot group membership so we can restore tab groups after the move (Chrome MV3)
            const oldGroupByTab = new Map;
      for (const i of tabs) {
        const g = browser_1.getGroupId(i);
        g != null && typeof g === "number" && oldGroupByTab.set(i.id, g);
      }
      if (!all) {
        const count = tabs.length;
        if (count >= total && total > 1) {
          resolve(0);
          ports_1.showHUD(i18n_1.trans_("moveAllTabs"));
          return;
        }
        if (count > 30 && run_commands_1.needConfirm_()) {
          run_commands_1.confirm_("moveTabToNewWindow", count).then(moveTabToNewWindow0.bind(null, wnd));
          return;
        }
        if (total === 1 && activeTab.index === 0 && abs(store_1.cRepeat) === 1) {
          browser_1.Q_(browser_1.Tabs_.query, {
            windowId: wnd.id,
            index: 1
          }).then(tabs2 => {
            if (!tabs2 || !tabs2.length) {
              resolve(0);
              ports_1.showHUD(i18n_1.trans_("moveAllTabs"));
              return;
            }
            wnd.tabs = [ wnd.tabs[0], tabs2[0] ];
            moveTabToNewWindow0(wnd);
          });
          return;
        }
      }
      const curIncognito = activeTab.incognito;
      const firstTab = tabs.includes(activeTab) ? activeTab : tabs[0];
      const rightInOld = ((_a = getDestIndex(activeTab)) !== null && _a !== void 0 ? _a : activeTab.index + 1) <= activeTab.index;
      const wndInit = {
        tabId: firstTab.id,
        incognito: curIncognito,
        focused
      };
      const wndState = wnd.type === "normal" ? wnd.state : "";
      filter_tabs_1.findNearShownTab_(tabs[rightInOld ? tabs.length - 1 : 0], rightInOld, allTabs).then(nearInOld => {
        focused || nearInOld && browser_1.selectTab(nearInOld.id);
        browser_1.makeWindow(wndInit, wndState, wnd2 => {
          if (!wnd2) {
            resolve(0);
            return;
          }
          notifyCKey();
          focused && nearInOld && browser_1.selectTab(nearInOld.id);
          const indexNewActive = tabs.indexOf(firstTab);
          let leftTabs = tabs.slice(0, indexNewActive), rightTabs = tabs.slice(indexNewActive + 1);
          const leftNum = leftTabs.length, rightNum = rightTabs.length;
          const getId = tab2 => tab2.id;
          if (leftNum) {
            browser_1.Tabs_.move(leftTabs.map(getId), {
              index: 0,
              windowId: wnd2.id
            }, browser_1.runtimeError_);
            leftNum > 1 && 
            // on Chrome, current order is [left[0], activeTabIndex, ...left[1:]], so need to move again
            browser_1.Tabs_.move(tabs[indexNewActive].id, {
              index: leftNum
            });
          }
          rightNum && browser_1.Tabs_.move(rightTabs.map(getId), {
            index: leftNum + 1,
            windowId: wnd2.id
          }, browser_1.runtimeError_);
          for (const tab of tabs) {
            tab.pinned && browser_1.tabsUpdate(tab.id, {
              pinned: true
            });
          }
          // Re-create tab groups in the new window from the pre-move snapshot
                    if (oldGroupByTab.size && browser_1.browser_.tabGroups) {
            const byOldGroup = new Map;
            for (const tab of tabs) {
              const g = oldGroupByTab.get(tab.id);
              if (g == null) {
                continue;
              }
              const arr = byOldGroup.get(g) || [];
              arr.push(tab.id);
              byOldGroup.set(g, arr);
            }
            const tasks = [];
            byOldGroup.forEach(tabIds => {
              tabIds.length && tasks.push(browser_1.Tabs_.group({
                tabIds,
                createProperties: {
                  windowId: wnd2.id
                }
              }));
            });
            Promise.all(tasks).then(() => {
              resolve(1);
            }, () => {
              resolve(1);
            });
            return;
          }
          resolve(1);
        });
      });
    };
    const moveTabToIncognito = wnd => {
      const tab = browser_1.selectFrom(wnd.tabs);
      if (wnd.incognito && tab.incognito) {
        resolve(0);
        return ports_1.showHUD(i18n_1.trans_(kInc));
      }
      const tabId = tab.id;
      const options = {
        incognito: true
      }, url = browser_1.getTabUrl(tab);
      if (tab.incognito) {} else {
        if (browser_1.isRefusingIncognito_(url)) {
          resolve(0);
          return ports_1.complainLimits(i18n_1.trans_("openIncog"));
        }
        options.url = url;
      }
      wnd.tabs = null;
      browser_1.Windows_.getAll(wnds => {
        let focused = store_1.get_cOptions().focused !== false;
        wnds = wnds.filter(wnd2 => wnd2.incognito && wnd2.type === "normal");
        if (wnds.length) {
          browser_1.Tabs_.query({
            windowId: open_urls_1.preferLastWnd(wnds).id,
            active: true
          }, ([tab2]) => {
            browser_1.tabsCreate({
              url,
              windowId: tab2.windowId,
              active: store_1.get_cOptions().active !== false,
              index: open_urls_1.newTabIndex(tab2, store_1.get_cOptions().position, false, false)
            }, run_commands_1.getRunNextCmdBy(3 /* kRunOn.tabPromise */));
            focused && browser_1.selectWnd(tab2);
            browser_1.Tabs_.remove(tabId);
          });
          return;
        }
        let state = wnd.type === "normal" ? wnd.state : "";
        const useUrl = options.url != null;
        if (useUrl) {
          if (store_1.CONST_.DisallowIncognito_) {
            focused = true;
            state = "";
          }
        } else {
          options.tabId = tabId;
        }
        options.focused = focused;
        // in tests on Chrome 46/51, Chrome hangs at once after creating a new normal window from an incognito tab
        // so there's no need to worry about stranger edge cases like "normal window + incognito tab + not allowed"
                browser_1.makeWindow(options, state, newWnd => {
          useUrl || newWnd && notifyCKey();
          useUrl && newWnd ? run_commands_1.getRunNextCmdBy(0 /* kRunOn.otherCb */)(newWnd.tabs && newWnd.tabs[0] || null) : resolve(!!newWnd);
        });
        useUrl && browser_1.Tabs_.remove(tabId);
      });
    };
    const incognito = !!store_1.get_cOptions().incognito;
    if (incognito && (store_1.cPort ? store_1.cPort.s.incognito_ : store_1.curIncognito_ === 2 /* IncognitoType.true */)) {
      ports_1.showHUD(i18n_1.trans_(kInc));
      resolve(0);
    } else {
      (all || abs(store_1.cRepeat) !== 1 && !incognito ? browser_1.Q_(browser_1.getCurWnd, true) : browser_1.Q_(browser_1.getCurWnd, false).then(wnd => wnd && browser_1.Q_(browser_1.Tabs_.query, {
        windowId: wnd.id,
        active: true
      }).then(tabs => {
        wnd.tabs = tabs;
        return tabs && tabs.length ? wnd : void 0;
      }))).then(w => {
        w ? (incognito ? moveTabToIncognito : moveTabToNewWindow0)(w) : resolve(0);
      });
    }
  };
  exports.moveTabToNewWindow = moveTabToNewWindow;
  const moveTabToNextWindow = ([tab], resolve) => {
    const noMin = store_1.get_cOptions().minimized === false || store_1.get_cOptions().min === false;
    const useLastWnd = store_1.get_cOptions().last;
    useLastWnd ? filter_tabs_1.findLastVisibleWindow_("normal", false, tab.incognito, tab.windowId, noMin).then(wndOrPair => {
      !wndOrPair || wndOrPair instanceof Array ? onWindows(/* already be [], in fact */ wndOrPair[0].slice(0, 1), wndOrPair[1]) : onWindows([ wndOrPair ]);
    }) : browser_1.Windows_.getAll(wnds => {
      onWindows(wnds.filter(wnd => wnd.incognito === tab.incognito && wnd.type === "normal" && (!noMin || wnd.state !== "minimized")), wnds.find(wnd => wnd.id === tab.windowId));
    });
    function onWindows(wnds, curWnd) {
      let ids;
      const focused = store_1.get_cOptions().focused !== false;
      const filter = store_1.get_cOptions().filter;
      const useTabs = !!(store_1.get_cOptions().tabs || filter || useLastWnd);
      if (wnds.length > 0) {
        ids = wnds.map(wnd => wnd.id).sort((i, j) => i - j);
        const index = ids.indexOf(tab.windowId);
        if (ids.length >= 2 || ids.length > 0 && index < 0) {
          const rawNext = store_1.get_cOptions().nextWindow;
          const nextWindow = useLastWnd ? 1 : (rawNext == null ? 1 : typeof rawNext === "boolean" ? rawNext ? 1 : -1 : 0 | +rawNext || 1) * (useTabs ? 1 : store_1.cRepeat);
          const firstWndIdx = useLastWnd ? 0 : index >= 0 ? nextWindow > 0 ? index + 1 : index : 0;
          let dest = nextWindow > 0 ? firstWndIdx + nextWindow - 1 : firstWndIdx + nextWindow;
          dest = (dest % ids.length + ids.length) % ids.length;
          dest = dest !== index ? dest : dest + (nextWindow > 0 ? 1 : -1);
          dest = (dest % ids.length + ids.length) % ids.length;
          const destWndId = ids[dest], destWnd = wnds.find(i => i.id === destWndId);
          const newDestState = focused && !noMin && destWnd && destWnd.state === "minimized" ? curWnd && curWnd.state === "maximized" ? curWnd.state : "normal" : "";
          browser_1.Tabs_.query({
            windowId: destWndId,
            active: true
          }, ([tab2]) => {
            const newIndex = getDestIndex(tab2);
            const toRight = newIndex == null || newIndex > tab2.index;
            let allToMove = null, nearInOld = false;
            let knownTabs = null;
            const callback = () => {
              if (nearInOld === false) {
                filter_tabs_1.findNearShownTab_(tab, !toRight, knownTabs).then(nearTab => {
                  nearInOld = nearTab;
                  callback();
                });
                return;
              }
              let q;
              focused || nearInOld && browser_1.selectTab(nearInOld.id);
              browser_1.Tabs_.move(tab.id, {
                index: newIndex !== null && newIndex !== void 0 ? newIndex : -1,
                windowId: destWndId
              }, resultCur => {
                if (browser_1.runtimeError_()) {
                  resolve(0);
                  browser_1.selectWnd(tab);
                  return browser_1.runtimeError_();
                }
                Promise.resolve(q).then(() => resolve(1));
                allToMove = allToMove || [ tab ];
                for (let i = 0; i < allToMove.length; i++) {
                  allToMove[i].id !== resultCur.id && browser_1.Tabs_.move(allToMove[i].id, {
                    index: resultCur.index + i,
                    windowId: resultCur.windowId
                  }, browser_1.runtimeError_);
                  allToMove[i].pinned && browser_1.Tabs_.update(allToMove[i].id, {
                    pinned: true
                  });
                }
                store_1.cPort && store_1.cPort.s.tabId_ === resultCur.id && notifyCKey();
              });
              if (focused) {
                newDestState && browser_1.Windows_.update(destWndId, {
                  state: newDestState
                });
                browser_1.selectWnd(tab2);
              }
              q = store_1.get_cOptions().active !== false && new Promise(resolve => {
                browser_1.selectTab(tab.id, resolve);
              });
              focused && nearInOld && browser_1.selectTab(nearInOld.id);
            };
            if (useTabs && (filter || abs(store_1.cRepeat) !== 1)) {
              filter_tabs_1.onShownTabsIfRepeat_(true, 0, (tabs, range) => {
                knownTabs = tabs.slice(0);
                tab = tabs[range[1]];
                tabs = tabs.slice(range[0], range[2]);
                store_1.CurCVer_ < 52 /* BrowserVer.MinNoAbnormalIncognito */ && (tabs = tabs.filter(i => i.incognito === tab.incognito));
                if (filter) {
                  tabs = filter_tabs_1.filterTabsByCond_(tab, tabs, filter);
                  if (!tabs.length) {
                    resolve(0);
                    return;
                  }
                  tab = tabs.includes(tab) ? tab : tabs[0];
                }
                allToMove = tabs;
                nearInOld = (allToMove.length !== 1 || !allToMove[0].active) && null;
                callback();
              }, [], resolve);
              return;
            }
             callback();
          });
          return;
        }
      } else {
        wnds = curWnd ? [ curWnd ] : [];
      }
      if (useTabs && abs(store_1.cRepeat) > 1) {
        exports.moveTabToNewWindow(resolve);
        return;
      }
      filter_tabs_1.findNearShownTab_(tab, false).then(nearInOld => {
        focused || nearInOld && browser_1.selectTab(nearInOld.id);
        browser_1.makeWindow({
          tabId: tab.id,
          incognito: tab.incognito,
          focused
        }, wnds.length === 1 && wnds[0].type === "normal" ? wnds[0].state : "", newWnd => {
          newWnd && (notifyCKey(), focused && nearInOld && browser_1.selectTab(nearInOld.id));
          tab.pinned && newWnd && newWnd.tabs && newWnd.tabs[0] && browser_1.tabsUpdate(newWnd.tabs[0].id, {
            pinned: true
          });
          resolve(!!newWnd);
        });
      });
    }
  };
  exports.moveTabToNextWindow = moveTabToNextWindow;
  const reloadTab = (tabs, [start, ind, end], r, force1) => {
    const reloadProperties = {
      bypassCache: store_1.get_cOptions().hard === true
    }, reload = browser_1.Tabs_.reload, allTabs = tabs;
    if (abs(store_1.cRepeat) < 2 || store_1.get_cOptions().single) {
      reload(tabs[force1 ? ind : start].id, reloadProperties, run_commands_1.getRunNextCmdBy(0 /* kRunOn.otherCb */));
      return;
    }
    let activeTab = tabs[ind], filter = store_1.get_cOptions().filter;
    tabs = tabs.slice(start, end);
    if (filter) {
      tabs = filter_tabs_1.filterTabsByCond_(activeTab, tabs, filter);
      if (!tabs.length) {
        r(0);
        return;
      }
      activeTab = tabs.includes(activeTab) ? activeTab : tabs[0];
    }
    if (tabs.length > 20 && run_commands_1.needConfirm_()) {
      run_commands_1.confirm_("reloadTab", tabs.length).then(exports.reloadTab.bind(null, allTabs, [ start, ind, end ], r));
      return;
    }
    reload(activeTab.id, reloadProperties, run_commands_1.getRunNextCmdBy(0 /* kRunOn.otherCb */));
    for (const i of tabs) {
      i !== activeTab && reload(i.id, reloadProperties);
    }
  };
  exports.reloadTab = reloadTab;
  const removeTab = (resolve, phase, tabs) => {
    var _a;
    const optHighlighted = store_1.get_cOptions().highlighted;
    const rawGoto = store_1.get_cOptions().goto || (store_1.get_cOptions().left ? "left" : ""), gotos = (rawGoto + "").split(/[\/,;\s]/), gotoVal = gotos.length > 1 ? gotos[abs(store_1.cRepeat) > 1 ? 1 : 0] : rawGoto + "", isGotoReverse = gotoVal === "near" || gotoVal === "reverse" || gotoVal.startsWith("back"), isGotoForward = gotoVal.startsWith("forw"), gotoLeft = isGotoReverse ? store_1.cRepeat > 0 : isGotoForward ? store_1.cRepeat < 0 : gotoVal === "left", gotoRight = isGotoReverse ? store_1.cRepeat < 0 : isGotoForward ? store_1.cRepeat > 0 : gotoVal === "right", gotoPrevious = gotoVal.includes("previous"), previousOnly = gotoPrevious && gotoVal.includes("only");
    if (!phase) {
      const needTabs = abs(store_1.cRepeat) > 1 || optHighlighted || gotoPrevious && !previousOnly;
      (needTabs ? browser_1.getCurTabs : browser_1.getCurTab)(exports.removeTab.bind(null, resolve, needTabs ? 2 : 1));
      return;
    }
    if (!tabs || !tabs.length) {
      resolve(0);
      return browser_1.runtimeError_();
    }
    const total = tabs.length, curInd = browser_1.selectIndexFrom(tabs), tab = tabs[curInd];
    let count = 1, start = curInd, end = curInd + 1;
    const noPinned = (_a = store_1.get_cOptions().noPinned) !== null && _a !== void 0 ? _a : tabs[0].pinned !== tab.pinned && !(store_1.cRepeat < 0 && curInd && tabs[curInd - 1].pinned);
    if (abs(store_1.cRepeat) > 1 && total > 1) {
      let skipped = 0;
      if (noPinned) {
        while (skipped < tabs.length && tabs[skipped].pinned) {
          skipped++;
        }
        if (skipped >= tabs.length) {
          resolve(0);
          return;
        }
      }
      const range = filter_tabs_1.getTabRange(curInd - skipped, total - skipped, total);
      count = range[1] - range[0];
      if (count > 20 && run_commands_1.needConfirm_() && phase < 3) {
        run_commands_1.confirm_("removeTab", count).then(exports.removeTab.bind(null, resolve, 2, tabs));
        return;
      }
      count > 1 && (start = skipped + range[0], end = skipped + range[1]);
    } else if (optHighlighted) {
      const highlighted = tabs.filter(j => j.highlighted && j !== tab && !(noPinned && j.pinned));
      const noCurrent = optHighlighted === "no-current" || noPinned && tab.pinned;
      count = highlighted.length + 1;
      count > 1 && (noCurrent || count < total) && browser_1.Tabs_.remove(highlighted.map(j => j.id), browser_1.runtimeError_);
      if (noCurrent) {
        resolve(count > 1);
        return;
      }
    } else {
      if (noPinned && tab.pinned) {
        resolve(0);
        return;
      }
      if (store_1.get_cOptions().filter && filter_tabs_1.filterTabsByCond_(tab, [ tab ], store_1.get_cOptions().filter).length === 0) {
        resolve(0);
        return;
      }
    }
    if (!start && count >= total && (store_1.get_cOptions().mayClose != null ? store_1.get_cOptions().mayClose : store_1.get_cOptions().allow_close) !== true) {
      phase < 2 ? // from `getCurTab`
      browser_1.getCurTabs(exports.removeTab.bind(null, resolve, 3)) : browser_1.Windows_.getAll( removeAllTabsInWnd.bind(null, resolve, tab, tabs));
      return;
    }
    let q;
    if (phase < 2) {
      if (previousOnly) {
        const lastActiveId = filter_tabs_1.tryLastActiveTab_();
        lastActiveId >= 0 && (q = browser_1.Q_(browser_1.tabsGet, lastActiveId));
      } else {
        (gotoRight || gotoLeft && start > 0) && (q = browser_1.Q_(browser_1.Tabs_.query, {
          windowId: tab.windowId,
          index: gotoLeft ? start - 1 : start + 1
        }).then(i => i && i[0]));
      }
      if (q) {
        q.then(destTab => {
          destTab && destTab.windowId === tab.windowId && browser_1.isNotHidden_(destTab) ? browser_1.removeTabsOrFailSoon_(tab.id, succeed => {
            succeed && browser_1.selectTab(destTab.id);
            resolve(succeed);
          }) : browser_1.getCurTabs(exports.removeTab.bind(null, resolve, 3));
        });
        return;
      }
    }
    let goToIndex = total;
    if (count >= total) {} else if (gotoPrevious) {
      let nextTab = !previousOnly && end < total && !store_1.recencyForTab_.has(tabs[end].id) ? tabs[end] : tabs.filter((j, ind) => (ind < start || ind >= end) && store_1.recencyForTab_.has(j.id)).sort(tools_1.TabRecency_.rCompare_)[0];
      goToIndex = nextTab ? tabs.indexOf(nextTab) : total;
    } else if (gotoLeft || gotoRight) {
      let i2 = goToIndex = gotoLeft ? start > 0 ? start - 1 : end : end < total ? end : start - 1;
      while (i2 >= 0 && i2 < total && (i2 < start || i2 >= end) && !browser_1.isNotHidden_(tabs[i2])) {
        i2 += i2 < start ? -1 : 1;
      }
      goToIndex = i2 >= 0 && i2 < total ? i2 : goToIndex;
    }
    if (goToIndex >= 0 && goToIndex < total) {
      const removeOne = Math.min(end, tabs.length) - Math.max(0, start) === 1, destId = tabs[goToIndex].id;
      if (removeOne) {
        browser_1.removeTabsOrFailSoon_(tab.id, ok => {
          ok && browser_1.selectTab(destId);
          resolve(ok);
        });
        browser_1.selectTab(destId);
        return;
      }
      browser_1.selectTab(destId);
    }
    removeTabsInOrder(tab, tabs, start, end, resolve);
  };
  exports.removeTab = removeTab;
  const removeAllTabsInWnd = (resolve, tab, curTabs, wnds) => {
    let windowId, wnd, protect = false;
    wnds = wnds.filter(wnd2 => wnd2.type === "normal");
    if (store_1.get_cOptions().keepWindow === "always") {
      protect = !wnds.length || wnds.some(i => i.id === tab.windowId);
    } else if (wnds.length <= 1) {
      // protect the last window
      protect = true;
      (wnd = wnds[0]) && (wnd.id !== tab.windowId ? protect = false : wnd.incognito && !browser_1.isRefusingIncognito_(store_1.newTabUrl_f) && (windowId = wnd.id));
      // other urls will be disabled if incognito else auto in current window
        } else if (!tab.incognito) {
      // protect the only "normal & not incognito" window if it has currentTab
      wnds = wnds.filter(wnd2 => !wnd2.incognito);
      if (wnds.length === 1 && wnds[0].id === tab.windowId) {
        windowId = wnds[0].id;
        protect = true;
      }
    }
    protect && browser_1.tabsCreate({
      index: curTabs.length,
      url: "",
      windowId
    }, run_commands_1.getRunNextCmdBy(3 /* kRunOn.tabPromise */));
    removeTabsInOrder(tab, curTabs, 0, curTabs.length, protect ? null : resolve);
  };
  const removeTabsInOrder = (tab, tabs, start, end, resolve) => {
    const curInd = Math.max(0, tabs.indexOf(tab));
    browser_1.removeTabsOrFailSoon_(tab.id, resolve || browser_1.runtimeError_);
    let rightParts = tabs.slice(curInd + 1, end), leftParts = tabs.slice(start, curInd);
    store_1.cRepeat < 0 && ([rightParts, leftParts] = [ leftParts, rightParts ]);
    rightParts.length > 0 && browser_1.Tabs_.remove(rightParts.map(j => j.id), browser_1.runtimeError_);
    leftParts.length > 0 && browser_1.Tabs_.remove(leftParts.map(j => j.id).reverse(), browser_1.runtimeError_);
  };
  const toggleMuteTab = resolve => {
    const filter = store_1.get_cOptions().filter;
    const currentWindow = store_1.get_cOptions().currentWindow;
    const rawOthers = store_1.get_cOptions().others;
    const others = rawOthers != null ? rawOthers : store_1.get_cOptions().other;
    if (!(store_1.get_cOptions().all || currentWindow || filter || others)) {
      browser_1.getCurTab(([tab]) => {
        const neg = !browser_1.isTabMuted(tab);
        const mute = store_1.get_cOptions().mute != null ? !!store_1.get_cOptions().mute : neg;
        mute === neg && browser_1.tabsUpdate(tab.id, {
          muted: mute
        });
        ports_1.showHUD(i18n_1.trans_(mute ? "muted" : "unmuted"));
        resolve(1);
      });
      return;
    }
    let activeTab;
    const cb = tabs => {
      let curId = others ? store_1.cPort ? store_1.cPort.s.tabId_ : store_1.curTabId_ : -1 /* GlobalConsts.TabIdNone */ , mute = tabs.length === 0 || curId !== -1 /* GlobalConsts.TabIdNone */ && tabs.length === 1 && tabs[0].id === curId;
      if (store_1.get_cOptions().mute != null) {
        mute = !!store_1.get_cOptions().mute;
      } else {
        for (const tab of tabs) {
          if (tab.id !== curId && !browser_1.isTabMuted(tab)) {
            mute = true;
            break;
          }
        }
      }
      if (filter) {
        tabs = filter_tabs_1.filterTabsByCond_(activeTab, tabs, filter);
        if (!tabs.length) {
          resolve(0);
          return;
        }
      }
      const action = {
        muted: mute
      };
      for (const tab of tabs) {
        tab.id !== curId && mute !== browser_1.isTabMuted(tab) && browser_1.tabsUpdate(tab.id, action);
      }
      ports_1.showHUDEx(store_1.cPort, mute ? "mute" : "unmute", 0, [ [ curId === -1 /* GlobalConsts.TabIdNone */ ? "All" : "Other" ] ]);
      resolve(1);
    };
    const wantedCurTabInfo = filter_tabs_1.getNecessaryCurTabInfo(filter);
    const tabQueryCond = currentWindow && store_1.curWndId_ >= 0 ? {
      audible: true,
      windowId: store_1.curWndId_
    } : {
      audible: true
    };
    wantedCurTabInfo ? wantedCurTabInfo.then(tab => {
      activeTab = tab;
      browser_1.Tabs_.query(tabQueryCond, cb);
    }) : browser_1.Tabs_.query(tabQueryCond, cb);
  };
  exports.toggleMuteTab = toggleMuteTab;
  const togglePinTab = (tabs, oriRange, resolve) => {
    const filter = store_1.get_cOptions().filter;
    const current = oriRange[1];
    const tab = tabs[current];
    tabs = filter ? filter_tabs_1.filterTabsByCond_(tab, tabs, filter) : tabs;
    const pin = !filter || tabs.includes(tab) ? !tab.pinned : !!tabs.find(i => !i.pinned);
    const action = {
      pinned: pin
    }, offset = pin ? 0 : 1;
    let skipped = 0;
    if (abs(store_1.cRepeat) > 1 && pin) {
      while (tabs[skipped].pinned) {
        skipped++;
      }
    }
    const range = filter_tabs_1.getTabRange(current - skipped, tabs.length - skipped, tabs.length);
    let start = skipped + range[offset] - offset, end = skipped + range[1 - offset] - offset;
    let wantedTabs = [];
    for (;start !== end; start += pin ? 1 : -1) {
      (pin || tabs[start].pinned) && wantedTabs.push(tabs[start]);
    }
    end = wantedTabs.length;
    if (!end) {
      resolve(0);
      return;
    }
    (end <= 30 || !run_commands_1.needConfirm_() ? Promise.resolve(false) : run_commands_1.confirm_("togglePinTab", end)).then(force1 => {
      force1 && (wantedTabs.length = 1);
    }).then(() => {
      const firstTabId = wantedTabs.includes(tab) ? tab.id : wantedTabs[0].id;
      for (const i of wantedTabs) {
        browser_1.tabsUpdate(i.id, action, i.id === firstTabId ? browser_1.R_(resolve) : browser_1.runtimeError_);
      }
    });
  };
  exports.togglePinTab = togglePinTab;
  const toggleTabUrl = (tabs, resolve) => {
    let tab = tabs[0], url = browser_1.getTabUrl(tab);
    const reader = store_1.get_cOptions().reader, keyword = store_1.get_cOptions().keyword;
    if (url.startsWith(store_1.CONST_.BrowserProtocol_)) {
      ports_1.complainLimits(i18n_1.trans_(reader ? "noReader" : "openExtSrc"));
      resolve(0);
      return;
    }
    if (reader && keyword) {
      const query = parse_urls_1.parseSearchUrl_({
        u: url
      });
      if (query && query.k === keyword) {
        run_commands_1.overrideCmdOptions({
          keyword: ""
        });
        open_urls_1.openUrlWithActions(query.u, 0 /* Urls.WorkType.Default */ , true, tabs);
      } else {
        url = normalize_urls_1.convertToUrl_(query && store_1.get_cOptions().parsed ? query.u : url, keyword);
        open_urls_1.openUrlWithActions(url, 9 /* Urls.WorkType.FakeType */ , true, tabs);
      }
      return;
    }
    if (reader) {
      if (store_1.IsEdg_ && BgUtils_.protocolRe_.test(url)) {
        url = url.startsWith("read:") ? BgUtils_.DecodeURLPart_(url.slice(url.indexOf("?url=") + 5)) : `read://${new URL(url).origin.replace(/:\/\/|:/g, "_")}/?url=${BgUtils_.encodeAsciiComponent_(url)}`;
        open_urls_1.openUrlWithActions(url, 9 /* Urls.WorkType.FakeType */ , true, tabs);
      } else {
        ports_1.complainLimits(i18n_1.trans_("noReader"));
        resolve(0);
      }
      return;
    }
    if (!store_1.get_cOptions().viewSource) {
      open_urls_1.openUrlWithActions("$S", 3 /* Urls.WorkType.EvenAffectStatus */ , true, tabs);
      return;
    }
    url = url.startsWith("view-source:") ? url.slice(12) : "view-source:" + url;
    open_urls_1.openUrlWithActions(url, 9 /* Urls.WorkType.FakeType */ , true, tabs);
  };
  exports.toggleTabUrl = toggleTabUrl;
  const reopenTab_ = (tab, refresh, exProps_mutable, useGroup) => {
    const tabId = tab.id, needTempBlankTab = refresh === 1;
    if (refresh && browser_1.browserSessions_() && (useGroup !== false || browser_1.getGroupId(tab) == null)) {
      let step = 0 /* RefreshTabStep.start */ , tempTabId = -1, onRefresh = () => {
        const err = browser_1.runtimeError_();
        if (err) {
          browser_1.browserSessions_().restore(null, run_commands_1.getRunNextCmdBy(0 /* kRunOn.otherCb */));
          tempTabId >= 0 && browser_1.Tabs_.remove(tempTabId);
          tempTabId = 0;
          return err;
        }
        step += 1;
        if (step >= 5 /* RefreshTabStep.end */) {
          return;
        }
        setTimeout(() => {
          browser_1.tabsGet(tabId, onRefresh);
        }, 50 * step * step);
      };
      needTempBlankTab && browser_1.tabsCreate({
        url: "about:blank",
        active: false,
        windowId: tab.windowId
      }, t2 => {
        tempTabId /* === -1 */ ? tempTabId = t2.id : browser_1.Tabs_.remove(t2.id);
      });
      browser_1.removeTabsOrFailSoon_(tabId, ok => {
        ok && browser_1.tabsGet(tabId, onRefresh);
      });
      return;
    }
    let recoverMuted;
    {
      const muted = browser_1.isTabMuted(tab);
      recoverMuted = tab2 => {
        muted !== browser_1.isTabMuted(tab2) && browser_1.tabsUpdate(tab2.id, {
          muted
        });
      };
    }
    let args = {
      windowId: tab.windowId,
      index: tab.index,
      url: browser_1.getTabUrl(tab),
      active: tab.active,
      pinned: tab.pinned,
      openerTabId: tab.openerTabId
    };
    exProps_mutable && (args = Object.assign(exProps_mutable, args));
    args.index != null && args.index++;
    browser_1.openMultiTabs(args, 1, true, [ null ], useGroup, tab, newTab => {
      newTab && recoverMuted && recoverMuted(newTab);
      newTab ? run_commands_1.runNextOnTabLoaded(store_1.get_cOptions(), newTab) : run_commands_1.runNextCmd(0);
    });
    browser_1.Tabs_.remove(tabId);
    // should never remove its session item - in case that goBack/goForward might be wanted
    // not seems to need to restore muted status
    };
  exports.reopenTab_ = reopenTab_;
  const onSessionRestored_ = (curWndId, restored, tabIdToReActivate) => {
    let restoredTab = null;
    const ensureSessionTabAccessable = async () => {
      var _a;
      const tab = restored ? restored.window ? browser_1.selectFrom(restored.window.tabs) : restored.tab : null;
      tab && (restoredTab = tab);
      if (!tab || !(restored.window || tab.windowId !== curWndId && tab.index === 0)) {
        return;
      }
      const url = tab.url;
      let runnable = /^(file|ftps?|https?)/.test(url) || url.startsWith(store_1.Origin2_);
      if (!runnable && url.startsWith(location.protocol) && !url.startsWith(store_1.Origin2_)) {
        const extHost = new URL(url).host;
        runnable = !!extHost && store_1.extAllowList_.get(extHost) === true;
      }
      if (!runnable) {
        return;
      }
      let wnd2 = restored.window;
      if (!wnd2) {
        const tabs = await browser_1.Q_(browser_1.Tabs_.query, {
          windowId: tab.windowId,
          index: 1
        });
        wnd2 = tabs && tabs.length ? null : await browser_1.Q_(browser_1.Windows_.get, tab.windowId);
      }
      if (!wnd2 || wnd2.type === "popup") {
        return;
      }
      const p1 = browser_1.Q_(browser_1.Tabs_.create, {
        url: "about:blank",
        windowId: wnd2.id
      });
      const {promise_: p2, resolve_: resolve} = BgUtils_.deferPromise_();
      browser_1.removeTabsOrFailSoon_(tab.id, resolve);
      const removed = await p2;
      const blankTab = await p1;
      restoredTab = removed && ((_a = await browser_1.Q_(browser_1.browserSessions_().restore)) === null || _a === void 0 ? void 0 : _a.tab) || null;
      blankTab && await browser_1.Tabs_.remove(blankTab.id);
    };
    return ensureSessionTabAccessable().then(async () => {
      if (tabIdToReActivate) {
        await browser_1.Q_(browser_1.tabsUpdate, tabIdToReActivate, {
          active: true
        });
        store_1.curWndId_ !== curWndId && await browser_1.Q_(browser_1.Windows_.update, curWndId, {
          focused: true
        });
      }
      return restoredTab;
    });
  };
  exports.onSessionRestored_ = onSessionRestored_;
  const toggleWindow = resolve => {
    const target = store_1.get_cOptions().target;
    let states = store_1.get_cOptions().states;
    states = typeof states === "string" ? states.trim().split(/[\s,;]+/) : states;
    states = states || [ "normal", "maximized" ];
    const curWndId = store_1.curWndId_;
    const selected = target && target !== "current" && target !== "all" ? store_1.lastWndId_ : curWndId;
    if (selected < 0) {
      resolve(0);
      return;
    }
    browser_1.Q_(browser_1.Windows_.get, selected).then(wnd => wnd || browser_1.Q_(browser_1.Windows_.get, store_1.curWndId_)).then(async wnd => {
      if (!wnd) {
        resolve(0);
        return;
      }
      const others = target === "other" || target === "others" ? await browser_1.Qs_(browser_1.Windows_.getAll).then(wnds => {
        wnds = wnds === null || wnds === void 0 ? void 0 : wnds.filter(i => i.id !== curWndId && i.id !== selected && i.type !== "devtools");
        return wnds ? wnds.map(i => i.id) : [];
      }) : [];
      let change = {};
      if (states instanceof Array) {
        const valid = [ "normal", "maximized", "fullscreen", "minimized" ];
        states = states.map(i => {
          var _a;
          return (_a = valid.find(j => j.startsWith(i))) !== null && _a !== void 0 ? _a : "current keep".includes(i) ? "" : " ";
        }).filter(i => i !== " ");
        const offset = store_1.cRepeat > 1 ? store_1.cRepeat - 2 : states.indexOf(wnd.state) + 1;
        const newState = states.length > 0 && states[offset % states.length] || wnd.state;
        (newState !== wnd.state || others.length > 0) && (change.state = newState);
      }
      Object.keys(change).length && browser_1.Windows_.update(selected, change, browser_1.R_(resolve));
      for (const otherWndId of others) {
        browser_1.Windows_.update(otherWndId, change, browser_1.runtimeError_);
      }
    });
  };
  exports.toggleWindow = toggleWindow;
  const noTabGroups = () => !browser_1.browser_.tabGroups || false;
  const openSidePanel = (tabs, resolve) => {
    // Prefer the dedicated kFgReq.key fast-path. This fallback still tries, then explains.
    new Promise((resolve_1, reject_1) => {
      require([ "./side_panel.js" ], resolve_1, reject_1);
    }).then(__importStar).then(m => {
      const tab = tabs && tabs[0];
      const started = m.openSidePanelImmediate_(tab ? tab.id : void 0, tab ? tab.windowId : void 0);
      m.openSidePanelBestEffort_(tab || null).then(ok => {
        ok || started || m.explainSidePanelGesture_();
        resolve(ok || started ? 1 : 0);
      });
    }, () => {
      ports_1.showHUD("Side panel module failed to load");
      resolve(0);
    });
  };
  exports.openSidePanel = openSidePanel;
  const toggleTabGroup = (tabs, resolve) => {
    if (noTabGroups()) {
      ports_1.showHUD("Tab groups unavailable");
      resolve(0);
      return;
    }
    const tab = tabs[0];
    const groupId = browser_1.getGroupId(tab);
    if (groupId != null) {
      browser_1.Tabs_.ungroup([ tab.id ], () => {
        ports_1.showHUD("Ungrouped tab");
        resolve(1);
        return browser_1.runtimeError_();
      });
      return;
    }
    const title = (store_1.get_cOptions().title || "") + "";
    const color = store_1.get_cOptions().color;
    browser_1.Tabs_.group({
      tabIds: [ tab.id ]
    }).then(newGroupId => {
      if (newGroupId == null) {
        resolve(0);
        return;
      }
      (title || color) && browser_1.browser_.tabGroups.update(newGroupId, {
        title: title || void 0,
        color: color || void 0
      });
      ports_1.showHUD(title ? `Grouped: ${title}` : "Tab grouped");
      resolve(1);
    }, () => {
      resolve(0);
    });
  };
  exports.toggleTabGroup = toggleTabGroup;
  const collapseTabGroup = (tabs, resolve) => {
    if (noTabGroups()) {
      ports_1.showHUD("Tab groups unavailable");
      resolve(0);
      return;
    }
    const groupId = browser_1.getGroupId(tabs[0]);
    if (groupId == null || typeof groupId !== "number") {
      ports_1.showHUD("Active tab is not in a group");
      resolve(0);
      return;
    }
    browser_1.browser_.tabGroups.query({
      windowId: tabs[0].windowId
    }).then(raw => {
      const groups = raw || [];
      const info = groups.find(g => g.id === groupId);
      if (!info) {
        resolve(0);
        return;
      }
      const force = store_1.get_cOptions().collapsed;
      const collapsed = force != null ? !!force : !info.collapsed;
      browser_1.browser_.tabGroups.update(groupId, {
        collapsed
      }).then(() => {
        ports_1.showHUD(collapsed ? "Group collapsed" : "Group expanded");
        resolve(1);
      }, () => {
        resolve(0);
      });
    }, () => {
      resolve(0);
    });
  };
  exports.collapseTabGroup = collapseTabGroup;
  const renameTabGroup = (tabs, resolve) => {
    if (noTabGroups()) {
      ports_1.showHUD("Tab groups unavailable");
      resolve(0);
      return;
    }
    const groupId = browser_1.getGroupId(tabs[0]);
    if (groupId == null || typeof groupId !== "number") {
      ports_1.showHUD("Active tab is not in a group");
      resolve(0);
      return;
    }
    let title = (store_1.get_cOptions().title || "") + "";
    const color = store_1.get_cOptions().color;
    if (!title) {
      const url = browser_1.getTabUrl(tabs[0]);
      const host = /^https?:\/\/([^/]+)/.exec(url);
      title = host ? host[1].replace(/^www\./, "") : "Group";
    }
    browser_1.browser_.tabGroups.update(groupId, {
      title,
      color: color || void 0
    }).then(() => {
      ports_1.showHUD(`Group: ${title}`);
      resolve(1);
    }, () => {
      resolve(0);
    });
  };
  exports.renameTabGroup = renameTabGroup;
  const moveTabToGroup = (tabs, resolve) => {
    if (noTabGroups()) {
      ports_1.showHUD("Tab groups unavailable");
      resolve(0);
      return;
    }
    const tab = tabs[0];
    const wantedTitle = (store_1.get_cOptions().title || "") + "";
    browser_1.browser_.tabGroups.query({
      windowId: tab.windowId
    }).then(raw => {
      const groups = raw || [];
      if (!groups.length) {
        ports_1.showHUD("No tab groups in this window");
        resolve(0);
        return;
      }
      let target = wantedTitle ? groups.find(g => (g.title || "").toLowerCase() === wantedTitle.toLowerCase()) : null;
      if (!target) {
        const curG = browser_1.getGroupId(tab);
        let idx = groups.findIndex(g => g.id === curG);
        idx < 0 && (idx = -1);
        const next = (idx + (store_1.cRepeat >= 0 ? 1 : -1) + groups.length * 10) % groups.length;
        target = groups[next];
      }
      if (!target) {
        resolve(0);
        return;
      }
      browser_1.Tabs_.group({
        groupId: target.id,
        tabIds: [ tab.id ]
      }).then(() => {
        ports_1.showHUD(`Moved to group: ${target.title || target.id}`);
        resolve(1);
      }, () => {
        resolve(0);
      });
    }, () => {
      resolve(0);
    });
  };
  exports.moveTabToGroup = moveTabToGroup;
  const addToReadingList = (tabs, resolve) => {
    const rl = browser_1.browser_.readingList;
    if (!rl || !rl.addEntry) {
      ports_1.showHUD("Reading List API unavailable");
      resolve(0);
      return;
    }
    const tab = tabs[0];
    const url = browser_1.getTabUrl(tab);
    if (!url || !/^https?:/.test(url)) {
      ports_1.showHUD("Only http(s) pages can be added to Reading List");
      resolve(0);
      return;
    }
    const title = ((store_1.get_cOptions().title || tab.title || url) + "").slice(0, 255);
    rl.addEntry({
      title,
      url,
      hasBeenRead: false
    }).then(() => {
      ports_1.showHUD("Added to Reading List");
      resolve(1);
    }, err => {
      const msg = err && err.message || "failed";
      ports_1.showHUD("Reading List: " + msg);
      resolve(0);
    });
  };
  exports.addToReadingList = addToReadingList;
  const cycleWindows = resolve => {
    const includeMin = store_1.get_cOptions().minimized !== false;
    browser_1.Windows_.getAll(wnds => {
      if (!wnds || !wnds.length) {
        resolve(0);
        return browser_1.runtimeError_();
      }
      let list = wnds.filter(w => w.type === "normal" || w.type === "popup");
      includeMin || (list = list.filter(w => w.state !== "minimized"));
      if (list.length < 2) {
        ports_1.showHUD(list.length ? "Only one window" : "No windows");
        resolve(0);
        return;
      }
      list.sort((a, b) => a.id - b.id);
      const curId = store_1.curWndId_;
      let idx = list.findIndex(w => w.id === curId);
      idx < 0 && (idx = 0);
      const delta = store_1.cRepeat >= 0 ? 1 : -1;
      const steps = Math.max(1, Math.abs(store_1.cRepeat | 0) || 1);
      const next = list[(idx + delta * steps + list.length * 100) % list.length];
      browser_1.Windows_.update(next.id, {
        focused: true
      }, () => {
        next.state === "minimized" && browser_1.Windows_.update(next.id, {
          state: "normal"
        }, browser_1.runtimeError_);
        ports_1.showHUD("Window " + (list.indexOf(next) + 1) + "/" + list.length);
        resolve(1);
        return browser_1.runtimeError_();
      });
    });
  };
  exports.cycleWindows = cycleWindows;
  /** Per-window progressive dock level (cleared when direction changes). */  const dockStateByWnd_ = new Map;
  const normalizeDockDir_ = raw => {
    const d = (raw || "left").toLowerCase();
    if (d === "top") {
      return "up";
    }
    if (d === "bottom") {
      return "down";
    }
    if (d === "maximize" || d === "maximum") {
      return "max";
    }
    if (d === "left" || d === "right" || d === "up" || d === "down" || d === "center" || d === "max") {
      return d;
    }
    return "left";
  };
  const getWorkArea_ = (wnd, cb) => {
    const sys = browser_1.browser_.system;
    const displayApi = sys && sys.display;
    if (displayApi && displayApi.getInfo) {
      try {
        displayApi.getInfo(infos => {
          if (browser_1.runtimeError_() || !infos || !infos.length) {
            cb(fallbackWorkArea_(wnd));
            return;
          }
          const cx = (wnd.left || 0) + (wnd.width || 800) / 2;
          const cy = (wnd.top || 0) + (wnd.height || 600) / 2;
          let best = infos[0];
          let bestDist = 1e15;
          for (const info of infos) {
            if (info.isEnabled === false) {
              continue;
            }
            const a = info.workArea || info.bounds;
            if (!a) {
              continue;
            }
            const inside = cx >= a.left && cx <= a.left + a.width && cy >= a.top && cy <= a.top + a.height;
            const mcx = a.left + a.width / 2, mcy = a.top + a.height / 2;
            const dist = (cx - mcx) * (cx - mcx) + (cy - mcy) * (cy - mcy);
            if (inside || dist < bestDist) {
              best = info;
              bestDist = inside ? -1 : dist;
              if (inside) {
                break;
              }
            }
          }
          const a = best.workArea || best.bounds;
          cb({
            l: a.left | 0,
            t: a.top | 0,
            w: a.width | 0,
            h: a.height | 0
          });
        });
        return;
      } catch (/* fall through */ _a) {/* fall through */}
    }
    cb(fallbackWorkArea_(wnd));
  };
  const fallbackWorkArea_ = wnd => {
    // Best-effort: treat current bounds as relative to a virtual area expanded to common laptop sizes
    const w = Math.max(wnd.width || 800, 1024);
    const h = Math.max(wnd.height || 600, 700);
    const l = wnd.left != null ? Math.min(wnd.left, 0) : 0;
    const t = wnd.top != null ? Math.min(wnd.top, 0) : 0;
    // Expand to cover typical full display when window is not maximized
        const fullW = Math.max(w + Math.max(0, wnd.left || 0), w);
    const fullH = Math.max(h + Math.max(0, wnd.top || 0), h);
    return {
      l: l < 0 ? l : 0,
      t: t < 0 ? t : 0,
      w: Math.max(fullW, (wnd.left || 0) + w),
      h: Math.max(fullH, (wnd.top || 0) + h)
    };
  };
  /**
     * Dock the current window to an edge of the display work area.
     * First press: half screen. Same direction again: shrink by dockWindowStep% of previous size.
     */  const dockWindow = resolve => {
    const dir = normalizeDockDir_((store_1.get_cOptions().direction || "left") + "");
    const rawStep = store_1.get_cOptions().step;
    const stepPct = Math.max(25, Math.min(90, (rawStep != null && +rawStep > 0 ? +rawStep : 0) || +store_1.settingsCache_.dockWindowStep || 50));
    const step = stepPct / 100;
    const rawFirst = store_1.get_cOptions().first;
    const first = Math.max(.25, Math.min(.75, rawFirst != null && +rawFirst > 0 ? +rawFirst : .5));
    browser_1.Windows_.getCurrent(wnd => {
      if (browser_1.runtimeError_() || !wnd || wnd.id == null) {
        ports_1.showHUD("No window");
        resolve(0);
        return;
      }
      const wndId = wnd.id;
      getWorkArea_(wnd, work => {
        if (work.w < 200 || work.h < 200) {
          ports_1.showHUD("Invalid display size");
          resolve(0);
          return;
        }
        if (dir === "max") {
          dockStateByWnd_.delete(wndId);
          browser_1.Windows_.update(wndId, {
            state: "maximized"
          }, () => {
            ports_1.showHUD("Maximized");
            resolve(1);
            return browser_1.runtimeError_();
          });
          return;
        }
        if (dir === "center") {
          dockStateByWnd_.delete(wndId);
          const ww = Math.round(work.w * first);
          const hh = Math.round(work.h * first);
          browser_1.Windows_.update(wndId, {
            state: "normal",
            left: work.l + Math.round((work.w - ww) / 2),
            top: work.t + Math.round((work.h - hh) / 2),
            width: ww,
            height: hh
          }, () => {
            ports_1.showHUD("Centered " + Math.round(first * 100) + "%");
            resolve(1);
            return browser_1.runtimeError_();
          });
          return;
        }
        let st = dockStateByWnd_.get(wndId);
        st && st.dir === dir ? st.level++ : st = {
          dir,
          level: 0
        };
        // Alt+Up twice → full screen (maximize). Other edges shrink progressively.
                if (dir === "up" && st.level >= 1) {
          dockStateByWnd_.delete(wndId);
          browser_1.Windows_.update(wndId, {
            state: "maximized"
          }, () => {
            ports_1.showHUD("Full screen");
            resolve(1);
            return browser_1.runtimeError_();
          });
          return;
        }
        // fraction of work area: first, first*step, first*step^2, …
                let frac = first * Math.pow(step, st.level);
        const minW = Math.min(320, work.w);
        const minH = Math.min(240, work.h);
        const axis = dir === "left" || dir === "right" ? work.w : work.h;
        const minFrac = (dir === "left" || dir === "right" ? minW : minH) / axis;
        if (frac < minFrac - 1e-6) {
          // wrap: feel natural rather than stuck at minimum
          st.level = 0;
          frac = first;
        }
        dockStateByWnd_.set(wndId, st);
        let left = work.l, top = work.t, width = work.w, height = work.h;
        if (dir === "left") {
          width = Math.max(minW, Math.round(work.w * frac));
          left = work.l;
        } else if (dir === "right") {
          width = Math.max(minW, Math.round(work.w * frac));
          left = work.l + work.w - width;
        } else if (dir === "up") {
          height = Math.max(minH, Math.round(work.h * frac));
          top = work.t;
        } else {
          height = Math.max(minH, Math.round(work.h * frac));
          top = work.t + work.h - height;
        }
        browser_1.Windows_.update(wndId, {
          state: "normal",
          left,
          top,
          width,
          height
        }, () => {
          const pct = Math.round(frac * 100);
          const hint = dir === "up" ? " \xb7 again = full screen" : "";
          ports_1.showHUD("Dock " + dir + " \xb7 " + pct + "%" + hint);
          resolve(1);
          return browser_1.runtimeError_();
        });
      });
    });
  };
  exports.dockWindow = dockWindow;
  const showLastDownload = resolve => {
    const downloads = browser_1.browser_.downloads;
    if (!downloads || !downloads.search) {
      ports_1.showHUD("Downloads API unavailable");
      resolve(0);
      return;
    }
    const wantOpen = !!store_1.get_cOptions().open;
    const wantShow = store_1.get_cOptions().show !== false;
    downloads.search({
      orderBy: [ "-startTime" ],
      limit: 20,
      state: "complete"
    }, items => {
      if (browser_1.runtimeError_() || !items || !items.length) {
        // fall back to any recent including in-progress
        downloads.search({
          orderBy: [ "-startTime" ],
          limit: 5
        }, items2 => {
          if (!items2 || !items2.length) {
            ports_1.showHUD("No downloads found");
            resolve(0);
            return browser_1.runtimeError_();
          }
          finishDownload_(items2[0], wantOpen, wantShow, resolve);
          return browser_1.runtimeError_();
        });
        return;
      }
      finishDownload_(items[0], wantOpen, wantShow, resolve);
      return browser_1.runtimeError_();
    });
  };
  exports.showLastDownload = showLastDownload;
  const finishDownload_ = (item, wantOpen, wantShow, resolve) => {
    const downloads = browser_1.browser_.downloads;
    try {
      if (wantOpen && downloads.open) {
        downloads.open(item.id);
        ports_1.showHUD("Opened: " + (item.filename.split(/[/\\]/).pop() || "download"));
      } else if (wantShow && downloads.show) {
        downloads.show(item.id);
        ports_1.showHUD("Revealed in folder");
      } else {
        browser_1.tabsCreate({
          url: "chrome://downloads"
        });
        ports_1.showHUD("Opened downloads page");
      }
      resolve(1);
    } catch (_a) {
      browser_1.tabsCreate({
        url: "chrome://downloads"
      });
      resolve(1);
    }
  };
  const toggleBookmark = (tabs, resolve) => {
    const bookmarks = browser_1.browser_.bookmarks;
    if (!bookmarks) {
      ports_1.showHUD("Bookmarks API unavailable");
      resolve(0);
      return;
    }
    const tab = tabs[0];
    const url = browser_1.getTabUrl(tab);
    if (!url) {
      resolve(0);
      return;
    }
    browser_1.Q_(bookmarks.search, {
      url
    }).then(found => {
      const list = found || [];
      if (list.length) {
        const id = list[0].id;
        browser_1.Q_(bookmarks.remove, id).then(() => {
          ports_1.showHUD("Bookmark removed");
          resolve(1);
        }, () => {
          resolve(0);
        });
        return;
      }
      const title = (tab.title || url).slice(0, 300);
      browser_1.Q_(bookmarks.create, {
        title,
        url
      }).then(() => {
        ports_1.showHUD("Bookmarked");
        resolve(1);
      }, () => {
        ports_1.showHUD("Could not create bookmark");
        resolve(0);
      });
    }, () => {
      resolve(0);
    });
  };
  exports.toggleBookmark = toggleBookmark;
});