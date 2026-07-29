"use strict";

var VimPlusInjector;

(() => {
  const old = VimPlusInjector, cur = {
    id: "",
    alive: -1,
    host: "",
    version: "",
    cache: null,
    clickable: void 0,
    eval: null,
    reload: null,
    checkIfEnabled: null,
    $: null,
    $h: null,
    $m: null,
    $r: null,
    $g: null,
    getCommandCount: null,
    callback: null,
    destroy: null
  };
  if (old) {
    for (let key of Object.keys(old)) {
      cur[key] = old[key];
    }
  }
  cur.alive = -1;
  cur.$g = null;
  VimPlusInjector = cur;
})();

(function(_a0, injectorBuilder) {
  const MayChrome = true /* BrowserType.Chrome */ , MayNotChrome = false /* BrowserType.Chrome */;
  const MayEdge = false /* BrowserType.Edge */;
  const mayBrowser_ = MayChrome && MayNotChrome && typeof browser === "object" && !("tagName" in browser) ? browser : null;
  const useBrowser = !!MayNotChrome && (!MayChrome || !!(mayBrowser_ && mayBrowser_.runtime && mayBrowser_.runtime.connect));
  let runtime = (useBrowser ? browser : chrome).runtime;
  const curEl = document.currentScript, scriptSrc = curEl.src, i0 = scriptSrc.indexOf("://") + 3;
  const confBlockFocus = curEl.dataset.blockFocus;
  let onIdle = MayEdge ? window.requestIdleCallback : requestIdleCallback;
  let tick = 1, extHost = scriptSrc.slice(i0, scriptSrc.indexOf("/", i0)), extID = extHost;
  (!MayChrome || MayNotChrome && extID.indexOf("-") > 0) && (extID = curEl.dataset.vimiumId || "vim-plus@jamal.dev" /* BuildStr.FirefoxID */);
  extID = curEl.dataset.extensionId || extID;
  if (extID === extHost && ((runtime.getManifest() || {}).manifest_version || 3) >= 3) {
    alert("Require [data-extension-id] on <script> of Vim+ injector.js");
    return;
  }
  VimPlusInjector.id = extID;
  MayEdge && (onIdle = typeof onIdle !== "function" || "tagName" in onIdle ? null : onIdle);
  function handler(res, err) {
    let str, noBackend;
    const _old = VimPlusInjector, oldClickable = _old && _old.clickable, oldCallback = _old && _old.callback;
    if (!res) {
      const msg = err && err.message, host = runtime.id || location.host || location.protocol;
      noBackend = !!(msg && msg.lastIndexOf("not exist") >= 0 && runtime.id);
      if (res === false) {
        str = ": not in the allow list.";
      } else if (!noBackend && err) {
        str = msg ? `:\n\t${msg}` : ": no backend found.";
      } else if (tick > 3) {
        str = msg ? `:\n\t${msg}` : `: retried but failed (${res}).`;
        noBackend = false;
      } else {
        setTimeout(safeCall, 200 * tick);
        tick++;
        noBackend = true;
      }
      if (!noBackend) {
        str = str || ` (${tick} retries).`;
        const colorRed = "color:red", colorAuto = "color:auto";
        console.log("%cVim+%c: %cfail%c to inject into %c%s%c %s", colorRed, colorAuto, colorRed, colorAuto, "color:#0c85e9", host, colorAuto, str);
        oldCallback && _old.callback(-1, str);
      }
    }
    _old && typeof _old.destroy === "function" && _old.destroy(true);
    const verHash = res ? res.h : "";
    const newInjector = VimPlusInjector = {
      id: extID,
      alive: 0,
      host: MayNotChrome ? res ? res.host : "" : extID,
      version: res ? res.version : "",
      cache: null,
      clickable: oldClickable,
      eval: null,
      reload: injectorBuilder(scriptSrc),
      checkIfEnabled: null,
      $: null,
      $h(stat_num) {
        return "vim-plus." /* PortNameEnum.Prefix */ + stat_num + verHash;
      },
      $m(task) {
        VimPlusInjector && VimPlusInjector.$r(typeof task === "object" ? task.t : task);
      },
      $r() {},
      $g: confBlockFocus != null ? confBlockFocus === "" || confBlockFocus.toLowerCase() === "true" : null,
      getCommandCount: null,
      callback: oldCallback || null,
      destroy: null
    };
    const docEl = document.documentElement;
    if (!res || !(docEl instanceof HTMLHtmlElement)) {
      return err;
    }
    const insertAfter = document.contains(curEl) ? curEl : (document.head || docEl).lastChild || document.head, insertBefore = insertAfter.nextSibling, parentElement = insertAfter.parentElement;
    const fragment = document.createDocumentFragment();
    const hasFrag = true /* BrowserVer.MinEnsured$ParentNode$$appendAndPrepend */;
    let scripts = [];
    for (const i of res.s) {
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.async = false;
      script.src = i;
      hasFrag || fragment.appendChild(script);
      scripts.push(script);
    }
    hasFrag && fragment.append(...scripts), parentElement.insertBefore(fragment, insertBefore);
    scripts.length > 0 && (scripts[scripts.length - 1].onload = function() {
      this.onload = null;
      for (let i = scripts.length; 0 <= --i; ) {
        scripts[i].remove();
      }
    });
    oldCallback && newInjector.callback(0, "loading");
  }
  const call = useBrowser ? () => {
    runtime.sendMessage(extID, {
      handler: 99 /* kFgReq.inject */ ,
      scripts: true
    }).then(handler, err => handler(void 0, err));
  } : () => {
    runtime.sendMessage(extID, {
      handler: 99 /* kFgReq.inject */ ,
      scripts: true
    }, res => {
      const err = runtime.lastError;
      err ? handler(void 0, err) : handler(res);
      return err;
    });
  };
  const safeCall = () => {
    try {
      call();
    } catch (ex) {
      console.log("Can not send message to the extension of %o: %s", extID, ex && ex.message || ex + "");
    }
  };
  function start() {
    // requestAnimationFrame((): void => {})
    !MayEdge || onIdle ? onIdle(() => {
      onIdle(() => {
        setTimeout(safeCall, 0);
      }, {
        timeout: 67
      });
    }, {
      timeout: 330
    }) : setTimeout(safeCall, 67);
  }
  document.readyState !== "loading" ? start() : addEventListener("DOMContentLoaded", start, {
    capture: true,
    once: true
  });
})(0, scriptSrc => isAsync => {
  const injector = VimPlusInjector;
  if (injector) {
    const oldClickable = injector.clickable;
    typeof injector.destroy === "function" && injector.destroy(true);
    injector.clickable = oldClickable;
  }
  function doReload() {
    const docEl = document.documentElement;
    const parentNode = document.head || document.body || docEl;
    const script = document.createElement("script");
    if (!parentNode) {
      return;
    }
    script.type = "text/javascript";
    script.async = false;
    script.src = scriptSrc;
    console.log("%cVim+%c begins to reload%s.", "color:red", "color:auto", isAsync === 1 /* InjectorTask.reload */ ? " because it has been updated." : "");
    parentNode.append(script);
  }
  isAsync ? setTimeout(doReload, 200) : doReload();
});

