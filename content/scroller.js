"use strict";
__filename = "content/scroller.js";
define([ "require", "exports", "../lib/utils", "../lib/dom_utils", "../lib/rect", "./dom_ui", "./key_handler", "./link_hints", "./marks", "../lib/keyboard_utils", "./port" ], (require, exports, utils_1, dom_utils_1, rect_1, dom_ui_1, key_handler_1, link_hints_1, marks_1, keyboard_utils_1, port_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.onActivate = exports.suppressScroll = exports.shouldScroll_s = exports.makeElementScrollBy_ = exports.scrollIntoView_s = exports.getPixelScaleToScroll = exports.onScrolls = exports.beginScroll = exports.scrollTick = exports.executeScroll = exports.activate = exports.$sc = exports.set_cachedScrollable = exports.setNewScrolling = exports.scrolled = exports.keyIsDown = exports.cachedScrollable = exports.currentScrolling = void 0;
  const kSE = "scrollend";
  let toggleAnimation = null;
  let maxKeyInterval = 1;
  let minDelay;
  let currentScrolling = null;
  exports.currentScrolling = currentScrolling;
  let cachedScrollable = null;
  exports.cachedScrollable = cachedScrollable;
  let keyIsDown = 0;
  exports.keyIsDown = keyIsDown;
  let preventPointEvents;
  let scale = 1;
  let joined = {
    a: 0
  };
  let scrolled = 0;
  exports.scrolled = scrolled;
  let isTopScrollable = 1;
  const setNewScrolling = el => {
    exports.currentScrolling = currentScrolling = utils_1.weakRef_not_ff(dom_utils_1.SafeEl_not_ff_(el));
    exports.cachedScrollable = cachedScrollable = null;
  };
  exports.setNewScrolling = setNewScrolling;
  function set_cachedScrollable(_newCurSc) {
    exports.cachedScrollable = cachedScrollable = _newCurSc;
  }
  exports.set_cachedScrollable = set_cachedScrollable;
  let performAnimate = (newEl, newDi, newAmount, newOpts) => {
    const hasNewScrollEnd = true /* BrowserVer.MinEnsuredScrollend */;
    let amount, sign, calibration, di, duration, element, elementRoot, beforePos, timestamp, rawTimestamp, totalDelta, totalElapsed, flags, calibTime, lostFrames, totalTick, styleTop, onFinish, wait2, padding, min_delta = 0, running = 0, timer = 0 /* TimerID.None */ , animate = newRawTimestamp => {
      const continuous = keyIsDown > 0;
      let rawElapsed = newRawTimestamp - rawTimestamp;
      let elapsed, delay2, newTimestamp = newRawTimestamp;
      // although timestamp is mono, Firefox adds too many limits to its precision
            if (timestamp) {
        if (rawElapsed < 3 && totalTick < 2) {
          elapsed = min_delta || 17 /* ScrollConsts.tickForUnexpectedTime */;
          newTimestamp = timestamp + elapsed;
        } else if (rawElapsed < 1e-5) {
          elapsed = 0;
        } else if (timer) {
          elapsed = min_delta;
          timer = 0 /* TimerID.None */;
        } else {
          elapsed = newRawTimestamp > timestamp ? newRawTimestamp - timestamp : 0;
          if (preventPointEvents > 19 && rawElapsed > preventPointEvents && min_delta > 4 && rawElapsed > min_delta * 1.8 && ++lostFrames > 2) {
            preventPointEvents = 2;
            toggleAnimation(1);
          }
          min_delta = rawTimestamp ? min_delta ? rawElapsed < min_delta * .7 ? .85 * min_delta : rawElapsed < min_delta * 1.3 ? (min_delta + rawElapsed) / 2 : (min_delta * 7 + rawElapsed) / 8 : rawElapsed < 3 && rawTimestamp !== timestamp ? 0 : utils_1.min_(utils_1.max_(rawTimestamp !== timestamp ? 11 : 6, rawElapsed + .1), 17 /* ScrollConsts.firstTick */) : min_delta;
        }
      } else {
        newTimestamp = performance.now();
        elapsed = utils_1.max_(newRawTimestamp + (min_delta || 17 /* ScrollConsts.firstTick */) - newTimestamp, 1);
        newTimestamp = utils_1.max_(newRawTimestamp, newTimestamp);
        beforePos = rect_1.dimSize_(element, 8 /* kDim.positionX */ + di);
      }
      totalElapsed += elapsed;
      totalTick++;
      rawTimestamp = newRawTimestamp;
      timestamp = newTimestamp;
      if (!running || !utils_1.isAlive_) {
        toggleAnimation();
        return;
      }
      if (continuous && totalElapsed >= 75 /* ScrollConsts.delayToChangeSpeed */) {
        totalElapsed > minDelay && (exports.keyIsDown = keyIsDown = keyIsDown > elapsed ? keyIsDown - elapsed : 0);
        calibTime += elapsed;
        if (.5 /* ScrollConsts.minCalibration */ <= calibration && calibration <= 1.6 /* ScrollConsts.maxCalibration */ && calibTime > 47 /* ScrollConsts.SpeedChangeInterval */) {
          const calibrationScale = 150 /* ScrollConsts.calibrationBoundary */ / amount / calibration;
          calibration *= calibrationScale > 1.05 /* ScrollConsts.maxS */ ? 1.05 /* ScrollConsts.maxS */ : calibrationScale < .95 /* ScrollConsts.minS */ ? .95 /* ScrollConsts.minS */ : 1;
          calibTime = 0;
        }
      }
      let near_elapsed = elapsed;
      if (min_delta && elapsed < 1.2 * min_delta && elapsed > .9 * min_delta) {
        const fps_test = 1e3 / min_delta;
        const step = fps_test < 95 ? fps_test < 55 ? 1 : 15 : fps_test > 149 ? fps_test < 195 ? 5 : 10 : 0;
        near_elapsed = 1e3 / (step ? (utils_1.math.round(fps_test / step) || 1) * step : fps_test < 110 ? 100 : fps_test < 132 ? 120 : 144);
      }
      let delta = utils_1.max_(amount * near_elapsed / duration * calibration - padding, 1);
      (!continuous || (totalDelta < amount || flags & 2 /* kScFlag.TO */) && totalElapsed < minDelay) && (delta = utils_1.max_(0, utils_1.min_(delta + 2 > amount - totalDelta && delta > 4 ? amount : delta, amount - totalDelta)));
      if (delta > 0) {
        const wanted = delta;
        // here should keep safe even if there're bounce effects
        delta = performScroll(element, di, sign * utils_1.max_(scale, (delta > 4 ? utils_1.math.round : utils_1.math.ceil)(delta)), beforePos);
        padding = wanted > 4 && utils_1.abs_(delta - wanted) < 2 ? delta - wanted : 0;
        // if `scrollPageDown`, then amount is very large, but when it has been at page top/bottom,
        // `performScroll` will only return 0, then `delta || 1` is never enough.
        // In such cases stop directly
                beforePos += delta;
        totalDelta += utils_1.abs_(delta);
      }
      if (delta && (!onFinish || totalDelta < amount)) {
        if (wait2 != 0 && totalDelta >= amount && continuous && totalElapsed < (delay2 = wait2 > 1 ? +wait2 : minDelay) - min_delta && (wait2 > 1 || flags & 2 /* kScFlag.TO */ || amount < 40 /* ScrollConsts.AmountLimitToScrollAndWaitRepeatedKeys */)) {
          running = 0;
          timer = utils_1.timeout_( resumeAnimation, delay2 - totalElapsed);
          totalElapsed = delay2;
        } else {
          dom_utils_1.rAF_(animate);
        }
      } else if (elapsed) {
        const el2 = element;
        totalElapsed -= elapsed;
        onFinish && onFinish(totalDelta);
        toggleAnimation();
        // split code and avoid `return` to make released file smaller
        // according to tests on C75, no "scrollend" events if scrolling behavior is "instant";
        // the doc on Google Docs requires no "overscroll" events for programmatic scrolling
        if (hasNewScrollEnd) {
          // ignore Chrome 74~77 with EXP enabled, to make code smaller
          const notEl = !el2 || el2 === dom_utils_1.scrollingEl_();
          // queueMicrotask can not be used to avoid async stack tracing on Chrome 114
                    dom_utils_1.dispatchEvent_(notEl ? utils_1.doc : el2, dom_utils_1.newEvent_(kSE, 1, 1, !notEl));
        }
        checkCurrent(el2);
      } else {
        dom_utils_1.rAF_(animate);
      }
    }, resumeAnimation = () => {
      padding = 0;
      if (!keyIsDown) {
        toggleAnimation();
        return;
      }
      flags & 2 /* kScFlag.TO */ && amount > utils_1.fgCache.t && (amount = utils_1.min_(amount, rect_1.dimSize_(element, di + 0 /* kDim.viewW */) / 2) | 0);
      running = running || dom_utils_1.rAF_(animate);
    };
    toggleAnimation = scrolling => {
      if (scrolling === 4) {
        wait2 || timer && (utils_1.clearTimeout_(timer), resumeAnimation());
        return;
      }
      if (!scrolling) {
        hasNewScrollEnd && utils_1.setupEventListener(elementRoot, kSE, utils_1.Stop_, 1);
        elementRoot = totalTick = running = timestamp = rawTimestamp = beforePos = calibTime = preventPointEvents = lostFrames = onFinish = 0;
        element = null;
        rect_1.set_scrollingTop(null);
      }
      const P = "pointerEvents";
      let el;
      let style;
      if (dom_utils_1.isHTML_()) {
        if (dom_utils_1.MayWoTopLevel && dom_utils_1.withoutToplevel_()) {
          el = scrolling ? dom_utils_1.SafeEl_not_ff_(dom_utils_1.docEl_unsafe_()) : styleTop;
          style = el && el.style;
          styleTop = scrolling && style && !style[P] ? el : null;
          style && (style[P] = scrolling ? dom_utils_1.NONE : "");
        } else {
          // here should not use inert - it affects too many DOM APIs
          scrolling ? dom_ui_1.ourDialogEl_ || dom_ui_1.addElementList([], [ 0, 0 ], 4) : dom_ui_1.ourDialogEl_ !== link_hints_1.hint_box && dom_ui_1.removeDialog_();
        }
      }
    };
    performAnimate = (newEl1, newDi1, newAmount1, options) => {
      amount = utils_1.max_(1, newAmount1 > 0 ? newAmount1 : -newAmount1), calibration = 1, 
      di = newDi1;
      flags = options ? options.f | 0 : 0;
      wait2 = options && options.wait;
      duration = utils_1.math.round(utils_1.max_(1, 20 /* ScrollConsts.durationScaleForAmount */ * utils_1.math.log(amount) / 120 /* ScrollConsts.minDuration */) * utils_1.fgCache.u);
      element = newEl1;
      sign = newAmount1 < 0 ? -1 : 1;
      utils_1.clearTimeout_(timer);
      timer = 0 /* TimerID.None */;
      totalDelta = totalElapsed = padding = 0;
      timestamp = rawTimestamp = calibTime = lostFrames = onFinish = totalTick = 0;
      const keyboard = utils_1.fgCache.k;
      keyboard.length > 2 && (min_delta = utils_1.min_(min_delta, +keyboard[2] || min_delta));
      maxKeyInterval = utils_1.max_(min_delta, keyboard[1]) * 2 + 60 /* ScrollConsts.DelayTolerance */;
      minDelay = keyboard[0] + utils_1.max_(keyboard[1], 60 /* ScrollConsts.DelayMinDelta */) + 60 /* ScrollConsts.DelayTolerance */;
      (preventPointEvents === 2 || preventPointEvents === 1 && !rect_1.isSelARange(dom_utils_1.getSelection_())) && toggleAnimation(1);
      if (hasNewScrollEnd) {
        elementRoot = element ? dom_utils_1.getRootNode_mounted(element) : utils_1.doc;
        elementRoot = elementRoot !== utils_1.doc ? elementRoot : 0;
        utils_1.setupEventListener(elementRoot, kSE);
      }
      running = running || dom_utils_1.rAF_(animate);
      let defer;
      return options && (options.$then || options.$else) && (defer = utils_1.promiseDefer_(), 
      onFinish = defer.r, defer.p) || 0;
    };
    return performAnimate(newEl, newDi, newAmount, newOpts);
  };
  const performScroll = (el, di, amount, before) => {
    before = before != null ? before : rect_1.dimSize_(el, 8 /* kDim.positionX */ + di);
    el ? el.scrollBy(rect_1.instantScOpt(di ? 0 : amount, di && amount)) : rect_1.scrollWndBy_(di ? 0 : amount, di && amount);
    return rect_1.dimSize_(el, 8 /* kDim.positionX */ + di) - before;
  };
  /** should not use `scrollingTop` (including `dimSize_(scrollingTop, clientH/W)`) */  const $sc = (element, di, amount, options) => {
    let ret;
    if (hasSpecialScrollSnap(element)) {
      while (amount * amount >= 1 && !(ret = performScroll(element, di, amount))) {
        amount /= 2;
      }
      checkCurrent(element);
    } else if (options && options.smooth != null ? options.smooth : utils_1.fgCache.s) {
      amount && (ret = performAnimate(element, di, amount, options));
      exports.scrollTick(1);
    } else if (amount) {
      ret = performScroll(element, di, amount);
      checkCurrent(element);
    }
    return ret;
  };
  exports.$sc = $sc;
  const activate = (options, count) => {
    options.$c == null && (options.$c = key_handler_1.isCmdTriggered);
    if (dom_ui_1.checkHidden(4 /* kFgCmd.scroll */ , options, count)) {
      return;
    }
    if (link_hints_1.tryNestedFrame(4 /* kFgCmd.scroll */ , options, count)) {
      return;
    }
    const di = options.axis === "x" ? 0 : 1, oriCount = count, dest = options.dest;
    let fromMax = dest === "max";
    count = utils_1.abs_(count) < (options.outer | 0) ? 1 : count;
    if (dest) {
      if (count < 0) {
        fromMax = !fromMax;
        count = -count;
      }
      count--;
      count = utils_1.max_(0, count + (+options.offset || 0));
    }
    count *= +options.dir || 1;
    exports.executeScroll(di, count, dest ? fromMax ? 3 /* kScFlag.toMax */ : 2 /* kScFlag.toMin */ : 0 /* kScFlag.scBy */ , options.view, options, oriCount);
    keyIsDown && !options.$c && exports.scrollTick(0);
  };
  exports.activate = activate;
  /**
     * @param amount0 can not be 0 if without `kScFlag.TO` else can not be negative
     * @param factor the scale factor of `amount0`
     * @param fromMax can not be true, if without `kScFlag.TO`
     */  const executeScroll = (di, amount0, flags, factor, options, oriCount, visitor, visitorDi) => {
    const callOtherFrame = dir => {
      visitor.n += 1 - dir;
      core.c(di, amount0, flags, factor, options, oriCount, visitor, dir);
      if (core.y().k) {
        exports.scrollTick(1);
        joined = visitor.v;
      }
    };
    const toFlags = flags & 3 /* kScFlag.INC */ , toMax = toFlags - 2 /* kScFlag.TO */;
    let core;
    {
      const childFrame = (visitor || (visitor = {
        v: joined,
        n: 0
      }), !visitorDi) && dom_utils_1.derefInDoc_(currentScrolling);
      core = childFrame && dom_utils_1.isIFrameElement(childFrame) && link_hints_1.detectUsableChild(childFrame);
      if (core) {
        callOtherFrame(0);
        return;
      }
    }
    visitor.n > 0 ? visitor.v.a = utils_1.vApi : visitor.v = {
      a: utils_1.vApi
    };
    rect_1.set_cropNotReady_(1);
    rect_1.set_scrollingTop(dom_utils_1.scrollingEl_(1));
    if (rect_1.scrollingTop) {
      rect_1.getViewBox_();
      exports.getPixelScaleToScroll();
    }
    const outer = options && +options.outer || 0;
    const element = findScrollable(di, toFlags ? toMax || -1 : amount0, outer > 0 ? oriCount <= outer ? utils_1.abs_(oriCount) : 1 : 0 | -outer, options && (options.scroll ? options.scroll === "force" : options.evenIf != null ? options.evenIf & 2 /* kHidden.OverflowHidden */ : null), options && options.scrollable);
    const elementIsTop = element === rect_1.scrollingTop;
    const mayUpperFrame = !utils_1.isTop && elementIsTop && element && !dom_utils_1.fullscreenEl_unsafe_();
    let viewSize, toDoInSelf = 1, amount = elementIsTop && isTopScrollable < 1 ? 0 : factor ? factor === 1 ? amount0 : amount0 && amount0 * (viewSize = rect_1.dimSize_(element, di + 0 /* kDim.viewW */), 
    factor !== "max" ? viewSize : rect_1.dimSize_(element, di + 4 /* kDim.scrollW */) - viewSize) : (!di && amount0 && element && rect_1.dimSize_(element, 4 /* kDim.scrollW */) <= rect_1.dimSize_(element, 5 /* kDim.scrollH */) * (rect_1.dimSize_(element, 4 /* kDim.scrollW */) < 720 ? 2 : 1) ? amount0 * .6 : amount0) * utils_1.fgCache.t;
    if (toFlags) {
      viewSize = viewSize || rect_1.dimSize_(element, di + 0 /* kDim.viewW */);
      const curPos = rect_1.dimSize_(element, di + 8 /* kDim.positionX */), rawMax = (toMax || amount) && rect_1.dimSize_(element, di + 4 /* kDim.scrollW */), boundingMax = elementIsTop && element ? rect_1.getBoundingClientRect_(element).height : 0, max = (boundingMax > rawMax && boundingMax < rawMax + 1 ? boundingMax : rawMax) - viewSize;
      const oldAmount = amount;
      amount = utils_1.max_(0, utils_1.min_(toMax ? max - amount : amount, max)) - curPos;
      amount = oldAmount > 0 && amount * amount < 1 ? 0 : amount;
      amount = amount0 ? amount : toMax ? utils_1.max_(amount, 0) : utils_1.min_(amount, 0);
    }
    amount = amount * amount > .01 ? amount : 0;
    if (!mayUpperFrame || !(core = dom_ui_1.getParentVApi()) || amount && utils_1.Lower(dom_utils_1.attr_s(dom_utils_1.frameElement_(), "scrolling") || "") !== "no" && doesScroll(element, di, amount || toMax)) {
      if (mayUpperFrame && options && !utils_1.injector && !options.$forced && options.acrossFrames !== false && (!amount || !core && !doesScroll(element, di, amount || toMax))) {
        port_1.post_({
          H: 28 /* kFgReq.gotoMainFrame */ ,
          f: 1,
          c: 4 /* kFgCmd.scroll */ ,
          n: oriCount,
          a: options
        });
        amount = toDoInSelf = 0;
      }
    } else {
      callOtherFrame(2);
      amount = toDoInSelf = 0;
    }
    if (toFlags && elementIsTop && amount) {
      di && marks_1.setPreviousMarkPosition(1);
      !joined && options && options.sel === "clear" && dom_ui_1.resetSelectionToDocStart();
    }
    isTopScrollable = 1;
    const keepHover = options && options.keepHover;
    preventPointEvents = keepHover === false ? 1 : keepHover === "never" ? 2 : keepHover === "auto" ? 20 /* ScrollConsts.MinLatencyToAutoPreventHover */ : keepHover > 19 ? keepHover : 0;
    (options || (options = {})).f = flags;
    amount && utils_1.readyState_ > "i" && overrideScrollRestoration && overrideScrollRestoration("scrollRestoration", "manual");
    const ret = toDoInSelf && utils_1.vApi.$(element, di, amount, options);
    preventPointEvents = keyIsDown ? preventPointEvents : 0;
    keyIsDown || rect_1.set_scrollingTop(null);
    exports.scrolled = scrolled = 0;
    ret && utils_1.isTY(ret, 1 /* kTY.obj */) ? ret.then(succeed => {
      port_1.runFallbackKey(options, succeed ? 0 : 2);
    }) : toDoInSelf && port_1.runFallbackKey(options, ret ? 0 : 2);
  };
  exports.executeScroll = executeScroll;
  let overrideScrollRestoration = (kScrollRestoration, kManual) => {
    const h = history, old = h[kScrollRestoration];
    if (old && old !== kManual) {
      h[kScrollRestoration] = kManual;
      overrideScrollRestoration = 0;
      dom_utils_1.OnDocLoaded_(() => {
        utils_1.timeout_(() => {
          h[kScrollRestoration] = old;
        }, 1);
      }, 1);
    }
  };
  /** @argument willContinue 1: continue; 0: skip middle steps; 2: abort further actions; 5: resume */  const scrollTick = willContinue => {
    exports.keyIsDown = keyIsDown = willContinue & 1 ? maxKeyInterval : 0;
    willContinue > 1 && toggleAnimation && toggleAnimation(willContinue & 4);
    if (joined.a && joined.a !== utils_1.vApi) {
      joined.a.k(willContinue);
      willContinue & 1 || (joined.a = 0);
    }
  };
  exports.scrollTick = scrollTick;
  const beginScroll = (eventWrapper, key, keybody) => {
    if (key.includes("s-") || key.includes("a-")) {
      return;
    }
    const index = keyboard_utils_1.keyNames_.indexOf(keybody);
 // [0..8]
        (index > 2 || key === keybody) && eventWrapper && keyboard_utils_1.prevent_(eventWrapper.e);
    index > 4 ? exports.executeScroll(1 & ~index, index < 7 ? -1 : 1, 0 /* kScFlag.scBy */) : index > 2 ? exports.executeScroll(1, 0, 6 - index, 0) : key === keybody && exports.executeScroll(1, index - 1.5, 0 /* kScFlag.scBy */ , 2);
  };
  exports.beginScroll = beginScroll;
  const onScrolls = event => {
    const repeat = keyboard_utils_1.isRepeated_(event);
    repeat && keyboard_utils_1.prevent_(event.e);
    exports.scrollTick(repeat ? 5 : 0);
    return repeat;
  };
  exports.onScrolls = onScrolls;
  /**
     * @param amount should not be 0
     */  const findScrollable = (di, amount, outer, evenOverflowHidden, scrollable) => {
    const selectFirst = info => {
      let type, cur_el = info.e;
      if (rect_1.dimSize_(cur_el, 3 /* kDim.elClientH */) + 3 < rect_1.dimSize_(cur_el, 5 /* kDim.scrollH */) && (type = exports.shouldScroll_s(cur_el, cur_el !== top && cur_el !== body ? selectFirstType : di, 1), 
      type > 0 || !type && rect_1.dimSize_(cur_el, 9 /* kDim.positionY */) > 0 && doesScroll(cur_el, 1 /* kDim.byY */ , 0))) {
        return info;
      }
      rect_1.cropNotReady_ > 1 && rect_1.getZoom_();
      rect_1.cropNotReady_ && rect_1.prepareCrop_();
      let children = [];
      for (let _ref = cur_el.children, _len = _ref.length > 50 ? 0 : _ref.length; 0 < _len--; ) {
        cur_el = _ref[_len];
        // here assumes that a <form> won't be a main scrollable area
                if (!dom_utils_1.isSafeEl_(cur_el)) {
          continue;
        }
        const visible = rect_1.getVisibleBoundingRect_(cur_el) || rect_1.getVisibleClientRect_(cur_el);
        if (visible) {
          const height = visible.b - visible.t, width = visible.r - visible.l;
          height > 199 && width > 199 && children.push({
            a: width * height,
            e: cur_el,
            h: height
          });
        }
      }
      children.sort((a, b) => b.a - a.a);
      return children.reduce((cur, info1) => cur || selectFirst(info1), null);
    };
    const selectFirstType = (evenOverflowHidden != null ? evenOverflowHidden : utils_1.isTop || utils_1.injector) ? di + 2 : di;
    const activeEl = dom_utils_1.derefInDoc_(currentScrolling) || null;
    const lastCachedScrolled = dom_utils_1.derefInDoc_(cachedScrollable);
    const fullscreen = dom_utils_1.fullscreenEl_unsafe_(), top = fullscreen || rect_1.scrollingTop, body = utils_1.doc.body;
    const selectAncestor = () => {
      while (element === top || fullscreen && !dom_utils_1.IsAInB_(element, fullscreen) ? (element = top, 
      0) : exports.shouldScroll_s(element, element === lastCachedScrolled ? di + 2 : di, amount) < 1 || --outer > 0) {
        element = dom_utils_1.SafeEl_not_ff_(dom_utils_1.GetParent_unsafe_(element, 4 /* PNType.RevealSlotAndGotoParent */)) || top;
      }
      element = element !== top ? element : null;
      outer = 0;
    };
    let candidate;
    let element = activeEl;
    activeEl && selectAncestor();
    if (!element) {
      // note: twitter auto focuses its dialog panel, so it's not needed to detect it here
      const selector = dom_utils_1.findSelectorByHost(scrollable) || dom_utils_1.findSelectorByHost(102 /* kTip.scrollable */);
      if (selector) {
        element = dom_utils_1.SafeEl_not_ff_(dom_utils_1.querySelector_unsafe_(selector));
        element = !element || fullscreen && !dom_utils_1.IsAInB_(element, fullscreen) ? null : element;
      }
    }
    if (!element && top && dom_utils_1.isSafeEl_(top)) {
      isTopScrollable = exports.shouldScroll_s(top, di, 0);
      if (isTopScrollable < 1) {
        element = dom_utils_1.elFromPoint_([ rect_1.wndSize_(1) / 2, rect_1.wndSize_() / 2 ], top);
        element && dom_utils_1.getEditableType_(element) && rect_1.dimSize_(element, 3 /* kDim.elClientH */) < rect_1.wndSize_() / 2 && (element = dom_utils_1.GetParent_unsafe_(element, 4 /* PNType.RevealSlotAndGotoParent */));
        element = dom_utils_1.SafeEl_not_ff_(element);
        element && selectAncestor();
        candidate = !element && selectFirst({
          a: 0,
          e: top,
          h: 0
        });
      }
      element = candidate && candidate.e !== top && (!activeEl || candidate.h > rect_1.wndSize_() / 2) ? candidate.e : element || top;
      // if current_, then delay update to currentScrolling, until scrolling ends and .checkCurrent is called;
      // otherwise, cache selected element for less further cost
            activeEl || fullscreen || exports.setNewScrolling(element);
    }
    return element && !dom_utils_1.isSafeEl_(element) ? null : element;
  };
  /** require `getViewBox_()` before it */  const getPixelScaleToScroll = () => {
    /** https://drafts.csswg.org/cssom-view/#dom-element-scrolltop
         * Imported on 2013-05-15 by https://github.com/w3c/csswg-drafts/commit/ad01664359641f791d99f0b3fce545b55579acdc
         * Firefox is still using `int`: https://bugzilla.mozilla.org/show_bug.cgi?id=1217330 (filed on 2015-10-22)
         */
    scale = 1 / utils_1.min_(1, rect_1.wdZoom_ * rect_1.dScale_) / utils_1.min_(1, rect_1.WithOldZoom ? rect_1.bZoom_ * rect_1.bScale_ : rect_1.bScale_);
  };
  exports.getPixelScaleToScroll = getPixelScaleToScroll;
  const checkCurrent = el => {
    const cur = dom_utils_1.derefInDoc_(currentScrolling);
    if (el && (!cur || cur !== el && (!dom_utils_1.IsAInB_(cur, el) || rect_1.isNotInViewport(cur)))) {
      const last = dom_utils_1.derefInDoc_(cachedScrollable);
      const par = last && el !== last && last !== cur && dom_utils_1.IsAInB_(last, el) && !rect_1.isNotInViewport(last) ? last : el;
      exports.setNewScrolling(par);
      set_cachedScrollable(currentScrolling);
    }
  };
  const hasSpecialScrollSnap = el => {
    const scrollSnap = el && dom_utils_1.getComputedStyle_(el).scrollSnapType;
    return scrollSnap !== dom_utils_1.NONE && scrollSnap;
  };
  const doesScroll = (el, di, amount) => {
    /** @todo: (help wanted) it seems not detectable when hasSpecialScrollSnap_ on Firefox */
    // Currently, Firefox corrects positions before .scrollBy returns,
    // so it always fails if amount < next-box-size
    const visualBefore = rect_1.dimSize_(el, 8 /* kDim.positionX */ + di), before = el !== rect_1.scrollingTop ? visualBefore : rect_1.dimSize_(el, 6 /* kDim.scPosX */ + di), changed = performScroll(el, di, amount > 0 ? scale : -scale, visualBefore);
    if (changed) {
      if (!di && hasSpecialScrollSnap(el)) {
        /**
                 * Here needs the third scrolling, because in `X Prox. LTR` mode, a second scrolling may jump very far.
                 * Tested on https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-type .
                 */
        let changed2 = performScroll(el, 0 /* kDim.byX */ , -changed, visualBefore);
        changed2 * changed2 > .1 && performScroll(el, 0 /* kDim.byX */ , -changed2, 0);
      } else {
        el.scrollTo(rect_1.instantScOpt(di ? void 0 : before, di ? before : void 0));
      }
      exports.scrolled = scrolled = scrolled || 1;
    }
    return !!changed;
  };
  const scrollIntoView_s = (el, r2, dir) => {
    let rect1 = el && rect_1.boundingRect_(el);
    rect1 = rect1 && (rect1.t - rect1.b || rect1.l - rect1.r) ? rect1 : r2;
    if (!rect1) {
      return;
    }
    let {l, t, r, b} = rect1;
    r2 && (l = utils_1.min_(utils_1.max_(l, r2.l), r), t = utils_1.min_(utils_1.max_(t, r2.t), b), 
    r = utils_1.max_(l, utils_1.min_(r2.r, r)), b = utils_1.max_(t, utils_1.min_(r2.b, b)));
    dir < 1 ? (r = l, b = t) : dir < 2 && (l = r, t = b);
    let iw = rect_1.wndSize_(1), ih = rect_1.wndSize_(), ihm = utils_1.min_(96, ih / 2), iwm = utils_1.min_(64, iw / 2), hasY = b < ihm ? utils_1.max_(b - ih + ihm, t - ihm) : ih < t + ihm ? utils_1.min_(b - ih + ihm, t - ihm) : 0, hasX = r < 0 ? utils_1.max_(l - iwm, r - iw + iwm) : iw < l ? utils_1.min_(r - iw + iwm, l - iwm) : 0;
    exports.setNewScrolling(el);
    for (;el && (hasX || hasY); el = dom_utils_1.GetParent_unsafe_(el, 4 /* PNType.RevealSlotAndGotoParent */)) {
      const pos = dom_utils_1.getComputedStyle_(el).position;
      pos !== "fixed" && pos !== "sticky" || (hasX = hasY = 0);
    }
    exports.makeElementScrollBy_(0, hasX, hasY);
  };
  exports.scrollIntoView_s = scrollIntoView_s;
  const makeElementScrollBy_ = (el, hasX, hasY) => {
    rect_1.set_cropNotReady_(2);
    hasX && (hasY ? performScroll : utils_1.vApi.$)(el !== 0 ? el : findScrollable(0 /* kDim.byX */ , hasX, 0), 0 /* kDim.byX */ , hasX);
    hasY && utils_1.vApi.$(el !== 0 ? el : findScrollable(1 /* kDim.byY */ , hasY, 0), 1 /* kDim.byY */ , hasY);
    isTopScrollable = 1;
    exports.scrolled = scrolled = 0;
    exports.scrollTick(0);
 // it's safe to only clean keyIsDown here
    };
  exports.makeElementScrollBy_ = makeElementScrollBy_;
  const shouldScroll_s = (element, di, amount) => {
    const st = dom_utils_1.getComputedStyle_(element), overflow = di ? st.overflowY : st.overflowX;
    return overflow === dom_utils_1.HDN && di < 2 || overflow === "clip" || st.display === dom_utils_1.NONE || !dom_utils_1.isRawStyleVisible(st) ? -1 : +doesScroll(element, di & 1, amount || +!rect_1.dimSize_(element, 6 /* kDim.scPosX */ + (di & 1)));
  };
  exports.shouldScroll_s = shouldScroll_s;
  const suppressScroll = timedOut => {
    timedOut = timedOut ? 1 : 0;
    exports.scrolled = scrolled = timedOut ? 0 : 2;
    utils_1.setupEventListener(0, "scroll", utils_1.Stop_, timedOut);
    utils_1.setupEventListener(0, kSE, utils_1.Stop_, timedOut);
    timedOut || utils_1.queueTask_(() => dom_utils_1.rAF_(exports.suppressScroll));
  };
  exports.suppressScroll = suppressScroll;
  const onActivate = event => {
    if (event.isTrusted) {
      const path = dom_utils_1.getEventPath(event), el = path[0];
      exports.setNewScrolling(el);
    }
  };
  exports.onActivate = onActivate;
});