"use strict";

typeof VApi == "object" && VApi && typeof VApi.d == "function" && VApi.d(1);

var VCID_ = VCID_ || "", VHost_ = VHost_ || "", Vomnibar_ = {
  pageType_: 0 /* VomnibarNS.PageType.Default */ ,
  activate_(options) {
    VUtils_.safer_(options);
    const a = Vomnibar_;
    a.mode_.o = (options.mode || "") + "" || "omni";
    a.mode_.t = 0 /* CompletersNS.SugType.Empty */;
    a.updateQueryFlag_(2 /* CompletersNS.QueryFlags.TabInCurrentWindow */ , !!options.currentWindow);
    a.updateQueryFlag_(4 /* CompletersNS.QueryFlags.PreferNewOpened */ , (options.preferTabs || "").includes("new"));
    a.updateQueryFlag_(128 /* CompletersNS.QueryFlags.TabTreeFromStart */ , options.tree === "from-start");
    a.updateQueryFlag_(8 /* CompletersNS.QueryFlags.TabTree */ , !!options.tree);
    a.updateQueryFlag_(16 /* CompletersNS.QueryFlags.MonospaceURL */ , null);
    a.updateQueryFlag_(32 /* CompletersNS.QueryFlags.ShowTime */ , null);
    a.updateQueryFlag_(256 /* CompletersNS.QueryFlags.NoTabEngine */ , !!options.noTabs);
    a.updateQueryFlag_(512 /* CompletersNS.QueryFlags.EvenHiddenTabs */ , !!options.hiddenTabs);
    a.updateQueryFlag_(2048 /* CompletersNS.QueryFlags.IncognitoTabs */ , !!options.incognitoTabs);
    a.updateQueryFlag_(1024 /* CompletersNS.QueryFlags.NoSessions */ , !!options.noSessions);
    a.updateQueryFlag_(4096 /* CompletersNS.QueryFlags.NeverMasked */ , !!options.neverMasked);
    a.options_ = options;
    let engines = options.engines;
    engines instanceof Array && (engines = engines.join());
    typeof engines === "string" && engines && (engines = (engines.includes("bookmark") ? 1 /* SugType2.kBookmark */ : 0) + (engines.includes("history") ? 2 /* SugType2.kHistory */ : 0) + (engines.includes("tab") ? 4 /* SugType2.tab */ : 0) + (engines.includes("search") ? 8 /* SugType2.search */ : 0) + (engines.includes("domain") ? 16 /* SugType2.domain */ : 0));
    a.mode_.e = (engines || 0 /* SugType2.Empty */) | 0;
    a.mode_.e && (a.mode_.o = "omni");
    a.baseHttps_ = null;
    let start, {url, keyword, p: search} = options;
    let [parWidth, parHeight, parScale] = options.w;
    let scale = parScale, dz = a.docZoom_ = scale < .98 ? 1 / scale : 1;
    const frameElWidth = Math.min(parWidth * a.wndRatioX_ + 24 /* PixelData.MarginH */ , a.maxWidthInPixel_);
    a.onInnerWidth_(frameElWidth);
    a._hostViewH = parHeight / dz;
    const max = Math.max(3, Math.min(0 | (parHeight / dz - a.baseHeightIfNotEmpty_ - 78 /* GlobalConsts.MaxScrollbarWidth */) / a.itemHeight_, a.maxMatches_));
    a.mode_.r = max;
    a.height_ = +a.isActive_;
    a.preInit_ && a.preInit_(options.t);
    a.docSt_.zoom = dz > 1 ? dz + "" : "";
    if (a.mode_.i) {
      const favScale = scale === 1 ? 1 : scale < 3 ? 2 : scale < 3.5 ? 3 : 4;
      /**
             * Note: "@1x" is necessary, because only the whole 'size/aa@bx/' can be optional
             * * definition: https://cs.chromium.org/chromium/src/chrome/browser/ui/webui/favicon_source.h?type=cs&q=FaviconSource&g=0&l=47
             * * parser: https://cs.chromium.org/chromium/src/components/favicon_base/favicon_url_parser.cc?type=cs&q=ParseFaviconPath&g=0&l=33
             */      const prefix = '" style="background-image: url(&quot;';
      a._favPrefix = prefix + location.origin + "/_favicon/?size=" + 16 * favScale + "&pageUrl=";
    }
    keyword = (keyword || "") + "";
    if (url == null) {
      a.reset_(keyword && keyword + " ");
      return;
    }
    if (search) {
      start = search.s;
      url = search.u;
      keyword || (keyword = search.k);
    } else if (search === null) {
      url = VUtils_.decodeURL_(url).replace(/\s$/g, "%20");
      if (!keyword && /^https?:\/\//i.test(url)) {
        const isHttps = (url.charCodeAt(4) | 32 /* kCharCode.CASE_DELTA */) === 115 /* kCharCode.s */;
        url = url.slice(isHttps ? 0 : 7, url.indexOf("/", 8) === url.length - 1 ? -1 : void 0);
        a.baseHttps_ = [ isHttps, url.slice(isHttps ? 8 : 0).split("/", 1)[0] ];
      }
      const sep = /[?#]/.exec(url), sep_index = sep ? sep.index + 1 : 0;
      if (sep_index && /%2f|%3a/i.test(url.slice(sep_index))) {
        const arg = VUtils_.decodeURL_(url.slice(sep_index), decodeURIComponent);
        url = sep[0] !== "#" && arg.includes("#") ? url : url.slice(0, sep_index) + arg;
      }
    } else {
      const endsWithSpace = url.trimRight().length !== url.length;
      url = VUtils_.decodeURL_(url, decodeURIComponent);
      url = (endsWithSpace ? url : url.trim()).replace(a.spacesRe_, " ");
    }
    if (!keyword || search && search.c) {
      a.reset_(url);
    } else {
      start = (start || 0) + keyword.length + 1;
      a.reset_(keyword + " " + url, start, start + url.length);
    }
  },
  isActive_: false,
  options_: null,
  inputText_: "",
  lastQuery_: null,
  useInput_: true,
  inputType_: 0,
  lastParsed_: "",
  completions_: null,
  total_: 0,
  maxPageNum_: Math.min(Math.max(3, window.VomnibarMaxPageNum | 0 || 10), 100),
  isEditing_: false,
  isInputComposing_: null,
  baseHttps_: null,
  isHttps_: null,
  isSearchOnTop_: false,
  actionType_: 0 /* ReuseType.current */ ,
  matchType_: 0 /* CompletersNS.MatchType.Default */ ,
  sugTypes_: 0 /* CompletersNS.SugType.Empty */ ,
  resMode_: "",
  focused_: false,
  showing_: false,
  codeFocusTime_: 0,
  codeFocusReceived_: false,
  blurWanted_: 0,
  showFavIcon_: 0,
  showRelevancy_: false,
  docZoom_: 1,
  lastScrolling_: 0,
  height_: 0,
  /** Parent page viewport height (CSS px) — used to keep the iframe on-screen */
  _hostViewH: 0,
  _canvas: null,
  input_: null,
  docSt_: null,
  bodySt_: null,
  inputBar_: null,
  barCls_: null,
  isSelOriginal_: true,
  lastKey_: 0 /* kKeyCode.None */ ,
  inOldShift_: 0,
  keyResult_: 0 /* SimpleKeyResult.Nothing */ ,
  list_: null,
  onUpdate_: null,
  onWndBlur2_: null,
  doEnter_: null,
  renderItems_: null,
  selection_: -1,
  afterHideTimer_: 0,
  timer_: 0,
  inAlt_: 0,
  _listenedAltDown: 0,
  noInputMode_: false,
  altChars_: null,
  wheelStart_: 0,
  wheelTime_: 0,
  wheelDelta_: 0,
  wheelSpeed_: 1,
  wheelMinStep_: 0,
  _nearWheelHasDeltaXY: 0,
  _nearWheelDeltaLimited: 0,
  browser_: 1 /* Build.BTypes */ /* BrowserType.Chrome */ ,
  browserVer_: 998 /* BrowserVer.assumedVer */ ,
  isEdg_: false,
  os_: 2 /* kOS.win */ ,
  mappedKeyRegistry_: null,
  keyLayout_: 0,
  maxMatches_: 0,
  queryInterval_: 0,
  // +tips/footer chrome (header tips + footer-tip). Final size remeasured after layout.
  heightIfEmpty_: 149,
  baseHeightIfNotEmpty_: 152,
  itemHeight_: 48 /* VomnibarNS.PixelData.Item */ ,
  wndRatioX_: .8 /* VomnibarNS.PixelData.WindowSizeRatioX */ ,
  maxWidthInPixel_: 1944 /* VomnibarNS.PixelData.MaxWidthInPixel */ ,
  tipEl_: null,
  tipTextEl_: null,
  tipModeEl_: null,
  footerTipEl_: null,
  styles_: "",
  customCss_: "",
  styleEl_: null,
  darkBtn_: null,
  last_scrolling_key_: 0 /* kKeyCode.None */ ,
  showTime_: 0,
  show_() {
    const a = Vomnibar_;
    a.showing_ = true;
    setTimeout(a.focus_, 0);
    document.body.addEventListener("wheel", a.onWheel_, {
      passive: false,
      capture: true
    });
  },
  hide_(fromContent) {
    const a = Vomnibar_, el = a.input_;
    a.isActive_ = a.showing_ = a.isEditing_ = a.codeFocusReceived_ = false;
    a.isInputComposing_ = a._canvas = null;
    a.codeFocusTime_ = a.blurWanted_ = a.inputType_ = a._listenedAltDown = 0;
    document.body.removeEventListener("wheel", a.onWheel_, {
      passive: false,
      capture: true
    });
    a.timer_ > 0 && clearTimeout(a.timer_);
    window.onkeyup = null;
    fromContent || VPort_ && VPort_.post_({
      H: 11 /* kFgReq.nextFrame */ ,
      t: 2 /* Frames.NextType.current */ ,
      o: !a.doEnter_,
      k: a.lastKey_
    });
    el.blur();
 // in case of a wrong IME state on Chrome 107 on v1.99.6
        a.bodySt_.display = "none";
    a.blurred_();
    a.docSt_.cssText = "";
    a.list_.style.height = a.lastParsed_ = a.list_.textContent = el.value = "";
    a.barCls_.remove("empty");
    a.list_.classList.remove("no-favicon");
    a.toggleAlt_();
    a.afterHideTimer_ = requestAnimationFrame(a.doEnter_ ? () => {
      a.afterHideTimer_ = requestAnimationFrame(a.AfterHide_);
    } : a.AfterHide_);
    a.timer_ = setTimeout(a.AfterHide_, a.doEnter_ ? 35 : 17);
  },
  AfterHide_() {
    const a = Vomnibar_;
    a.afterHideTimer_ && cancelAnimationFrame(a.afterHideTimer_);
    a.timer_ && clearTimeout(a.timer_);
    a.afterHideTimer_ = a.timer_ = 0;
    a.height_ && !a.isActive_ && a.onHidden_();
  },
  onHidden_() {
    VPort_ && VPort_.postToOwner_({
      N: 0
 /* VomnibarNS.kFReq.hide */    });
    const a = Vomnibar_;
    a.timer_ = a.height_ = a.matchType_ = a.sugTypes_ = a.wheelStart_ = a.wheelTime_ = a.actionType_ = a.inputType_ = a.total_ = a.lastKey_ = a.inOldShift_ = a.wheelDelta_ = VUtils_.timeCache_ = 0;
    a.docZoom_ = 1;
    a.options_ = a.completions_ = a.onUpdate_ = a.isHttps_ = a.baseHttps_ = a.lastQuery_ = null;
    a.mode_.q = a.inputText_ = a.resMode_ = "";
    a.mode_.o = "omni";
    a.mode_.t = 0 /* CompletersNS.SugType.Empty */;
    a.isSearchOnTop_ = false;
    VUtils_._cachedFavicons = {};
    a.doEnter_ && VPort_ ? setTimeout(a.doEnter_[0], 0) : /a?/.test("");
    a.doEnter_ = null;
  },
  reset_(input, start, end) {
    const a = Vomnibar_;
    /^\+\d\d?$/.test(input.trim()) && (start = end = 0, input = " " + input.trim());
    a.inputText_ = input;
    a.useInput_ = a.showing_ = false;
    a.isHttps_ = a.baseHttps_;
    a.mode_.q = a.lastQuery_ = input && input.trim().replace(a.spacesRe_, " ");
    a.isActive_ = true;
    a.AfterHide_();
 // clear afterHideTimer_
    // also clear @timer
        a.update_(0);
    a.init_ && a.init_();
    a.input_.value = a.inputText_;
    start <= end && a.input_.setSelectionRange(start, end);
    document.body.dataset.mode = a.mode_.o;
  },
  focus_(focus) {
    const a = Vomnibar_;
    if (!a.showing_) {
      a.codeFocusTime_ = 0;
      a.codeFocusReceived_ = false;
 // clean again, in case of unknown race conditions
            return;
    }
    a.codeFocusTime_ = performance.now();
    a.codeFocusReceived_ = false;
    if (focus !== false) {
      a.input_.focus();
      if (!a.codeFocusReceived_ || !a.focused_) {
        focus = focus ? focus | 0 : 0;
        focus < 9 /* TimerType.fake */ ? console.log(`Vomnibar: can not focus the input bar at the ${focus + 1} time` + (focus < 5 ? ", so retry in 33ms." : ".")) : console.log("Vomnibar: fail in focusing the input bar.");
        focus < 5 && setTimeout(a.focus_, 33, focus + 1);
      }
    } else {
      VPort_.post_({
        H: 11 /* kFgReq.nextFrame */ ,
        t: 2 /* Frames.NextType.current */ ,
        k: a.lastKey_
      });
    }
  },
  update_(updateDelay, callback) {
    const a = Vomnibar_;
    a.onUpdate_ = callback || null;
    if (updateDelay >= 0) {
      a.isInputComposing_ = null;
      a.timer_ > 0 && clearTimeout(a.timer_);
      if (updateDelay === 0) {
        return a.fetch_();
      }
    } else {
      if (a.timer_ > 0) {
        return;
      }
      updateDelay = a.queryInterval_;
    }
    a.timer_ = setTimeout(a.OnTimer_, updateDelay);
  },
  updateInput_() {
    const a = Vomnibar_, focused = a.focused_, blurred = a.blurWanted_;
    a.isSelOriginal_ = false;
    if (a.selection_ === -1) {
      a.isHttps_ = a.baseHttps_;
      a.isEditing_ = false;
      a.input_.value = a.inputText_;
      let arr = a._pageNumRe.exec(a.inputText_);
      if (arr && (!a.completions_.length || a.completions_[0].e !== "search")) {
        let i = a.inputText_.length - arr[0].length;
        a.input_.setSelectionRange(i, i);
      }
      if (!focused) {
        a.focus_();
        a.blurWanted_ = blurred;
      }
      return;
    }
    blurred && focused && a.input_.blur();
    const line = a.completions_[a.selection_];
    if (line.parsed_) {
      a._didUpdateInput(line, line.parsed_);
      return;
    }
    line.https_ == null && (line.https_ = line.u.startsWith("https://"));
    // Quick actions: keep the short ":cmd" form in the bar (never paste URL or long desc)
        if (line.e === "search" && (line.u.startsWith("vimium://qa/") || a.mode_.q.startsWith(":"))) {
      if (line.parsed_ == null) {
        VUtils_.ensureText_(line);
        line.parsed_ = line.t;
      }
      a._didUpdateInput(line, line.t);
      return;
    }
    if (line.e !== "history" && line.e !== "tab") {
      if (line.parsed_ == null) {
        VUtils_.ensureText_(line);
        line.parsed_ = "";
      }
      a._didUpdateInput(line, line.t);
      line.e === "math" && !blurred && a.input_.select();
      return;
    }
    const onlyUrl = !line.t, url = line.u;
    const ind = VUtils_.ensureText_(line);
    const useUrl = onlyUrl || !/[^\x00-\x7f]/.test(line.t);
    let str = useUrl ? url : VUtils_.decodeURL_(url, decodeURIComponent);
    if (!useUrl && str.length === url.length && url.includes("%")) {
      // has error during decoding
      str = line.t;
      if (ind) {
        str = str.lastIndexOf("://", 5) < 0 ? (ind === 7 /* ProtocolType.http */ ? "http://" : "https://") + str : str;
        str = url.endsWith("/") && !str.endsWith("/") ? str + "/" : str;
      }
    }
    VPort_.post_({
      H: 4 /* kFgReq.parseSearchUrl */ ,
      i: a.selection_,
      u: str
    });
  },
  parsed_({i: id, s: search}) {
    const line = Vomnibar_.completions_[id];
    line.parsed_ = search ? ((Vomnibar_.mode_.e ? Vomnibar_.mode_.e & 8 /* CompletersNS.SugType.search */ : Vomnibar_.mode_.o.endsWith("omni")) && !Vomnibar_.resMode_ ? "" : ":o ") + search.k + " " + search.u + " " : Vomnibar_.resMode_ + line.t;
    Vomnibar_.lastParsed_ = line.parsed_;
    id === Vomnibar_.selection_ && Vomnibar_._didUpdateInput(line, line.parsed_);
  },
  toggleInput_() {
    const a = Vomnibar_;
    if (a.selection_ < 0) {
      return;
    }
    if (a.isSelOriginal_) {
      a.inputText_ = a.input_.value;
      return a.updateInput_();
    }
    let line = a.completions_[a.selection_], str = a.input_.value.trim();
    a.resMode_ && (str = str.slice(a.resMode_.length));
    str = str === (line.title || line.u) ? line.parsed_ || a.resMode_ + (line.title === line.t ? line.u : line.t) : a.resMode_ + (line.title && str === line.u ? line.title : str === line.t ? line.u : line.t);
    a._didUpdateInput(line, str);
  },
  _didUpdateInput(line, str) {
    const maxW = str.length * 10, tooLong = maxW > innerWidth - 84 /* PixelData.AllHNotInput */;
    if (Vomnibar_.input_.value !== str) {
      Vomnibar_.input_.value = str;
      line.e === "domain" && Vomnibar_.input_.select();
    }
    tooLong && (Vomnibar_.input_.scrollLeft = maxW);
    Vomnibar_.isHttps_ = str === line.t && line.u.includes("://") ? [ line.https_, line.u.split("://")[1].split("/", 1)[0] ] : null;
    Vomnibar_.isEditing_ = str !== line.parsed_ || line.parsed_ === line.t;
  },
  updateSelection_(sel) {
    const a = Vomnibar_;
    const ref = a.list_.children, old = a.selection_;
    (a.isSelOriginal_ || old === -1) && (a.inputText_ = a.input_.value);
    a.selection_ = sel;
    a.updateInput_();
    old >= 1 && ref[old - 1].classList.remove("p");
    old >= 0 && ref[old].classList.remove("s");
    sel >= 1 && ref[sel - 1].classList.add("p");
    sel >= 0 && ref[sel].classList.add("s");
    // Keep selection visible when the list scrolls (long :action palettes)
        if (sel >= 0 && ref[sel]) {
      try {
        ref[sel].scrollIntoView({
          block: "nearest"
        });
        Vomnibar_.updateListScrollHint_();
      } catch (_a) {
        try {
          ref[sel].scrollIntoView(false);
        } catch (_b) {}
      }
    }
  },
  _keyNames: [ "space" /* kChar.space */ , "pageup" /* kChar.pageup */ , "pagedown" /* kChar.pagedown */ , "end" /* kChar.end */ , "home" /* kChar.home */ , "left" /* kChar.left */ , "up" /* kChar.up */ , "right" /* kChar.right */ , "down" /* kChar.down */ , "" /* kChar.None */ , "" /* kChar.None */ , "" /* kChar.None */ , "" /* kChar.None */ , "insert" /* kChar.insert */ , "delete" /* kChar.delete */ ],
  _codeCorrectionMap: [ "Semicolon", "Equal", "Comma", "Minus", "Period", "Slash", "Backquote", "BracketLeft", "Backslash", "BracketRight", "Quote", "IntlBackslash" ],
  _modifierKeys: {
    Alt: 1,
    AltGraph: 1,
    Control: 1,
    Meta: 1,
    OS: 1,
    Shift: 1
  },
  keyIdCorrectionOffset_old_cr_: 0,
  _getKeyName(event) {
    let s, i = event.keyCode;
    return i > 31 && i < 47 /* kKeyCode.minNotDelete */ ? i < 33 && (s = event.key).length > 1 ? s.toLowerCase() : Vomnibar_._keyNames[i - 32 /* kKeyCode.space */ ] : i < 47 /* kKeyCode.minNotDelete */ || i === 91 /* kKeyCode.metaKey */ || i === 93 /* kKeyCode.osRight_mac */ && !Vomnibar_.os_ ? i === 8 /* kKeyCode.backspace */ ? "backspace" /* kChar.backspace */ : i === 27 /* kKeyCode.esc */ ? "esc" /* kChar.esc */ : i === 9 /* kKeyCode.tab */ ? "tab" /* kChar.tab */ : i === 13 /* kKeyCode.enter */ ? "enter" /* kChar.enter */ : (i < 19 ? i > 15 : i > 90 /* kKeyCode.maxNotMetaKey */) ? Vomnibar_.keyLayout_ > 63 && Vomnibar_.keyLayout_ >> 6 /* kKeyLayout.MapModifierOffset */ === event.location ? "modifier" /* kChar.Modifier */ : i !== 91 /* kKeyCode.osLeft */ && i !== 93 /* kKeyCode.osRight_mac */ || Vomnibar_.os_ ? i === 18 /* kKeyCode.altKey */ ? "alt" /* kChar.Alt */ : " " /* kChar.INVALID */ : "meta" /* kChar.Meta */ : "" /* kChar.None */ : i === 93 /* kKeyCode.menuKey */ ? "contextmenu" /* kChar.Menu */ : ((s = event.key) ? /^F\d/.test(s) : i > 111 /* kKeyCode.maxNotFn */ && i < 132 /* kKeyCode.minNotFn */) ? "f" + (s ? s.slice(1) : i - 111 /* kKeyCode.maxNotFn */) : s && s.length > 1 && !Vomnibar_._modifierKeys[s] ? s.toLowerCase() : "" /* kChar.None */;
  },
  _getKeyCharUsingKeyIdentifier_old_cr: 0,
  char_(event) {
    const shiftKey = event.shiftKey;
    let key = event.key;
    let isDeadKey = key === "Dead" || key === "Unidentified";
    let code = event.code;
    if (Vomnibar_.keyLayout_ & 1 /* kKeyLayout.alwaysIgnore */ || Vomnibar_.keyLayout_ & 8 /* kKeyLayout.ignoreIfAlt */ && event.altKey || isDeadKey || key > "~" /* kChar.maxASCII */ && key.length === 1) {
      let prefix = code.slice(0, 3);
      let isKeyShort = key.length < 2 || isDeadKey;
      let mapped;
      if (prefix !== "Num") {
        // not (Numpad* or NumLock)
        prefix !== "Key" && prefix !== "Dig" && prefix !== "Arr" || (code = code.slice(code < "K" ? 5 : 3));
        key = code.length === 1 && isKeyShort ? !shiftKey || code < "0" || code > "9" ? code : ")!@#$%^&*(" /* kChar.EnNumTrans */ [+code] : Vomnibar_._modifierKeys[key] ? Vomnibar_.keyLayout_ > 63 && Vomnibar_.keyLayout_ >> 6 /* kKeyLayout.MapModifierOffset */ === event.location ? "modifier" /* kChar.Modifier */ : key !== "Meta" || Vomnibar_.os_ ? key === "Alt" ? "alt" /* kChar.Alt */ : "" : "meta" /* kChar.Meta */ : key === "Escape" ? "esc" /* kChar.esc */ : code.length < 2 || !isKeyShort ? key.startsWith("Arrow") && key.slice(5) || key : (mapped = Vomnibar_._codeCorrectionMap.indexOf(code)) < 0 ? code : ";=,-./`[\\]'\\:+<_>?~{|}\"|" /* kChar.CharCorrectionList */ [mapped + 12 * +shiftKey];
      }
      key = shiftKey && key.length < 2 ? key : key.toLowerCase();
    } else {
      key = key.length > 1 || key === " " ? (Vomnibar_._getKeyName(event) || key.toLowerCase()).trim() : shiftKey ? key.toUpperCase() : key.toLowerCase();
    }
    return key;
  },
  hasShift_: 0,
  getMappedKey_(event) {
    const char = Vomnibar_.char_(event);
    let mapped, key = char;
    if (char) {
      let baseMod = `${event.altKey ? "a-" : ""}${event.ctrlKey ? "c-" : ""}${event.metaKey ? "m-" : ""}`, chLower = char.toLowerCase(), isLong = char.length > 1, mod = event.shiftKey && (isLong || baseMod && char.toUpperCase() !== chLower) ? baseMod + "s-" : baseMod;
      char.length === 1 || char.length > 1 && char === chLower || console.error(`Assert error: Vomnibar_.key_ get an invalid char of "${char}" !`);
      key = isLong || mod ? mod + chLower : char;
      if (Vomnibar_.mappedKeyRegistry_) {
        mapped = Vomnibar_.mappedKeyRegistry_[key + ":o" /* GlobalConsts.OmniModeId */ ] || Vomnibar_.mappedKeyRegistry_[key];
        mapped = mapped || (!isLong && (mapped = Vomnibar_.mappedKeyRegistry_[chLower]) && mapped.length < 2 && (baseMod = mapped.toUpperCase()) !== mapped ? mod ? mod + mapped : char === chLower ? mapped : baseMod : "");
      }
    }
    return mapped ? {
      mapped: true,
      key: mapped
    } : {
      mapped: false,
      key
    };
  },
  ctrlCharOrShiftKeyMap_: {
    // for Ctrl / Meta
    space: 9 /* AllowedActions.toggle */ ,
    j: 8 /* AllowedActions.down */ ,
    k: 6 /* AllowedActions.up */ ,
    n: 8 /* AllowedActions.down */ ,
    p: 6 /* AllowedActions.up */ ,
    "[": 1 /* AllowedActions.dismiss */ ,
    "]": 9,
    up: 10 /* AllowedActions.pageup */ ,
    down: 11 /* AllowedActions.pagedown */ ,
    tab: 6 /* AllowedActions.up */ ,
    delete: 12
 /* AllowedActions.remove */  },
  normalMap_: {
    tab: 8 /* AllowedActions.down */ ,
    esc: 1 /* AllowedActions.dismiss */ ,
    pageup: 10 /* AllowedActions.pageup */ ,
    pagedown: 11 /* AllowedActions.pagedown */ ,
    up: 6 /* AllowedActions.up */ ,
    down: 8 /* AllowedActions.down */ ,
    f1: 4 /* AllowedActions.backspace */ ,
    f2: 5 /* AllowedActions.blur */ ,
    alt2: 19
 /* AllowedActions.altAtOnce */  },
  onKeydown_(event) {
    const a = Vomnibar_, n = event.keyCode, focused = a.focused_, {mapped, key} = n !== 229 /* kKeyCode.ime */ ? a.getMappedKey_(event) : {
      mapped: false,
      key: ""
    };
    a.lastKey_ = a.os_ || !event.metaKey ? n : 0;
    a.inOldShift_ = event.shiftKey && !(n === 16 /* kKeyCode.shiftKey */ && !event.repeat) && (n !== 16 /* kKeyCode.shiftKey */ && key.length === 1 || a.inOldShift_);
    if (!key) {
      a.inAlt_ && !a._modifierKeys[event.key] && a.toggleAlt_();
      a.keyResult_ = !focused || n === 93 /* kKeyCode.menuKey */ && a.os_ || n === 229 /* kKeyCode.ime */ ? 0 /* SimpleKeyResult.Nothing */ : 1 /* SimpleKeyResult.Suppress */;
      return;
    }
    if (key.startsWith("v-")) {
      VPort_.post_({
        H: 39 /* kFgReq.keyFromOmni */ ,
        k: `<${key}>`,
        l: n,
        e: focused ? [ a.input_.localName, a.input_.id, a.input_.className ] : [ "body", "", "" ]
      });
      a.inAlt_ && a.toggleAlt_();
      return;
    }
    let ind, action = 0 /* AllowedActions.nothing */;
    const char = key.slice(key.lastIndexOf("-") + 1) || key && "-" /* kChar.minus */ , mainModifier = key.includes("-", 1) ? key[0] : "";
    if (char === "enter" /* kChar.enter */) {
      event.metaKey || event.key !== "Enter" && n !== 13 /* kKeyCode.enter */ ? a.onEnter_(key) : window.onkeyup = a.OnNativeEnterUp_.bind(null, key, mapped);
      return;
    }
    if (mainModifier === "a" || mainModifier === "m" && !a.os_) {
      ind = char >= "0" && char <= "9" ? +char || 10 : mapped || !event.shiftKey ? -1 : event.code ? event.code.startsWith("Digit") ? +event.code.slice(5) || 10 : -1 : n > 47 /* kKeyCode.maxNotNum */ && n < 58 /* kKeyCode.minNotNum */ ? n - 48 /* kKeyCode.N0 */ || 10 : -1;
      if (ind >= 0 && (a.os_ || mainModifier === "m" || /[cm]-/.test(key))) {
        ind <= a.completions_.length && a.onEnter_(char >= "0" && char <= "9" || -2, ind - 1);
        return;
      }
      if (/^([am]-modifier|a-alt|m-meta)$/.test(key)) {
        if (a.inAlt_ === 1 ? !event.repeat : a.inAlt_ === 0) {
          a._listenedAltDown = char === "modifier" /* kChar.Modifier */ || mapped ? n : char;
          addEventListener("keyup", a._onAltUp, true);
          a.inAlt_ = a.inAlt_ || -setTimeout(a.toggleAlt_, 260, 1);
        }
        return;
      }
      a.inAlt_ > 0 ? a._onAltUp() : a.toggleAlt_();
      if (char === "down" /* kChar.down */ || char === "up" /* kChar.up */ || /^[jknp]$/.test(char)) {
        return a.onAction_(char < "o" && char !== "k" ? 8 /* AllowedActions.down */ : 6 /* AllowedActions.up */);
      }
    }
    if (mainModifier && mainModifier < "s" && focused) {
      if (!(char !== "left" /* kChar.left */ && char !== "right" /* kChar.right */ || key.includes("m-"))) {
        action = (key.includes("s-") ? char > "r" /* kChar.r */ ? 71 /* kCharCode.G */ : 72 /* kCharCode.H */ : char > "r" /* kChar.r */ ? 70 /* kCharCode.F */ : 66 /* kKeyCode.B */) - 64 /* kCharCode.maxNotAlphabet */;
        if (mapped || mainModifier !== (a.os_ ? "c" : "a")) {
          a.onWordAction_(action);
        } else {
          VUtils_.nextTask_(a.onWordAction_.bind(0, action, true));
 // `setTimeout` may be too late on Chrome in WSLg
                    a.keyResult_ = 1 /* SimpleKeyResult.Suppress */;
        }
        return;
      }
      if (char === "backspace" /* kChar.backspace */) {
        mainModifier > "a" || !a.os_ && !key.includes("a-c-") ? // treat <a-c-***> on macOS as <a-***> on Windows
        // -2 is for https://www.reddit.com/r/firefox/comments/767bha/how_to_make_cmdbackspace_better_on_macos/
        a.onWordAction_(mainModifier < "m" ? -1 : key.includes("s-") ? -3 : -2) : a.os_ < 2 /* kOS.win */ || key.includes("a-c-") ? document.execCommand(key.includes("s-") ? "redo" : "undo") : a.keyResult_ = 1 /* SimpleKeyResult.Suppress */;
        return;
      }
    }
    if (mainModifier === "a" || mainModifier === "m") {
      if (char === "f2" /* kChar.f2 */) {
        return a.onAction_(focused ? 3 /* AllowedActions.blurInput */ : 2 /* AllowedActions.focus */);
      }
      if (focused && char.length === 1 && "bdfw".includes(char) && (!a.os_ || key !== "a-d")) {
        return a.onWordAction_(char.charCodeAt(0) - 96 /* kCharCode.CASE_DELTA */ , 0, key.includes("s-") ? 3 : 0);
      }
      if (key === "a-c-c" || key === "a-m-c") {
        return a.onAction_(17 /* AllowedActions.copyPlain */);
      }
      if (mainModifier === "a") {
        a.keyResult_ = 0 /* SimpleKeyResult.Nothing */;
        return;
      }
    }
    if (mainModifier === "c" || mainModifier === "m") {
      if (char === "c" /* kChar.c */) {
        action = a.selection_ >= 0 && getSelection().type !== "Range" ? key.includes("s") ? 16 /* AllowedActions.copyWithTitle */ : 13 /* AllowedActions.copy */ : key.includes("s") ? 17 /* AllowedActions.copyPlain */ : a.os_ || key !== "c-c" ? 0 /* AllowedActions.nothing */ : 13 /* AllowedActions.copy */;
      } else if (key !== "c-v" || a.os_) {
        if (key === "c-d" && a.os_) {
          return a.onWordAction_(4 /* kCharCode.maxNotAlphabet */);
        }
        if (key.includes("s-")) {
          action = char === "f" /* kChar.f */ ? 11 /* AllowedActions.pagedown */ : char === "b" /* kChar.b */ ? 10 /* AllowedActions.pageup */ : char === "v" /* kChar.v */ ? 18 /* AllowedActions.pastePlain */ : 0 /* AllowedActions.nothing */;
        } else {
          if (char === "up" /* kChar.up */ || char === "down" /* kChar.down */ || char === "end" /* kChar.end */ || char === "home" /* kChar.home */) {
            event.preventDefault();
            a.lastScrolling_ = event.timeStamp;
            a.last_scrolling_key_ = -n;
            window.onkeyup = Vomnibar_.HandleKeydown_;
            VPort_.postToOwner_({
              N: 6 /* VomnibarNS.kFReq.scroll */ ,
              k: key,
              b: char
            });
            return;
          }
          char === "delete" /* kChar.delete */ || char === "tab" /* kChar.tab */ ? a.keyResult_ = 1 /* SimpleKeyResult.Suppress */ : action = (n !== 32 /* kKeyCode.space */ || mainModifier === "c") && a.ctrlCharOrShiftKeyMap_[char] || 0 /* AllowedActions.nothing */;
        }
      } else {
        action = 18 /* AllowedActions.pastePlain */;
      }
    } else if (mainModifier === "s") {
      action = (n !== 32 /* kKeyCode.space */ || !a.inOldShift_) && a.ctrlCharOrShiftKeyMap_[char] || 0 /* AllowedActions.nothing */;
    } else if (action = a.normalMap_[char] || 0 /* AllowedActions.nothing */) {} else {
      if (char > "f0" /* kChar.maxNotF_num */ && char < "f:" /* kChar.minNotF_num */) {
        // "f" + N
        a.keyResult_ = 0 /* SimpleKeyResult.Nothing */;
        return;
      }
      if (!focused || char !== "home" /* kChar.home */ && char !== "end" /* kChar.end */) {
        if (n === 8 /* kKeyCode.backspace */) {
          focused && (a.keyResult_ = 1 /* SimpleKeyResult.Suppress */);
          return;
        }
        if (char !== "space" /* kChar.space */) {} else if (focused) {
          if (!mapped && (a.selection_ >= 0 || a.completions_.length <= 1) && a.input_.value.endsWith(a.lastParsed_.endsWith(" ") ? "   " : "  ")) {
            return a.onEnter_(true);
          }
        } else {
          action = 2 /* AllowedActions.focus */;
        }
      } else {
        // home/end on macOS scrolls a page if possible
        action = char > "h" /* kChar.h */ ? 14 /* AllowedActions.home */ : 15 /* AllowedActions.end */;
      }
    }
    if (action) {
      return a.onAction_(action);
    }
    if (focused || char.length !== 1 || isNaN(ind = parseInt(char, 10))) {
      a.keyResult_ = (focused ? n !== 93 /* kKeyCode.menuKey */ || !a.os_ : key.length > 1) ? 1 /* SimpleKeyResult.Suppress */ : 0 /* SimpleKeyResult.Nothing */;
    } else {
      ind = ind || 10;
      ind <= a.completions_.length && a.onEnter_(key, ind - 1);
    }
  },
  onAction_(action) {
    const a = Vomnibar_;
    let sel;
    switch (action) {
     case 1 /* AllowedActions.dismiss */ :
      const selection = getSelection();
      if (selection.type !== "Range" || !a.focused_) {
        return a.hide_();
      }
      {
        const el = a.input_;
        sel = el.selectionDirection !== "backward" && el.selectionEnd < el.value.length ? el.selectionStart : el.selectionEnd;
        el.setSelectionRange(sel, sel);
      }
      break;

     case 2 /* AllowedActions.focus */ :
      a.focus_();
      break;

     case 3 /* AllowedActions.blurInput */ :
      a.blurWanted_ = 1;
      a.input_.blur();
      break;

     case 4 /* AllowedActions.backspace */ :
     case 5 /* AllowedActions.blur */ :
      a.focused_ ? action === 5 /* AllowedActions.blur */ ? a.focus_(false) : document.execCommand("delete") : a.focus_();
      break;

     case 6 /* AllowedActions.up */ :
     case 8 /* AllowedActions.down */ :
      if (a.timer_) {
        a.onUpdate_ = () => {
          Vomnibar_.selection_ = -1, Vomnibar_.isSelOriginal_ = false;
          Vomnibar_.onAction_(action);
        };
        a.timer_ > 0 && a.update_(0, a.onUpdate_);
        return;
      }
      sel = a.completions_.length + 1;
      sel = (sel + a.selection_ + (action - 6 /* AllowedActions.up */)) % sel - 1;
      return a.updateSelection_(sel);

     case 9 /* AllowedActions.toggle */ :
      return a.toggleInput_();

     case 10 /* AllowedActions.pageup */ :
     case 11 /* AllowedActions.pagedown */ :
      return a.goPage_(action !== 10 /* AllowedActions.pageup */);

     case 12 /* AllowedActions.remove */ :
      return a.removeCur_();

     case 13 /* AllowedActions.copy */ :
     case 16 /* AllowedActions.copyWithTitle */ :
      let item = a.completions_[a.selection_], title = item.title, type = item.e, math = type === "math";
      let mathSearch = !a.selection_ && a.completions_.length > 1 && a.completions_[1].e === "math";
      VUtils_.ensureText_(item);
      title = action !== 16 /* AllowedActions.copyWithTitle */ || type === "search" || math || title === item.u || title === item.t ? "" : title;
      return VPort_.post_({
        H: 42 /* kFgReq.omniCopy */ ,
        t: math ? item.textSplit + " = " + item.t : title,
        u: math ? "" : mathSearch ? a.completions_[1].t : item.u
      });

     case 17 /* AllowedActions.copyPlain */ :
     case 18 /* AllowedActions.pastePlain */ :
      const navClip = navigator.clipboard;
      const plain = action === 17 /* AllowedActions.copyPlain */ ? getSelection() + "" : "";
      action === 17 /* AllowedActions.copyPlain */ ? plain && navClip.writeText(plain) : document.execCommand("paste");
      action === 17 /* AllowedActions.copyPlain */ && plain && VPort_.post_({
        H: 43 /* kFgReq.omniCopied */ ,
        t: plain
      });
      break;

     case 14 /* AllowedActions.home */ :
     case 15 /* AllowedActions.end */ :
      sel = action === 14 /* AllowedActions.home */ ? 0 : a.input_.value.length;
      a.input_.setSelectionRange(sel, sel);
      a.input_.scrollLeft = sel ? a.input_.scrollWidth : 0;
      break;

     case 19 /* AllowedActions.altAtOnce */ :
      a.toggleAlt_(Vomnibar_.inAlt_ ? 0 : 1);
      break;
    }
  },
  // b(2): left; d(4): right-extend-delete; f(6): right; (7): right-extend; (8): left-extend; w: left-delete
  // -1: delete a left word; -2: delete from current to start; -3: delete all
  onWordAction_(code, delayed, mode) {
    const BTy = 1 /* Build.BTypes */;
    const re = /[^\p{L}\p{Nd}_]+/u;
    const isDel = code === 4 || code < 0 || code > 9;
    const isExtend = isDel || code > 6 || mode === 3, isRight = code > 3 && code < 8;
    const input = Vomnibar_.input_, spacesRe = /\s+/;
    delayed || code < -1 || isDel && input.selectionStart !== input.selectionEnd || getSelection().modify(isExtend ? "extend" : "move", isRight ? "forward" : "backward", mode === 2 ? "character" : "word");
    const {value: str, selectionStart: start, selectionEnd: end} = input;
    let isFwd = input.selectionDirection !== "backward", anchor0 = isFwd ? start : end, focus1 = isFwd ? end : start;
    let s1, a2 = anchor0, focus = focus1;
    // test string: " a+ bc +dw+ef  + daf + ++  +++  sdf fas sdd  "
        if (code < -1) {
      // Cmd (+ Shift)? + backspace
      a2 = 0, focus = code < -2 ? str.length : end;
    } else if (isDel && anchor0 !== focus1) {} else if (mode && mode < 3) {} else {
      const notNewCr = !(BTy & 1 /* BrowserType.Chrome */) || false /* BrowserVer.MinOnWindows$Selection$$extend$stopWhenWhiteSpaceEnd */ /* BrowserVer.MinOnWindows$Selection$$extend$stopWhenWhiteSpaceEnd */;
      while (focus > 0 && re.test(s1 = str[focus] || "") && (!isExtend || spacesRe.test(s1) || (s1 = str[focus - 1] || "") && !spacesRe.test(s1) && re.test(s1))) {
        if (notNewCr) {
          isRight ? focus++ : focus--;
          continue;
        }
        getSelection().modify(isExtend ? "extend" : "move", isRight ? "forward" : "backward", spacesRe.test(s1) ? "character" : "word");
        focus = input.selectionDirection !== "backward" ? input.selectionEnd : input.selectionStart;
      }
      notNewCr || (focus1 = focus);
    }
    if (a2 !== anchor0 || focus !== focus1) {
      isExtend || (a2 = focus);
      input.setSelectionRange(focus < a2 ? focus : a2, focus < a2 ? a2 : focus, focus < a2 ? "backward" : "forward");
    }
    isDel && a2 !== focus && document.execCommand("delete");
    const {scrollWidth: sw, clientWidth: cw} = input;
    if (sw < cw + 1) {
      return;
    }
    const curPos = input.scrollLeft, st = getComputedStyle(input), font = st.font;
    const canvas = Vomnibar_._canvas || (Vomnibar_._canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font !== font && (context.font = font);
    const nearLeft = focus + focus < str.length;
    const textWidth = context.measureText(nearLeft ? str.slice(0, focus) : str.slice(focus)).width;
    const focusPos = (nearLeft ? textWidth + (0 | +st.paddingLeft) + (0 | +st.paddingRight) : sw - textWidth) - cw;
    (curPos < focusPos + 4 ? curPos < sw - cw : curPos > focusPos + cw - 4 && curPos > 0) && (input.scrollLeft = Math.min(Math.max(0, curPos < focusPos + 4 ? focusPos + 40 : focusPos + cw - 40), sw - cw));
  },
  _pageNumRe: /(?:^|\s)(\+\d{0,2})$/,
  goPage_(dirOrNum) {
    const a = Vomnibar_;
    if (a.isSearchOnTop_) {
      return;
    }
    const len = a.completions_.length, n = a.mode_.r;
    let delta = +dirOrNum || -1, str = (a.isSelOriginal_ || a.selection_ < 0 ? a.input_.value : a.inputText_).trimRight();
    let arr = a._pageNumRe.exec(str), i = (arr && arr[0]) | 0;
    if (len >= n) {
      delta *= n;
    } else if (i > 0 && delta < 0) {
      delta *= i >= n ? n : 1;
    } else if (len < (len && a.completions_[0].e !== "tab" ? n : 3)) {
      return;
    }
    const dest = Math.min(Math.max(0, i + delta), a.maxPageNum_ * n - n);
    if (delta > 0 && (dest === i || dest >= a.total_ && a.total_ > 0)) {
      return;
    }
    arr && (str = str.slice(0, -arr[0].length));
    str = str.trimRight();
    i = Math.min(a.input_.selectionEnd, str.length);
    dest > 0 && (str += " +" + dest);
    const oldStart = a.input_.selectionStart, oldDi = a.input_.selectionDirection;
    a.input_.value = str;
    a.input_.setSelectionRange(oldStart, i, oldDi);
    a.isInputComposing_ = null;
    a.update_(0);
  },
  onEnter_(event, newSel) {
    var _a;
    const a = Vomnibar_, options = a.options_;
    let sel = newSel != null ? newSel : a.selection_;
    typeof event === "string" && (event = (event.includes("a-") ? 1 /* KeyStat.altKey */ : 0) + (event.includes("c-") ? 2 /* KeyStat.ctrlKey */ : 0) + (event.includes("m-") ? 4 /* KeyStat.metaKey */ : 0) + (event.includes("s-") ? 8 /* KeyStat.shiftKey */ : 0));
    const eventKey = typeof event === "number" && event >= 0 ? event : 0;
    a.actionType_ = event == null ? a.actionType_ : event === true ? null : event === -2 ? -2 /* ReuseType.newBg */ : event & 14 /* KeyStat.shiftKey */ && options.clickLike ? a.parseClickEventAs_(event) : event & 6 /* KeyStat.PrimaryModifier */ ? event & 8 /* KeyStat.shiftKey */ ? -2 /* ReuseType.newBg */ : -1 /* ReuseType.newFg */ : event & 8 /* KeyStat.shiftKey */ ? 0 /* ReuseType.current */ : null;
    if (sel === -1) {
      const input = a.input_.value.trim();
      if (!input) {
        return;
      }
      if ((options.searchInput === false || options.itemField) && !event && !input.includes("://")) {
        if (!input.includes(":")) {
          return;
        }
        try {
          new URL(input);
        } catch (_b) {
          return;
        }
      }
    }
    if (newSel == null && a.timer_) {
      if (!a.isEditing_) {
        if (a.timer_ > 0) {
          return a.update_(0, a.onEnter_);
        }
        a.onUpdate_ = a.onEnter_;
        return;
      }
      sel = -1;
    }
    const useItem = sel >= 0, testUrl = options.testUrl;
    const item = useItem ? a.completions_[sel] : {
      u: a.input_.value.trim()
    }, inputSed = options.sed, sed2 = options.itemSedKeys || null, itemSed = sed2 ? {
      r: true,
      k: sed2 + ""
    } : null, itemKeyword = options.itemKeyword, field = options.itemField, action = (_a = a.actionType_) !== null && _a !== void 0 ? _a : options.newtab ? -1 /* ReuseType.newFg */ : 0 /* ReuseType.current */ , https = a.isHttps_, navReq = !useItem || item.s == null || itemSed || itemKeyword ? {
      H: 8 /* kFgReq.openUrl */ ,
      f: false,
      r: action,
      h: useItem ? null : https && ("." + item.u.split("/", 1)[0]).endsWith("." + https[1]) ? https[0] : null,
      u: field && useItem ? field in item ? item[field] + "" : "" : item.u,
      o: {
        i: options.incognito,
        s: useItem ? itemSed || {
          r: false,
          k: ""
        } : typeof inputSed === "object" ? inputSed instanceof Array ? null : inputSed : {
          r: inputSed,
          k: options.inputSedKeys || options.sedKeys || options.sedKey
        },
        k: (useItem || !field) && itemKeyword || null,
        p: options.position,
        t: useItem ? !!testUrl : testUrl != null ? testUrl : "whole"
      }
    } : null, sessionReq = navReq ? null : {
      H: 7 /* kFgReq.gotoSession */ ,
      a: a.actionType_ === null ? 1 : action === -1 /* ReuseType.newFg */ ? 2 : 0,
      s: item.s
    }, func = () => {
      VPort_ && (navReq ? Vomnibar_.navigateToUrl_(navReq, action) : Vomnibar_.gotoSession_(sessionReq, item.e === "tab"));
      /a?/.test("");
    };
    if (!useItem && eventKey & 1 /* KeyStat.altKey */ && action > -2 /* ReuseType.newBg */ && /^\w+(-\w+)?$/.test(item.u)) {
      const domains = a.completions_.filter(i => i.e === "domain");
      navReq.u = domains.length ? domains[0].u : `www.${item.u}.com`;
    }
    if (action > -2 /* ReuseType.newBg */ || eventKey & 1 /* KeyStat.altKey */) {
      a.doEnter_ = [ func, action ];
      a.hide_();
    } else {
      func();
    }
  },
  OnNativeEnterUp_(key, mapped, event) {
    const keyCode = event.keyCode;
    if (event.isTrusted) {
      // call onEnter once an enter / modifier key is up
      window.onkeyup = null;
      const a = Vomnibar_, key2 = key !== "enter" /* kChar.enter */ || mapped ? key : (event.altKey || keyCode === 18 /* kKeyCode.altKey */ ? 1 /* KeyStat.altKey */ : 0) + (event.ctrlKey || keyCode === 17 /* kKeyCode.ctrlKey */ ? 2 /* KeyStat.ctrlKey */ : 0) + (event.metaKey || keyCode > 90 /* kKeyCode.maxNotMetaKey */ && keyCode < 94 /* kKeyCode.minNotMetaKeyOrMenu */ ? 4 /* KeyStat.metaKey */ : 0) + (event.shiftKey || keyCode === 16 /* kKeyCode.shiftKey */ ? 8 /* KeyStat.shiftKey */ : 0);
      if (!a.isActive_) {
        return;
      }
      a.lastKey_ = 0 /* kKeyCode.None */;
      a.onEnter_(key, (typeof key2 === "string" ? key2 === "a-enter" /* kChar.enter */ : key2 === 1 /* KeyStat.altKey */) ? !a.selection_ && a.isSelOriginal_ ? -1 : a.selection_ : null);
    }
  },
  parseClickEventAs_(event) {
    const a = Vomnibar_, type = a.options_.clickLike === true ? "chrome" : a.options_.clickLike + "", hasCtrl = event & 6 /* KeyStat.PrimaryModifier */ , hasShift = event & 8 /* KeyStat.shiftKey */ , likeVivaldi = type.endsWith("2") ? type.includes("chro") : type.includes("viva");
    return likeVivaldi ? hasCtrl ? hasShift ? 2 /* ReuseType.newWnd */ : -2 /* ReuseType.newBg */ : -1 : hasCtrl ? !!hasShift !== !!a.options_.activeOnCtrl ? -1 /* ReuseType.newFg */ : -2 /* ReuseType.newBg */ : 2 /* ReuseType.newWnd */;
  },
  removeCur_() {
    if (Vomnibar_.selection_ < 0 || Vomnibar_.timer_) {
      return;
    }
    const completion = Vomnibar_.completions_[Vomnibar_.selection_], type = completion.e;
    if (type !== "tab" && (type !== "history" || completion.s != null)) {
      VPort_.post_({
        H: 25 /* kFgReq.removeSug */ ,
        t: "e"
      });
      return;
    }
    VPort_.post_({
      H: 25 /* kFgReq.removeSug */ ,
      t: type,
      s: completion.s,
      u: completion.u
    });
    Vomnibar_.refresh_();
  },
  onClick_(event) {
    const a = Vomnibar_;
    let el = event.target;
    if (!event.isTrusted || event.button || el === a.input_ || getSelection().type === "Range") {
      return;
    }
    if (el === a.input_.parentElement) {
      return a.focus_();
    }
    if (a.timer_) {
      VUtils_.Stop_(event, 1);
      return;
    }
    while (el && el.parentElement !== a.list_) {
      el = el.parentElement;
    }
    if (!el) {
      return;
    }
    a.lastKey_ = 0 /* kKeyCode.None */;
    VUtils_.Stop_(event, 1);
    a.onEnter_(event.altKey | event.ctrlKey * 2 | event.metaKey * 4 | event.shiftKey * 8, [].indexOf.call(a.list_.children, el));
  },
  OnMenu_(event) {
    let item, el = event.target, Anchor = HTMLAnchorElement;
    el instanceof Anchor || (el = el.parentElement);
    if (!(el instanceof Anchor) || el.href) {
      return;
    }
    for (item = el; item && item.parentElement !== Vomnibar_.list_; item = item.parentElement) {}
    const ind = [].indexOf.call(Vomnibar_.list_.children, item);
    ind >= 0 && (el.href = Vomnibar_.completions_[ind].u);
  },
  OnSelect_() {
    let el = this;
    if (el.selectionStart !== 0 || el.selectionDirection !== "backward") {
      return;
    }
    let left = el.value, end = el.selectionEnd - 1;
    if (left.charCodeAt(end) !== 32 /* kCharCode.space */ || end === left.length - 1) {
      return;
    }
    left = left.slice(0, end).trimRight();
    left.includes(" ") || el.setSelectionRange(0, left.length, "backward");
  },
  OnTimer_() {
    VPort_ && Vomnibar_.isActive_ && Vomnibar_.fetch_();
  },
  onWheel_(event) {
    if (event.ctrlKey || event.metaKey || !event.isTrusted) {
      return;
    }
    const a = Vomnibar_, input = a.input_;
    const {target, deltaX: rawDeltaX, deltaY: rawDeltaY, deltaMode: mode} = event;
    const deltaX = !rawDeltaY || rawDeltaX && Math.abs(rawDeltaX / rawDeltaY) > 1 ? rawDeltaX : 0;
    const deltaY = deltaX ? 0 : rawDeltaY, hasXAndY = rawDeltaX && rawDeltaY, absDelta = Math.abs(deltaY || deltaX);
    let total = 0, scale = 0;
    hasXAndY && (a._nearWheelHasDeltaXY = 1);
    let notTouchpad = mode === /*WheelEvent.DOM_DELTA_LINE*/ 1 ? 2 : !mode && !hasXAndY && !!absDelta && 3;
    if (notTouchpad === 3) {
      const legacyWheelDelta = deltaX ? event.wheelDeltaX : event.wheelDeltaY;
      const absLegacyDelta = legacyWheelDelta && Math.abs(legacyWheelDelta) || 0;
      const absMinStep = Math.abs(a.wheelMinStep_);
      scale = absLegacyDelta ? absLegacyDelta / absDelta : 0;
      // if touchpad, then 1) isScaled; 2) absDelta should be int, unless on firefox + non-mac
            const isScaled = !!scale && Math.abs(absLegacyDelta / Math.round(scale) - absDelta) <= 1 && (absDelta | 0) === absDelta;
      a._nearWheelDeltaLimited = Math.max(-9, Math.min(a._nearWheelDeltaLimited + (absDelta < 12 ? 1 : -1), 9));
      notTouchpad = absLegacyDelta && !isScaled || absMinStep > 9 && (absDelta >= absMinStep || absLegacyDelta >= absMinStep) && !a._nearWheelHasDeltaXY ? 2 : !a._nearWheelHasDeltaXY && (a.os_ ? (absDelta | 0) === absDelta && absDelta >= 20 && (absLegacyDelta ? absDelta % 10 === 0 || absLegacyDelta >= 80 && absLegacyDelta % 10 === 0 : a._nearWheelDeltaLimited < 3) : absDelta >= 4 && a._nearWheelDeltaLimited < (/* safari or (chrome w/o legacy) */ (absDelta | 0) !== absDelta ? 5 : 3));
    }
    notTouchpad === 2 && (a._nearWheelHasDeltaXY = a._nearWheelDeltaLimited = 0);
    if (!a.isActive_ || target == input && deltaX && (deltaX < 0 ? input.scrollLeft > 0 : input.scrollLeft + .01 < input.scrollWidth - input.clientWidth)) {
      a.wheelDelta_ = 0;
      return;
    }
    // Overflowed result list: native scroll (do not preventDefault / page)
        const listEl0 = a.list_;
    if (listEl0 && (target === listEl0 || listEl0.contains(target)) && listEl0.scrollHeight > listEl0.clientHeight + 2) {
      a.wheelDelta_ = 0;
      a.updateListScrollHint_(listEl0);
      return;
    }
    VUtils_.Stop_(event, 1);
    if (hasXAndY && Math.abs(rawDeltaX - rawDeltaY) < .5 || !absDelta) {
      return;
    }
    const forward = !!notTouchpad !== a.wheelMinStep_ < 0;
    if (target === input) {
      if (deltaY) {
        total = (a.wheelStart_ ? 0 : a.wheelDelta_) + deltaY;
        if (Math.abs(total) >= 10) {
          // on mac, touchpad may cause a hook (curve)
          a.onWordAction_(total > 0 === forward ? 6 : 2, 0, notTouchpad ? 1 : 2);
          total = Math.abs(total) % 10 * (total > 0 ? 1 : -1);
        }
      }
      a.wheelDelta_ = total;
      return;
    }
    if (deltaX || a.isSearchOnTop_ || a.inputBar_.contains(target) && a.inputBar_ !== target) {
      return;
    }
    const now = Date.now();
    if (now - a.wheelTime_ > (mode || notTouchpad ? 330 /* GlobalConsts.WheelTimeout */ : 120 /* GlobalConsts.TouchpadTimeout */) || now - a.wheelTime_ < -33) {
      a.wheelDelta_ = 0;
      a.wheelStart_ = 0;
    }
    a.wheelTime_ = now;
    scale = Math.max(1, 1 + Math.log(a.wheelSpeed_));
    total = a.wheelDelta_ + (notTouchpad ? deltaY * 100 * a.wheelSpeed_ : notTouchpad || mode ? /* WheelEvent.DOM_DELTA_PAGE */ deltaY * 300 /* GlobalConsts.VomnibarWheelStepForPage */ : deltaY * scale);
    if (Math.abs(total) < 300 /* GlobalConsts.VomnibarWheelStepForPage */ || a.wheelStart_ && now - a.wheelStart_ > -33 && now - a.wheelStart_ < 150 /* GlobalConsts.VomnibarWheelIntervalForPage */ / scale) {
      a.wheelDelta_ = total;
      return;
    }
    a.wheelDelta_ = Math.abs(total) % 300 /* GlobalConsts.VomnibarWheelStepForPage */ * (total > 0 ? 1 : -1);
    a.wheelStart_ = now;
    a.goPage_(deltaY > 0);
  },
  OnInput_(event) {
    const a = Vomnibar_, s0 = a.lastQuery_;
    let s1 = a.input_.value, str = s1.trim(), inputType = a.inputType_;
    a.blurWanted_ = a.inputType_ = a._nearWheelHasDeltaXY = a._nearWheelDeltaLimited = 0;
    s1 === "/" && a.isEdg_ && a.input_.selectionEnd && !event.isComposing && (s1 = a.input_.value = " /");
    if (str === (a.selection_ === -1 || a.isSelOriginal_ ? s0 : a.lastParsed_.trim() || a.completions_[a.selection_].t)) {
      return;
    }
    if (a.matchType_ === 1 /* CompletersNS.MatchType.emptyResult */ && s0 !== null && str.startsWith(s0) && (!str.includes(" /", s0.length) || /^\/|\s\//.test(str.slice(0, s0.length - 1)) || !(a.mode_.e ? a.mode_.e & 1 /* CompletersNS.SugType.kBookmark */ : "bomni bookmarks".includes(a.mode_.o)))) {
      return;
    }
    a.lastParsed_ = "";
    str || (a.isHttps_ = a.baseHttps_ = null);
    let arr, i = a.input_.selectionStart;
    i >= 2 && s1[i - 1] === " " && s1[i - 2] !== " " && (s0 === null || str.startsWith(s0)) && (str.length > (str.includes(" ") ? 3 : 6) || /[\x80-\uffff]/.test(str)) && (inputType = 2);
    if (a.isSearchOnTop_) {} else if (i > s1.length - 2) {
      if (s1.endsWith(" +") && !a.timer_ && str.slice(0, -2).trimRight() === s0) {
        return;
      }
    } else if (s0 && (arr = a._pageNumRe.exec(s0)) && str.endsWith(arr[0])) {
      const j = arr[0].length, s2 = s1.slice(0, s1.trimRight().length - j);
      if (s2.trim() !== s0.slice(0, -j).trimRight()) {
        a.input_.value = s2.trimRight();
        a.input_.setSelectionRange(i, i);
      }
    }
    a.isInputComposing_ && (!event || event.isComposing === false) && (a.isInputComposing_ = null);
    a.updateTips_(a.input_.value, a.mode_.o, a.completions_ ? a.completions_.length : 0);
    a.update_(inputType ? 0 : -1, a.inAlt_ ? a.toggleAlt_ : null);
  },
  /** Keep the iframe inside the parent viewport; extra rows scroll inside #list. */
  listFit_() {
    const a = Vomnibar_;
    const host = a._hostViewH || (typeof innerHeight === "number" ? innerHeight : 720);
    const maxFrame = Math.max(a.heightIfEmpty_ + a.itemHeight_ * 3, Math.floor(host - 64 /* PixelData.FrameTop */ - 16));
    const maxList = Math.max(a.itemHeight_ * 3, maxFrame - a.baseHeightIfNotEmpty_);
    return {
      maxList,
      maxFrame
    };
  },
  omni_(response) {
    const a = Vomnibar_, autoSelect = a.options_.autoSelect;
    const completions = response.l, len = completions.length, notEmpty = len > 0, oldH = a.height_, list = a.list_;
    const fit = a.listFit_();
    const maxVisibleRows = Math.max(3, fit.maxList / a.itemHeight_ | 0);
    const visibleRows = notEmpty ? Math.min(len, maxVisibleRows) : 0;
    const formulaH = Math.ceil(notEmpty ? Math.min(visibleRows * a.itemHeight_ + a.baseHeightIfNotEmpty_, fit.maxFrame) : a.heightIfEmpty_);
    let height = a.height_ = formulaH;
    const wdZoom = a.docZoom_, msg = {
      N: 2 /* VomnibarNS.kFReq.style */ ,
      h: height * wdZoom
    };
    if (!a.isActive_) {
      return;
    }
    // Expand early so layout isn't clipped while we measure
        height > oldH && VPort_.postToOwner_(msg);
    a.total_ = response.t;
    a.showFavIcon_ = response.i;
    a.matchType_ = response.m;
    a.sugTypes_ = response.s;
    a.resMode_ = response.r && response.r + " ";
    a.completions_ = completions;
    a.updateTips_(a.input_ && a.input_.value || "", response.r || a.mode_.o, len);
    a.isSearchOnTop_ = len > 0 && completions[0].e === "search" && !completions[0].n;
    a.selection_ = a.isSearchOnTop_ || (autoSelect == null ? response.a : autoSelect && notEmpty) ? 0 : -1;
    a.isSelOriginal_ = true;
    a.ParseCompletions_(a.completions_);
    a.renderItems_(a.completions_, list);
    const listMax = fit.maxList;
    list.style.maxHeight = listMax + "px";
    list.style.overflowY = "auto";
    const wrap = document.getElementById("list-wrap");
    wrap && (wrap.style.maxHeight = listMax + "px");
    a.bindListScrollHint_(list);
    a.updateListScrollHint_(list);
    oldH || (a.bodySt_.display = "");
    a.toggleInputMode_();
    a.toggleAttr_("enterkeyhint", a.isSearchOnTop_ ? "Search" : "Go");
    let cl = a.barCls_, cl2 = list.classList, c = "empty";
    notEmpty ? cl.remove(c) : cl.add(c);
    c = "no-query";
    response.c & 6 /* CompletersNS.QComponent.queryOrOffset */ ? (cl.remove(c), cl2.remove(c)) : (cl.add(c), 
    cl2.add(c));
    c = "no-favicon";
    a.showFavIcon_ ? cl2.remove(c) : cl2.add(c);
    if (notEmpty) {
      a.selection_ === 0 && list.firstElementChild.classList.add("s");
      list.lastElementChild.classList.add("b");
      // Reset scroll when query changes so first hits stay in view
            list.scrollTop = 0;
    }
    if (a.onUpdate_ === a.toggleAlt_) {
      a.toggleAlt_();
      a.onUpdate_ = null;
    }
    // Remeasure after layout so 1–N rows fully show the last item (tips wrap, item CSS vs sizes).
        const postMeasured = () => {
      if (!a.isActive_) {
        return;
      }
      const body = document.body;
      const root = document.documentElement;
      const st = getComputedStyle(body);
      const marginV = (+st.marginTop || 0) + (+st.marginBottom || 0);
      // Prefer full document height; body.offsetHeight alone omits margins the iframe must fit.
            let needed = Math.ceil(Math.max(root.scrollHeight, body.offsetHeight + marginV, formulaH) + 2);
 // +2 for subpixel / border
            needed > fit.maxFrame && (needed = fit.maxFrame);
      height = a.height_ = needed;
      msg.h = needed * wdZoom;
      VPort_.postToOwner_(msg);
      a.postUpdate_();
    };
    requestAnimationFrame(() => {
      postMeasured();
      Vomnibar_.updateListScrollHint_(list);
    });
  },
  /** Fade + “more ↓” when the result list can scroll further */
  bindListScrollHint_(list) {
    const a = Vomnibar_;
    if (list.__vpScrollBound) {
      return;
    }
    list.__vpScrollBound = 1;
    const onScroll = () => {
      a.updateListScrollHint_(list);
    };
    list.addEventListener("scroll", onScroll, {
      passive: true
    });
  },
  updateListScrollHint_(list) {
    const el = list || Vomnibar_.list_;
    if (!el) {
      return;
    }
    const wrap = document.getElementById("list-wrap");
    if (!wrap) {
      return;
    }
    // Force reflow so scrollHeight is accurate after render
        const maxScroll = el.scrollHeight - el.clientHeight;
    const canScroll = maxScroll > 2;
    canScroll && el.style.overflowY !== "auto" && (el.style.overflowY = "auto");
    const atTop = el.scrollTop <= 2;
    const atBottom = !canScroll || el.scrollTop >= maxScroll - 2;
    wrap.classList.toggle("more-below", canScroll && !atBottom);
    wrap.classList.toggle("more-above", canScroll && !atTop);
  },
  postUpdate_() {
    let func;
    const a = Vomnibar_;
    a.showing_ || a.show_();
    if (a.timer_ > 0) {
      return;
    }
    a.timer_ = 0;
    a.isEditing_ = false;
    if (func = a.onUpdate_) {
      a.onUpdate_ = null;
      return func();
    }
  },
  toggleInputMode_() {
    Vomnibar_.isInputComposing_ || Vomnibar_.lastQuery_ === null || Vomnibar_.toggleAttr_("inputmode", Vomnibar_.isSearchOnTop_ || !/[\/:]/.test(Vomnibar_.lastQuery_) ? "search" : "url");
  },
  toggleAttr_(attr, value, trans) {
    trans && Vomnibar_.pageType_ === 0 /* VomnibarNS.PageType.inner */ && (value = chrome.i18n.getMessage(value) || value);
    Vomnibar_.noInputMode_ ? Vomnibar_.input_.removeAttribute(attr) : Vomnibar_.input_.getAttribute(attr) !== value && Vomnibar_.input_.setAttribute(attr, value);
  },
  toggleStyle_(req) {
    const enable = !Vomnibar_.styles_.includes(` ${req.t || "dark"} `);
    VPort_.post_({
      H: 29 /* kFgReq.omniToggleMedia */ ,
      t: req.t,
      b: req.b,
      v: enable
    });
  },
  onStyleUpdate_(omniStyles) {
    Vomnibar_.styles_ = omniStyles;
    const body = document.body;
    const dark = omniStyles.includes(" dark ");
    if (Vomnibar_.darkBtn_) {
      Vomnibar_.darkBtn_.childElementCount || (Vomnibar_.darkBtn_.textContent = dark ? "\u2600" : "\u263d");
      Vomnibar_.darkBtn_.classList.toggle("toggled", dark);
    }
    const monospaceURL = omniStyles.includes(" mono-url ");
    Vomnibar_.showTime_ = omniStyles.includes("time ") ? omniStyles.includes(" absolute-num-time ") ? 1 : omniStyles.includes(" absolute-time ") ? 2 : 3 : 0;
    Vomnibar_.updateQueryFlag_(32 /* CompletersNS.QueryFlags.ShowTime */ , Vomnibar_.showTime_ > 0);
    let newClassName = "";
    // Note: should not use style[title], because "title" on style/link has special semantics
    // https://html.spec.whatwg.org/multipage/semantics.html#the-style-element
        const styles = document.querySelectorAll("style[id]");
    for (let i = 0; i < styles.length; i++) {
      const style = styles[i];
      const key = (style.id !== "time" ? " " : "") + style.id + " ", isCustom = key === " custom ";
      const found = isCustom || omniStyles.includes(key);
      style.dataset.media ? style.media = found ? "" : style.dataset.media : style.sheet.disabled = !found;
      isCustom || found && (newClassName += " has-" + style.id);
      found && (omniStyles = omniStyles.replace(key, " "));
    }
    Vomnibar_.wheelSpeed_ = 1;
    Vomnibar_.wheelMinStep_ = 0;
    Vomnibar_.noInputMode_ = false;
    Vomnibar_.altChars_ = null;
    omniStyles = omniStyles.replace(/\b([\w-]+)=([\w.]+)/g, (_, key, val) => {
      let val2;
      key === "wheel-speed" && (Vomnibar_.wheelSpeed_ = Math.max(.1, Math.min(parseFloat(val) || 1, 10)));
      key === "wheel-min-step" && (Vomnibar_.wheelMinStep_ = Math.max(-2e3, Math.min(parseInt(val) || 0, 2e3)));
      key === "inputmode" && (Vomnibar_.noInputMode_ = val === "no" || val === "false" || val === "0");
      key === "alt-characters" && (val2 = val ? val.replace(/["'<>]/g, "").split(val.includes(",") ? "," : "") : [], 
      Vomnibar_.altChars_ = val2.length > 3 ? val2 : null);
      return "";
    });
    omniStyles = omniStyles.trim().replace(Vomnibar_.spacesRe_, " ");
    newClassName += " " + omniStyles;
    body.classList.contains("inactive") && (newClassName += " inactive");
    newClassName = newClassName.trimLeft();
    body.className !== newClassName && (body.className = newClassName);
    if (!!(Vomnibar_.mode_.f & 16 /* CompletersNS.QueryFlags.MonospaceURL */) !== monospaceURL) {
      Vomnibar_.updateQueryFlag_(16 /* CompletersNS.QueryFlags.MonospaceURL */ , monospaceURL);
      Vomnibar_.isActive_ && !Vomnibar_.init_ && Vomnibar_.refresh_(document.hidden);
    }
  },
  updateOptions_(delta, confVer) {
    VUtils_.safer_(delta);
    if (!Vomnibar_.init_) {
      const styles = delta.t;
      styles != null && Vomnibar_.onStyleUpdate_(` ${styles} `);
      delta.c != null && Vomnibar_.onCss_(delta.c);
    }
    delta.n != null && (Vomnibar_.maxMatches_ = delta.n);
    delta.i != null && (Vomnibar_.queryInterval_ = delta.i);
    delta.m !== void 0 && (Vomnibar_.mappedKeyRegistry_ = delta.m);
    delta.l != null && (Vomnibar_.keyLayout_ = delta.l);
    if (delta.s != null) {
      // Extra chrome for #tips + #footer-tip (not in classic PixelData sizes)
      const tipsChrome = 72;
      let sizes = delta.s.split(","), n = +sizes[0], m = Math.min, M = Math.max;
      Vomnibar_.heightIfEmpty_ = M(24, m((n || 77 /* VomnibarNS.PixelData.OthersIfEmpty */) + tipsChrome, 400));
      n = +sizes[1];
      Vomnibar_.baseHeightIfNotEmpty_ = M(24, m(Vomnibar_.heightIfEmpty_ + (n || 3 /* VomnibarNS.PixelData.OthersIfEmpty */), 400));
      n = +sizes[2];
      // Prefer CSS row height (48) if stored size is the old classic 44
            const rawItem = n || 48 /* VomnibarNS.PixelData.Item */;
      Vomnibar_.itemHeight_ = M(14, m(rawItem === 44 ? 48 /* VomnibarNS.PixelData.Item */ : rawItem, 120));
      n = sizes.length > 3 ? +sizes[3] : 0;
      Vomnibar_.wndRatioX_ = M(.3, m(n || .8 /* VomnibarNS.PixelData.WindowSizeRatioX */ , .95));
      n = sizes.length > 4 ? +sizes[4] : 0;
      Vomnibar_.maxWidthInPixel_ = M(200, m(n || 1944 /* VomnibarNS.PixelData.MaxWidthInPixel */ , 8192));
    }
    VPort_._confVersion = confVer;
  },
  _delayedBlurred: 0,
  OnWndFocus_(event) {
    const a = Vomnibar_, byCode = a.codeFocusTime_ && performance.now() - a.codeFocusTime_ < 120, blurred = event.type === "blur", target = event.target, isWnd = target === window;
    if (!event.isTrusted || !VPort_) {
      return;
    }
    a.codeFocusReceived_ = true;
    a._nearWheelHasDeltaXY = a._nearWheelDeltaLimited = 0;
    blurred && a.onWndBlur2_ && isWnd && a.onWndBlur2_();
    if (!isWnd || !a.isActive_) {
      target === a.input_ && (Vomnibar_.focused_ = !blurred) && (Vomnibar_.blurWanted_ = 0);
      return;
    }
    a.codeFocusTime_ = 0;
    a._delayedBlurred && clearTimeout(a._delayedBlurred);
    if (byCode) {
      a.blurred_(blurred);
      return;
    }
    a._delayedBlurred = setTimeout(a.blurred_, 50, null);
    if (blurred) {
      Vomnibar_.inAlt_ < 0 && Vomnibar_.toggleAlt_();
      Vomnibar_._canvas = Vomnibar_.lastQuery_ = null;
    } else {
      VPort_.post_({
        H: 24 /* kFgReq.cmd */ ,
        i: 0
      });
      a.pageType_ !== 0 /* VomnibarNS.PageType.inner */ && VPort_ && setTimeout(() => {
        VPort_ && !VPort_._port && VPort_.postToOwner_({
          N: 9
 /* VomnibarNS.kFReq.broken */        });
      }, 50);
    }
  },
  blurred_(blurred, delayed2nd) {
    if (!Vomnibar_) {
      return;
    }
    const a = Vomnibar_, doc = document, cls = doc.body.classList;
    let hidden;
    a._delayedBlurred = 0;
    // Document.hidden is since C33, according to MDN
        !a.isActive_ || (blurred != null ? !blurred : (hidden = doc.hidden) || doc.hasFocus()) ? cls.remove("inactive") : hidden || delayed2nd ? cls.add("inactive") : a._delayedBlurred = setTimeout(a.blurred_, 50, null, 1);
  },
  onWndFreeze_(event) {
    if (VPort_._port && event.isTrusted) {
      try {
        VPort_._port.disconnect();
      } catch (_a) {}
      VPort_._port = null;
    }
  },
  /** Numbered 1–9 picks: ⌘ on macOS, Alt on Windows/Linux (matches onKeydown_). */
  pickMod_() {
    return Vomnibar_.os_ === 0 /* kOS.mac */ ? "\u2318" : "Alt";
  },
  updateTips_(query, mode, count) {
    const a = Vomnibar_;
    if (!a.tipTextEl_ || !a.tipModeEl_) {
      return;
    }
    const q = (query || "").trim();
    const modKey = a.pickMod_();
    let modeLabel = (mode || a.mode_.o || "omni").toUpperCase();
    let html = "";
    if (q.startsWith(":")) {
      modeLabel = "PALETTE";
      const rest = q.slice(1).trim().toLowerCase();
      html = rest ? /^(view|read|tab|hist|priv|win|nav|clip|chrome|vim|fx|dock)$/.test(rest.split(/\s+/)[0] || "") ? "<b>Browsing " + (rest.split(/\s+/)[0] || "") + "</b> \xb7 filter further \xb7 <kbd>Enter</kbd> run \xb7 short form stays in bar" : "<b>Filter</b> \xb7 matches title, category &amp; cmd \xb7 hold <kbd>" + modKey + "</kbd> + <kbd>1</kbd>\u2013<kbd>9</kbd> to jump" : "<b>Categories</b> \xb7 <kbd>:view</kbd> <kbd>:read</kbd> <kbd>:tab</kbd> <kbd>:hist</kbd> <kbd>:priv</kbd> <kbd>:win</kbd> <kbd>:nav</kbd> <kbd>:clip</kbd> <kbd>:chrome</kbd>";
    } else if (q.startsWith("!")) {
      modeLabel = "ENGINE";
      html = "<b>Search engine</b> \xb7 <kbd>!g</kbd> Google \xb7 <kbd>!w</kbd> Wiki \xb7 <kbd>!gh</kbd> GitHub \xb7 query after bang";
    } else if (mode === "tab" || mode === "window" || modeLabel === "TAB" || modeLabel === "WINDOW") {
      modeLabel = mode === "window" || modeLabel === "WINDOW" ? "WINDOWS" : "TABS";
      html = "<b>" + modeLabel + "</b> \xb7 filter \xb7 <kbd>Enter</kbd> focus \xb7 hold <kbd>" + modKey + "</kbd> then <kbd>1</kbd>\u2013<kbd>9</kbd> for numbered pick";
    } else if (q) {
      modeLabel = "OMNI";
      html = "<b>" + (count ? count + " result" + (count === 1 ? "" : "s") : "No matches") + "</b> \xb7 hold <kbd>" + modKey + "</kbd> for numbered hints \xb7 <kbd>Enter</kbd> open";
    } else {
      modeLabel = "OMNI";
      html = "<b>Search everything</b> \xb7 <kbd>:</kbd> commands \xb7 <kbd>!g</kbd> engines \xb7 hold <kbd>" + modKey + "</kbd> for <kbd>1</kbd>\u2013<kbd>9</kbd> hints";
    }
    a.tipModeEl_.textContent = modeLabel;
    a.tipTextEl_.innerHTML = html;
    a.footerTipEl_ && (a.footerTipEl_.innerHTML = q.startsWith(":") ? "<kbd>\u2191</kbd><kbd>\u2193</kbd> move \xb7 scroll for more \xb7 <kbd>Enter</kbd> run \xb7 hold <kbd>" + modKey + "</kbd>+<kbd>1</kbd>\u2013<kbd>9</kbd>" : "<kbd>\u2191</kbd><kbd>\u2193</kbd> \xb7 <kbd>Enter</kbd> \xb7 hold <kbd>" + modKey + "</kbd> + <kbd>1</kbd>\u2013<kbd>9</kbd> jump \xb7 <kbd>Esc</kbd> \xb7 <kbd>:</kbd> palette");
  },
  init_() {
    const a = Vomnibar_;
    window.onclick = Vomnibar_.onClick_;
    VUtils_.safer_(a.ctrlCharOrShiftKeyMap_);
    VUtils_.safer_(a.normalMap_);
    VUtils_.safer_(a._modifierKeys);
    const list = a.list_ = document.getElementById("list");
    const listen = addEventListener, input = a.input_ = document.getElementById("input");
    a.inputBar_ = document.getElementById("bar");
    a.barCls_ = input.parentElement.classList;
    a.tipEl_ = document.getElementById("tips");
    a.tipTextEl_ = document.getElementById("tip-text");
    a.tipModeEl_ = document.getElementById("tip-mode");
    a.footerTipEl_ = document.getElementById("footer-tip");
    a.updateTips_("", "omni", 0);
    list.onmouseover = list.oncontextmenu = a.OnMenu_;
    document.getElementById("close").onclick = () => Vomnibar_.hide_();
    listen("keydown", a.HandleKeydown_, true);
    listen("focus", a.OnWndFocus_, true);
    listen("blur", a.OnWndFocus_, true);
    listen("freeze", a.onWndFreeze_, true);
    input.oninput = a.OnInput_;
    input.onselect = a.OnSelect_;
    input.onpaste = () => {
      Vomnibar_.inputType_ = 1;
    };
    a.renderItems_ = VUtils_.makeListRenderer_(document.getElementById("template").innerHTML);
    {
      const css = document.createElement("style");
      css.textContent = "body::after, #input, .item { border-width: 0.01px; }";
      document.head.append(css);
    }
    {
      let func = event => {
        const doesStart = event.type === "compositionstart", box = Vomnibar_.input_;
        Vomnibar_.isInputComposing_ = doesStart ? [ box.selectionStart, box.value.length - box.selectionEnd ] : null;
      };
      input.addEventListener("compositionstart", func);
      input.addEventListener("compositionend", func);
    }
    a.styleEl_ && document.head.append(a.styleEl_);
    a.darkBtn_ = document.querySelector("#toggle-dark");
    a.darkBtn_ && (a.darkBtn_.onclick = event => {
      Vomnibar_.toggleStyle_({
        t: "",
        b: event.ctrlKey || event.metaKey
      });
      VUtils_.Stop_(event, 1);
      Vomnibar_.input_.focus();
    });
    a.onStyleUpdate_(a.styles_);
    a.onCss_(a.customCss_);
    if (a.pageType_ === 0 /* VomnibarNS.PageType.inner */) {
      const els = document.querySelectorAll("[title]");
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        let t = chrome.i18n.getMessage(el.title.replace(" ", "_"));
        t && (el.title = t);
      }
    }
    a.init_ = a.preInit_ = VUtils_.makeListRenderer_ = null;
    return;
  },
  onCss_(css) {
    let st = Vomnibar_.styleEl_;
    if (!css) {
      st && st.remove();
      Vomnibar_.styleEl_ = null;
      return;
    }
    if (!st) {
      st = Vomnibar_.styleEl_ = document.querySelector("#custom") || document.createElement("style");
      st.id = "custom";
      st.parentNode || document.head.append(st);
    }
    st.textContent = css;
  },
  getTypeIcon_(sug) {
    return sug.e;
  },
  preInit_(type) {
    const a = Vomnibar_, docEl = document.documentElement;
    a.docSt_ = docEl.style;
    a.bodySt_ = document.body.style;
    a.pageType_ = type;
    let f, manifest, str, fav = 0;
    const canShowOnExtOrWeb = true /* BrowserVer.MinExtensionContentPageAlwaysCanShowFavIcon */ /* BrowserVer.MinExtensionContentPageAlwaysCanShowFavIcon */;
    if (type === 2 /* VomnibarNS.PageType.web */) {} else if (type === 0 /* VomnibarNS.PageType.inner */) {
      fav = canShowOnExtOrWeb ? 2 : 0;
    } else if (canShowOnExtOrWeb && (str = docEl.dataset.favicons) != null) {
      fav = str && str.toLowerCase() !== "true" ? 0 : 2;
    } else if (canShowOnExtOrWeb && (f = chrome.runtime.getManifest) && (manifest = f())) {
      const arr = manifest.permissions || [];
      fav = arr.includes("favicon") ? 2 : 0;
    }
    a.mode_.i = fav;
  },
  HandleKeydown_(event) {
    if (!event.isTrusted) {
      return;
    }
    Vomnibar_.keyResult_ = 2 /* SimpleKeyResult.Prevent */;
    let keyCode = event.keyCode, stop = 3, now = 0;
    if (Vomnibar_.last_scrolling_key_) {
      const hasChar = keyCode > 18 /* kKeyCode.maxAcsKeys */ || keyCode < 16 /* kKeyCode.minAcsKeys */ , isSameChar = keyCode === Math.abs(Vomnibar_.last_scrolling_key_);
      stop = event.repeat || hasChar && isSameChar && event.type[3] < "e" /* kChar.e */ ? 0 : 1;
      if (hasChar && !isSameChar) {
        stop = 3;
      } else if (Vomnibar_.last_scrolling_key_ > 0) {
        stop = event.type[3] < "e" /* kChar.e */ ? 0 : 2;
      } else if (stop || (now = event.timeStamp) - Vomnibar_.lastScrolling_ > 40 || now < Vomnibar_.lastScrolling_) {
        VPort_.postToOwner_({
          N: stop ? 8 /* VomnibarNS.kFReq.stopScroll */ : 7
 /* VomnibarNS.kFReq.scrollGoing */        });
        Vomnibar_.lastScrolling_ = now;
      }
      if (stop) {
        Vomnibar_.last_scrolling_key_ = hasChar || stop > 1 ? 0 /* kKeyCode.None */ : Math.abs(Vomnibar_.last_scrolling_key_);
        Vomnibar_.last_scrolling_key_ || (window.onkeyup = null);
      }
    }
    stop === 3 && Vomnibar_.isActive_ && 
     Vomnibar_.onKeydown_(event);
    if (Vomnibar_.keyResult_ === 0 /* SimpleKeyResult.Nothing */) {
      return;
    }
    VUtils_.Stop_(event, Vomnibar_.keyResult_ === 2 /* SimpleKeyResult.Prevent */);
  },
  HandleKeyup_ff_: 0,
  _onAltUp(event) {
    const listened = Vomnibar_._listenedAltDown;
    if (!event || (typeof listened === "string" ? Vomnibar_.getMappedKey_(event).key : event.keyCode) === listened) {
      removeEventListener("keyup", Vomnibar_._onAltUp, true);
      event && Vomnibar_.toggleAlt_(Vomnibar_.inAlt_ < 0 ? 1 : 0);
      Vomnibar_._listenedAltDown = 0;
    }
  },
  toggleAlt_(enable) {
    const inAlt = Vomnibar_.inAlt_;
    enable = enable || 0;
    if (inAlt !== enable) {
      if (inAlt > 0 !== !!enable) {
        document.body.classList.toggle("alt", !!enable);
        for (let i = 0, end = enable ? Vomnibar_.list_.childElementCount : 0; i < end; i++) {
          Vomnibar_.list_.children[i].classList.add("alt-index");
        }
      }
      inAlt < 0 && clearTimeout(-inAlt);
      enable || Vomnibar_._onAltUp();
      Vomnibar_.inAlt_ = enable;
    }
  },
  _realDevRatio: 0,
  onInnerWidth_(w) {
    Vomnibar_.mode_.c = Math.floor(((w || innerWidth) / Vomnibar_.docZoom_ - 84 /* PixelData.AllHNotUrl */) / (Vomnibar_.mode_.f & 16 /* CompletersNS.QueryFlags.MonospaceURL */ ? 7.7 /* PixelData.MeanWidthOfMonoFont */ : 4 /* PixelData.MeanWidthOfNonMonoFont */));
  },
  updateQueryFlag_(flag, enable) {
    const isFirst = enable == null;
    isFirst && (enable = Vomnibar_.styles_.includes(flag - 32 /* CompletersNS.QueryFlags.ShowTime */ ? " mono-url " : "time "));
    const newFlag = Vomnibar_.mode_.f & ~flag | (enable ? flag : 0);
    if (Vomnibar_.mode_.f === newFlag) {
      return;
    }
    Vomnibar_.mode_.f = newFlag;
    flag !== 16 /* CompletersNS.QueryFlags.MonospaceURL */ || isFirst || Vomnibar_.onInnerWidth_();
  },
  secret_: null,
  mode_: {
    H: 17 /* kFgReq.omni */ ,
    o: "omni",
    t: 0 /* CompletersNS.SugType.Empty */ ,
    c: 0,
    e: 0 /* CompletersNS.SugType.Empty */ ,
    r: 0,
    f: 0 /* CompletersNS.QueryFlags.None */ ,
    i: 0,
    q: ""
  },
  spacesRe_: /\s+/g,
  fetch_() {
    const a = Vomnibar_, mayUseCache = a.lastQuery_ !== null;
    let str, mode = a.mode_, newMatchType = 0 /* CompletersNS.MatchType.Default */;
    a.timer_ = -1;
    if (a.useInput_) {
      a.lastQuery_ = str = a.input_.value.trim();
      if (a.isInputComposing_) {
        const left = a.isInputComposing_[0], end = str.length - a.isInputComposing_[1];
        str = str.slice(0, left) + str.slice(left, end).replace(/'/g, "") + str.slice(end);
      }
      str = str.replace(a.spacesRe_, " ");
      if (a.options_.icase) {
        const prefix = /^:[WBH] /.test(str) ? 3 : 0;
        str = prefix ? str.slice(0, prefix) + str.slice(prefix).toLowerCase() : str.toLowerCase();
      }
      if (str === mode.q && mayUseCache) {
        return a.postUpdate_();
      }
      mode.t = a.matchType_ < 2 /* CompletersNS.MatchType.someMatches */ || !str.startsWith(mode.q) ? 0 /* CompletersNS.SugType.Empty */ : a.matchType_ === 3 /* CompletersNS.MatchType.searchWanted */ ? str.includes(" ") ? 0 /* CompletersNS.SugType.Empty */ : 8 /* CompletersNS.SugType.search */ : (newMatchType = a.matchType_, 
      a.sugTypes_);
      mode.q = str;
      a.matchType_ = newMatchType;
      a.onInnerWidth_();
    } else {
      a.useInput_ = true;
      a.options_.icase && (mode.q = mode.q.toLowerCase());
    }
    VPort_.post_(mode);
    mode.f & 1024 /* CompletersNS.QueryFlags.NoSessions */ && a.options_.noSessions === "start" && (mode.f &= -1025 /* CompletersNS.QueryFlags.NoSessions */);
  },
  _favPrefix: "",
  ParseCompletions_(items) {
    const arr1 = [], arr2 = [];
    let str;
    for (const item of items) {
      item.r = Vomnibar_.showRelevancy_ ? `\n\t\t\t<span class="relevancy">${item.r}</span>` : "";
      if (str = item.label) {
        // Color category chips for quick actions (Privacy / Read / View / …)
        let safe = str;
        safe = safe.replace(/[^\w+.\- ]/g, "").replace(/\s+/g, "").replace(/\+/g, "plus");
        const cls = "label label-" + (safe || "Action");
        item.label = ` <span class="${cls}">${str}</span>`;
      }
      (item.e === "history" || item.e === "tab" || item.v ? arr1 : arr2).push(item);
    }
    let n1 = arr1.length, i = 0;
    arr1.sort((i, j) => !i.v !== !j.v ? i.v ? -1 : 1 : i.u.length - j.u.length);
    for (const item of arr1.concat(arr2)) {
      item.favIcon = (str = Vomnibar_.showFavIcon_ ? item.u : "") && Vomnibar_._favPrefix + encodeURIComponent(Vomnibar_._parseFavIcon_not_ff(item, i++ < n1, str) || "about:blank") + "&quot;);";
    }
  },
  _parseFavIcon_not_ff(item, visited, url) {
    let str = url.slice(0, 11).toLowerCase(), optionsPage = "/pages/options.html" /* GlobalConsts.OptionsPage */;
    return str.startsWith("vimium://") ? Vomnibar_.pageType_ !== 1 /* VomnibarNS.PageType.ext */ ? chrome.runtime.getURL(optionsPage) : location.protocol + "//" + VHost_ + optionsPage : url.length > 512 || str === "javascript:" || str.startsWith("data:") ? "" : VUtils_.getCachedFavIcons_(url, visited, item.v || "", str);
  },
  navigateToUrl_(req, reuse) {
    if (/^javascript:/i.test(req.u)) {
      VPort_.postToOwner_({
        N: 5 /* VomnibarNS.kFReq.evalJS */ ,
        u: req.u
      });
      return;
    }
    // not set .formatted, so that convertToUrl is always called with Urls.WorkType.EvenAffectStatus
        VPort_.post_(req);
    if (reuse === -2 /* ReuseType.newBg */ && Vomnibar_.isActive_ && (!Vomnibar_.lastQuery_ || /^\+\d{0,2}$/.exec(Vomnibar_.lastQuery_))) {
      return Vomnibar_.refresh_();
    }
  },
  gotoSession_(req, isTab) {
    VPort_.post_(req);
    Vomnibar_ && Vomnibar_.isActive_ && Vomnibar_.refresh_(isTab);
  },
  refresh_(waitFocus) {
    const doRefresh = wait => {
      let oldSel = Vomnibar_.selection_, origin = Vomnibar_.isSelOriginal_;
      Vomnibar_.useInput_ = false;
      Vomnibar_.onInnerWidth_();
      Vomnibar_.update_(wait, () => {
        const len = Vomnibar_.completions_.length;
        if (!origin && oldSel >= 0) {
          const newSel = Math.min(oldSel, len - 1);
          Vomnibar_.isSelOriginal_ = false;
          Vomnibar_.selection_ < 0 && Vomnibar_.selection_--;
          Vomnibar_.updateSelection_(newSel);
        }
        Vomnibar_.focused_ || Vomnibar_.blurWanted_ || Vomnibar_.focus_();
      });
    };
    Vomnibar_.focused_ || getSelection().removeAllRanges();
    if (!waitFocus) {
      doRefresh(150);
      return;
    }
    window.onfocus = e => {
      window.onfocus = null;
      e.isTrusted && VPort_._port && doRefresh(17);
    };
  },
  OnPageHide_(e) {
    var _a;
    if (!VPort_ || e && !e.isTrusted) {
      return;
    }
    Vomnibar_.isActive_ = false;
    Vomnibar_.timer_ > 0 && clearTimeout(Vomnibar_.timer_);
    (_a = VPort_._port) === null || _a === void 0 || _a.disconnect();
    VPort_._port = null;
    VPort_.postToOwner_({
      N: 10
 /* VomnibarNS.kFReq.unload */    });
  }
}, VUtils_ = {
  safer_(opt) {
    return Object.setPrototypeOf(opt, null);
  },
  makeListRenderer_(template) {
    const a = template.trim().replace(/\s{2,}/g, " ").replace(/> /g, ">").split(/\{\{(\w+)}}/g).map(function(placeholder, index) {
      const id = index & 1 ? this.indexOf(placeholder) + 2 : 0;
      return {
        i: id,
        n: id < 2 ? placeholder : ""
      };
    }, [ "typeIcon", "altIndex", "time", "index", "" ]);
    return (objectArray, element) => {
      const altChars = Vomnibar_.altChars_;
      let j, val, html = "", len = a.length - 1, index = 0;
      VUtils_.timeCache_ = 0;
      for (;index < objectArray.length; index++) {
        val = objectArray[index];
        for (j = 0; j < len; j += 2) {
          html += a[j].n;
          const {i: id, n: propName} = a[j + 1];
          html += id === 1 ? val[propName] || "" : id === 2 ? Vomnibar_.getTypeIcon_(val) : id === 3 ? altChars !== null ? index < altChars.length ? altChars[index] : index >= altChars.length * altChars.length ? "" : altChars[(index / altChars.length | 0) % altChars.length] + altChars[index % altChars.length] : index < 9 || Vomnibar_.maxMatches_ > 10 ? index + 1 + "" : "0" : id === 4 ? Vomnibar_.showTime_ ? VUtils_.timeStr_(val.visit) : "" : id === 5 ? index + 1 + "" : "";
        }
        html += a[len].n;
      }
      element.innerHTML = html;
    };
  },
  _cachedFavicons: {},
  getCachedFavIcons_(url, visited, favIcon, scheme) {
    scheme = scheme || url.slice(0, 11).toLowerCase();
    let i, hasHost = scheme.startsWith("http") || scheme.lastIndexOf("-", scheme.indexOf(":") + 1 || 8) > 0 && url.lastIndexOf("://", 21) > 0, host = hasHost ? (i = url.indexOf("/", url.indexOf("://") + 3), 
    i > 0 ? url.slice(0, i + 1) : url + "/") : null;
    return host && VUtils_._cachedFavicons[host] || (visited && host && (VUtils_._cachedFavicons[host] = favIcon || url), 
    favIcon || !visited && host || url);
  },
  urlToCssAttr_(url) {
    return `url("${url.replace(/"/g, () => "%22")}")`;
  },
  assignFavIcons_ff_: 0,
  decodeURL_(url, decode) {
    try {
      url = (decode || decodeURI)(url);
    } catch (_a) {}
    return url;
  },
  decodeFileURL_(url, decoded) {
    if (Vomnibar_.os_ > 1 /* kOS.MAX_NOT_WIN */ && url.startsWith("file://")) {
      const slash = url.indexOf("/", 7);
      if (slash < 0 || slash === url.length - 1) {
        return slash < 0 ? url + "/" : url;
      }
      const type = slash === 7 ? url.charAt(9) === ":" ? 3 : url.substr(9, 3).toLowerCase() === "%3a" ? 5 : 0 : 0;
      url = type ? url[8].toUpperCase() + ":\\" + url.slice(type + 8) : slash === 7 ? url : "\\\\" + url.slice(7);
      let sep = /[?#]/.exec(url), index = sep ? sep.index : 0;
      let tail = index ? url.slice(index) : "";
      url = (index ? url.slice(0, index) : url).replace(/\/\/+/g, "/");
      url = url.replace(/(?<!<)\//g, "\\");
      url = index ? url + tail : url;
    }
    return decoded ? url : VUtils_.decodeURL_(url, decodeURIComponent);
  },
  ensureText_(sug) {
    let {u: url, t: text} = sug, str = url.slice(0, 8).toLowerCase();
    let protocol = str.startsWith("http://") ? 7 /* ProtocolType.http */ : str === "https://" ? 8 /* ProtocolType.https */ : 0 /* ProtocolType.others */;
    protocol >= url.length && (protocol = 0 /* ProtocolType.others */);
    let wantScheme = !protocol;
    if (protocol === 8 /* ProtocolType.https */) {
      let j = url.indexOf("/", protocol);
      (j > 0 ? j < url.length : /* domain has port */ /:\d+\/?$/.test(url)) && (wantScheme = sug.e !== "search" || !!text && url.lastIndexOf(text, 8) === 8);
    }
    if (text) {
      if (protocol) {
        wantScheme && !text.startsWith(str) && (text = str + text);
        url.endsWith("/") && !str.endsWith("/") && str.includes("/") && (text += "/");
      }
    } else {
      text = !wantScheme && protocol ? url.slice(protocol) : url;
    }
    sug.t = VUtils_.decodeFileURL_(text, !!sug.t);
    (str = sug.title) && (sug.title = str.replace(/<\/?match[^>]*?>/g, "").replace(/&(amp|apos|gt|lt|quot);|\u2026/g, VUtils_.onHTMLEntity));
    return protocol;
  },
  onHTMLEntity(_s0, str) {
    return str === "amp" ? "&" : str === "apos" ? "'" : str === "quot" ? '"' : str === "gt" ? ">" : str === "lt" ? "<" : "";
  },
  escapeCSSUrlInAttr_mv2_not_ff_: 0,
  timeCache_: 0,
  timeStr_(timestamp) {
    const cls = Intl.RelativeTimeFormat;
    const lang = document.documentElement.lang || navigator.language;
    const isZh = lang.startsWith("zh"), destLang = isZh ? "zh-CN" : lang;
    const kJustNow = isZh ? "\u521a\u521a" : lang.startsWith("fr") ? "tout \xe0 l'heure" : "just now";
    let dateTimeFormatter;
    let relativeFormatter;
    let tzOffset = 0;
    const kUnits = [ "second", "minute", "hour", "day", /** week */ "", "month", "year" ];
    VUtils_.timeStr_ = t => {
      if (!t) {
        return "";
      }
      if (!VUtils_.timeCache_) {
        const now = new Date;
        VUtils_.timeCache_ = +now;
        tzOffset = 6e4 * now.getTimezoneOffset();
      }
      // Chrome (including Edge C) 37 and 83 has a bug that the unit of Session.lastVisitTime is second
            const negPos = parseInt((VUtils_.timeCache_ - t) / 1e3);
      let d = negPos < 0 ? -negPos : negPos;
      // the range below is copied from `threshold` in momentjs:
      // https://github.com/moment/moment/blob/9d560507e54612cf2fdd84cbaa117337568a384c/src/lib/duration/humanize.js#L4-L12
            const unit = d < 10 ? -1 : d < 45 ? 0 : (d /= 60) < 49.5 ? 1 : (d /= 60) < 22 ? 2 : (d /= 24) < 5 ? 3 : d < 26 ? 4 : d < 304 ? 5 : 6;
      let stdDateTime = new Date(t - tzOffset).toJSON().slice(0, -5).replace("T", " ");
      let str;
      stdDateTime[0] !== "+" && stdDateTime[0] !== "-" || (stdDateTime = stdDateTime.replace(/^\+?(-?)0+/, "$1"));
      if (unit === -1) {
        str = kJustNow;
      } else if (Vomnibar_.showTime_ < 3) {
        !dateTimeFormatter && Vomnibar_.showTime_ > 1 && (dateTimeFormatter = new Intl.DateTimeFormat(destLang, {
          localeMatcher: "best fit",
          second: "2-digit",
          year: "numeric",
          month: "short",
          weekday: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
        }));
        if (Vomnibar_.showTime_ < 2) {
          str = stdDateTime;
          negPos > 0 && stdDateTime[0] !== "-" ? 
          // unit == 6 ? [0, 7] : unit >= 4 ? [5, 10] : unit == 3 ? [8, 16] : unit >= 1 ? [11, 16] : [11, 19]
          str = unit > 3 ? (unit > 5 ? str.slice(0, -12) : str.slice(str[str.length - 14] === "0" ? -13 : -14, -9)).replace("-", " / ") : str.slice(unit > 2 ? str[str.length - 11] === "0" ? -10 : -11 : -8, unit ? -3 : 99) : stdDateTime = "";
        } else {
          str = "";
          const arr = dateTimeFormatter.formatToParts(t);
          for (let i = 0, isLastOutLiteral = true; i < arr.length; i++) {
            const type = arr[i].type;
            const skip = type === "year" ? unit < 6 : type === "month" ? unit < 4 : type === "day" ? unit < 3 || unit > 5 : type === "weekday" ? unit < 3 || unit > 4 : type === "dayPeriod" || type === "hour" || type === "minute" ? unit > 3 : type === "second" ? unit > 0 : type !== "literal";
            if (skip) {
              i += isLastOutLiteral && i + 1 < arr.length && arr[i + 1].type === "literal" ? 1 : 0;
            } else {
              const old = isLastOutLiteral, newVal = arr[i].value;
              isLastOutLiteral = type === "literal";
              !isLastOutLiteral && (type === "weekday" || type[0] === "d" && type.slice(4, 5) === "e") && str && /[.:-]/.test(str[str.length - 1]) && (str = str.slice(0, -1) + " ");
              (!old || isZh && (newVal[0] === "\u661f" || newVal[0] === "\u5468")) && !isLastOutLiteral && str && /[^\x00-\x7f]/.test(str[str.length - 1]) && (str += " ");
              str += isZh && type[0] === "d" && type.slice(4, 5) === "e" ? (d = parseInt(stdDateTime.slice(-8, -6), 10), 
              d >= 12 ? d >= 18 ? d >= 21 ? "\u591c\u665a" : "\u665a\u4e0a" : d >= 13 ? "\u4e0b\u5348" : "\u4e2d\u5348" : d >= 6 ? d >= 9 ? "\u4e0a\u5348" : "\u65e9\u4e0a" : d > 0 ? "\u51cc\u6668" : "\u5348\u591c") : newVal;
            }
          }
          str = str.trim().replace(/[,.: -]+$/, "");
        }
      } else {
        relativeFormatter || (relativeFormatter = new cls(destLang, {
          localeMatcher: "best fit",
          numeric: "auto",
          style: "long"
        }));
        str = relativeFormatter.format((Math.round(unit < 5 ? d : d / 365.25 + .25) || 1) * (negPos > 0 ? -1 : 1), kUnits[unit === 4 ? 3 : unit]);
        str = isZh ? str.replace("\u79d2\u949f", "\u79d2") : str;
      }
      return `<span class="time" title="${stdDateTime}">${str}</span>`;
    };
    return VUtils_.timeStr_(timestamp);
  },
  _macroTasks: [],
  nextTask_(callback) {
    VUtils_._macroTasks.length || (postMessage(0, "*"), VUtils_._onMacroTasks && (addEventListener("message", VUtils_._onMacroTasks, true), 
    VUtils_._onMacroTasks = null));
    VUtils_._macroTasks.push(callback);
  },
  _onMacroTasks() {
    for (const cb of VUtils_._macroTasks.splice(0, VUtils_._macroTasks.length)) {
      cb();
    }
  },
  Stop_(event, prevent) {
    prevent && event.preventDefault();
    event.stopImmediatePropagation();
  }
}, VPort_ = {
  _port: null,
  _confVersion: 0,
  postToOwner_: null,
  post_(request) {
    if (VPort_._port) {
      try {
        VPort_._port.postMessage(request);
        return;
      } catch (_a) {
        VPort_._port = null;
      }
    }
    try {
      VPort_.connect_(264 /* PortType.reconnect */);
    } catch (_b) {
      VPort_ = null;
      this.postToOwner_({
        N: 9
 /* VomnibarNS.kFReq.broken */      });
      return;
    }
    VPort_._port.postMessage(request);
  },
  _Listener(response) {
    const name = response.N;
    name === 43 /* kBgReq.omni_omni */ ? Vomnibar_.options_ && Vomnibar_.omni_(response) : name === 44 /* kBgReq.omni_parsed */ ? Vomnibar_.parsed_(response) : name === 42 /* kBgReq.omni_init */ ? Vomnibar_.secret_ && Vomnibar_.secret_(response) : name === 45 /* kBgReq.omni_returnFocus */ ? VPort_.postToOwner_({
      N: 1 /* VomnibarNS.kFReq.focus */ ,
      l: response.l
    }) : name === 46 /* kBgReq.omni_toggleStyle */ ? Vomnibar_.toggleStyle_(response) : name === 47 /* kBgReq.omni_updateOptions */ ? Vomnibar_.updateOptions_(response.d, response.v) : name === 48 /* kBgReq.omni_refresh */ && (VPort_._port.disconnect(), 
    VPort_.connect_(264 /* PortType.reconnect */));
  },
  _OnOwnerMessage({data}) {
    let name = typeof data === "number" ? data : data.N;
    name === 0 /* VomnibarNS.kCReq.activate */ ? Vomnibar_.activate_(data) : name === 2 /* VomnibarNS.kCReq.focus */ ? Vomnibar_.focus_() : name === 1 /* VomnibarNS.kCReq.hide */ && Vomnibar_.hide_(1);
  },
  _ClearPort() {
    VPort_._port = null;
    !Vomnibar_.isActive_ && Vomnibar_.OnPageHide_();
  },
  connect_(type) {
    type |= VPort_._confVersion << 13 /* PortType.OFFSET_SETTINGS */;
    const data = {
      name: VCID_ ? "vim-plus." /* PortNameEnum.Prefix */ + type + "@dev" /* BuildStr.Commit */ : "" + type
    }, port = VPort_._port = VCID_ ? chrome.runtime.connect(VCID_, data) : chrome.runtime.connect(data);
    port.onDisconnect.addListener(VPort_._ClearPort);
    port.onMessage.addListener(VPort_._Listener);
    return port;
  }
};

(() => {
  if (document.documentElement.dataset.version !== "1.73") {
    console.log("Error: Vomnibar page version dismatches:", document.documentElement.dataset.version);
    location.href = "about:blank";
    return;
  }
  let curEl;
  if (location.pathname.startsWith("/front/") || !(curEl = document.currentScript)) {} else {
    if (!curEl.src.endsWith("/front/vomnibar.js") || /^(ht|s?f)tp/.test(curEl.src) || /^(ht|s?f)tp/.test(location.origin)) {
      curEl.remove();
      return;
    }
    VCID_ = new URL(curEl.src).host;
    VHost_ = VCID_;
  }
  const unsafeMsg = [], isWeb = curEl === null;
  let _sec = "";
  const handler = (unsafeSecretCode, port, options) => {
    if (!_sec || unsafeSecretCode !== _sec) {
      _sec || unsafeMsg.push([ unsafeSecretCode, port, options ]);
      return;
    }
    _sec = "1";
    clearTimeout(autoUnloadTimer);
    removeEventListener("message", onUnknownMsg, true);
    VPort_.postToOwner_ = port.postMessage.bind(port);
    port.onmessage = VPort_._OnOwnerMessage;
    window.onpagehide = Vomnibar_.OnPageHide_;
    VPort_.postToOwner_({
      N: 3 /* VomnibarNS.kFReq.iframeIsAlive */ ,
      o: options ? 1 : 0
    });
    options && Vomnibar_.activate_(options);
  }, onUnknownMsg = event => {
    if (event.source !== parent) {
      return;
    }
    const data = event.data;
    if (!data || data.length !== 3 || data[0] !== "VimiumPlus" || typeof data[1] !== "string" || typeof data[2] !== "object") {
      return;
    }
    isWeb && VUtils_.Stop_(event, 0);
 // smell like VomnibarNS.MessageData
        data[1].length === 16 /* GlobalConsts.VomnibarSecretLength */ && handler(data[1], event.ports[0], data[2]);
  }, autoUnloadTimer = frameElement ? 0 : setTimeout(() => {
    console.log("Error: Vomnibar page hadn't received a valid secret");
    debugger;
    location.href = "about:blank";
  }, 700);
  Vomnibar_.secret_ = ({l: payload, s: secret, v: confVersion}) => {
    Vomnibar_.secret_ = null;
    if (!secret) {
      // see https://github.com/philc/vimium/issues/3832
      _sec = "2";
      unsafeMsg.length = 0;
      removeEventListener("message", onUnknownMsg, true);
      console.log("%cVim+: warning: Vomnibar was unexpectedly opened without triggering Vomnibar.activate!!!", "color: red; background: lightyellow;");
      clearTimeout(autoUnloadTimer);
      setTimeout(() => {
        location.href = "about:blank";
      }, 500);
      return;
    }
    Vomnibar_.browserVer_ = Math.abs(payload.v || 998 /* BrowserVer.assumedVer */);
    Vomnibar_.isEdg_ = payload.v < 0;
    Vomnibar_.os_ = payload.o;
    Vomnibar_.styles_ = ` ${payload.t} `;
    Vomnibar_.customCss_ = payload.c;
    Vomnibar_.updateOptions_(payload, confVersion);
    _sec = secret;
    for (const i of unsafeMsg) {
      if (i[0] === secret) {
        unsafeMsg.length = 0;
        return handler(i[0], i[1], i[2]);
      }
    }
  };
  addEventListener("message", onUnknownMsg, true);
  VPort_.connect_(256 /* PortType.omnibar */);
})();