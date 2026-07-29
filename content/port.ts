import {
  injector, safer, timeout_, isAlive_, isTop, set_i18n_getMsg, locHref, OnEdge, OnChrome, OnFirefox, isTY, fgCache,
  interval_, setupTimerFunc_cr, noRAF_old_cr_, runtime_ff, isIFrameInAbout_, isLocked_, inherited_, chromeVer_,
  confVersion, safeCall
} from "../lib/utils"
import { suppressTail_ } from "../lib/keyboard_utils"
import { docHasFocus_, rAF_ } from "../lib/dom_utils"
import { style_ui } from "./dom_ui"
import { hudTip } from "./hud"
import { isPassKeysReversed, passKeys } from "./key_handler"

export declare const enum HookAction { Install = 0, SuppressListenersOnDocument = 1, Suppress = 2, Destroy = 3 }

let port_callbacks: { [msgId: number]: <k extends keyof FgRes>(this: void, res: FgRes[k]) => unknown }
let port_: ContentNS.Port | null = null
let tick = 0
let onceFreezed: PortType.onceFreezed | 0 = 0
let safeDestroy: (silent?: boolean | BOOL | 9) => void
let requestHandlers: { [k in keyof BgReq]: (this: void, request: BgReq[k]) => unknown }
let contentCommands_: {
  [k in keyof CmdOptions]:
    k extends kFgCmd.insertMode ? (msg: CmdOptions[k], count?: number) => void :
    (this: void, options: CmdOptions[k] & SafeObject, count: number, key?: -42 | 0 | 1 | 2 | TimerType.fake) => void;
}
let hookOnWnd: (action: HookAction) => void

export { port_ as runtime_port, safeDestroy, requestHandlers, contentCommands_, hookOnWnd }

export function set_port_ (_newRuntimePort: null): void { port_ = _newRuntimePort }
export function set_safeDestroy (_newSafeDestroy: typeof safeDestroy): void { safeDestroy = _newSafeDestroy }
export function set_requestHandlers (_newHandlers: typeof requestHandlers): void { requestHandlers = _newHandlers }
export function set_contentCommands_ (_newCmds: typeof contentCommands_): void { contentCommands_ = _newCmds }
export function set_hookOnWnd (_newHookOnWnd: typeof hookOnWnd): void { hookOnWnd = _newHookOnWnd }

export const post_ = <k extends keyof FgReq>(request: FgReq[k] & Req.baseFg<k>): 1 | void => {
  port_!.postMessage(request);
}

export const send_  = <k extends keyof FgRes> (cmd: k, args: Req.fgWithRes<k>["a"]
    , callback: (this: void, res: FgRes[k]) => void): void => {
  (post_ as ContentNS.Port["postMessage"])({ H: kFgReq.msg, i: OnChrome ? tick += 2 : ++tick, c: cmd, a: args })
  ; port_callbacks = port_callbacks || safer({})
  port_callbacks[tick] =
          callback as <K2 extends keyof FgRes>(this: void, res: FgRes[K2]) => void
}

export const onPortRes_ = function<k extends keyof FgRes> (response: Omit<Req.res<k>, "N">): void {
  const id = response.m, handler = port_callbacks[id]
  delete port_callbacks[id]
  handler(response.r)
}

export const safePost = <k extends keyof FgReq> (request: FgReq[k] & Req.baseFg<k>, retried?: 1): void => {
  if (!port_) {
    const r = OnChrome ? chrome.runtime : null
    // sometimes runtime may be undefined, found on Chrome 126 + Ubuntu24, although not reproduced on Win11
    if (OnChrome && (!r || !r.id)) { // in fact, only after BrowserVer.Min$runtime$$id$GetsUndefinedOnTurnOff
      safeDestroy()
      return
    }
    safeCall(runtimeConnect)
    injector ? timeout_((): void => { port_ || safeDestroy() }, 50) : port_ || safeDestroy()
  } else if (OnFirefox && injector) {
    (requestHandlers[kBgReq.injectorRun] as VimPlusInjectorTy["$m"])(InjectorTask.recheckLiving)
  }
  try {
    port_ && post_(request)
  } catch { // this extension is reloaded or disabled
    if (OnChrome && (Build.MinCVer >= BrowserVer.Min$runtime$$id$GetsUndefinedOnTurnOff
          || chromeVer_ > BrowserVer.Min$runtime$$id$GetsUndefinedOnTurnOff - 1) && port_ && !retried) {
      port_ = null
      safePost(request, 1)
    } else {
      safeDestroy()
    }
  }
}

/**
 * Reading lastError clears Chrome's "Unchecked runtime.lastError" console noise (e.g. bfcache).
 * Must return the value so the compiler keeps the property access (void-only reads get DCE'd).
 */
const clearRuntimeLastError = (): unknown => {
  try {
    return (OnFirefox ? runtime_ff! : (OnChrome ? chrome : browser as typeof chrome).runtime).lastError
  } catch {
    return 0
  }
}

