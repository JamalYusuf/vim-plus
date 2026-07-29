const OnOther = 1 /* Build.BTypes */ /* BrowserType.Unknown */;

export const OnChrome = true /* BrowserType.Chrome */ /* BrowserType.Chrome */;

export const OnFirefox = false /* BrowserType.Firefox */ /* BrowserType.Firefox */;

export const OnEdge = false /* BrowserType.Edge */ /* BrowserType.Edge */;

export const OnSafari = false /* BrowserType.Safari */ /* BrowserType.Safari */;

const uad = navigator.userAgentData;

const brands = uad.brands;

let tmpBrand;

export const IsEdg_ = !!brands.find(i => i.brand.includes("Edge") || i.brand.includes("Microsoft"));

export const CurCVer_ = (tmpBrand = brands.find(i => i.brand.includes("Chromium"))) && parseInt(tmpBrand.version) > 82 ? parseInt(tmpBrand.version) : 0 | (navigator.userAgent.match(/\bChrom(?:e|ium)\/(\d+)/) || [ 0, 998 /* BrowserVer.assumedVer */ ])[1];

export let CurFFVer_ = 999 /* FirefoxBrowserVer.assumedVer */ /* FirefoxBrowserVer.assumedVer */;

export let BrowserName_;

export let PageOs_ = 9 /* kOS.UNKNOWN */;

export const setupPageOs_ = os => {
  PageOs_ = os;
};

export const browser_ = chrome;

let rawIsVApiReady_;

export const isVApiReady_ = new Promise(resolve => {
  let resolve2;
  rawIsVApiReady_ = new Promise(r => {
    resolve2 = r;
  });
  addEventListener("VimiumPlus" /* GlobalConsts.kLoadEvent */ , function onContentLoaded() {
    queueTask_(resolve2);
    nextTick_(resolve);
  }, {
    once: true,
    capture: true
  });
});

let readyInfo_ = 4 /* kReadyInfo.browserInfo */;

const __oldI18nMap = {};

const i18nDict_ = new Map;

let _todoMsgs = null;

let _sentMsgs = null;

let _ansCallbacks = null;

const _todoCallbacks = Object.create(null);

let _queryId = 1;

let _tempPort = null;

export let selfTabId_ = -1 /* GlobalConsts.TabIdNone */;

//#region async messages
const onRespond = res => {
  _tempPort && (_sentMsgs = 0);
  if (res === false) {
    alert("Can not send info to the background: not trusted");
    return;
  }
  const callbacks = _todoCallbacks[res.i];
  delete _todoCallbacks[res.i];
  for (let arr = res.a, i = 0; i < callbacks.length; i++) {
    callbacks[i](arr[i]);
  }
  VApi && _tempPort && Object.keys(_todoCallbacks).length === 0 && _disconnect();
};

const onRespond2_ff = res => {
  res = structuredClone(res);
  onRespond(res);
};

const onDisconnect = () => {
  _tempPort = 0;
  console.log("[WARNING] the temp port is disconnected unexpectedly; need to replay messages using VApi");
  _sentMsgs && rawIsVApiReady_.then(() => {
    const oldMsgs = _sentMsgs, oldIds = oldMsgs ? Object.keys(_todoCallbacks) : [];
    _sentMsgs = 0;
    for (const id of oldIds) {
      const cb = _todoCallbacks[id], msg = oldMsgs[id];
      if (msg && cb) {
        _todoMsgs = msg, _ansCallbacks = cb;
        postAll(msg.length);
      }
    }
  });
};

const postAll = knownSize => {
  if (!_todoMsgs) {
    return;
  }
  const api = VApi, len = _todoMsgs.length;
  if (len > (knownSize || 1)) {
    queueTask_(postAll.bind(null, len));
    return;
  }
  api && _tempPort && Object.keys(_todoCallbacks).length === 0 && _disconnect();
  len && console.log("[debug] in pages/, post_: %c%s", "color: #15c;", len > 5 ? `[${len}]` : _todoMsgs.map(i => i.n).join(","));
  if (knownSize === 0) {
    _todoMsgs = _ansCallbacks = null;
    return;
  }
  const id = _queryId++;
  _todoCallbacks[id] = _ansCallbacks;
  _ansCallbacks = null;
  const getBg = null;
  const bg = getBg && getBg();
  if (bg && bg.onPagesReq) {
    bg.onPagesReq({
      i: id,
      q: _todoMsgs
    }).then(onRespond);
  } else if (api) {
    api.r[0](40 /* kFgReq.pages */ , {
      i: id,
      q: _todoMsgs
    }, onRespond);
  } else {
    if (_tempPort == null) {
      _tempPort = browser_.runtime.connect({
        name: "128"
 /* PortType.selfPages */      });
      _tempPort.onMessage.addListener(onRespond);
      _tempPort.onDisconnect.addListener(onDisconnect);
    }
    _tempPort && _tempPort.postMessage({
      H: 40 /* kFgReq.pages */ ,
      i: id,
      q: _todoMsgs
    });
    _sentMsgs !== 0 && ((_sentMsgs || (_sentMsgs = Object.create(null)))[id] = _todoMsgs);
  }
  _todoMsgs = null;
};

