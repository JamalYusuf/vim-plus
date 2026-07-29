"use strict";
__filename = "lib/rect.js";
define([ "require", "exports", "./utils", "./dom_utils" ], (require, exports, utils_1, dom_utils_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.setBoundary_ = exports.getVisibleBoundingRect_ = exports.boundingRect_ = exports.padClientRect_ = exports.isContaining_ = exports.center_ = exports.scrollWndBy_ = exports.instantScOpt = exports.view_ = exports.isSelMultiline = exports.selRange_ = exports.isSelARange = exports.isNotInViewport = exports.getViewBox_ = exports.getZoom_ = exports.getCroppedRect_ = exports.getIFrameRect = exports.getClientRectsForAreas_ = exports.getVisibleClientRect_ = exports.getBoundingClientRect_ = exports.cropRectS_ = exports.setupPageLevelCrops = exports.cropRectToVisible_ = exports.prepareCrop_ = exports.dimSize_ = exports.wndSize_ = exports.set_isOldZoom_ = exports.set_cropNotReady_ = exports.set_scrollingTop = exports.set_bZoom_ = exports.docZoomNew_ = exports.isOldZoom_ = exports.WithOldZoom = exports.viewportRight = exports.cropNotReady_ = exports.scrollingTop = exports.bZoom_ = exports.bScale_ = exports.dScale_ = exports.isDocZoomStrange_old_cr = exports.docZoom_ = exports.wdZoom_ = exports.paintBox_ = void 0;
  const WithOldZoom = true /* BrowserVer.MinNewZoom */ /* BrowserType.Edge */;
  exports.WithOldZoom = WithOldZoom;
  let isOldZoom_ = 0;
  exports.isOldZoom_ = isOldZoom_;
  let paintBox_ = null;
 // it may need to use `paintBox[] / <body>.zoom`
    exports.paintBox_ = paintBox_;
  let wdZoom_ = 1;
 // <html>.zoom * min(devicePixelRatio, 1) := related to physical pixels
    exports.wdZoom_ = wdZoom_;
  let docZoom_ = 1;
 // zoom of <html>
    exports.docZoom_ = docZoom_;
  let docZoomNew_ = 1;
 // zoom of <html> in the new spec
    exports.docZoomNew_ = docZoomNew_;
  let bZoom_ = 1;
 // zoom of <body> (if not fullscreen else 1)
    exports.bZoom_ = bZoom_;
  let isDocZoomStrange_old_cr = 0;
  exports.isDocZoomStrange_old_cr = isDocZoomStrange_old_cr;
  let dScale_ = 1;
 // <html>.transform:scale (ignore the case of sx != sy) * (new-zoom ? <html>.zoom : 1)
    exports.dScale_ = dScale_;
  let bScale_ = 1;
 // <body>.transform:scale (ignore the case of sx != sy) * (new-zoom ? <html>.zoom : 1)
    exports.bScale_ = bScale_;
  let cropNotReady_ = 2;
 // 0: ready; 1: need prepareCrop; 2: also need getZoom_
    exports.cropNotReady_ = cropNotReady_;
  let vright, vbottom, vbottoms, vleft, vtop, vtops;
  exports.viewportRight = vright;
  let scrollingTop = null;
  exports.scrollingTop = scrollingTop;
  function set_bZoom_(_newBZoom) {
    exports.bZoom_ = bZoom_ = _newBZoom;
  }
  exports.set_bZoom_ = set_bZoom_;
  function set_scrollingTop(newScrollingTop) {
    exports.scrollingTop = scrollingTop = newScrollingTop;
  }
  exports.set_scrollingTop = set_scrollingTop;
  function set_cropNotReady_(newCropNotReady) {
    exports.cropNotReady_ = cropNotReady_ = newCropNotReady;
  }
  exports.set_cropNotReady_ = set_cropNotReady_;
  function set_isOldZoom_(_newIsOldZoom) {
    exports.isOldZoom_ = isOldZoom_ = _newIsOldZoom;
  }
  exports.set_isOldZoom_ = set_isOldZoom_;
  const wndSize_ = id => id ? id < 2 ? innerWidth : devicePixelRatio : innerHeight;
  exports.wndSize_ = wndSize_;
  /** if `el` is null, then return viewSize for `kDim.scrollSize` */  const dimSize_ = (el, index) => {
    const kEnsuredVV = true /* BrowserVer.MinEnsured$visualViewport$ */ /* FirefoxBrowserVer.MinEnsured$visualViewport$ */;
    let visual, byY = index & 1 /* kDim.byY */;
    return el && (el !== scrollingTop || index > 1 && index < 8 /* kDim.positionX */) ? index < 4 /* kDim.scrollW */ ? byY ? el.clientHeight : el.clientWidth : index < 6 /* kDim.scPosX */ ? byY ? el.scrollHeight : el.scrollWidth : byY ? el.scrollTop : el.scrollLeft : index - byY !== 6 /* kDim.scPosX */ && (kEnsuredVV || (visual = visualViewport, 
    visual && visual.width)) ? (kEnsuredVV && (visual = visualViewport), index > 7 ? byY ? visual.pageTop : visual.pageLeft : byY ? visual.height : visual.width) : index > 5 ? index > 8 /* kDim.positionX */ && el ? exports.dimSize_(el, 6 /* kDim.scPosX */ + byY) : byY ? scrollY : scrollX : exports.wndSize_(1 - byY);
  };
  exports.dimSize_ = dimSize_;
  /** depends on .docZoom_, .bZoom_, .paintBox_ */  let prepareCrop_ = (inVisualViewport, limited) => {
    const fz = WithOldZoom ? docZoom_ * bZoom_ : 1, visual = inVisualViewport && visualViewport;
    let i, j, el, docEl;
    vleft = vtop = exports.cropNotReady_ = cropNotReady_ = 0;
    if (visual) {
      vleft = visual.offsetLeft | 0, vtop = visual.offsetTop | 0;
      i = vleft + visual.width | 0;
      j = vtop + visual.height | 0;
    } else if (docEl = dom_utils_1.docEl_unsafe_(), el = dom_utils_1.scrollingEl_(), 
    el) {
      i = exports.dimSize_(el, 2 /* kDim.elClientW */), j = exports.dimSize_(el, 3 /* kDim.elClientH */);
    } else {
      i = exports.wndSize_(1), j = exports.wndSize_();
      if (!docEl) {
        return vbottom = j, vbottoms = j - 8, exports.viewportRight = vright = i;
      }
      i = utils_1.min_(utils_1.max_(i - 24 /* GlobalConsts.MaxScrollbarWidth */ , (WithOldZoom ? exports.dimSize_(docEl, 2 /* kDim.elClientW */) * docZoom_ : exports.dimSize_(docEl, 2 /* kDim.elClientW */)) | 0), i);
      j = utils_1.min_(utils_1.max_(j - 24 /* GlobalConsts.MaxScrollbarWidth */ , (WithOldZoom ? exports.dimSize_(docEl, 3 /* kDim.elClientH */) * docZoom_ : exports.dimSize_(docEl, 3 /* kDim.elClientH */)) | 0), j);
    }
    if (paintBox_) {
      i = utils_1.min_(i, WithOldZoom ? paintBox_[0] * docZoom_ : paintBox_[0]);
      j = utils_1.min_(j, WithOldZoom ? paintBox_[1] * docZoom_ : paintBox_[1]);
    }
    WithOldZoom ? (exports.viewportRight = vright = i / fz | 0, vbottom = j / fz | 0) : (exports.viewportRight = vright = i | 0, 
    vbottom = j | 0);
    if (limited) {
      vleft = utils_1.max_(vleft, limited.l | 0);
      vtop = utils_1.max_(vtop, limited.t | 0);
      exports.viewportRight = vright = utils_1.min_(vright, limited.r | 0);
      vbottom = utils_1.min_(vbottom, limited.b | 0);
    }
    vtops = vtop + 3;
    vbottoms = vbottom - 8 / fz | 0;
  };
  exports.prepareCrop_ = prepareCrop_;
  const cropRectToVisible_ = (left, top, right, bottom) => {
    if (top > vbottoms || bottom < vtops) {
      return null;
    }
    const cr = {
      l: left > vleft ? left | 0 : vleft,
      t: top > vtop ? top | 0 : vtop,
      r: right < vright ? right | 0 : vright,
      b: bottom < vbottom ? bottom | 0 : vbottom
    };
    return cr.r - cr.l > 2 && cr.b - cr.t > 2 ? cr : null;
  };
  exports.cropRectToVisible_ = cropRectToVisible_;
  const setupPageLevelCrops = newPageBox => {
    vleft = -scrollX, vtop = vtops = -scrollY, exports.viewportRight = vright = newPageBox[2], 
    vbottom = vbottoms = utils_1.max_(newPageBox[3], vbottom);
  };
  exports.setupPageLevelCrops = setupPageLevelCrops;
  const cropRectS_ = rect => exports.cropRectToVisible_(rect.l, rect.t, rect.r, rect.b);
  exports.cropRectS_ = cropRectS_;
  exports.getBoundingClientRect_ = el => {
    const func = dom_utils_1.ElementProto_not_ff.getBoundingClientRect;
    exports.getBoundingClientRect_ = func.call.bind(func);
    return exports.getBoundingClientRect_(el);
  };
  exports.getVisibleClientRect_ = (element, el_style) => {
    let cr, I, useChild, isInline, str;
    for (const rect of element.getClientRects()) {
      if (rect.height > 0 && rect.width > 0) {
        if (cr = exports.cropRectToVisible_(rect.left, rect.top, rect.right, rect.bottom)) {
          return dom_utils_1.isRawStyleVisible(el_style || dom_utils_1.getComputedStyle_(element)) || utils_1.evenHidden_ & 1 /* kHidden.VisibilityHidden */ ? cr : null;
        }
        continue;
      }
      if (I) {
        continue;
      }
      I = "inline";
      for (const el2 of element.children) {
        const st = dom_utils_1.getComputedStyle_(el2);
        if (useChild = st.float !== dom_utils_1.NONE || (str = st.position) !== "static" && str !== "relative") {} else if (rect.height === 0) {
          if (isInline == null) {
            el_style || (el_style = dom_utils_1.getComputedStyle_(element));
            isInline = (el_style.fontSize === "0px" || el_style.lineHeight === "0px") && el_style.display.startsWith(I);
          }
          useChild = isInline && st.display.startsWith(I);
        }
        if (useChild && dom_utils_1.isSafeEl_(el2) && (cr = exports.getVisibleClientRect_(el2, st))) {
          return cr;
        }
      }
    }
    return null;
  };
  exports.getClientRectsForAreas_ = (element, output, areas) => {
    let diff, x1, x2, y1, y2, rect;
    const cr = exports.boundingRect_(element), crWidth = cr.r - cr.l, crHeight = cr.b - cr.t;
    if (crHeight < 3 || crWidth < 3) {
      return null;
    }
    // replace is necessary: chrome allows "&quot;", and also allows no "#"
        if (!areas) {
      const selector = `map[name="${CSS.escape(element.useMap.replace(/^#/, ""))}"]`;
      // on C73, if a <map> is moved outside from a #shadowRoot, then the relation of the <img> and it is kept
      // while on F65 the relation will get lost.
            const root = dom_utils_1.getRootNode_mounted(element);
      const map = dom_utils_1.querySelector_unsafe_(selector, root);
      if (!map || !dom_utils_1.htmlTag_(map)) {
        return null;
      }
      areas = dom_utils_1.querySelectorAll_unsafe_("area", map);
    }
    const toInt = a => a | 0;
    for (let _i = 0, _len = areas.length; _i < _len; _i++) {
      const area = areas[_i];
      if (!dom_utils_1.htmlTag_(area)) {
        continue;
      }
      let coords = area.coords.split(",").map(toInt);
      switch (utils_1.Lower(area.shape)) {
       case "circle":
       case "circ":
        // note: "circ" is non-conforming
        x2 = coords[0];
        y2 = coords[1];
        diff = coords[2] / utils_1.math.sqrt(2);
        x1 = x2 - diff;
        x2 += diff;
        y1 = y2 - diff;
        y2 += diff;
        diff = 3;
        break;

       case "default":
        x1 = y1 = diff = 0, x2 = crWidth, y2 = crHeight;
        break;

       case "poly":
       case "polygon":
        // note: "polygon" is non-conforming
        y1 = coords[0], y2 = coords[2], diff = coords[4];
        x1 = utils_1.min_(y1, y2, diff);
        x2 = utils_1.max_(y1, y2, diff);
        y1 = coords[1], y2 = coords[3], diff = coords[5];
        y1 = utils_1.min_(y1, y2, diff);
        y2 = utils_1.max_(coords[1], y2, diff);
        diff = 6;
        break;

       default:
        x1 = coords[0];
        y1 = coords[1];
        x2 = coords[2];
        y2 = coords[3];
        x1 > x2 && (x1 = x2, x2 = coords[0]);
        y1 > y2 && (y1 = y2, y2 = coords[1]);
        diff = 4;
        break;
      }
      if (coords.length < diff) {
        continue;
      }
      rect = exports.cropRectToVisible_(x1 + cr.l, y1 + cr.t, x2 + cr.l, y2 + cr.t);
      rect && output.push([ area, rect, 0, [ rect, 0 ], element ]);
    }
    return output.length ? output[0][1] : null;
  };
  const getIFrameRect = element => {
    const oldEvenHidden = utils_1.evenHidden_, rect = (utils_1.set_evenHidden_(0 /* kHidden.None */), 
    exports.getVisibleClientRect_(element));
    utils_1.set_evenHidden_(oldEvenHidden);
    return rect;
  };
  exports.getIFrameRect = getIFrameRect;
  exports.getCroppedRect_ = (el, crect) => {
    let prect, parent = el, i = crect ? 3 : 0;
    while (0 < i-- && (parent = dom_utils_1.GetParent_unsafe_(parent, 4 /* PNType.RevealSlotAndGotoParent */))) {
      const st = dom_utils_1.getComputedStyle_(parent), overflow = st.overflow;
      if (overflow === dom_utils_1.HDN || overflow === "clip") {
        prect = exports.getVisibleBoundingRect_(parent);
        crect = prect && exports.isContaining_(crect, prect) ? prect : crect;
      }
    }
    return crect;
  };
  const elZoom_ = st => st && st.display !== dom_utils_1.NONE && +st.zoom || 1;
  /** update `docZoom_ + bZoom_` if `target` else `docZoom_` */  exports.getZoom_ = WithOldZoom ? target => {
    let docEl = dom_utils_1.docEl_unsafe_(), ratio = exports.wndSize_(2), st = dom_utils_1.getComputedStyle_(docEl), zoom = isOldZoom_ && +st.zoom || 1, el = isOldZoom_ ? dom_utils_1.fullscreenEl_unsafe_() : null;
    if (isOldZoom_ && target) {
      const body = el ? null : utils_1.doc.body;
      // if fullscreen and there's nested "contain" styles,
      // then it's a whole mess and nothing can be ensured to be right
            exports.bZoom_ = bZoom_ = body && (target === 1 || dom_utils_1.IsAInB_(target, body)) ? elZoom_(dom_utils_1.getComputedStyle_(body)) : 1;
    }
    for (;el && el !== docEl; el = dom_utils_1.GetParent_unsafe_(el, 3 /* PNType.RevealSlot */)) {
      zoom *= elZoom_(dom_utils_1.getComputedStyle_(el));
    }
    exports.paintBox_ = paintBox_ = null;
 // it's not so necessary to get a new paintBox here
        exports.docZoom_ = docZoom_ = zoom;
    exports.wdZoom_ = wdZoom_ = utils_1.math.round(zoom * utils_1.min_(ratio, 1) * 1e3) / 1e3;
  } : () => {
    exports.paintBox_ = paintBox_ = null;
    exports.wdZoom_ = wdZoom_ = utils_1.min_(exports.wndSize_(2), 1);
  };
  exports.getViewBox_ = needBox => {
    const ratio = WithOldZoom ? exports.wndSize_(2) : 1, round = utils_1.math.round, float = parseFloat, box = dom_utils_1.docEl_unsafe_(), st = dom_utils_1.getComputedStyle_(box), box2 = utils_1.doc.body, st2 = box2 ? dom_utils_1.getComputedStyle_(box2) : st, rawZoom2 = WithOldZoom && box2 ? elZoom_(st2) : 1, zoom2o = WithOldZoom ? exports.bZoom_ = bZoom_ = isOldZoom_ ? rawZoom2 : 1 : 1, docContain = st.contain, 
    // bodyNotPropagateOut = true && docContain !== "none",
    paintingLimited = /c|p/.test(docContain), notPropagate = /s|t/.test(docContain), 
    // NOTE: if box.zoom > 1, although doc.documentElement.scrollHeight is integer,
    rect = exports.boundingRect_(box), rawZoom = +st.zoom || 1, zoom1o = WithOldZoom && isOldZoom_ ? rawZoom : 1;
    let iw = exports.wndSize_(1), ih = exports.wndSize_(), _trans = st.transform || "n";
    // ignore the case that x != y in "transform: scale(x, y)""
        const scale = exports.dScale_ = dScale_ = (_trans < "n" && float(_trans.slice(7)) || 1) * (+st.scale || 1) * (WithOldZoom ? rawZoom / zoom1o : rawZoom);
    const stacking = needBox !== 3 && (st.position !== "static" || /a|c/.test(docContain) || _trans < "n");
    exports.docZoomNew_ = docZoomNew_ = WithOldZoom ? rawZoom / zoom1o : rawZoom;
    if (dom_utils_1.fullscreenEl_unsafe_()) {
      exports.getZoom_(1);
      exports.dScale_ = dScale_ = exports.bScale_ = bScale_ = 1;
      return [ 0, 0, WithOldZoom ? iw * docZoom_ / wdZoom_ | 0 : iw, WithOldZoom ? ih * docZoom_ / wdZoom_ | 0 : ih, 0 ];
    }
    exports.bScale_ = bScale_ = box2 ? ((_trans = st2.transform || "n") < "n" && float(_trans.slice(7)) || 1) * (+st2.scale || 1) * (WithOldZoom ? rawZoom2 / zoom2o : elZoom_(st2)) : 1;
    exports.wdZoom_ = wdZoom_ = WithOldZoom ? round(zoom1o * utils_1.min_(ratio, 1) * 1e3) / 1e3 : utils_1.min_(exports.wndSize_(2), 1);
    WithOldZoom && (exports.docZoom_ = docZoom_ = zoom1o);
    let x = stacking ? 0 | -box.clientLeft : float(st.marginLeft), y = stacking ? 0 | -box.clientTop : float(st.marginTop);
    x = needBox === 3 ? 0 : x * scale - rect.l;
    y = needBox === 3 ? 0 : y * scale - rect.t;
    // note: `Math.abs(y) < 0.01` supports almost all `0.01 * N` (except .01, .26, .51, .76)
        x = x * x < 1e-4 ? 0 : utils_1.math.ceil(WithOldZoom ? round(x / zoom2o * 100) / 100 : x);
    y = y * y < 1e-4 ? 0 : utils_1.math.ceil(WithOldZoom ? round(y / zoom2o * 100) / 100 : y);
    WithOldZoom && (iw /= zoom1o, ih /= zoom1o);
    let mw = iw, mh = ih;
    // ignore the area on the block's left
        exports.paintBox_ = paintBox_ = paintingLimited ? [ (iw = rect.r) - float(st.borderRightWidth) * scale, (ih = rect.b) - float(st.borderBottomWidth) * scale ] : null;
    if (!needBox) {
      return [ x, y ];
    }
    // here rect.right is not accurate because <html> may be smaller than <body>
        const sEl = dom_utils_1.scrollingEl_(), nonScrollableRe = /hidden|clip/, xScrollable = !nonScrollableRe.test("" + st.overflowX + (notPropagate ? "" : st2.overflowX)), yScrollable = !nonScrollableRe.test("" + st.overflowY + (notPropagate ? "" : st2.overflowY));
    if (xScrollable) {
      mw += 64 * (WithOldZoom ? zoom2o : 1);
      iw = paintingLimited ? iw : sEl && (WithOldZoom ? (exports.dimSize_(sEl, 4 /* kDim.scrollW */) - scrollX) / zoom1o : exports.dimSize_(sEl, 4 /* kDim.scrollW */) - scrollX) || utils_1.max_(iw - 24 /* GlobalConsts.MaxScrollbarWidth */ / zoom1o, rect.r);
    }
    if (yScrollable) {
      mh += 20 * (WithOldZoom ? zoom2o : 1);
      ih = paintingLimited ? ih : sEl && (WithOldZoom ? (exports.dimSize_(sEl, 5 /* kDim.scrollH */) - scrollY) / zoom1o : exports.dimSize_(sEl, 5 /* kDim.scrollH */) - scrollY) || utils_1.max_(ih - 24 /* GlobalConsts.MaxScrollbarWidth */ / zoom1o, rect.b);
    }
    iw = iw < mw ? iw : mw, ih = ih < mh ? ih : mh;
    WithOldZoom ? (iw = iw / zoom2o | 0, ih = ih / zoom2o | 0) : (iw |= 0, ih |= 0);
    return [ x, y, iw, yScrollable ? ih - 24 /* GlobalConsts.MaxHeightOfLinkHintMarker */ : ih ];
  };
  const isNotInViewport = (element, rect) => {
    let fs;
    rect || (rect = exports.boundingRect_(element));
    const h = rect.b - rect.t, w = rect.r - rect.l;
    return h < 1 && w < 1 ? 3 /* kInvisibility.NoSpace */ : (fs = dom_utils_1.fullscreenEl_unsafe_()) && !dom_utils_1.IsAInB_(element, fs) ? 2 /* kInvisibility.NotInFullscreen */ : rect.b <= 0 || rect.t >= exports.wndSize_() || rect.r <= 0 || rect.l >= exports.wndSize_(1) ? 1 /* kInvisibility.OutOfView */ : h > 1 && w > 1 || (cropNotReady_ > 1 && exports.getZoom_(), 
    cropNotReady_ && exports.prepareCrop_(), exports.getVisibleClientRect_(element) /* kInvisibility.Visible */) ? 0 : 3 /* kInvisibility.NoSpace */;
  };
  exports.isNotInViewport = isNotInViewport;
  const isSelARange = sel => sel.type === "Range";
  exports.isSelARange = isSelARange;
  exports.selRange_ = (sel, ensured) => ensured || dom_utils_1.rangeCount_(sel) ? sel.getRangeAt(0) : null;
  const isSelMultiline = sel => {
    const rects = !(sel + "").slice(0, -1).includes("\n") && dom_utils_1.rangeCount_(sel) && exports.selRange_(sel).getClientRects();
    if (rects && rects.length > 1) {
      const first = exports.padClientRect_(rects[0]);
      for (let i = 1; i < rects.length; i++) {
        const next = exports.padClientRect_(rects[i]), cy = (next.t + next.b) / 2;
        if (cy > first.b || cy < first.t) {
          // ignore rotation - no wayt to detect it
          return true;
        }
      }
    }
    return rects === false;
  };
  exports.isSelMultiline = isSelMultiline;
  const view_ = (el, allowSmooth, oldY) => {
    let secondScroll, rect = exports.boundingRect_(el), ty = exports.isNotInViewport(el, rect);
    if (ty === 1 /* kInvisibility.OutOfView */) {
      let ih = exports.wndSize_(), sign = rect.t < 0 ? -1 : rect.t > ih ? 1 : 0, f = oldY != null, elHeight = rect.b - rect.t;
      const kBh = "scroll-behavior";
      const top = false /* BrowserVer.Min$ScrollBehavior$$Instant$InScrollIntoView */;
      const style = top && dom_utils_1.getComputedStyle_(top)[kBh] === "smooth" && top.style;
      const oldCss = style && style.cssText;
      style && style.setProperty(kBh, "auto", "important");
      dom_utils_1.scrollIntoView_(el, !allowSmooth);
      const stillNotInView = exports.isNotInViewport(el);
      if (!stillNotInView && f) {
        secondScroll = elHeight < ih ? oldY - scrollY : 0;
        // required range of wanted: delta > 0 ? [-limit, 0] : [0, limit]
                f = sign * secondScroll <= 0 && sign * secondScroll >= elHeight - ih;
      }
      stillNotInView || (sign || f) && exports.scrollWndBy_(0, f ? secondScroll * secondScroll < 4 ? 0 : secondScroll : sign * ih / 5);
      style && (style.cssText = oldCss);
    }
    return ty;
  };
  exports.view_ = view_;
  const instantScOpt = (x, y) => ({
    behavior: "instant",
    left: x,
    top: y
  });
  exports.instantScOpt = instantScOpt;
  const scrollWndBy_ = (x, y) => {
    scrollBy(exports.instantScOpt(x, y));
  };
  exports.scrollWndBy_ = scrollWndBy_;
  const center_ = (rect, xy) => {
    let zoom = WithOldZoom ? docZoom_ * bZoom_ / (xy ? 1 : 2) : xy ? 1 : .5;
    let n = xy ? xy.n - 1 ? xy.n * xy.s : .5 : 0;
    let x = xy ? utils_1.isTY(xy.x) ? n : xy.x : 0, y = xy ? utils_1.isTY(xy.y) ? n : xy.y : 0;
    rect = rect && exports.cropRectS_(rect) || rect;
    x = rect ? xy ? utils_1.max_(rect.l, utils_1.min_((x < 0 ? rect.r : rect.l) + (x * x > 1 ? x : (rect.r - rect.l) * x), rect.r - 1)) : rect.l + rect.r : 0;
    y = rect ? xy ? utils_1.max_(rect.t, utils_1.min_((y < 0 ? rect.b : rect.t) + (y * y > 1 ? y : (rect.b - rect.t) * y), rect.b - 1)) : rect.t + rect.b : 0;
    return [ x * zoom | 0, y * zoom | 0 ];
  };
  exports.center_ = center_;
  /** still return `true` if `paddings <= 4px` */  const isContaining_ = (a, b) => b.b - 5 < a.b && b.r - 5 < a.r && b.t > a.t - 5 && b.l > a.l - 5;
  exports.isContaining_ = isContaining_;
  const padClientRect_ = (rect, padding) => {
    const x = rect.left, y = rect.top, w = rect.width, h = rect.height;
    padding = w || h ? padding | 0 : 0;
    return {
      l: x | 0,
      t: y | 0,
      r: x + utils_1.max_(w, padding) | 0,
      b: y + utils_1.max_(h, padding) | 0
    };
  };
  exports.padClientRect_ = padClientRect_;
  const boundingRect_ = element => exports.padClientRect_(exports.getBoundingClientRect_(element), 0);
  exports.boundingRect_ = boundingRect_;
  const getVisibleBoundingRect_ = (element, crop, st) => {
    let zoom = (st || crop) && +(st || dom_utils_1.getComputedStyle_(element)).zoom || 1, rect = exports.boundingRect_(element), arr = exports.cropRectToVisible_(rect.l * zoom, rect.t * zoom, rect.r * zoom, rect.b * zoom);
    crop && (arr = exports.getCroppedRect_(element, arr));
    return arr;
  };
  exports.getVisibleBoundingRect_ = getVisibleBoundingRect_;
  const setBoundary_ = (style, r, allowAbs, arr, minSize) => {
    let top;
    const need_abs = allowAbs === 1 ? (r.t < 0 || r.l < 0 || r.b > exports.wndSize_() || r.r > exports.wndSize_(1)) && (arr = arr || exports.getViewBox_(), 
    top = dom_utils_1.scrollingEl_(1), arr[1] + r.b < exports.dimSize_(top, 5 /* kDim.scrollH */) && arr[0] + r.r < exports.dimSize_(top, 4 /* kDim.scrollW */)) : !!allowAbs, P = "px";
    style.left = r.l + (need_abs ? arr[0] : 0) + P;
    style.top = r.t + (need_abs ? arr[1] : 0) + P;
    style.width = utils_1.max_(minSize | 0, r.r - r.l) + P, style.height = utils_1.max_(minSize | 0, r.b - r.t) + P;
    return need_abs;
  };
  exports.setBoundary_ = setBoundary_;
});