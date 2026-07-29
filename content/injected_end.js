"use strict";

VApi.e = (cmd, el2) => {
  const injector = VimPlusInjector;
  if (cmd === 6 /* kContentCmd.Destroy */ && injector) {
    const rEL = removeEventListener, onHashChnage = injector.checkIfEnabled;
    if (onHashChnage) {
      rEL("hashchange", onHashChnage);
      rEL("hashchange", onHashChnage, true);
    }
    injector.alive = 0;
    injector.destroy = injector.checkIfEnabled = injector.getCommandCount = null;
    injector.$ = injector.$r = injector.$m = null;
    injector.clickable = null;
    injector.callback && injector.callback(3, "destroy");
  } else {
    cmd === 3 /* kContentCmd.ShowPicker_cr_mv3 */ && el2.showPicker();
  }
};

(() => {
  const thisApi = VApi;
  const injector = VimPlusInjector;
  const trArgsRe = /\$\d/g;
  const runtime = chrome.runtime;
  const safeFrameElement_ = () => frameElement;
  let jsEvalPromise;
  const tryEval = code => {
    const injector1 = VimPlusInjector;
    if (injector1.eval) {
      const ret2 = injector1.eval(code);
      if (ret2 !== code) {
        return ret2;
      }
    }
    jsEvalPromise = jsEvalPromise || new Promise(resolve => {
      const script = document.createElement("script");
      script.src = `${location.protocol}//${injector1.host || injector1.id}/lib/simple_eval.js`;
      script.onload = () => {
        script.remove();
        resolve();
      };
      (document.head || document.documentElement).appendChild(script);
    });
    const ret = jsEvalPromise.then(() => VApi.v !== tryEval ? (VApi.v = VApi.v.tryEval || VApi.v)(code) : void 0);
    const composedRet = ret;
    composedRet.result = ret.then(i => i && "ok" in i && "result" in i ? i.result : i);
    composedRet.ok = ret.then(i => i && "ok" in i && "result" in i ? i.ok : i);
    return ret;
  };
  let i18nMessages = null;
  const ref = thisApi.r;
  ref[0](32 /* kFgReq.i18n */ , 0, res => {
    i18nMessages = res;
    VApi.z && VimPlusInjector.$r(4 /* InjectorTask.extInited */);
  });
  ref[2](2, (tid, args) => i18nMessages ? i18nMessages[tid].replace(trArgsRe, args ? s => typeof args === "string" ? args : args[+s[1] - 1] : "") : "$Msg-" + tid);
  const parentInjector = top !== window && safeFrameElement_() && parent.VimPlusInjector, 
  // share the set of all clickable, if .dataset.vimiumHooks is not "false"
  clickable = injector.clickable = parentInjector && parentInjector.clickable || injector.clickable;
  clickable && ref[2](1, clickable);
  injector.checkIfEnabled = (func => {
    func({
      H: 10 /* kFgReq.checkIfEnabled */ ,
      u: location.href
    });
  }).bind(null, ref[1]);
  injector.getCommandCount = (func => {
    let currentKeys = func(0);
    return currentKeys !== "-" ? parseInt(currentKeys, 10) || 1 : -1;
  }).bind(null, ref[2]);
  ref[1] = ref[2] = void 0;
  if (runtime.onMessageExternal) {
    injector.alive = 1;
  } else {
    injector.alive = .5;
    const colorRed = "color:red", colorAuto = "color:auto";
    console.log("%cVim+%c: injected %cpartly%c into %c%s", colorRed, colorAuto, colorRed, colorAuto, "color:#0c85e9", runtime.id || location.host, ".");
  }
  injector.$r = task => {
    if (task === 1 /* InjectorTask.reload */) {
      const injector1 = VimPlusInjector;
      injector1 && injector1.reload(1 /* InjectorTask.reload */);
      return;
    }
    switch (task) {
     case 4 /* InjectorTask.extInited */ :
      const injector1 = VimPlusInjector;
      injector1.cache = VApi.z;
      if (i18nMessages) {
        VApi.v = tryEval;
        injector1.callback && injector1.callback(2, "complete");
      }
      // not listen hash here; a 3rd-party page may add listeners by itself if it indeed wants
            return;
    }
  };
  injector.$ = thisApi;
  injector.cache = thisApi.z;
  injector.destroy = thisApi.d;
  injector.callback && injector.callback(1, "initing");
  thisApi.z && // has loaded before this script file runs
  injector.$r(4 /* InjectorTask.extInited */);
})();