export const post_ = (action, messageBody) => new Promise(resolve => {
  _todoMsgs || prepareToPostAll();
  _todoMsgs.push({
    n: action,
    q: messageBody !== void 0 ? messageBody : null
  });
  _ansCallbacks.push(resolve);
});

const prepareToPostAll = () => {
  _todoMsgs || (_todoMsgs = [], _ansCallbacks = [], queueTask_(postAll));
};

export { prepareToPostAll as disconnect_ };

const _disconnect = () => {
  const port = _tempPort;
  _tempPort = null;
  if (port) {
    port.onDisconnect.removeListener(onDisconnect);
    port.onMessage.removeListener(onRespond);
    port.disconnect();
  }
};

//#endregion
//#region utils
const queueTask_ = queueMicrotask;

export const $ = selector => document.querySelector(selector);

export const $$ = (selector, root) => {
  const list = (root || document).querySelectorAll(selector);
  return [].slice.call(list);
};

export const toggleDark_ = dark => {
  const el = document.head.querySelector("meta[name=color-scheme]");
  const content = dark === 2 ? "light dark" : dark === 1 ? "dark" : "light";
  el && el.content !== content && (el.content = content);
  const cls = document.documentElement.classList;
  // dark === 0 → light, 1 → force dark, 2 → system (meta only; keep media-driven classes)
    const forceDark = dark === 1;
  const forceLight = dark === 0;
  if (forceDark || forceLight) {
    cls.toggle("vp-dark", forceDark);
    cls.toggle("dark", forceDark);
    cls.toggle("no-dark", forceLight);
    cls.toggle("vp-light", forceLight);
  } else {
    cls.remove("no-dark", "vp-light");
    try {
      const sys = matchMedia("(prefers-color-scheme: dark)").matches;
      cls.toggle("vp-dark", sys);
      cls.toggle("dark", sys);
    } catch (_a) {}
  }
};

export const toggleReduceMotion_ = reduced => {
  document.documentElement.classList.toggle("less-motion", reduced);
};

export let enableNextTick_;

const dbg_task_ = console.createTask;

export const nextTick_ = (() => {
  const ticked = () => {
    const oldSize = tasks.length;
    for (let i = 0; i < oldSize; i++) {
      (0, tasks[i])();
    }
    if (tasks.length > oldSize) {
      tasks.splice(0, oldSize);
      queueTask_(ticked);
    } else {
      tasks.length = 0;
      taskId = 0;
    }
  }, tasks = [];
  let taskId = 0;
  enableNextTick_ = (type, toRemove) => {
    readyInfo_ = (readyInfo_ | type) & ~(toRemove || 0);
    readyInfo_ === 7 /* kReadyInfo.FINISHED */ && queueTask_(ticked);
  };
  return (task, context) => {
    tasks.length <= 0 && readyInfo_ === 7 /* kReadyInfo.FINISHED */ && queueTask_(ticked);
    const asyncTask = dbg_task_ ? dbg_task_("task-" + ++taskId) : null;
    if (context === 9) {
      task = asyncTask ? asyncTask.run.bind(asyncTask, task) : task;
      tasks.unshift(task);
 // here ignores the case of re-entry
        } else {
      let task2 = context ? task.bind(null, context) : task;
      task2 = asyncTask ? asyncTask.run.bind(asyncTask, task2) : task2;
      tasks.push(task2);
    }
  };
})();

export const import2_ = url => import(url);

window.updateUI = () => {
  post_(9 /* kPgReq.reloadCSS */ , null);
};

export const pageTrans_ = (key, arg1) => {
  (readyInfo_ & 7 /* kReadyInfo.FINISHED */) !== 7 /* kReadyInfo.FINISHED */ && console.trace("Error: want to translate %s before finished (ready = %d)", key, readyInfo_);
  let val = i18nDict_.get(key);
  arg1 != null && val && (val = val.replace(/\$\d/g, i => arg1[+i[1] - 1]));
  return val;
};

/** @see {@link ../background/i18n#transPart_ } */ const transPart_ = (msg, child) => msg && msg.split(" ").reduce((old, i) => old || (i.includes("=") ? i.startsWith(child) ? i.slice(child.length + 1) : old : i), "");