(!document.currentScript || (document.currentScript.dataset.vimiumHooks || "").toLowerCase() !== "false") && VimPlusInjector.clickable !== null && (function() {
  VimPlusInjector.clickable = VimPlusInjector.clickable || new WeakSet;
  const obj = EventTarget, cls = obj.prototype, _listen = cls.addEventListener;
  if (_listen.vimiumHooked === true) {
    return;
  }
  const HACls = HTMLAnchorElement, ElCls = Element;
  const newListen = cls.addEventListener = function addEventListener(type, listener) {
    if (type === "click" && !(this instanceof HACls) && listener && this instanceof ElCls) {
      const injector = VimPlusInjector;
      injector && injector.clickable && injector.clickable.add(this);
    }
    const args = arguments, len = args.length;
    return len === 2 ? _listen.call(this, type, listener) : len === 3 ? _listen.call(this, type, listener, args[2]) : _listen.apply(this, args);
  }, funcCls = Function.prototype, funcToString = funcCls.toString, newToString = funcCls.toString = function toString() {
    return funcToString.apply(this === newListen ? _listen : this === newToString ? funcToString : this, arguments);
  };
  newListen.vimiumHooked = true;
  obj.vimiumRemoveHooks = () => {
    delete obj.vimiumRemoveHooks;
    cls.addEventListener === newListen && (cls.addEventListener = _listen);
    funcCls.toString === newToString && (funcCls.toString = funcToString);
  };
  newListen.prototype = newToString.prototype = void 0;
})();