"use strict";
__filename = "background/i18n.js";
define([ "require", "exports", "./store", "./utils", "./browser" ], (require, exports, store_1, utils_1, browser_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.loadContentI18n_ = exports.getI18nJson = exports.i18nLang_ = exports.transPart_ = exports.transEx_ = exports.trans_ = exports.extTrans_ = exports.contentI18n_ = exports.i18nReadyExt_ = void 0;
  let extPayload_;
  exports.i18nReadyExt_ = 1;
  let i18nPayload_;
  let ready_ = 0;
  exports.contentI18n_ = [];
  exports.extTrans_ = msg => browser_1.browser_.i18n.getMessage(msg);
  const trans_ = (name, args) => {
    if (ready_ === 1) {
      const val = i18nPayload_.get(name);
      return args != null && val ? val.replace(/\$\d/g, i => args[+i[1] - 1]) : val || "";
    }
    ready_ || (ready_ = exports.getI18nJson("background").then(obj => {
      i18nPayload_ = obj, ready_ = 1;
    }));
    return ready_.then(exports.trans_.bind(null, name, args));
  };
  exports.trans_ = trans_;
  const transEx_ = (name, args) => {
    args.forEach((i, ind, arr) => {
      if (i instanceof Array) {
        const name = i[0];
        arr[ind] = ready_ === 1 ? i18nPayload_.get(name) || name : exports.trans_(name).then(j => j || name);
      }
    });
    if (args.some(i => i instanceof Promise)) {
      const p = Promise.all(args);
      const p2 = ready_ === 1 ? p : (ready_ || exports.trans_("NS")).then(() => p);
      return p2.then(newArgs => exports.trans_(name, newArgs));
    }
    return exports.trans_(name, args);
  };
  exports.transEx_ = transEx_;
  const loadExt_ = () => exports.i18nReadyExt_ = Promise.all([ utils_1.fetchFile_("/_locales/en/messages.json"), browser_1.Q_(browser_1.browser_.i18n.getAcceptLanguages) ]).then(([enDict, wanted]) => {
    let all = ((enDict.get("i18nAll") || {}).message || "").split(" "), i = "";
    for (i of wanted || []) {
      all.includes(i) || all.includes(i = i.split("-")[0]) || (i = "");
      if (i) {
        break;
      }
    }
    if (!i) {
      return [ enDict ];
    }
    return Promise.all([ enDict, utils_1.fetchFile_(`/_locales/${i}/messages.json`) ]);
  }).then(arr => {
    extPayload_ = new Map;
    exports.i18nReadyExt_ = 1;
    for (let i of arr) {
      for (let [k, v] of i.entries()) {
        extPayload_.set(k, v.message);
      }
    }
  });
  const transPart_ = (msg, child) => msg && msg.split(" ").reduce((old, i) => old || (i.includes("=") ? child && i.startsWith(child) ? i.slice(child.length + 1) : old : i), "");
  exports.transPart_ = transPart_;
  const i18nLang_ = id => {
    let msg2 = exports.extTrans_("i18n");
    return exports.transPart_(msg2, id || "background") || exports.extTrans_("lang1") || "en";
  };
  exports.i18nLang_ = i18nLang_;
  const getI18nJson = file_name => {
    if (exports.i18nReadyExt_ === 0) {
      return loadExt_().then(exports.getI18nJson.bind(0, file_name));
    }
    return utils_1.fetchFile_(`/i18n/${exports.i18nLang_(file_name)}/${file_name}.json`);
  };
  exports.getI18nJson = getI18nJson;
  let loadContentI18n_ = () => {
    const arr = exports.contentI18n_, args = [ "$1", "$2", "$3", "$4" ];
    for (let i = 0; i < 124 /* kTip.INJECTED_CONTENT_END */; i++) {
      arr.push(browser_1.browser_.i18n.getMessage("" + i, args));
    }
    exports.loadContentI18n_ = null;
  };
  exports.loadContentI18n_ = loadContentI18n_;
});