"use strict";
__filename = "content/link_hints.js";
define([ "require", "exports", "../lib/utils", "../lib/dom_utils", "../lib/rect", "../lib/keyboard_utils", "./dom_ui", "./scroller", "./hud", "./insert", "./local_links", "./hint_filters", "./link_actions", "./async_dispatcher", "./port", "./pagination" ], (require, exports, utils_1, dom_utils_1, rect_1, keyboard_utils_1, dom_ui_1, scroller_1, hud_1, insert_1, local_links_1, hint_filters_1, link_actions_1, async_dispatcher_1, port_1, pagination_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.coreHints = exports.doesWantToReloadLinkHints = exports.detectUsableChild = exports.clear = exports.reinitLinkHintsIn = exports.resetMode = exports.findAnElement_ = exports.tryNestedFrame = exports.setMode = exports.activate = exports.set_isClickListened_ = exports.set_kSafeAllSelector = exports.isHC_ = exports.hintManager = exports.hintApi = exports.addChildFrame_ = exports.kSafeAllSelector = exports.tooHigh_ = exports.isClickListened_ = exports.forHover_ = exports.hintCount_ = exports.hintOptions = exports.mode1_ = exports.hintMode_ = exports.hintChars = exports.useFilter_ = exports.hintKeyStatus = exports.allHints = exports.wantDialogMode_ = exports.hint_box = exports.isHintsActive = void 0;
  let box_ = null;
  exports.hint_box = box_;
  let wantDialogMode_;
  exports.wantDialogMode_ = wantDialogMode_;
  let hints_ = null;
  exports.allHints = hints_;
  let frameArray = [];
  let mode_ = 0 /* HintMode.empty */;
  exports.hintMode_ = mode_;
  let mode1_ = 0 /* HintMode.empty */;
  exports.mode1_ = mode1_;
  let forHover_ = 0;
  exports.forHover_ = forHover_;
  let count_ = 0;
  exports.hintCount_ = count_;
  let lastMode_ = 0;
  let noHUD_ = 0;
  let tooHigh_ = 0;
  exports.tooHigh_ = tooHigh_;
  let isClickListened_ = true;
  exports.isClickListened_ = isClickListened_;
  let chars_ = "";
  exports.hintChars = chars_;
  let useFilter_;
  exports.useFilter_ = useFilter_;
  let keyStatus_;
  exports.hintKeyStatus = keyStatus_;
  /** must be called from a manager, required by {@link #delayToExecute_ } */  let onTailEnter;
  let onWaitingKey;
  let isActive = 0;
  exports.isHintsActive = isActive;
  let options_ = null;
  exports.hintOptions = options_;
  let _timer = 0 /* TimerID.None */ , _reinitTime = 0;
  let kSafeAllSelector = ":not(form)";
  exports.kSafeAllSelector = kSafeAllSelector;
  let manager_ = null;
  exports.hintManager = manager_;
  let api_ = null;
  exports.hintApi = api_;
  let addChildFrame_;
  exports.addChildFrame_ = addChildFrame_;
  let isHC_;
  exports.isHC_ = isHC_;
  function set_kSafeAllSelector(_newKSafeAll) {
    exports.kSafeAllSelector = kSafeAllSelector = _newKSafeAll;
  }
  exports.set_kSafeAllSelector = set_kSafeAllSelector;
  function set_isClickListened_(_newIsClickListened) {
    exports.isClickListened_ = isClickListened_ = _newIsClickListened;
  }
  exports.set_isClickListened_ = set_isClickListened_;
  const activate = (options, count, force) => {
    const oldTimer = _timer, xy = options.xy;
    _timer = _reinitTime = coreHints.h = 0;
    utils_1.clearTimeout_(oldTimer);
    if (isActive && force !== 2 || !utils_1.isEnabled_) {
      return;
    }
    if (dom_ui_1.checkHidden(2 /* kFgCmd.linkHints */ , options, count)) {
      return exports.clear(1);
    }
    if (utils_1.doc.body === null) {
      manager_ || exports.clear();
      if (!oldTimer && utils_1.readyState_ > "l") {
        exports.reinitLinkHintsIn(300, port_1.contentCommands_[2 /* kFgCmd.linkHints */ ].bind(0, options, count, 0));
        return keyboard_utils_1.replaceOrSuppressMost_(4 /* kHandler.linkHints */);
      }
    }
    isClickListened_ && utils_1.vApi.e && utils_1.vApi.e(oldTimer ? 2 /* kContentCmd.ManuallyReportKnownAtOnce */ : 1 /* kContentCmd.AutoReportKnownAtOnce_not_ff */);
    xy && !xy.n && (xy.n = count, count = 1);
    if (options.direct) {
      return activateDirectly(options, count);
    }
    const parApi = !dom_utils_1.fullscreenEl_unsafe_() && dom_ui_1.getParentVApi();
    if (parApi) {
      parApi.l(dom_ui_1.style_ui);
      // recursively go up and use the topmost frame in a same origin
            return parApi.f(2 /* kFgCmd.linkHints */ , options, count, 2, dom_utils_1.frameElement_());
    }
    const useFilter0 = options.useFilter, useFilter = useFilter0 != null ? !!useFilter0 : utils_1.fgCache.f, topFrameInfo = {
      h: [],
      v: null,
      s: coreHints
    }, toCleanArray = [], wantTop = options.onTop, chars = options.c ? options.c : useFilter ? utils_1.fgCache.n : utils_1.fgCache.c;
    frameArray = [ topFrameInfo ];
    exports.isHC_ = isHC_ = matchMedia(utils_1.VTr(86 /* kTip.forcedColors */)).matches;
    coreHints.d = dom_utils_1.MayWoTopLevel && dom_utils_1.withoutToplevel_() ? 0 : dom_ui_1.usePopover_ > 7 || utils_1.chromeVer_ < 132 /* BrowserVer.MinEnsuredDialogToggleEvent */ && dom_utils_1.querySelector_unsafe_("dialog[open]") ? 3 : +!!(wantDialogMode_ != null ? wantDialogMode_ : utils_1.isTY(wantTop) ? utils_1.findOptByHost(wantTop, 0) : wantTop != null ? wantTop : dom_utils_1.hasInCSSFilter_());
    let allHints, child, frameInfo, total, insertPos = 0;
    const childFrames = [], addChild = (officer, el, rect) => {
      const childApi = exports.detectUsableChild(el), childOfficer = childApi && childApi.b;
      if (childOfficer) {
        childApi.l(dom_ui_1.style_ui);
        childFrames.splice(insertPos, 0, {
          v: rect && officer.g(el, rect),
          s: childOfficer
        });
      }
      return !childOfficer;
    };
    coreHints.o(options, count, chars, useFilter, null, null, topFrameInfo, addChild);
    allHints = topFrameInfo.h;
    while (child = childFrames.pop()) {
      if (child.v) {
        insertPos = childFrames.length;
        frameArray.push(frameInfo = {
          h: [],
          v: null,
          s: child.s
        });
        child.s.o(options, count, chars, useFilter, child.v, coreHints, frameInfo, addChild);
        // ensure allHints always belong to the manager frame
                allHints = frameInfo.h.length ? allHints.concat(frameInfo.h) : allHints;
      } else {
        child.s.$().a && toCleanArray.push(child.s);
      }
    }
    for (const i of toCleanArray) {
      i.p = null;
      i.c();
    }
    total = allHints.length;
    if (!total || total > 1e6 /* GlobalConsts.MaxCountToHint */) {
      port_1.runFallbackKey(options, total ? 22 /* kTip.tooManyLinks */ : mode_ < 32 /* HintMode.min_job */ && !options.match ? 71 /* kTip.noLinks */ : 5 /* kTip.noTargets */);
      return exports.clear();
    }
    exports.allHints = hints_ = keyStatus_.c = allHints;
    coreHints.hints_ = allHints;
    noHUD_ = !(useFilter || topFrameInfo.v[3] > 40 && topFrameInfo.v[2] > 320) || options.hideHUD ? 1 : 0;
    useFilter ?  hint_filters_1.initFilterEngine(allHints) : hint_filters_1.initAlphabetEngine(allHints);
    hint_filters_1.renderMarkers(allHints);
    coreHints.h = -utils_1.getTime();
    for (const frame of frameArray) {
      frame.s.r(frame.h, frame.v, utils_1.vApi);
    }
  };
  exports.activate = activate;
  const collectFrameHints = (options, count, chars, useFilter, outerView, manager, frameInfo, newAddChildFrame) => {
    coreHints.p = exports.hintManager = manager_ = manager;
    coreHints.v();
    scroller_1.scrollTick(2);
    if (options_ !== options) {
      /** ensured by {@link ../background/key_mappings.ts#KeyMappings.makeCommand_} */
      exports.hintOptions = options_ = options;
      exports.hintCount_ = count_ = count;
      exports.setMode(count > 1 ? (options.m || 2 /* HintMode.queue */) | 16 /* HintMode.queue */ : options.m, 1);
    }
    exports.hintChars = chars_ = chars;
    exports.useFilter_ = useFilter_ = useFilter;
    if (!dom_utils_1.isHTML_()) {
      return;
    }
    const view = rect_1.getViewBox_((manager || coreHints).d | 1);
    rect_1.prepareCrop_(1, outerView);
    if (tooHigh_ !== null) {
      const scrolling = !options.longPage && dom_utils_1.scrollingEl_(1);
      exports.tooHigh_ = tooHigh_ = scrolling && rect_1.dimSize_(scrolling, 5 /* kDim.scrollH */) / rect_1.wndSize_() > 20 /* GlobalConsts.LinkHintTooHighThreshold */ ? 1 : 0;
    }
    dom_ui_1.removeDialog_();
    local_links_1.initTestRegExps();
 // needed by generateHintText
        exports.addChildFrame_ = addChildFrame_ = newAddChildFrame;
    const elements =  local_links_1.getVisibleElements(view);
    const hintItems = elements.map(hint_filters_1.createHint);
    exports.addChildFrame_ = addChildFrame_ = null;
    rect_1.WithOldZoom && rect_1.bZoom_ !== 1 &&  hint_filters_1.adjustMarkers_old_cr_edge(hintItems, elements);
    for (let i = useFilter ? hintItems.length : 0; 0 <= --i; ) {
      hintItems[i].h = hint_filters_1.generateHintText(elements[i], i, hintItems);
    }
    frameInfo.h = hintItems;
    frameInfo.v = view;
  };
  const render = (hints, arr, raw_apis) => {
    const managerOrA = manager_ || coreHints;
    let body = utils_1.doc.body;
    manager_ && (body && dom_utils_1.htmlTag_(body) && body.isContentEditable || utils_1.isIFrameInAbout_) && port_1.hookOnWnd(0 /* HookAction.Install */);
    removeBox();
    exports.hintApi = api_ = raw_apis;
    dom_ui_1.ensureBorder();
    manager_ || exports.setMode(mode_);
    hints.length ? exports.hint_box = box_ = dom_ui_1.addElementList(hints, arr, managerOrA.d | coreHints.d) : manager_ || dom_ui_1.adjustUI();
    utils_1.set_keydownEvents_(raw_apis.a());
    insert_1.set_onWndBlur2(managerOrA.s);
    keyboard_utils_1.replaceOrSuppressMost_(4 /* kHandler.linkHints */ , coreHints.n);
    manager_ && utils_1.setupEventListener(0, dom_utils_1.PGH, exports.clear);
 // "unload" is deprecated
        exports.isHintsActive = isActive = 1;
    options_.suppressInput && insert_1.insertInit(true);
  };
  /** must be called from the manager context, or be used to sync mode from the manager */  const setMode = (mode, silent) => {
    mode_ - mode && (lastMode_ = exports.hintMode_ = mode_ = mode);
    exports.mode1_ = mode1_ = mode & -17 /* HintMode.queue */;
    exports.forHover_ = forHover_ = mode1_ > 31 && mode1_ < 34 ? 1 : 0;
    if (silent || noHUD_ || hud_1.hud_tipTimer) {
      return;
    }
    let key;
    let msg = onTailEnter && !onWaitingKey ? utils_1.VTr(63 /* kTip.waitForEnter */) : utils_1.VTr(mode_) + (useFilter_ || isHC_ ? ` [${key = isHC_ ? keyStatus_.k + keyStatus_.t : keyStatus_.t}]` : "") + ((useFilter_ || isHC_) && key || !coreHints.d ? "" : utils_1.VTr(30 /* kTip.modalHints */));
    hud_1.hudShow(1 /* kTip.raw */ , msg, true);
  };
  exports.setMode = setMode;
  const getPreciseChildRect = (frameEl, view) => {
    const V = "visible", brect = rect_1.boundingRect_(frameEl), // not check <iframe>s referred by <slot>s
    docEl = dom_utils_1.docEl_unsafe_(), body = utils_1.doc.body, inBody = !!body && dom_utils_1.IsAInB_(frameEl, body), totalScale = inBody ? rect_1.dScale_ * rect_1.bScale_ : rect_1.dScale_, zoom = (rect_1.WithOldZoom ? rect_1.docZoom_ * (inBody ? rect_1.bZoom_ : 1) : 1) / totalScale;
    let x0 = utils_1.min_(view.l, brect.l), y0 = utils_1.min_(view.t, brect.t), l = x0, t = y0, r = view.r, b = view.b;
    for (let el = frameEl; el = dom_utils_1.GetParent_unsafe_(el, 4 /* PNType.RevealSlotAndGotoParent */); ) {
      const st = dom_utils_1.getComputedStyle_(el);
      if (st.overflow !== V) {
        let outer = rect_1.boundingRect_(el), hx = st.overflowX !== V, hy = st.overflowY !== V, scale = el !== docEl ? totalScale : rect_1.dScale_;
        /** Note: since `el` is not safe, `dimSize_(el, *)` may returns `NaN` */        hx && (l = utils_1.max_(l, outer.l), 
        r = l + utils_1.min_(r - l, outer.r - outer.l, hy && rect_1.dimSize_(el, 2 /* kDim.elClientW */) * scale || r));
        hy && (t = utils_1.max_(t, outer.t), b = t + utils_1.min_(b - t, outer.b - outer.t, hx && rect_1.dimSize_(el, 3 /* kDim.elClientH */) * scale || b));
      }
    }
    l = utils_1.max_(l, view.l), t = utils_1.max_(t, view.t);
    const cropped = l + 7 < r && t + 7 < b ? {
      l: (l - x0) * zoom,
      t: (t - y0) * zoom,
      r: (r - x0) * zoom,
      b: (b - y0) * zoom
    } : null;
    let hints;
    return !cropped || utils_1.fgCache.e && !(local_links_1.filterOutNonReachable(hints = [ [ frameEl, {
      l,
      t,
      r,
      b
    }, 7 /* ClickType.frame */ ] ]), hints.length) ? null : cropped;
  };
  const tryNestedFrame = (cmd, options, count) => {
    if (local_links_1.frameNested_ !== null) {
      cmd - 6 /* kFgCmd.vomnibar */ && rect_1.getZoom_();
      rect_1.prepareCrop_();
      local_links_1.checkNestedFrame();
    }
    if (!local_links_1.frameNested_) {
      return false;
    }
    const childApi = exports.detectUsableChild(local_links_1.frameNested_);
    if (childApi) {
      childApi.f(cmd, options, count);
      utils_1.readyState_ > "i" && local_links_1.set_frameNested_(false);
    } else {
      // It's cross-site, or Vim+ on the child is wholly disabled
      // * Cross-site: it's in an abnormal situation, so we needn't focus the child;
      local_links_1.set_frameNested_(null);
    }
    return !!childApi;
  };
  exports.tryNestedFrame = tryNestedFrame;
  const onKeydown = event => {
    let matchedHint, key, keybody, i = event.i;
    let ret = 2 /* HandlerResult.Prevent */;
    if (manager_) {
      utils_1.set_keydownEvents_(api_.a());
      ret = manager_.n(event);
    } else if (onWaitingKey && !keyboard_utils_1.isEscape_(keyboard_utils_1.getMappedKey(event, 4 /* kModeId.Link */))) {
      onWaitingKey();
    } else if (isActive) {
      if (keyboard_utils_1.isRepeated_(event)) {} else if (i === 229 /* kKeyCode.ime */) {
        hud_1.hudTip(72 /* kTip.exitForIME */);
        exports.clear();
        ret = 0 /* HandlerResult.Nothing */;
      } else if (key = keyboard_utils_1.getMappedKey(event, 4 /* kModeId.Link */), keybody = keyboard_utils_1.keybody_(key), 
      keyboard_utils_1.isEscape_(key) || onTailEnter && keybody === keyboard_utils_1.BSP) {
        exports.clear();
      } else if (i === 27 /* kKeyCode.esc */ || event.v) {
        ret = 1 /* HandlerResult.Suppress */;
      } else if (onTailEnter && keybody !== "f12" /* kChar.f12 */) {
        onTailEnter(event, key, keybody);
      } else if (keybody > "f0" /* kChar.maxNotF_num */ && keybody < "f:" /* kChar.minNotF_num */ && key !== "f1" /* kChar.f1 */) {
        // exclude plain <f1>
        i = 0;
        keybody > "f1" /* kChar.f1 */ && keybody !== "f2" /* kChar.f2 */ ? ret = 0 /* HandlerResult.Nothing */ : keybody < "f2" /* kChar.f2 */ ? // <*-f1> or <*-f0***>
        key < "b" && useFilter_ ? locateHint(hint_filters_1.activeHint_).l(hint_filters_1.activeHint_) : key > "s" && // <s-f1> or <s-f0[_a-z0-9]+>
        frameArray.forEach( toggleClassForKey.bind(0, keybody)) : (i = 1, key > "a-s" && key.includes("-s") ? // <a-s-f2>, <c-s-f2> or <m-s-f2>
        utils_1.fgCache.e = !utils_1.fgCache.e : key < "b" ? // <a-f2>, <a-c-f2>, <a-m-f2> or <a-c-*-f2>
        dom_utils_1.MayWoTopLevel && dom_utils_1.withoutToplevel_() ? i = 0 : exports.wantDialogMode_ = wantDialogMode_ = !coreHints.d : key < "d" || key[0] === "m" ? // <c-f2> or <m-f2>
        options_.useFilter = utils_1.fgCache.f = !useFilter_ : key !== keybody ? exports.isClickListened_ = isClickListened_ = !isClickListened_ : utils_1.vApi.e ? // plain <f2>
        exports.isClickListened_ = isClickListened_ = true : i = 0);
        exports.resetMode(i);
        i && utils_1.timeout_(reinit, 0);
      } else if (keybody !== "tab" /* kChar.tab */ || useFilter_ || keyStatus_.k) {
        if (coreHints.h = 0, i < 19 && i > 15 || !utils_1.os_ && i > 90 /* kKeyCode.maxNotMetaKey */ && i < 94 /* kKeyCode.minNotMetaKeyOrMenu */ /* kKeyCode.os_ff_mac */) {
          key && keybody !== "modifier" /* kChar.Modifier */ || toggleModesOnModifierKey(event, i);
        } else if (keybody === "alt") {
          toggleModesOnModifierKey(event, 18 /* kKeyCode.altKey */);
        } else if (key[0] === (utils_1.os_ ? "c" : "m") && "0-=".includes(key[2]) && !chars_.includes(key[2])) {
          ret = -1 /* HandlerResult.PassKey */;
        } else if (i = keyboard_utils_1.keyNames_.indexOf(keybody), i > 0) {
          i > 2 && insert_1.raw_insert_lock || scroller_1.beginScroll(event, key, keybody);
          exports.resetMode();
          ret = i > 2 && insert_1.raw_insert_lock ? 1 /* HandlerResult.Suppress */ : 2 /* HandlerResult.Prevent */;
        } else if (keybody !== keyboard_utils_1.SPC || useFilter_ && key === keybody) {
          if (matchedHint =  hint_filters_1.matchHintsByKey(keyStatus_, event, key, keybody), 
          matchedHint === 0) {
            // then .keyStatus_.hintSequence_ is the last key char
            exports.clear(0, keyStatus_.n ? 0 : utils_1.fgCache.k[0]);
          } else if (matchedHint !== 2) {
            lastMode_ = mode_;
            callExecuteHint(matchedHint, event);
          }
        } else {
          keyStatus_.t = keyStatus_.t.replace("  ", " ");
          hint_filters_1.zIndexes_ !== 0 && frameArray.forEach( rotateHints.bind(0, key === "s-" + keybody));
          exports.resetMode();
        }
      } else {
        exports.tooHigh_ = tooHigh_ = null;
        exports.resetMode();
        utils_1.timeout_(reinit, 0);
      }
    } else {
      keyboard_utils_1.isEscape_(keyboard_utils_1.getMappedKey(event, 4 /* kModeId.Link */)) && exports.clear();
    }
    return ret;
  };
  const toggleModesOnModifierKey = (event, i, silent) => {
    const mode = mode_, mode1 = mode1_;
    let num1 = mode1 > 39 && mode1 < 44 ? i === 17 /* kKeyCode.ctrlKey */ || i > 90 /* kKeyCode.maxNotMetaKey */ ? 1 /* HintMode.list */ ^ (mode1 | 16 /* HintMode.queue */) : i === 18 /* kKeyCode.altKey */ ? mode & -2 /* HintMode.list */ ^ 16 /* HintMode.queue */ : mode : i === 18 /* kKeyCode.altKey */ ? mode < 64 /* HintMode.min_disable_queue */ ? 16 /* HintMode.queue */ ^ ((mode1 < 32 /* HintMode.min_job */ ? 2 /* HintMode.newTab */ : 0 /* HintMode.empty */) | mode) : mode : mode1 < 32 /* HintMode.min_job */ ? i === 16 /* kKeyCode.shiftKey */ === !options_.swapCtrlAndShift ? 3 /* HintMode.mask_focus_new */ ^ (mode | 1 /* HintMode.focused */) : 1 /* HintMode.focused */ ^ (mode | 2 /* HintMode.newTab */) : mode;
    if (num1 !== mode) {
      exports.setMode(num1, silent);
      num1 = keyboard_utils_1.getKeyStat_(event.e);
      num1 & num1 - 1 || (lastMode_ = mode);
    }
  };
  const toggleClassForKey = (name, frame) => {
    dom_utils_1.toggleClass_s(frame.s.$().b, "HM-" + name);
  };
  const rotateHints = (reverse, list) => {
    list.s.t(list.h, reverse, !keyStatus_.k && !keyStatus_.t);
  };
  const callExecuteHint = (hint, event) => {
    const selectedHintWorker = locateHint(hint), clickEl = utils_1.weakRef_not_ff(hint.d);
    const retainedInput = mode_ & 16 /* HintMode.queue */ && options_.retainInput && keyStatus_ && keyStatus_.t;
    const p = selectedHintWorker.e(hint, event);
    p && (onWaitingKey = utils_1.getTime /** after {@link resetHints} */ , p.then(result => {
      exports.isHintsActive = isActive = 0;
      port_1.runFallbackKey(options_, mode_ > 31 && 0);
      link_actions_1.removeFlash && link_actions_1.removeFlash();
      link_actions_1.set_removeFlash(null);
      if (!(mode_ & 16 /* HintMode.queue */)) {
        exports.clear(0, 0);
        // always set a timer, so that a next `F` will know there was a recent click (github #638)
                exports.reinitLinkHintsIn(255, selectedHintWorker, clickEl, result);
      }
      mode_ & 16 /* HintMode.queue */ && exports.reinitLinkHintsIn(frameArray.length > 1 ? 50 : 18, () => {
        reinit(0, selectedHintWorker, clickEl, result, retainedInput);
        isActive && 1 === (exports.hintCount_ = --count_) && exports.setMode(mode1_);
      });
    }));
  };
  const findAnElement_ = (options, count, alsoBody) => {
    const exOpts = options.directOptions || {}, elIndex = exOpts.index, indByCount = elIndex === "count" || count < 0, offset = exOpts.offset || "", wholeDoc = ("" + exOpts.search).startsWith("doc"), matchEl = (hints, el1) => {
      pagination_1.isInteractiveInPage(el1) && hints.push([ el1 ]);
    }, computeOffset = () => {
      const cur = dom_utils_1.derefInDoc_(scroller_1.currentScrolling), end = matches.length;
      let mid, low = 0, high = cur ? end - 1 : -1;
      while (low <= high) {
        mid = low + high >> 1;
        const midEl = matches[mid][0];
        if (midEl === cur) {
          low = mid + (matchIndex >= 0);
          break;
        }
        dom_utils_1.compareDocumentPosition(midEl, cur) & 4 ? low = mid + 1 : high = mid - 1;
      }
      return exOpts.loop ? (low + matchIndex) % end : low < -matchIndex ? end : low + matchIndex;
    };
    let isSel;
    let matches, oneMatch, matchIndex;
    let el;
    let d = options.direct, defaultMatch = options.match;
    defaultMatch = utils_1.isTY(defaultMatch) && defaultMatch || null;
    d = utils_1.isTY(d) && d ? d : defaultMatch && d === true ? "em" : "em,sel,f,h";
    rect_1.getZoom_(1);
    rect_1.prepareCrop_();
    for (let i of d.split(d.includes(";") ? ";" : ",")) {
      const key = utils_1.Lower(i.split("=")[0]), testD = "".includes.bind(key), j = i.slice(key.length + 1).trim();
      isSel = 0;
      el = testD("em") ? (options.match = j || defaultMatch) && (matches = local_links_1.traverse(kSafeAllSelector, options, matchEl, 1, wholeDoc, 1), 
      matchIndex = indByCount ? count < 0 ? count : count - 1 : +elIndex || 0, oneMatch = matches.slice(offset > "e" ? ~matchIndex : offset < "c" ? matchIndex : computeOffset())[0]) && oneMatch[0] : testD("el") ? rect_1.isSelARange(dom_utils_1.getSelection_()) && (el = dom_utils_1.getSelectionFocusEdge_(dom_ui_1.getSelected()), 
      isSel = !!el, el) : testD("sc") || testD("ac") ? dom_utils_1.derefInDoc_(scroller_1.currentScrolling) : testD("la") || testD("ec") ? /* last-focused / recently-focused */ dom_utils_1.derefInDoc_(insert_1.insert_last_) || dom_utils_1.derefInDoc_(insert_1.insert_last2_) : testD("f") ? insert_1.insert_Lock_() || dom_utils_1.SafeEl_not_ff_(dom_utils_1.deepActiveEl_unsafe_(alsoBody)) : testD("h") || testD("cl") ? dom_utils_1.derefInDoc_(async_dispatcher_1.lastHovered_) : testD("b") ? dom_utils_1.SafeEl_not_ff_(utils_1.doc.body || dom_utils_1.docEl_unsafe_()) : null;
      if (!testD("em")) {
        if (el && j) {
          const el2 = dom_utils_1.SafeEl_not_ff_(utils_1.safeCall(dom_utils_1.querySelector_unsafe_, j, el));
          el = el2 === null ? dom_utils_1.SafeEl_not_ff_(el.closest(j)) : el2;
        }
        el = el && rect_1.isNotInViewport(el) < (wholeDoc ? 2 : 1) && local_links_1.excludeHints([ [ el ] ], options, 1).length > 0 ? el : null;
      }
      if (el) {
        break;
      }
    }
    return [ el, wholeDoc, indByCount, isSel ];
  };
  exports.findAnElement_ = findAnElement_;
  const activateDirectly = (options, count) => {
    const mode = options.m, next = () => {
      if (count < 1) {
        exports.clear();
        return;
      }
      count = dom_utils_1.IsAInB_(el) ? (coreHints.e({
        d: el,
        r: null,
        m: null
      }, 0, res[3] && dom_ui_1.getSelectionBoundingBox_()), count - 1) : 0;
      count || port_1.runFallbackKey(options_, mode > 31 && 0);
      utils_1.timeout_(next, count > 99 ? 1 : count && 17);
    }, res = exports.findAnElement_(options, count), rawEl = res[0], el = mode < 32 /* HintMode.min_job */ || rawEl && dom_utils_1.htmlTag_(rawEl) ? rawEl : null;
    exports.clear();
    if (el && dom_utils_1.IsAInB_(el)) {
      count = mode < 32 /* HintMode.min_job */ && !res[2] ? count : 1;
      exports.hintApi = api_ = utils_1.vApi;
      exports.hintOptions = options_ = options;
      exports.setMode(mode, exports.hintCount_ = count_ = exports.isHintsActive = isActive = 1);
      rect_1.set_cropNotReady_(2);
      res[1] && rect_1.view_(el);
      next();
    } else {
      port_1.runFallbackKey(options, 5 /* kTip.noTargets */);
    }
  };
  const locateHint = matchedHint => {
    /** safer; necessary since {@link #highlightChild} calls {@link #detectUsableChild} */
    let i = frameArray.length;
    while (0 < --i) {
      if (frameArray[i].h.includes(matchedHint)) {
        break;
      }
    }
    return frameArray[i].s;
  };
  const highlightHint = hint => {
    dom_ui_1.flash_(hint.m, null, 660, " Sel");
    dom_utils_1.toggleClass_s(box_, "HMM");
  };
  const resetMode = silent => {
    if (lastMode_ !== mode_ && mode_ < 64 /* HintMode.min_disable_queue */) {
      let d = utils_1.keydownEvents_;
      (d[17 /* kKeyCode.ctrlKey */ ] || d[91 /* kKeyCode.metaKey */ ] || d[16 /* kKeyCode.shiftKey */ ] || d[18 /* kKeyCode.altKey */ ] || d[93 /* kKeyCode.osRight_mac */ ] || d[92 /* kKeyCode.osRight_not_mac */ ]) && exports.setMode(lastMode_, silent);
    }
  };
  exports.resetMode = resetMode;
  const delayToExecute = (officer, hint, flashEl) => {
    const waitEnter = utils_1.fgCache.w, callback = (event, key, keybody) => {
      let closed;
      try {
        closed = officer.x(1);
      } catch (_a) {}
      if (closed !== 2) {
        hud_1.hudTip(73 /* kTip.linkRemoved */);
        isActive && exports.clear();
      } else if (event) {
        tick = waitEnter && keybody === keyboard_utils_1.SPC ? tick + 1 : 0;
        tick === 3 || keybody === keyboard_utils_1.ENTER ? callExecuteHint(hint, event) : key === "f1" /* kChar.f1 */ && flashEl && dom_utils_1.toggleClass_s(flashEl, "Sel");
      } else {
        callExecuteHint(hint);
      }
    };
    let tick = 0;
    onTailEnter = callback;
    removeBox();
    waitEnter ? exports.setMode(mode_) : onWaitingKey = keyboard_utils_1.suppressTail_(200 /* GlobalConsts.TimeOfSuppressingTailKeydownEvents */ , onTailEnter);
  };
  /** reinit: should only be called on manager */  const reinit = (auto, officer, lastEl, rect, retainedInput) => {
    const now = utils_1.getTime();
    if (utils_1.isEnabled_) {
      exports.isHintsActive = isActive = 0;
      coreHints.v();
      port_1.contentCommands_[2 /* kFgCmd.linkHints */ ](options_, 0);
      if (!isActive) {
        return;
      }
      coreHints.h = now;
      retainedInput && useFilter_ && hint_filters_1.getMatchingHints(keyStatus_, retainedInput, "", 3);
      officer && mode1_ < 32 /* HintMode.min_job */ && exports.reinitLinkHintsIn(frameArray.length > 1 ? 380 : 255, officer, lastEl, rect, now);
      onWaitingKey = auto ? keyboard_utils_1.suppressTail_(220 /* GlobalConsts.TimeOfSuppressingUnexpectedKeydownEvents */ ,  resetOnWaitKey) : onWaitingKey;
    } else {
      exports.clear();
    }
  };
  const resetOnWaitKey = () => {
    onWaitingKey = null;
  };
  /** should only be called on manager */  exports.reinitLinkHintsIn = (timeout, officer, el, r, start) => {
    const now = utils_1.getTime();
    _reinitTime = utils_1.max_(now, (start || now) + timeout, _reinitTime);
    utils_1.clearTimeout_(_timer);
    _timer = utils_1.timeout_(utils_1.isTY(officer, 2 /* kTY.func */) ? officer : () => {
      _timer = _reinitTime = 0 /* TimerID.None */;
      let doesReinit;
      try {
        // can not use safeCall, in case `unwrap_ff(officer).x` throws
        doesReinit = (officer || coreHints).x(el, r, isActive && coreHints.h && hints_ && hints_.length < (frameArray.length > 1 ? 200 : 99));
      } catch (_a) {}
      doesReinit && reinit(1);
    }, Math.max(_reinitTime - now, 50 /* GlobalConsts.MinCancelableInBackupTimer */));
  };
  // if not el, then reinit if only no key stroke and hints.length < 64
    const checkLast = (el, r, hasJustReinited) => {
    const hasEl = el;
    let r2, hidden;
    if (utils_1.isAlive_) {
      if (window.closed) {
        return 1;
      }
      if (el === 1) {
        return 2;
      }
      r2 = hasEl && (el = dom_utils_1.derefInDoc_(el)) ? rect_1.boundingRect_(el) : null;
      hidden = !r2 || (r2.r - r2.l) * (r2.b - r2.t) < 4 || !dom_utils_1.isStyleVisible_(el);
      hidden && el === utils_1.deref_(async_dispatcher_1.lastHovered_) && async_dispatcher_1.hover_async();
      return r2 && !r || !hasJustReinited || !(hidden || utils_1.abs_(r2.l - r.l) > 100 || utils_1.abs_(r2.t - r.t) > 60) || hasEl && !exports.doesWantToReloadLinkHints("cl") ? 0 : 1;
    }
    return 0;
  };
  const resetHints = () => {
    // here should not consider about .manager_
    onWaitingKey = onTailEnter = exports.allHints = hints_ = null;
    coreHints.hints_ = null;
     hint_filters_1.hintFilterReset();
    keyStatus_ && (keyStatus_.c = null);
    exports.hintKeyStatus = keyStatus_ = {
      c: null,
      k: "",
      t: "",
      n: 0,
      b: 0
    };
    coreHints.keyStatus_ = keyStatus_;
    for (const frame of frameArray) {
      frame.h = [];
    }
  };
  const clear = (onlySelfOrEvent, suppressTimeout) => {
    if (!utils_1.isAlive_) {
      return;
    }
    if (onlySelfOrEvent === 1 || onlySelfOrEvent && onlySelfOrEvent.isTrusted && onlySelfOrEvent.target === utils_1.doc) {
      coreHints.p && manager_.u(coreHints);
      exports.hintManager = manager_ = null;
      if (onlySelfOrEvent !== 1) {
        return;
      }
    }
    const manager = coreHints.p, oldMode = isActive ? mode1_ : 34;
    utils_1.clearTimeout_(_timer);
    exports.isHintsActive = isActive = _timer = _reinitTime = 0;
    exports.hintManager = manager_ = coreHints.p = null;
    manager && manager.c(onlySelfOrEvent, suppressTimeout);
    frameArray.forEach(utils_1.safeCall.bind(0, frameInfo => {
      let frame = frameInfo.s, hasManager = frame.p;
      frame.p = null;
      hasManager && frame.c(0, suppressTimeout);
    }));
    coreHints.y = frameArray = [];
    manager && utils_1.setupEventListener(0, dom_utils_1.PGH, exports.clear, 1);
    coreHints.v();
    keyboard_utils_1.removeHandler_(4 /* kHandler.linkHints */);
    suppressTimeout != null && keyboard_utils_1.suppressTail_(suppressTimeout);
    link_actions_1.removeFlash && link_actions_1.removeFlash();
    insert_1.set_onWndBlur2(link_actions_1.set_removeFlash(exports.isHC_ = isHC_ = api_ = options_ = null));
    hint_filters_1.set_maxPrefixLen_(lastMode_ = exports.hintMode_ = mode_ = exports.mode1_ = mode1_ = exports.hintCount_ = count_ = coreHints.h = noHUD_ = exports.forHover_ = forHover_ = exports.tooHigh_ = tooHigh_ =  local_links_1.localLinkClear());
    coreHints.d = 0;
    insert_1.set_grabBackFocus(exports.useFilter_ = useFilter_ = false);
    exports.hintChars = chars_ = "";
    removeBox();
    hud_1.hud_tipTimer || hud_1.hudHide();
    oldMode < 34 && !manager && exports.reinitLinkHintsIn(1e3);
 // just a flag to test on re-activate
    };
  exports.clear = clear;
  const removeBox = () => {
    if (box_) {
      dom_utils_1.removeEl_s(box_);
      exports.hint_box = box_ = null;
    }
    dom_ui_1.removeDialog_();
    dom_ui_1.set_usePopover_(dom_ui_1.usePopover_ & -2);
  };
  const onFrameUnload = officer => {
    const frames = frameArray, len = frames.length;
    let i = 0, offset = 0;
    while (i < len && frames[i].s !== officer) {
      offset += frames[i++].h.length;
    }
    if (i >= len || !isActive || _timer) {
      return;
    }
    const deleteCount = frames[i].h.length;
    deleteCount && hints_.splice(offset, deleteCount);
 // remove `readonly` on purpose
        frames.splice(i, 1);
    if (!deleteCount) {
      return;
    }
    onWaitingKey = onTailEnter ? onWaitingKey : keyboard_utils_1.suppressTail_(220 /* GlobalConsts.TimeOfSuppressingUnexpectedKeydownEvents */ ,  resetOnWaitKey);
    hint_filters_1.set_zIndexes_(null);
    keyStatus_.c = hints_;
    keyStatus_.n = keyStatus_.b = 0;
    if (hints_.length) {
      if (useFilter_) {
        hint_filters_1.getMatchingHints(keyStatus_, "", "", 1);
      } else {
        hints_.forEach(hint => {
          hint.m.innerText = "";
        });
        hint_filters_1.initAlphabetEngine(hints_);
        hint_filters_1.renderMarkers(hints_);
      }
    } else {
      hud_1.hudTip(17 /* kTip.frameUnloaded */);
      exports.clear();
    }
  };
  const detectUsableChild = el => {
    let childApi, err = true;
    try {
      err = !el.contentDocument || !(childApi = el.contentWindow.VApi) || childApi.a(utils_1.keydownEvents_);
    } catch (e) {
      {
        let notDocError = true;
        if (utils_1.chromeVer_ < 67 /* BrowserVer.Min$ContentDocument$NotThrow */) {
          try {
            notDocError = el.contentDocument !== void 0;
          } catch (_a) {
            notDocError = false;
          }
        }
        notDocError && console.log("Assert error: Child frame check breaks:", e);
      }
    }
    return err ? null : childApi || null;
  };
  exports.detectUsableChild = detectUsableChild;
  const doesWantToReloadLinkHints = reason => {
    let conf = options_.autoReload, accept = !utils_1.isTY(conf) || conf === "all" || utils_1.Lower(conf).includes(reason);
    accept = accept && !navigator.scheduling.isInputPending();
    return accept;
  };
  exports.doesWantToReloadLinkHints = doesWantToReloadLinkHints;
  const coreHints = {
    $(doesResetMode) {
      return {
        a: isActive,
        b: box_,
        k: keyStatus_,
        m: doesResetMode ? exports.hintMode_ = mode_ = 0 /* HintMode.DEFAULT */ : mode_
      };
    },
    d: 0,
    h: 0,
    y: [],
    x: checkLast,
    c: exports.clear,
    o: collectFrameHints,
    j: delayToExecute,
    e: link_actions_1.executeHintInOfficer,
    g: getPreciseChildRect,
    l: highlightHint,
    r: render,
    t: hint_filters_1.rotate1,
    p: null,
    n: onKeydown,
    s: exports.resetMode,
    i: reinit,
    v: resetHints,
    u: onFrameUnload
  };
  exports.coreHints = coreHints;
  coreHints.hints_ = coreHints.keyStatus_ = null;
});