export const runtimeConnect = (function (this: void, extraFlags?: number): void {
  const api = OnChrome ? chrome : OnFirefox ? null as never : browser as typeof chrome,
  status = !fgCache ? PortType.initing + inherited_
      : PortType.reconnect | extraFlags! | PortType.hasCSS * <number> <boolean | number> !!style_ui,
  name = (PortType.isTop === 1 ? <number> <boolean | number> isTop : PortType.isTop * <number> <number | boolean> isTop)
      | PortType.aboutIframe * <number> <number | boolean> isIFrameInAbout_ | onceFreezed | status
      | PortType.hasFocus * <number> <number | boolean> docHasFocus_()
      | (confVersion << PortType.OFFSET_SETTINGS),
  data = { name: injector ? injector.$h(name) : OnEdge ? name + PortNameEnum.Delimiter + locHref() : "" + name },
  connect = (OnFirefox ? runtime_ff! : api.runtime).connect
  port_ = (injector ? connect(injector.id, data) : connect(data)) as ContentNS.Port
  port_.onDisconnect.addListener((): void => {
    // Chrome bfcache / freeze: must read lastError or Chrome logs "Unchecked runtime.lastError"
    const lastErr = clearRuntimeLastError() as void | { message?: string }
    port_ = null
    // Do not thrash reconnect while the page is frozen / in back-forward cache
    if (typeof document !== "undefined" && (document as Document & { wasDiscarded?: boolean }).wasDiscarded) {
      return
    }
    // bfcache closes the channel; pageshow (persisted) reconnects — do not spin here
    const msg = lastErr && lastErr.message || ""
    if (OnChrome && msg.includes("back/forward cache")) {
      return
    }
    fgCache ? 0 : OnChrome && timeout_ === interval_ ? safeDestroy() : timeout_((): void => {
      try {
        if (port_ || !isAlive_) { return }
        // pageshow after bfcache will reconnect; skip if document is still hidden in bfcache-ish state
        if (typeof document !== "undefined" && document.visibilityState === "hidden"
            && !docHasFocus_()) {
          return
        }
        runtimeConnect()
      } catch { safeDestroy() }
    }, (!fgCache ? 5000 : 2000) + (isTop as number | boolean as number) * 50)
  });
  port_.onMessage.addListener(<T extends keyof BgReq> (response: Req.bg<T>): void => {
    type TypeToCheck = { [k in keyof BgReq]: (this: void, request: BgReq[k]) => unknown };
    type TypeChecked = { [k in keyof BgReq]: <T2 extends keyof BgReq>(this: void, request: BgReq[T2]) => unknown };
    (requestHandlers as TypeToCheck as TypeChecked)[response.N](response);
  })
  if (isLocked_ && onceFreezed && isTop) {
    post_({ H: kFgReq.syncStatus, s: [isLocked_, isPassKeysReversed,
        passKeys && (!(Build.BTypes & BrowserType.Chrome) || Build.MinCVer >= BrowserVer.MinTestedES6Environment
        ? [...(<string[] & Set<string>>passKeys)] : Array.from(passKeys as string[] & Set<string>))
    ] })
  }
  onceFreezed = 0
  set_i18n_getMsg((OnFirefox ? browser as typeof chrome : api).i18n.getMessage)
})

export const runFallbackKey = ((options: Req.FallbackOptions
    , anotherTip: kTip | 0 | false | 2, tipArgs?: string | Array<string | number>, wait?: number): void => {
  const fallback = !anotherTip ? options.$then : options.$else, context = options.$f
  if (fallback && isTY(fallback)) {
    if (!Build.NDEBUG) {
      console.log("Vim+: run another command %o for type & tip = %o", fallback, anotherTip)
    }
    suppressTail_(wait || 60, 0)
    post_({
      H: kFgReq.nextKey, k: fallback, f: { c: context, r: options.$retry, u: anotherTip, w: wait }
    })
  } else {
    const tip = anotherTip && (anotherTip !== 2 ? anotherTip : context && context.t)
    tip && hudTip(tip, 0, tipArgs)
  }
}) as {
  /** if `anotherTip` is `0` / `false`, then use `.$then`; otherwise use `.$else` */
  (options: Req.FallbackOptions, anotherTip: 0 | 2 | false, tipArgs?: "" | TimerType.fake, wait?: number): void
  (options: Req.FallbackOptions, anotherTip: kTip, tipArgs?: string | Array<string | number>): void
}

export const setupBackupTimer_cr = !OnChrome ? 0 as never : (): void => {
  /*#__INLINE__*/ setupTimerFunc_cr((func: (info?: TimerType.fake) => void, timeout: number): number => {
    return (Build.MinCVer <= BrowserVer.NoRAFOrRICOnSandboxedPage && noRAF_old_cr_
        || timeout > GlobalConsts.MinCancelableInBackupTimer - 1) && port_
        // not use bind, in case that rAF_ gives more arguments than needed
        ? (send_(kFgReq.wait, timeout, func), tick - 1) : rAF_((): void => { func(TimerType.fake) })
  }, (timer: ValidTimeoutID | ValidIntervalID): void => {
    timer && port_callbacks && port_callbacks[timer as number + 1] &&
    ((port_callbacks as { [msgId: number]: (this: void, res: FgRes[kFgReq.wait]) => unknown }
      )[timer as number + 1] = isTY)
  })
}

export const onFreezePort = (event: Event): void => {
  if (port_ && event.isTrusted) {
    onceFreezed = PortType.onceFreezed
    try {
      port_.disconnect()
    } catch { /* empty */ }
    // Intentional disconnect still sets lastError in some Chromium builds
    if (clearRuntimeLastError()) { /* ignore */ }
    port_ = null
  }
}

/** Reconnect after bfcache restore / page resume */
export const onPageShowPort = (event: PageTransitionEvent | Event): void => {
  const e = event as PageTransitionEvent
  if (!isAlive_) { return }
  if ((e as PageTransitionEvent).persisted || onceFreezed) {
    try {
      if (!port_) { runtimeConnect(PortType.reconnect) }
    } catch { /* empty */ }
  }
}
