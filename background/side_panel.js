"use strict";
__filename = "background/side_panel.js";
define([ "require", "exports", "./store", "./browser", "./ports" ], (require, exports, store_1, browser_1, ports_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.openSidePanelFromSender_ = exports.toggleSidePanel_ = exports.explainSidePanelGesture_ = exports.openSidePanelBestEffort_ = exports.openSidePanelImmediate_ = exports.ensureSidePanelConfigured_ = exports.getSidePanelApi_ = void 0;
  const getSidePanelApi_ = () => browser_1.browser_.sidePanel || null;
  exports.getSidePanelApi_ = getSidePanelApi_;
  /** Call once at startup — never await this before open(). */  const ensureSidePanelConfigured_ = () => {
    const sp = exports.getSidePanelApi_();
    if (!sp) {
      return;
    }
    sp.setOptions({
      path: "pages/sidepanel.html",
      enabled: true
    }).then(store_1.blank_, store_1.blank_);
    // Toolbar icon opens the command center (more useful than a tiny popup).
        sp.setPanelBehavior({
      openPanelOnActionClick: true
    }).then(store_1.blank_, store_1.blank_);
  };
  exports.ensureSidePanelConfigured_ = ensureSidePanelConfigured_;
  /**
     * Open immediately using whatever ids we already have (keeps user gesture).
     * Prefer windowId for a global panel that survives tab switches.
     */  const openSidePanelImmediate_ = (tabId, windowId) => {
    const sp = exports.getSidePanelApi_();
    if (!sp) {
      return false;
    }
    const opts = {};
    windowId != null && windowId >= 0 && (opts.windowId = windowId);
    tabId != null && tabId >= 0 && (opts.tabId = tabId);
    if (opts.windowId == null && opts.tabId == null) {
      if (store_1.curWndId_ >= 0) {
        opts.windowId = store_1.curWndId_;
      } else {
        if (!(store_1.curTabId_ >= 0)) {
          return false;
        }
        opts.tabId = store_1.curTabId_;
      }
    }
    sp.open(opts).then(store_1.blank_, store_1.blank_);
    return true;
  };
  exports.openSidePanelImmediate_ = openSidePanelImmediate_;
  /** Best-effort open with lookups; may lose gesture if called after async hops. */  const openSidePanelBestEffort_ = knownTab => {
    const sp = exports.getSidePanelApi_();
    if (!sp) {
      return Promise.resolve(false);
    }
    if (knownTab) {
      return sp.open({
        tabId: knownTab.id,
        windowId: knownTab.windowId
      }).then(() => true, () => false);
    }
    if (store_1.curWndId_ >= 0) {
      return sp.open({
        windowId: store_1.curWndId_
      }).then(() => true, () => false);
    }
    return new Promise(resolve => {
      browser_1.getCurTab(tabs => {
        const tab = tabs && tabs[0];
        if (!tab) {
          browser_1.Windows_.getCurrent(wnd => {
            wnd && wnd.id != null ? sp.open({
              windowId: wnd.id
            }).then(() => {
              resolve(true);
            }, () => {
              resolve(false);
            }) : resolve(false);
            return browser_1.runtimeError_();
          });
          return;
        }
        sp.open({
          tabId: tab.id,
          windowId: tab.windowId
        }).then(() => {
          resolve(true);
        }, () => {
          resolve(false);
        });
      });
    });
  };
  exports.openSidePanelBestEffort_ = openSidePanelBestEffort_;
  const explainSidePanelGesture_ = () => {
    ports_1.showHUD("Side panel: use toolbar icon, Alt+Shift+V, or right-click \u2192 Open side panel");
  };
  exports.explainSidePanelGesture_ = explainSidePanelGesture_;
  /** Toggle: try close (Chrome 141+) then open. */  const toggleSidePanel_ = tab => {
    const sp = exports.getSidePanelApi_();
    if (!sp) {
      ports_1.showHUD("Side panel API unavailable");
      return;
    }
    const windowId = tab ? tab.windowId : store_1.curWndId_ >= 0 ? store_1.curWndId_ : void 0;
    const tabId = tab ? tab.id : store_1.curTabId_ >= 0 ? store_1.curTabId_ : void 0;
    if (sp.close && (windowId != null || tabId != null)) {
      sp.close({
        windowId,
        tabId
      }).then(() => {}, () => {
        exports.openSidePanelBestEffort_(tab || null).then(ok => {
          ok || exports.explainSidePanelGesture_();
        });
      });
      // Also try open if close is a no-op on older builds that reject
            return;
    }
    exports.openSidePanelBestEffort_(tab || null).then(ok => {
      ok || exports.explainSidePanelGesture_();
    });
  };
  exports.toggleSidePanel_ = toggleSidePanel_;
  const openSidePanelFromSender_ = sender => {
    const tab = sender && sender.tab;
    if (tab) {
      return exports.openSidePanelImmediate_(tab.id, tab.windowId);
    }
    return exports.openSidePanelImmediate_();
  };
  exports.openSidePanelFromSender_ = openSidePanelFromSender_;
});