export const bTrans_ = browser_.i18n.getMessage;

const curPath = location.pathname.replace("/pages/", "").split(".")[0], browserLang = bTrans_("lang1");

export const pageLangs_ = transPart_(bTrans_("i18n"), curPath) || browserLang || "en";

const useTopLevelAwait = false /* Build.NDEBUG */ /* BrowserVer.MinEnsuredES$TopLevelAwait */;

const onDicts = dicts => {
  const dest = i18nDict_;
  for (const src of dicts.reverse()) {
    if (!src) {
      continue;
    }
    const part = useTopLevelAwait ? src.default : JSON.parse(src);
    for (const key in part) {
      dest.set(key, part[key]);
    }
  }
  enableNextTick_(2 /* kReadyInfo.i18n */);
};

export const onDicts_ = useTopLevelAwait ? onDicts : 0;

export const curPagePath_ = useTopLevelAwait ? curPath : 0;

// Pages that ship dedicated i18n JSON (others like sidepanel/wiki skip fetch → no "Failed to fetch")
const kPagesWithI18n = "options action show blank";

const pageI18nName = curPath === "show" ? "action" : curPath;

const hasPageI18n = kPagesWithI18n.split(" ").indexOf(pageI18nName) >= 0;

hasPageI18n ? Promise.all(pageLangs_.split(",").map(lang => {
  const langFile = `/i18n/${lang}/${pageI18nName}.json`;
  const p = fetch(langFile).then(r => {
    if (!r.ok) {
      return Promise.reject(new Error("HTTP " + r.status));
    }
    return r.text();
  });
  // Always catch — missing files must not surface as uncaught "Failed to fetch"
    return p.catch(err => {
    console.log("Can not load the language file:", langFile, ":", err);
    return null;
  });
})).then(onDicts) : enableNextTick_(2 /* kReadyInfo.i18n */);

//#endregion
//#region async/await helper
{
  const storage = browser_.storage.local;
  // Follow gn / vomnibar dark (vpUiDark) first, then Options autoDarkMode
    storage.get([ "vpUiDark", "autoDarkMode" ], res => {
    const forced = res && res.vpUiDark;
    if (forced === 1 || forced === true || forced === "1") {
      toggleDark_(1);
      return browser_.runtime.lastError;
    }
    if (forced === 0 || forced === false || forced === "0") {
      toggleDark_(0);
      return browser_.runtime.lastError;
    }
    const value = res && res.autoDarkMode;
    (value === false || value === 1 || value === 0) && toggleDark_(value ? 1 : 0);
    return browser_.runtime.lastError;
  });
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" && area !== "sync") {
        return;
      }
      if (changes.vpUiDark) {
        const v = changes.vpUiDark.newValue;
        v === 1 || v === true || v === "1" ? toggleDark_(1) : v !== 0 && v !== false && v !== "0" || toggleDark_(0);
      } else if (changes.autoDarkMode) {
        const value = changes.autoDarkMode.newValue;
        toggleDark_(value === false || value === 0 ? 0 : value === 1 || value === true ? 1 : 2);
      }
    });
  } catch (_a) {}
}

if (browserLang && curPath !== "action") {
  const s = bTrans_("v" + curPath);
  s && (document.title = "Vim+ " + s);
}

curPath === "options" && isVApiReady_.then(() => {
  VApi.r[0](40 /* kFgReq.pages */ , {
    i: 1,
    q: [ {
      n: 26 /* kPgReq.selfTabId */ ,
      q: null
    } ]
  }, res => {
    res !== false && (selfTabId_ = res.a[0]);
  });
});

export const simulateClick_ = (target, event) => {
  let mouseEvent;
  event = event || {
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false
  };
  mouseEvent = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    detail: 1,
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    shiftKey: event.shiftKey,
    metaKey: event.metaKey,
    button: 0,
    buttons: 1,
    relatedTarget: null
  });
  return target.dispatchEvent(mouseEvent);
};

export const hasShift_ = event => event.shiftKey;

export const isRepeated_ = event => {
  const repeated = event.repeat;
  return repeated;
};

export const prevent_ = event => {
  event.preventDefault();
  const keyCode = event.type === "keydown" ? event.keyCode : 0 /* kKeyCode.None */;
  !keyCode || !PageOs_ && event.metaKey || VApi && (VApi.a()[keyCode] = 1);
};

export const escapeAllForRe_ = str => str.replace(/[$()*+.?\[\\\]\^{|}]/g, "\\$&");

typeof VApi === "undefined" && (globalThis.VApi = void 0);