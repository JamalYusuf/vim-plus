"use strict";
__filename = "background/settings.js";
define([ "require", "exports", "./store", "./utils", "./browser", "./normalize_urls", "./parse_urls", "./ports" ], (require, exports, store_1, utils_1, browser_1, normalize_urls_1, parse_urls_1, ports_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.kSettingsToUpgrade_ = exports.valuesToLoad_ = exports.frontUpdateAllowed_ = exports.defaults_ = exports.normalizeHashbangsForParser_ = exports.updatePayload_ = exports.reloadFromLegacy_ = exports.broadcastOmniConf_ = exports.broadcast_ = exports.postUpdate_ = exports.getInLocal_ = exports.setInLocal_ = exports.set_ = exports.ready_ = exports.local_ = exports.legacyStorage_mv2_ = exports.needToUpgradeSettings_ = void 0;
  let newSettingsToBroadcast_ = null;
  let toSaveCache = null;
  exports.needToUpgradeSettings_ = 0;
  exports.legacyStorage_mv2_ = null;
  exports.local_ = browser_1.browser_.storage.local;
  exports.ready_ = Promise.all([ 0, browser_1.Qs_(browser_1.browser_.runtime.getPlatformInfo).then(info => {
    const os = info.os.toLowerCase(), types = browser_1.browser_.runtime.PlatformOs, osEnum = os === types.WIN ? 2 /* kOS.win */ : os === types.MAC ? 0 /* kOS.mac */ : 1 /* kOS.linuxLike */;
    store_1.CONST_.Platform_ = os;
    store_1.omniPayload_.o = store_1.contentPayload_.o = osEnum;
    store_1.set_os_(osEnum);
  }), browser_1.Qs_(exports.local_.get.bind(exports.local_)).then(items => {
    const cache = store_1.settingsCache_;
    Object.assign(cache, exports.defaults_);
    items = items || {};
    for (let item of Object.entries(items)) {
      item[0] in exports.defaults_ ? cache[item[0]] = item[1] : store_1.storageCache_.set(item[0], item[1]);
    }
    let n = 0;
    const done = n + Object.keys(items).length;
    store_1.set_hasEmptyLocalStorage_(done === 0);
    return done;
  }) ]).then(i => {
    store_1.settingsCache_.keyLayout === 260 /* kKeyLayout.Default */ && (exports.needToUpgradeSettings_ |= 1, 
    loadLegacyKeyLayout_());
    for (let _i in exports.valuesToLoad_) {
      exports.updatePayload_(exports.valuesToLoad_[_i], store_1.settingsCache_[_i], store_1.contentPayload_);
    }
    store_1.contentPayload_.g = store_1.settingsCache_.grabBackFocus;
    store_1.omniPayload_.l = store_1.contentPayload_.l;
    store_1.set_bgIniting_(store_1.bgIniting_ | 2 /* BackendHandlersNS.kInitStat.settings */);
    return i[2];
  });
  exports.ready_.then(() => {
    store_1.onInit_ && store_1.onInit_();
  });
  const set_ = (key, value) => {
    store_1.settingsCache_[key] = value;
    toSaveCache || (toSaveCache = utils_1.safeObj_(), setTimeout(saveAllLocally, 0));
    const initial = exports.defaults_[key];
    const val2 = value !== initial ? value : null;
    toSaveCache[key] = val2;
    store_1.sync_(key, val2);
    key in exports.valuesToLoad_ && exports.updatePayload_(exports.valuesToLoad_[key], value, store_1.contentPayload_);
    let ref;
    if (ref = store_1.updateHooks_[key]) {
      return ref(value, key);
    }
  };
  exports.set_ = set_;
  const setInLocal_ = (key, value) => {
    const old = store_1.storageCache_.get(key);
    if ((old !== void 0 ? old : null) === value) {
      return;
    }
    toSaveCache || (toSaveCache = utils_1.safeObj_(), setTimeout(saveAllLocally, 0));
    toSaveCache[key] = value;
    value !== null ? store_1.storageCache_.set(key, value) : store_1.storageCache_.delete(key);
  };
  exports.setInLocal_ = setInLocal_;
  const getInLocal_ = key => store_1.storageCache_.get(key);
  exports.getInLocal_ = getInLocal_;
  const saveAllLocally = () => {
    const toSet = toSaveCache, toRemove = [];
    toSaveCache = null;
    for (let [key, value] of Object.entries(toSet)) {
      value === null && (toRemove.push(key), delete toSet[key]);
    }
    exports.local_.remove(toRemove);
    exports.local_.set(toSet);
  };
  exports.postUpdate_ = (key, value) => store_1.updateHooks_[key](value !== void 0 ? value : store_1.settingsCache_[key], key);
  const broadcast_ = request => {
    if (request.N !== 6 /* kBgReq.settingsUpdate */) {
      _BroadcastSettingsUpdates(request);
    } else if (request.d.length == null) {
      _BroadcastSettingsUpdates(request);
    } else {
      let cur = request.d, old = newSettingsToBroadcast_;
      old ? cur = cur.concat(old) : utils_1.nextTick_(_BroadcastSettingsUpdates.bind(null, request));
      newSettingsToBroadcast_ = cur;
      request.d = null;
    }
  };
  exports.broadcast_ = broadcast_;
  const _BroadcastSettingsUpdates = request => {
    const reqName = request.N;
    if (reqName === 6 /* kBgReq.settingsUpdate */ && !request.d) {
      const obj = newSettingsToBroadcast_;
      const d = request.d = {};
      for (const key of obj) {
        d[key] = store_1.contentPayload_[key];
      }
      newSettingsToBroadcast_ = null;
    }
    const needConfVer = reqName === 9 /* kBgReq.keyFSM */ || 6 /* kBgReq.settingsUpdate */;
    ports_1.asyncIterFrames_(reqName === 3 /* kBgReq.url */ ? 4096 /* Frames.Flags.UrlUpdated */ : reqName === 9 /* kBgReq.keyFSM */ ? 32768 /* Frames.Flags.KeyMappingsUpdated */ | (request.k ? 65536 /* Frames.Flags.KeyFSMUpdated */ : 0) : 8192 /* Frames.Flags.SettingsUpdated */ , frames => {
      needConfVer && (request.v = store_1.contentConfVer_);
      for (const port of frames.ports_) {
        port.postMessage(request);
      }
    });
  };
  const broadcastOmniConf_ = payload => {
    const msg = {
      N: 47 /* kBgReq.omni_updateOptions */ ,
      d: payload,
      v: utils_1.nextConfUpdate(1)
    };
    utils_1.asyncIter_(store_1.framesForOmni_.slice(0), frame => {
      store_1.framesForOmni_.includes(frame) && frame.postMessage(msg);
      return 1;
    });
  };
  exports.broadcastOmniConf_ = broadcastOmniConf_;
  const loadLegacyKeyLayout_ = () => {
    let ikl = store_1.storageCache_.get(exports.kSettingsToUpgrade_[0]), icl = store_1.storageCache_.get(exports.kSettingsToUpgrade_[1]), mm = store_1.storageCache_.get(exports.kSettingsToUpgrade_[2]);
    ikl !== void 0 && (ikl += ""), icl !== void 0 && (icl += ""), mm !== void 0 && (mm += "");
    let kl = 260 /* kKeyLayout.DefaultFromOld */;
    if (ikl !== void 0 || icl !== void 0 || mm !== void 0) {
      kl = ikl == null ? 4 /* kKeyLayout.inCmdIgnoreIfNotASCII */ : ikl === "2" || ikl === "true" ? 1 /* kKeyLayout.alwaysIgnore */ : ikl === "1" ? 12 /* kKeyLayout.inCmdIgnoreIfNotASCII */ : 4 /* kKeyLayout.inCmdIgnoreIfNotASCII */;
      kl |= icl == null || kl === 1 /* kKeyLayout.alwaysIgnore */ ? 0 : icl === "2" || icl === "true" ? 16 /* kKeyLayout.ignoreCaps */ : icl === "1" ? 512 /* kKeyLayout.ignoreCapsOnMac */ : 0;
      kl |= mm == null ? 0 : mm === "2" ? 128 /* kKeyLayout.mapRightModifiers */ : mm === "1" ? 64 /* kKeyLayout.mapLeftModifiers */ : 0;
      exports.needToUpgradeSettings_ |= 2;
    } else {
      exports.needToUpgradeSettings_ &= -3;
    }
    return store_1.settingsCache_.keyLayout = kl;
  };
  const reloadFromLegacy_ = changed => {
    if (changed < 3 && exports.needToUpgradeSettings_ & 1) {
      const curPayload = store_1.contentPayload_.l, legacyVal = loadLegacyKeyLayout_();
      const newPayload = exports.updatePayload_("l", legacyVal, store_1.contentPayload_);
      newPayload !== curPayload && exports.postUpdate_("keyLayout", legacyVal);
    }
  };
  exports.reloadFromLegacy_ = reloadFromLegacy_;
  const RemoveComment = i => i.startsWith("# ") ? "" : i.split("//", 1)[0].trim();
  /** @argument value may come from `LinkHints.*::characters` and `kBgCmd.toggle::value` */  exports.updatePayload_ = (shortKey, value, obj) => {
    switch (shortKey) {
     case "c":
     case "n":
      value = value.toLowerCase().toUpperCase();
      break;

     case "l":
      value = value & 255 /* kKeyLayout.FgMask */ | (value & 512 /* kKeyLayout.ignoreCapsOnMac */ && !store_1.os_ ? 16 /* kKeyLayout.ignoreCaps */ : 0);
      break;

     case "d":
      value = value ? " D" : "";
      break;

     case "p":
      value = value.replace("[aria-controls],[role=combobox],#kw.s_ipt", ":default" /* GlobalConsts.kCssDefault */);

      // no break;
           case "y":
      value = value.split("\n").map(RemoveComment).join("");
      break;

     default:
      break;
 // lgtm [js/unreachable-statement]
        }
    return obj ? obj[shortKey] = value : value;
  };
  Object.assign(store_1.updateHooks_, {
    extAllowList(val) {
      const map = store_1.extAllowList_;
      map.forEach((v, k) => {
        v !== false && map.delete(k);
      });
      if (!val) {
        return;
      }
      for (let arr = val.split("\n"), i = arr.length, wordCharRe = /^[\da-z_]/i; 0 <= --i; ) {
        (val = arr[i].trim()) && wordCharRe.test(val) && map.set(val, true);
      }
    },
    grabBackFocus(value) {
      store_1.contentPayload_.g = value;
    },
    keyLayout(value) {
      store_1.omniPayload_.l = store_1.contentPayload_.l;
      exports.broadcastOmniConf_({
        l: store_1.contentPayload_.l
      });
      if (exports.needToUpgradeSettings_ & 1 && !(value & 256 /* kKeyLayout.fromOld */)) {
        const hasInLocal = exports.needToUpgradeSettings_ & 2;
        exports.needToUpgradeSettings_ &= -4;
        for (let i = 0, end = hasInLocal ? 3 : 0; i < end; i++) {
          exports.setInLocal_(exports.kSettingsToUpgrade_[i], null);
          store_1.sync_(exports.kSettingsToUpgrade_[i], null);
        }
      }
    },
    newTabUrl(url) {
      url = /^\/?pages\/[a-z]+.html\b/i.test(url) ? browser_1.browser_.runtime.getURL(url) : browser_1.normalizeExtOrigin_(normalize_urls_1.convertToUrl_(url));
      store_1.set_newTabUrl_f(url);
      exports.setInLocal_("newTabUrl_f", url);
    },
    searchEngines() {
      store_1.searchEngines_.map.clear();
      store_1.searchEngines_.keywords = null;
      // Hashbangs (!g, !w, …) load first so they take precedence; then custom search engines.
      // Parser treats lines starting with !/"/# as comments — normalize bangs first.
            store_1.searchEngines_.rules = parse_urls_1.parseSearchEngines_("~:" + store_1.settingsCache_.searchUrl + "\n\n_browser: vimium://b-search-at/new-tab/$s re= Browser default search\n" + exports.normalizeHashbangsForParser_(store_1.settingsCache_.hashbangs || "") + "\n" + store_1.settingsCache_.searchEngines, store_1.searchEngines_.map).reverse();
    },
    searchUrl(str) {
      var _a;
      const map = store_1.searchEngines_.map;
      if (str) {
        ((_a = map.get("~")) === null || _a === void 0 ? void 0 : _a.complex_) || parse_urls_1.parseSearchEngines_("~:" + str, map);
      } else {
        map.clear();
        map.set("~", {
          name_: "~",
          url_: store_1.settingsCache_.searchUrl.split(" ", 1)[0],
          blank_: "",
          complex_: false
        });
        store_1.searchEngines_.rules = [];
        store_1.set_newTabUrl_f(store_1.storageCache_.get("newTabUrl_f") || "");
        if (store_1.newTabUrl_f) {
          return;
        }
      }
      exports.postUpdate_("newTabUrl");
    },
    vomnibarPage(url) {
      const cur = store_1.storageCache_.get("vomnibarPage_f");
      if (cur && !url) {
        store_1.set_vomnibarPage_f(cur);
        return;
      }
      url = url ? browser_1.normalizeExtOrigin_(url) : store_1.settingsCache_.vomnibarPage;
      if (url === exports.defaults_.vomnibarPage) {
        url = store_1.CONST_.VomnibarPageInner_;
      } else if (url.startsWith("front/")) {
        url = browser_1.browser_.runtime.getURL(url);
      } else {
        url = normalize_urls_1.convertToUrl_(url);
        url = normalize_urls_1.reformatURL_(url);
        url = url.replace(":version", `${parseFloat(store_1.CONST_.VerCode_)}`);
      }
      store_1.set_vomnibarPage_f(url);
      exports.setInLocal_("vomnibarPage_f", url);
    }
  });
  // Hashbangs re-use the search-engine parser (not part of DeclaredUpdateHooks)
    store_1.updateHooks_.hashbangs = () => {
    store_1.updateHooks_.searchEngines(store_1.settingsCache_.searchEngines, "searchEngines");
  };
  /**
     * Search-engine parser skips lines whose first char is < `$` (i.e. `!` `"` `#`).
     * Hashbang configs conventionally start with `!g|…`. Rewrite so a non-bang alias
     * leads the line while keeping `!g` as a usable omnibar keyword.
     */  const normalizeHashbangsForParser_ = raw => {
    if (!raw) {
      return "";
    }
    const hasUrlLike = /https?:|vimium:|javascript:|\$s|%s|\$S/i;
    return raw.split("\n").map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed[0] !== "!") {
        return line;
      }
      // Real comments: "! something" without a URL rule
            let colon = 0;
      do {
        colon = trimmed.indexOf(":", colon + 1);
      } while (colon > 0 && trimmed.charCodeAt(colon - 1) === 92);
      if (colon <= 0) {
        return line;
      }
      const rest = trimmed.slice(colon);
      // Keep pure comments like "! note" without a URL
            if (!hasUrlLike.test(rest)) {
        return line;
      }
      const keys = trimmed.slice(0, colon).split("|").map(k => k.trim()).filter(Boolean);
      if (!keys.length) {
        return line;
      }
      // Prefer a non-bang key first so the line is not treated as a comment
            const nonBang = keys.find(k => k[0] !== "!");
      let ordered;
      if (nonBang) {
        ordered = [ nonBang, ...keys.filter(k => k !== nonBang) ];
      } else {
        // All keys start with ! → strip bang from first for line validity, keep ! form as alias
        const first = keys[0];
        const plain = first.slice(1);
        ordered = plain ? [ plain, first, ...keys.slice(1).filter(k => k !== plain && k !== first) ] : keys;
      }
      // Preserve original indentation
            const lead = line.match(/^\s*/);
      const indent = lead ? lead[0] : "";
      return indent + ordered.join("|") + rest;
    }).join("\n");
  };
  exports.normalizeHashbangsForParser_ = normalizeHashbangsForParser_;
  // the default of all nullable fields must be set to null for compatibility with @Sync.set
    exports.defaults_ = {
    __proto__: null,
    allBrowserUrls: false,
    autoDarkMode: 2,
    autoReduceMotion: 2,
    clipSub: "p=^git@([^/:]+):=https://$1/=\ns@^https://(?:www\\.)?google\\.com(?:\\.[^/]+)?/url\\?(?:[^&#]+&)*?url=([^&#]+)@$1@,matched,decodecomp\np@^https://item\\.m\\.jd\\.com/product/(\\d+)\\.html\\b@https://item.jd.com/$1.html@",
    exclusionListenHash: true,
    exclusionOnlyFirstMatch: false,
    exclusionRules: [ {
      passKeys: "",
      pattern: ":https://mail.google.com/"
    } ],
    extAllowList: "# modified versions of X New Tab and PDF Viewer,\n# NewTab Adapter, and Shortcuts Forwarding Tool\nhdnehngglnbnehkfcidabjckinphnief\nnacjakoppgmdcpemlfnfegmlhipddanj\ncglpcedifkgalfdklahhcchnjepcckfn\nclnalilglegcjmlgenoppklmfppddien\n# EdgeTranslate\nbocbaocobfecmglnmeaeppambideimao\nbfdogplmndidlpjfhoijckpakkdjkkil\n# SalaDict\ncdonnmffkdaoajfknoeeecmchibpmkmg\nidghocbbahafpfhjnfhpbfbmpegphmmp",
    filterLinkHints: false,
    grabBackFocus: false,
    hideHud: false,
    ignoreReadonly: ":default" /* GlobalConsts.kCssDefault */ ,
    keyLayout: 260 /* kKeyLayout.Default */ ,
    keyboard: [ 560, 33 ],
    keyupTime: 120,
    keyMappings: "",
    linkHintCharacters: "sadjklewcmpgh",
    linkHintNumbers: "0123456789",
    localeEncoding: "gbk",
    mouseReachable: true,
    /** mutable */ newTabUrl: "",
    nextPatterns: "\u4e0b\u4e00\u5c01,\u4e0b\u9875,\u4e0b\u4e00\u9875,\u4e0b\u4e00\u7ae0,\u540e\u4e00\u9875,\u4e0b\u4e00\u5f20,next,more,newer,>,\u203a,\u2192,\xbb,\u226b,>>",
    notifyUpdate: true,
    omniBlockList: "",
    passEsc: ":default" /* GlobalConsts.kCssDefault */ ,
    preferBrowserSearch: true,
    previousPatterns: "\u4e0a\u4e00\u5c01,\u4e0a\u9875,\u4e0a\u4e00\u9875,\u4e0a\u4e00\u7ae0,\u524d\u4e00\u9875,\u4e0a\u4e00\u5f20,prev,previous,back,older,<,\u2039,\u2190,\xab,\u226a,<<",
    regexFindMode: false,
    scrollStepSize: 100,
    searchUrl: "https://www.google.com/search?q=%s Google",
    // Default engines (no Baidu / Gitee). Users can add any engine in Options.
    searchEngines: "g|go|gg|google|Google: https://www.google.com/search?q=%s \\\n  www.google.com re=/^(?:\\.[a-z]{2,4})?\\/search\\b.*?[#&?]q=([^#&]*)/i \\\n  blank=https://www.google.com/ Google\nbi|bing: https://www.bing.com/search?q=%s \\\n  blank=https://www.bing.com/ Bing\nd|dd|ddg|duckduckgo: https://duckduckgo.com/?q=%s DuckDuckGo\nbr|brave: https://search.brave.com/search?q=%s Brave\nec|ecosia: https://www.ecosia.org/search?q=%s Ecosia\nqw|qwant: https://www.qwant.com/?q=%s Qwant\nya|yd|yandex: https://yandex.com/search/?text=%s Yandex\nyh|yahoo: https://search.yahoo.com/search?p=%s Yahoo\n\ng.m|gm|g.map|gmap|maps: https://www.google.com/maps?q=%s \\\n  blank=https://www.google.com/maps Google Maps\ny|yt|youtube: https://www.youtube.com/results?search_query=%s \\\n  blank=https://www.youtube.com/ YouTube\nw|wiki|wikipedia: https://www.wikipedia.org/w/index.php?search=%s Wikipedia\ng.s|gs|gscholar: https://scholar.google.com/scholar?q=$s \\\n  scholar.google.com re=/^(?:\\.[a-z]{2,4})?\\/scholar\\b.*?[#&?]q=([^#&]*)/i \\\n  blank=https://scholar.google.com/ Google Scholar\nmdn: https://developer.mozilla.org/search?q=%s MDN\nso|stack: https://stackoverflow.com/search?q=%s Stack Overflow\nr|reddit: https://www.reddit.com/search/?q=%s Reddit\n\na|amz|amazon: https://www.amazon.com/s?k=%s \\\n  blank=https://www.amazon.com/ Amazon\ngh|github: https://github.com/search?q=$s \\\n  blank=https://github.com/ GitHub\n\n\\:i: vimium://sed/s/^//,lower\\ $S re= Lower case\nv.m|math: vimium://math\\ $S re= Calculate\nv.p: vimium://parse\\ $S re= Redo Search\njs\\:|Js: javascript:\\ $S; JavaScript",
    // Leading keys must not start with ! (parser treats !/"/# as comments). Aliases may include !g.
    dockWindowStep: 50,
    readingProgress: true,
    readingProgressColor: "#e11d48",
    readingProgressHeight: 2,
    readingProgressCss: "",
    showInfiniteScrollMark: true,
    // Empty = built-in :view profiles (see DEFAULT_VIEW_FX_CSS / wiki #view-fx)
    viewFxCss: "",
    accentColor: "#e11d48",
    hintBg: "#e11d48",
    hintFg: "#ffffff",
    findHighlightColor: "#ff9632",
    highlighterColors: "#fef08a,#bbf7d0,#fbcfe8,#bfdbfe,#fdba74",
    spotlightRadius: 150,
    readerFontSize: 18,
    readerWidth: 36,
    hashbangs: "g|!g|google: https://www.google.com/search?q=%s Google\nw|!w|wiki|wikipedia: https://en.wikipedia.org/w/index.php?search=%s Wikipedia\ngh|!gh|github: https://github.com/search?q=%s GitHub\nyt|!yt|y|youtube: https://www.youtube.com/results?search_query=%s YouTube\nd|!d|ddg|duck: https://duckduckgo.com/?q=%s DuckDuckGo\nb|!b|bing: https://www.bing.com/search?q=%s Bing\nm|!m|maps: https://www.google.com/maps/search/%s Google Maps\nso|!so|stack: https://stackoverflow.com/search?q=%s Stack Overflow\nr|!r|reddit: https://www.reddit.com/search/?q=%s Reddit\nmdn|!mdn: https://developer.mozilla.org/search?q=%s MDN\nnpm|!npm: https://www.npmjs.com/search?q=%s npm\na|!a|amz|amazon: https://www.amazon.com/s?k=%s Amazon\nt|!t|tw: https://x.com/search?q=%s X\ntr|!tr|translate: https://translate.google.com/?sl=auto&tl=en&text=%s Translate\ndef|!def|dict: https://www.dictionary.com/browse/%s Dictionary\nimg|!img|images: https://www.google.com/search?tbm=isch&q=%s Images\nw3|!w3: https://www.w3.org/search/?q=%s W3C\nc|!c|crates: https://crates.io/search?q=%s crates.io\npy|!py|pypi: https://pypi.org/search/?q=%s PyPI\nhn|!hn: https://hn.algolia.com/?q=%s Hacker News\ngrok|!grok|xai|think: https://grok.com/?q=%s Grok\ngpt|!gpt|chatgpt|openai: https://chatgpt.com/?q=%s ChatGPT\nclaude|!claude|anthropic: https://claude.ai/new?q=%s Claude\ngemini|!gemini|bard: https://www.google.com/search?q=%s+Gemini Gemini\npplx|!pplx|perplexity|ppx: https://www.perplexity.ai/search?q=%s Perplexity\ncopilot|!copilot|msai: https://copilot.microsoft.com/?q=%s Copilot\nph|!ph|phind: https://www.phind.com/search?q=%s Phind\npoe|!poe: https://poe.com/search/%s Poe\nyou|!you|youchat: https://you.com/search?q=%s&tbm=youchat You.com\n",
    showActionIcon: true,
    showAdvancedCommands: true,
    showContextMenu: true,
    showInIncognito: false,
    smoothScroll: true,
    titleIgnoreList: "",
    userDefinedCss: "",
    vomnibarOptions: {
      actions: "",
      // Chrome-like denser autocomplete (history / domains / bookmarks / engines)
      maxMatches: 12,
      queryInterval: 120,
      sizes: "77,3,48,0.8,1944" /* VomnibarNS.PixelData.MaxWidthInPixel */ ,
      styles: "mono-url"
    },
    vimSync: null,
    vomnibarPage: "front/vomnibar.html",
    waitForEnter: true
  };
  exports.frontUpdateAllowed_ = [ "showAdvancedCommands" ];
  exports.valuesToLoad_ = {
    __proto__: null,
    filterLinkHints: "f",
    hideHud: "h",
    ignoreReadonly: "y",
    keyLayout: "l",
    keyboard: "k",
    keyupTime: "u",
    linkHintCharacters: "c",
    linkHintNumbers: "n",
    mouseReachable: "e",
    passEsc: "p",
    regexFindMode: "r",
    smoothScroll: "s",
    scrollStepSize: "t",
    waitForEnter: "w"
  };
  exports.kSettingsToUpgrade_ = [ "ignoreKeyboardLayout", "ignoreCapsLock", "mapModifier" ];
  store_1.bgIniting_ < 6 /* BackendHandlersNS.kInitStat.FINISHED */ && (() => {
    const ref = browser_1.browser_.runtime.getManifest(), {origin} = location, prefix = origin + "/", ref2 = ref.content_scripts[0].js, obj = store_1.CONST_, 
    // on Edge, https://www.msn.cn/spartan/ntp also works with some complicated search parameters
    // on Firefox, both "about:newtab" and "about:home" work,
    EdgNewTab = "edge://newtab", CommonNewTab = "about:newtab", ChromeNewTab = "chrome://newtab", ref3 = store_1.newTabUrls_, func = path => (path.charCodeAt(0) === 47 /* kCharCode.slash */ ? origin : path.startsWith(prefix) ? "" : prefix) + path;
    exports.defaults_.newTabUrl = store_1.IsEdg_ ? EdgNewTab : ChromeNewTab;
    // note: on firefox, "about:newtab/" is invalid, but it's OKay if still marking the URL a NewTab URL.
        ref3.set(CommonNewTab, 1 /* Urls.NewTabType.browser */);
    ref3.set(CommonNewTab + "/", 1 /* Urls.NewTabType.browser */);
    {
      ref3.set(ChromeNewTab, 1 /* Urls.NewTabType.browser */);
      ref3.set(ChromeNewTab + "/", 1 /* Urls.NewTabType.browser */);
      // should not add "chrome://new-tab-page" to newTabUrl, since it can be opened manually and the tab.url keeps it
            if (store_1.IsEdg_) {
        ref3.set(EdgNewTab, 1 /* Urls.NewTabType.browser */);
        ref3.set(EdgNewTab + "/", 1 /* Urls.NewTabType.browser */);
      }
      const chromeNewTabPage = "chrome://new-tab-page";
      ref3.set(chromeNewTabPage, 2 /* Urls.NewTabType.cNewNTP */);
      ref3.set(chromeNewTabPage + "/", 2 /* Urls.NewTabType.cNewNTP */);
    }
    obj.GlobalCommands_ = Object.keys(ref.commands || {}).map(i => i === "quickNext" /* kShortcutAliases.nextTab1 */ ? "nextTab" : i);
    obj.VerCode_ = ref.version;
    obj.VerName_ = ref.version_name || ref.version;
    obj.OptionsPage_ = func(obj.OptionsPage_);
    obj.ShowPage_ = func(obj.ShowPage_);
    obj.VomnibarPageInner_ = func(exports.defaults_.vomnibarPage);
    obj.VomnibarScript_f_ = func(obj.VomnibarScript_);
    obj.HomePage_ = ref.homepage_url || obj.HomePage_;
    obj.Injector_ = func(obj.Injector_);
    obj.TeeFrame_ = func(obj.TeeFrame_);
    ref2.push("content/injected_end.js");
    obj.ContentScripts_ = ref2.map(func);
  })();
});