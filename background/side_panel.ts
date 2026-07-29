/**
 * Side panel open helpers.
 *
 * chrome.sidePanel.open() requires an extension user gesture (toolbar click,
 * chrome.commands, context menu, or a content-script / extension-page click).
 * Page keys like `gS` arrive through the content→port→command chain and usually
 * lose that gesture — those paths must fall back with clear guidance.
 */
import { blank_, curTabId_, curWndId_, OnChrome } from "./store"
import { browser_, getCurTab, runtimeError_, Windows_ } from "./browser"
import { showHUD } from "./ports"

type SidePanelApi = {
  open (opts: { tabId?: number, windowId?: number }): Promise<void>
  setOptions (opts: { path?: string, enabled?: boolean, tabId?: number }): Promise<void>
  setPanelBehavior (opts: { openPanelOnActionClick: boolean }): Promise<void>
  close?: (opts: { tabId?: number, windowId?: number }) => Promise<void>
}

export const getSidePanelApi_ = (): SidePanelApi | null => {
  if (!OnChrome) { return null }
  return ((browser_ as Dict<any>)["sidePanel"] as SidePanelApi | undefined) || null
}

/** Call once at startup — never await this before open(). */
export const ensureSidePanelConfigured_ = (): void => {
  const sp = getSidePanelApi_()
  if (!sp) { return }
  void sp.setOptions({ path: "pages/sidepanel.html", enabled: true }).then(blank_, blank_)
  // Toolbar icon opens the command center (more useful than a tiny popup).
  void sp.setPanelBehavior({ openPanelOnActionClick: true }).then(blank_, blank_)
}

/**
 * Open immediately using whatever ids we already have (keeps user gesture).
 * Prefer windowId for a global panel that survives tab switches.
 */
export const openSidePanelImmediate_ = (tabId?: number, windowId?: number): boolean => {
  const sp = getSidePanelApi_()
  if (!sp) { return false }
  const opts: { tabId?: number, windowId?: number } = {}
  if (windowId != null && windowId >= 0) { opts.windowId = windowId }
  if (tabId != null && tabId >= 0) { opts.tabId = tabId }
  if (opts.windowId == null && opts.tabId == null) {
    if (curWndId_ >= 0) { opts.windowId = curWndId_ }
    else if (curTabId_ >= 0) { opts.tabId = curTabId_ }
    else { return false }
  }
  void sp.open(opts).then(blank_, blank_)
  return true
}

/** Best-effort open with lookups; may lose gesture if called after async hops. */
export const openSidePanelBestEffort_ = (knownTab?: Tab | null): Promise<boolean> => {
  const sp = getSidePanelApi_()
  if (!sp) { return Promise.resolve(false) }
  if (knownTab) {
    return sp.open({ tabId: knownTab.id, windowId: knownTab.windowId }).then((): boolean => true, (): boolean => false)
  }
  if (curWndId_ >= 0) {
    return sp.open({ windowId: curWndId_ }).then((): boolean => true, (): boolean => false)
  }
  return new Promise((resolve): void => {
    getCurTab((tabs): void => {
      const tab = tabs && tabs[0]
      if (!tab) {
        Windows_.getCurrent((wnd): void => {
          if (wnd && wnd.id != null) {
            void sp.open({ windowId: wnd.id }).then((): void => { resolve(true) }, (): void => { resolve(false) })
          } else { resolve(false) }
          return runtimeError_()
        })
        return
      }
      void sp.open({ tabId: tab.id, windowId: tab.windowId }).then((): void => { resolve(true) }, (): void => { resolve(false) })
    })
  })
}

export const explainSidePanelGesture_ = (): void => {
  showHUD("Side panel: use toolbar icon, Alt+Shift+V, or right-click → Open side panel")
}

/** Toggle: try close (Chrome 141+) then open. */
export const toggleSidePanel_ = (tab?: Tab | null): void => {
  const sp = getSidePanelApi_()
  if (!sp) {
    showHUD("Side panel API unavailable")
    return
  }
  const windowId = tab ? tab.windowId : (curWndId_ >= 0 ? curWndId_ : undefined)
  const tabId = tab ? tab.id : (curTabId_ >= 0 ? curTabId_ : undefined)
  if (sp.close && (windowId != null || tabId != null)) {
    void sp.close({ windowId, tabId }).then((): void => {
      // closed — leave closed as toggle off
    }, (): void => {
      void openSidePanelBestEffort_(tab || null).then((ok): void => { if (!ok) { explainSidePanelGesture_() } })
    })
    // Also try open if close is a no-op on older builds that reject
    return
  }
  void openSidePanelBestEffort_(tab || null).then((ok): void => { if (!ok) { explainSidePanelGesture_() } })
}

export const openSidePanelFromSender_ = (sender: chrome.runtime.MessageSender | null | undefined): boolean => {
  const tab = sender && sender.tab
  if (tab) {
    return openSidePanelImmediate_(tab.id, tab.windowId)
  }
  return openSidePanelImmediate_()
}
