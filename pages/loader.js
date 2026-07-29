"use strict";

var VApi, VimPlusInjector = null;

(window.browser || window.chrome || {}).runtime && (() => {
  const MayChrome = true /* BrowserType.Chrome */ , MayNotChrome = false /* BrowserType.Chrome */;
  const mayBrowser_ = MayChrome && MayNotChrome && typeof browser === "object" ? browser : null;
  const useBrowser = !!MayNotChrome && (!MayChrome || !(!mayBrowser_ || !mayBrowser_.runtime));
  const browser_ = useBrowser ? browser : chrome;
  MayNotChrome && useBrowser && (window.chrome = browser_);
  const OnOther = 1 /* Build.BTypes */ /* BrowserType.Unknown */;
  const loader = document.currentScript;
  let jsEvalPromise;
  const head = loader.parentElement, scripts = [], prefix = browser_.runtime.getURL(""), curPath = location.pathname.replace("/pages/", "").split(".")[0], arr = browser_.runtime.getManifest().content_scripts[0].js;
  if (OnOther !== 4 /* BrowserType.Edge */) {
    for (const src of arr) {
      const scriptElement = document.createElement("script");
      scriptElement.async = false;
      scriptElement.src = src[0] === "/" || src.lastIndexOf(prefix, 0) === 0 ? src : "/" + src;
      scripts.push(scriptElement);
    }
    scripts[scripts.length - 1].onload = onLastLoad;
    // wait a while so that the page gets ready earlier
        setTimeout(() => {
      head.append(...scripts);
      return;
    }, curPath === "options" ? 32 : 100);
  }
  function onLastLoad() {
    for (let i = scripts.length; 0 <= --i; ) {
      scripts[i].remove();
    }
    VApi && (VApi.$r = event => {
      event === 4 /* InjectorTask.extInited */ && document.dispatchEvent(new CustomEvent("VimiumPlus" /* GlobalConsts.kLoadEvent */));
    }, VApi.v = function tryEval(code) {
      jsEvalPromise = jsEvalPromise || new Promise(resolve => {
        const script = document.createElement("script");
        script.src = "/lib/simple_eval.js";
        script.onload = () => {
          script.remove();
          resolve();
        };
        document.head.append(script);
      });
      const r = jsEvalPromise.then(() => VApi.v !== tryEval ? (VApi.v = VApi.v.tryEval || VApi.v)(code) : void 0);
      {
        const composedRet = r;
        composedRet.result = r.then(i => i && "ok" in i && "result" in i ? i.result : i);
        composedRet.ok = r.then(i => i && "ok" in i && "result" in i ? i.ok : i);
      }
      return r;
    });
  }
  if (curPath === "blank") {
    const storage = browser_.storage.local;
    storage.get("autoDarkMode", res => {
      const value = res && res.autoDarkMode;
      if (value === false || value === 1) {
        const el = document.head.querySelector("meta[name=color-scheme]");
        el && (el.content = value === 1 ? "dark" : "light");
      }
      return browser_.runtime.lastError;
    });
    if (browser_.i18n.getMessage("lang1")) {
      const s = browser_.i18n.getMessage("vblank");
      s && (document.title = s);
    }
  }
  window.a = null;
  window.cb = b => {
    window.a = b;
    console.log("%o", b);
  };
  function next(index) {
    if (index >= arr.length) {
      return onLastLoad();
    }
    const scriptElement = document.createElement("script"), src = arr[index];
    scriptElement.src = src[0] === "/" || src.lastIndexOf(prefix, 0) === 0 ? src : "/" + src;
    scriptElement.onload = () => next(index + 1);
    scripts.push(scriptElement);
    head.append(scriptElement);
  }
  if (OnOther === 2 /* BrowserType.Firefox */) {
    const iconLink = document.createElement("link");
    iconLink.rel = "icon";
    iconLink.href = "../icons/icon128.png";
    iconLink.type = "image/png";
    document.head.append(iconLink);
  }
  OnOther === 4 /* BrowserType.Edge */ && setTimeout(() => {
    next(0);
  }, 100);
})();