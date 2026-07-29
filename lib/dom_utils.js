"use strict";
__filename = "lib/dom_utils.js";
define([ "require", "exports", "./utils", "./rect", "./utils" ], (require, exports, utils_1, rect_1, utils_2) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.dispatchAsync_ = exports.dispatchEvent_ = exports.blur_unsafe = exports.focus_ = exports.runJS_ = exports.rAF_ = exports.inputSelRange = exports.modifySel = exports.scrollIntoView_ = exports.attachShadow_ = exports.textContent_s = exports.toggleClass_s = exports.setOrRemoveAttr_s = exports.setDisplaying_s = exports.setVisibility_s = exports.setClassName_s = exports.removeEl_s = exports.append_not_ff = exports.appendNode_s = exports.set_createElement_ = exports.createElement_ = exports.set_onReadyState_ = exports.set_OnDocLoaded_ = exports.onReadyState_ = exports.OnDocLoaded_ = exports.elFromPoint_ = exports.findSelectorByHost = exports.joinValidSelectors = exports.newEvent_ = exports.extractField = exports.getElDesc_ = exports.singleSelectionElement_unsafe = exports.getSelectionFocusEdge_ = exports.getDirectionOfNormalSelection = exports.isSelected_ = exports.getEditableType_ = exports.editableTypes_ = exports.uneditableInputs_ = exports.deepActiveEl_unsafe_ = exports.getMediaUrl = exports.getMediaTag = exports.hasInCSSFilter_ = exports.isAriaFalse_ = exports.isRawStyleVisible = exports.isStyleVisible_ = exports.IsAInB_ = exports.findAnchor_ = exports.queryHTMLChild_ = exports.derefInDoc_ = exports.getEventPath = exports.getAccessibleSelectedNode = exports.compareDocumentPosition = exports.frameElement_ = exports.fullscreenEl_unsafe_ = exports.scrollingEl_ = exports.getRootNode_mounted = exports.GetParent_unsafe_ = exports.getNodeChild_ = exports.GetShadowRoot_ = exports.TryGetShadowRoot_ = exports.SafeEl_not_ff_ = exports.isSafeEl_ = exports.isInTouchMode_cr_ = exports.withoutPopover_ = exports.withoutToplevel_ = exports.isInert_ = exports.supportInert_ = exports.hasTag_ = exports.htmlTag_ = exports.isHTML_ = exports.docHasFocus_ = exports.parentNode_unsafe_s = exports.textOffset_ = exports.selOffset_ = exports.attr_s = exports.contains_s = exports.rangeCount_ = exports.isNode_ = exports.isIFrameElement = exports.testMatch = exports.querySelectorAll_unsafe_ = exports.querySelector_unsafe_ = exports.activeEl_unsafe_ = exports.docEl_unsafe_ = exports.getSelection_ = exports.getComputedStyle_ = exports.HTMLElementProto = exports.ElementProto_not_ff = exports.set_docSelectable_ = exports.markFramesetTagUnsafe_old_cr = exports.docSelectable_ = exports.unsafeFramesetTag_old_cr_ = exports.AriaArray = exports.kGCh = exports.kDir = exports.PGH = exports.ALA = exports.BU = exports.INP = exports.NONE = exports.HDN = exports.CLK = exports.MDW = exports.DAC = exports.MayWoPopover = exports.MayWoTopLevel = void 0;
  exports.MayWoTopLevel = false /* BrowserType.Firefox */ /* FirefoxBrowserVer.MinEnsuredDialog */;
  exports.MayWoPopover = false /* BrowserType.Firefox */ /* FirefoxBrowserVer.MinEnsuredPopover */;
  exports.DAC = "DOMActivate", exports.MDW = "mousedown", exports.CLK = "click", exports.HDN = "hidden", 
  exports.NONE = "none";
  exports.INP = "input", exports.BU = "blur", exports.ALA = "aria-label", exports.PGH = "pagehide";
  exports.kDir = [ "backward", "forward" ], exports.kGCh = "character";
  exports.AriaArray = [ "aria-hidden", "aria-disabled", "aria-haspopup", "aria-readonly" ];
  //#region data and DOM-shortcut section
    let unsafeFramesetTag_old_cr_ = 0;
  exports.unsafeFramesetTag_old_cr_ = unsafeFramesetTag_old_cr_;
  let docSelectable_ = true;
  exports.docSelectable_ = docSelectable_;
  let _cssChecker;
  function markFramesetTagUnsafe_old_cr() {
    return exports.unsafeFramesetTag_old_cr_ = unsafeFramesetTag_old_cr_ = "frameset";
  }
  exports.markFramesetTagUnsafe_old_cr = markFramesetTagUnsafe_old_cr;
  function set_docSelectable_(_newDocSelectable) {
    exports.docSelectable_ = docSelectable_ = _newDocSelectable;
  }
  exports.set_docSelectable_ = set_docSelectable_;
  exports.ElementProto_not_ff = Element.prototype;
  exports.HTMLElementProto = HTMLElement.prototype;
  exports.getComputedStyle_ = el => getComputedStyle(el);
  exports.getSelection_ = () => getSelection();
  const docEl_unsafe_ = () => utils_1.doc.documentElement;
  exports.docEl_unsafe_ = docEl_unsafe_;
  const activeEl_unsafe_ = () => utils_1.doc.activeElement;
  exports.activeEl_unsafe_ = activeEl_unsafe_;
  const querySelector_unsafe_ = (selector, scope) => (scope || utils_1.doc).querySelector(selector);
  exports.querySelector_unsafe_ = querySelector_unsafe_;
  exports.querySelectorAll_unsafe_ = (selector, scope, isScopeAnElementOrNull) => {
    try {
      return (scope && isScopeAnElementOrNull ? exports.ElementProto_not_ff : scope || utils_1.doc).querySelectorAll.call(scope || utils_1.doc, selector);
    } catch (_a) {}
  };
  const testMatch = (selector, element) => element.matches(selector);
  exports.testMatch = testMatch;
  const isIFrameElement = (el, alsoFenced) => {
    const tag = el.localName;
    return (tag === "iframe" || tag === "frame" || tag === "fencedframe" && alsoFenced === 1) && exports.hasTag_(tag, el);
  };
  exports.isIFrameElement = isIFrameElement;
  const isNode_ = (node, typeId) => {
    const type = node.nodeType;
    return type === typeId || typeId === 1 /* kNode.ELEMENT_NODE */ && utils_1.isTY(type, 1 /* kTY.obj */);
  };
  exports.isNode_ = isNode_;
  const rangeCount_ = sel => sel.rangeCount;
  exports.rangeCount_ = rangeCount_;
  const contains_s = (par, child) => par.contains(child);
  exports.contains_s = contains_s;
  const attr_s = (el, attr) => el.getAttribute(attr);
  exports.attr_s = attr_s;
  const selOffset_ = (sel, focus) => focus ? sel.focusOffset : sel.anchorOffset;
  exports.selOffset_ = selOffset_;
  const textOffset_ = (el, dir) => dir ? el.selectionEnd : el.selectionStart;
  exports.textOffset_ = textOffset_;
  const parentNode_unsafe_s = el => el.parentNode;
  exports.parentNode_unsafe_s = parentNode_unsafe_s;
  const docHasFocus_ = () => utils_1.doc.hasFocus();
  exports.docHasFocus_ = docHasFocus_;
  //#endregion
  //#region DOM-compatibility section
    exports.isHTML_ = () => "lang" in (exports.docEl_unsafe_() || {});
  exports.htmlTag_ = element => {
    let s;
    if ("lang" in element && typeof (s = element.localName) === "string") {
      return s === "form" ? "" : s;
    }
    return "";
  };
  const hasTag_ = (htmlTag, el) => el.localName === htmlTag && "lang" in el;
  exports.hasTag_ = hasTag_;
  exports.supportInert_ = 0;
  let isInert_ = el => {
    const interactivity = utils_1.chromeVer_ > 131 ? exports.getComputedStyle_(el).interactivity : null;
    if (!interactivity) {
      return (exports.isInert_ = el2 => !!el2.closest("[inert]"))(el);
    }
    return interactivity === "inert";
  };
  exports.isInert_ = isInert_;
  exports.withoutToplevel_ = exports.MayWoTopLevel ? () => utils_1.chromeVer_ < 37 /* BrowserVer.MinEnsuredDialog */ && typeof HTMLDialogElement !== utils_1.OBJECT_TYPES[2 /* kTY.func */ ] : 0;
  exports.withoutPopover_ = exports.MayWoPopover ? () => {
    var _a;
    return (_a = false) !== null && _a !== void 0 ? _a : !exports.HTMLElementProto.showPopover;
  } : 0;
  exports.isInTouchMode_cr_ = () => {
    const viewport_meta = exports.querySelector_unsafe_("meta[name=viewport]");
    return !!viewport_meta && utils_1.createRegExp(97 /* kTip.metaKeywordsForMobile */ , "i").test(viewport_meta.content /* safe even if undefined */);
  };
  /** refer to {@link #BrowserVer.MinParentNodeGetterInNodePrototype } */  const _getter_unsafeOnly_not_ff_ = (Cls, instance, property) => {
    const desc = Object.getOwnPropertyDescriptor(Cls.prototype, property);
    return desc && desc.get ? desc.get.call(instance) : null;
  };
  exports.isSafeEl_ = el => {
    let s;
    return typeof (s = el.localName) === "string" && s !== "form";
  };
  /** @safe_even_if_any_overridden_property */  exports.SafeEl_not_ff_ = (el, type) => el && !exports.isSafeEl_(el) ? exports.SafeEl_not_ff_(exports.GetParent_unsafe_(el, type || 4 /* PNType.RevealSlotAndGotoParent */), type) : el;
  const TryGetShadowRoot_ = (el, noClosed_cr) => exports.htmlTag_(el) ? exports.GetShadowRoot_(el, noClosed_cr) : null;
  exports.TryGetShadowRoot_ = TryGetShadowRoot_;
  exports.GetShadowRoot_ = (el, noClosed_cr) => {
    let sr;
    if (noClosed_cr !== 1) {
      return chrome.dom.openOrClosedShadowRoot(el);
    }
    // Note: .webkitShadowRoot and .shadowRoot share a same object
        sr = el.shadowRoot;
    // according to https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow,
    // <form> and <frameset> can not have shadowRoot
        return sr;
  };
  // offset: 0: anchor, 1: focus; >= 2: directly use (offset - 2)
    const getNodeChild_ = (node, sel, offset) => {
    const type = node.nodeType;
    let childNodes;
    if (type === 1 /* kNode.ELEMENT_NODE */ || type === 11 /* kNode.DOCUMENT_FRAGMENT_NODE */ || utils_1.isTY(type, 1 /* kTY.obj */)) {
      childNodes = type === 11 /* kNode.DOCUMENT_FRAGMENT_NODE */ || exports.isSafeEl_(node) ? node.childNodes : _getter_unsafeOnly_not_ff_(Node, node, "childNodes");
      return childNodes[offset > 1 ? offset - 2 : exports.selOffset_(sel, offset)];
    }
  };
  exports.getNodeChild_ = getNodeChild_;
  /** Try its best to find a real parent */  exports.GetParent_unsafe_ = (el, type) => {
    /** Chrome: a selection / range can only know nodes and text in a same tree scope */
    if (type > 2) {
      let slot = el.assignedSlot;
      slot && !exports.isSafeEl_(el) && (slot = _getter_unsafeOnly_not_ff_(Element, el, "assignedSlot"));
      if (slot) {
        if (type < 4) {
          return slot;
        }
        while (slot = slot.assignedSlot) {
          el = slot;
        }
      }
    }
    let pe = el.parentElement, pn = el.parentNode;
    let nodeTy;
    if (pe === pn /* normal pe or no parent */ || !pn /* indeed no par */) {
      return pn;
    }
    // may be `frameset,form` with pn or pe overridden; <frameset>.parentNode may be a connected shadowRoot
        pn = (nodeTy = pn.nodeType) && (nodeTy === 11 /* kNode.DOCUMENT_FRAGMENT_NODE */ || nodeTy === 9 /* kNode.DOCUMENT_NODE */ || nodeTy && utils_1.doc.contains.call(pn, el)) ? pn : _getter_unsafeOnly_not_ff_(Node, el, "parentNode");
    // pn is real (if BrowserVer.MinParentNodeGetterInNodePrototype else) real or null
    return type ? type >= 2 /* PNType.ResolveShadowHost */ && exports.isNode_(pn, 11 /* kNode.DOCUMENT_FRAGMENT_NODE */) ? pn.host || null : pn.tagName ? pn /* in doc and .pN+.pE are overridden */ : null /* pn is null, or some unknown type ... */ : pn;
  };
  exports.getRootNode_mounted = el => el.getRootNode();
  const scrollingEl_ = fallback => {
    const docEl = exports.docEl_unsafe_(), body = utils_1.doc.body;
    let el = utils_1.doc.scrollingElement;
    // here `el` may be `:root, :root > body, :root > frameset` or `null`
    return el && exports.isSafeEl_(el) ? el : fallback && docEl && (el || !body) && exports.isSafeEl_(docEl) ? docEl : null;
  };
  exports.scrollingEl_ = scrollingEl_;
  const fullscreenEl_unsafe_ = () => utils_1.doc.fullscreenElement;
  exports.fullscreenEl_unsafe_ = fullscreenEl_unsafe_;
  // Note: sometimes a cached frameElement is not the wanted
    let frameElement_ = () => frameElement;
  exports.frameElement_ = frameElement_;
  const compareDocumentPosition = (anchorNode, focusNode) => Node.prototype.compareDocumentPosition.call(anchorNode, focusNode);
  exports.compareDocumentPosition = compareDocumentPosition;
  const getAccessibleSelectedNode = (sel, focused) => {
    let node = focused ? sel.focusNode : sel.anchorNode;
    return node;
  };
  exports.getAccessibleSelectedNode = getAccessibleSelectedNode;
  const getEventPath = event => event.composedPath();
  exports.getEventPath = getEventPath;
  //#endregion
  //#region computation section
    exports.derefInDoc_ = val => {
    val = utils_1.deref_(val);
    return val && exports.IsAInB_(val, utils_1.doc) ? val : null;
  };
  const queryHTMLChild_ = (parent, childTag) => [].find.call(parent.children, exports.hasTag_.bind(0, childTag)) || null;
  exports.queryHTMLChild_ = queryHTMLChild_;
  exports.findAnchor_ = element => {
    while (element && !exports.hasTag_("a", element)) {
      element = exports.GetParent_unsafe_(element, 4 /* PNType.RevealSlotAndGotoParent */);
    }
    return element;
  };
  exports.IsAInB_ = (element, root, checkMouseEnter) => {
    if (!root || exports.isNode_(root, 9 /* kNode.DOCUMENT_NODE */)) {
      const isConnected = element.isConnected;
 /** {@link #BrowserVer.Min$Node$$isConnected} */      return isConnected && (!root || element.ownerDocument === root);
    }
    let pe = element;
    while (pe && !element.contains.call(root, pe)) {
      pe = exports.getRootNode_mounted(pe);
      pe = pe && exports.isNode_(pe, 11 /* kNode.DOCUMENT_FRAGMENT_NODE */) ? pe.host : null;
    }
    if (pe || !checkMouseEnter) {
      return !!pe;
    }
    while ((pe = exports.GetParent_unsafe_(element, checkMouseEnter ? 4 /* PNType.RevealSlotAndGotoParent */ : 2 /* PNType.ResolveShadowHost */)) && pe !== root) {
      element = pe;
    }
    // if not pe, then PNType.DirectNode won't return an Element
    // because .GetParent_ will only return a real parent, but not a fake <form>.parentNode
        return (pe || exports.GetParent_unsafe_(element, 0 /* PNType.DirectNode */)) === root;
  };
  const isStyleVisible_ = element => exports.isRawStyleVisible(exports.getComputedStyle_(element));
  exports.isStyleVisible_ = isStyleVisible_;
  const isRawStyleVisible = style => style.visibility === "visible";
  exports.isRawStyleVisible = isRawStyleVisible;
  const isAriaFalse_ = (element, ariaType) => {
    let s = ariaType > 1 /* kAria.disabled */ ? ariaType > 2 /* kAria.hasPopup */ ? element.ariaReadOnly : element.ariaHasPopup : ariaType < 1 /* kAria.disabled */ ? element.ariaHidden : element.ariaDisabled;
    return s === null || !!s && utils_1.Lower(s) === "false" || !!(utils_1.evenHidden_ & 16 /* kHidden.BASE_ARIA */ << ariaType);
  };
  exports.isAriaFalse_ = isAriaFalse_;
  const hasInCSSFilter_ = () => {
    const el = exports.fullscreenEl_unsafe_() || exports.docEl_unsafe_(), st = el && exports.getComputedStyle_(el);
    return !!st && st.filter !== "none";
  };
  exports.hasInCSSFilter_ = hasInCSSFilter_;
  const getMediaTag = tag => tag === "img" ? 0 /* kMediaTag.img */ : tag === "video" || tag === "audio" ? 1 /* kMediaTag.otherMedias */ : tag === "a" ? 2 /* kMediaTag.a */ : 3 /* kMediaTag.others */;
  exports.getMediaTag = getMediaTag;
  const getMediaUrl = (element, isMedia) => {
    let kSrcAttr, srcValue;
    return isMedia !== 2 && element.dataset.src || isMedia && element.currentSrc || (srcValue = exports.attr_s(element, kSrcAttr = isMedia ? "src" : "href") || "", 
    srcValue && element[kSrcAttr] || srcValue);
  };
  exports.getMediaUrl = getMediaUrl;
  /** not return `<body>` or `<html>` */  const deepActiveEl_unsafe_ = alsoBody => {
    let el = exports.activeEl_unsafe_();
    let shadowRoot, active = alsoBody && (el || exports.docEl_unsafe_());
    if (el !== utils_1.doc.body && el !== exports.docEl_unsafe_()) {
      while (el && (shadowRoot = exports.TryGetShadowRoot_(active = el))) {
        el = shadowRoot.activeElement;
      }
    }
    return active || null;
  };
  exports.deepActiveEl_unsafe_ = deepActiveEl_unsafe_;
  exports.uneditableInputs_ = {
    __proto__: null,
    button: 2,
    checkbox: 3,
    color: 4,
    file: 1,
    hidden: 1,
    image: 2,
    radio: 3,
    range: 1,
    reset: 1,
    submit: 1
  };
  exports.editableTypes_ = {
    __proto__: null,
    input: 5 /* EditableType.Input */ ,
    textarea: 4 /* EditableType.TextArea */ ,
    select: 2 /* EditableType.Select */ ,
    embed: 1 /* EditableType.Embed */ ,
    object: 1
 /* EditableType.Embed */  };
  /**
     * if true, then `element` is `LockableElement`,
     * so MUST always filter out HTMLFormElement, to keep LockableElement safe
     */  exports.getEditableType_ = element => {
    const tag = exports.htmlTag_(element), ty = exports.editableTypes_[tag];
    return tag ? ty !== 5 /* EditableType.Input */ ? ty || (element.isContentEditable !== true ? 0 /* EditableType.NotEditable */ : 3 /* EditableType.ContentEditable */) : exports.uneditableInputs_[element.type] ? 0 /* EditableType.NotEditable */ : 5 /* EditableType.Input */ : 0 /* EditableType.NotEditable */;
  };
  const isSelected_ = () => {
    const element = exports.activeEl_unsafe_(), sel = exports.getSelection_(), node = exports.getAccessibleSelectedNode(sel);
    return !(!node || !element) && (element.isContentEditable === true ? utils_1.doc.contains.call(element, node) : element === node || element === exports.getNodeChild_(node, sel));
  };
  exports.isSelected_ = isSelected_;
  /** return `right` in case of unknown cases */  const getDirectionOfNormalSelection = (sel, anc, focus) => {
    const num1 = anc && focus ? anc !== focus ? exports.compareDocumentPosition(anc, focus) : exports.selOffset_(sel, 1) < exports.selOffset_(sel) ? 2 /* kNode.DOCUMENT_POSITION_PRECEDING */ : 0 : 0;
    return (num1 & 24 /* kNode.DOCUMENT_POSITION_CONTAINED_BY */ ? rect_1.selRange_(sel, 1).endContainer === anc : num1 & 2 /* kNode.DOCUMENT_POSITION_PRECEDING */) ? 0 /* VisualModeNS.kDir.left */ : 1 /* VisualModeNS.kDir.right */;
  };
  exports.getDirectionOfNormalSelection = getDirectionOfNormalSelection;
  const getSelectionFocusEdge_ = (sel, knownDi) => {
    let o, el = exports.rangeCount_(sel) && exports.getAccessibleSelectedNode(sel, 1);
    if (!el) {
      return null;
    }
    const anc = exports.getAccessibleSelectedNode(sel);
    knownDi = knownDi != null ? knownDi : exports.getDirectionOfNormalSelection(sel, anc, el);
    o = exports.getNodeChild_(el, sel, 1);
    if (!o) {
      o = el;
      el = exports.GetParent_unsafe_(el, 2 /* PNType.ResolveShadowHost */);
    }
    for (;o && !exports.isNode_(o, 1 /* kNode.ELEMENT_NODE */); o = knownDi ? o.previousSibling : o.nextSibling) {}
    if (o && anc) {
      const num = exports.compareDocumentPosition(anc, o);
      !(num & 24 /* kNode.DOCUMENT_POSITION_CONTAINED_BY */) && num & (knownDi ? 2 /* kNode.DOCUMENT_POSITION_PRECEDING */ : 4 /* kNode.DOCUMENT_POSITION_FOLLOWING */) && (o = 0);
    }
    return exports.SafeEl_not_ff_(o || el, 1 /* PNType.DirectElement */);
  };
  exports.getSelectionFocusEdge_ = getSelectionFocusEdge_;
  /** may skip a `<form> having <input name="nodeType">` */  const singleSelectionElement_unsafe = sel => {
    const anchor = exports.getAccessibleSelectedNode(sel);
    const child = anchor && exports.getNodeChild_(anchor, sel);
    return child && anchor === exports.getAccessibleSelectedNode(sel, 1) && exports.selOffset_(sel) === exports.selOffset_(sel, 1) && exports.isNode_(child, 1 /* kNode.ELEMENT_NODE */) ? child : null;
  };
  exports.singleSelectionElement_unsafe = singleSelectionElement_unsafe;
  const getElDesc_ = el => 
  // if el is SVGElement, then el.className is SVGAnimatedString
  el && exports.isSafeEl_(el) && [ el.localName, el.id, exports.attr_s(el, "class") ] || null;
  exports.getElDesc_ = getElDesc_;
  const extractField = (el, props) => {
    let json = el;
    props = props.trim();
    for (const prop of props ? props.split(".") : []) {
      json && utils_1.isTY(json) && (json = utils_1.safeCall(JSON.parse, json) || json);
      json = json && utils_1.isTY(json[prop], 2 /* kTY.func */) ? json[prop]() : json !== el ? json != null ? json[prop] : json : el ? el.dataset && el.dataset[prop] || el[prop] || exports.attr_s(el, prop) : 0;
    }
    return utils_1.isTY(json) || utils_1.isTY(json, 3 /* kTY.num */) ? json + "" : "";
  };
  exports.extractField = extractField;
  const newEvent_ = (type, notCancelable, notComposed, notBubbles, init, cls) => {
    init = init || {};
    init.bubbles = !notBubbles, init.cancelable = !notCancelable, init.composed = !notComposed;
    return new (cls || Event)(type, init);
  };
  exports.newEvent_ = newEvent_;
  const joinValidSelectors = (selector, validAnother) => // this should be O(1)
  // here can not use `docEl.matches`, because of `:has(...)`
  selector ? validAnother ? selector + "," + validAnother : selector : validAnother || null;
  exports.joinValidSelectors = joinValidSelectors;
  // { "host-cond": boolean | "query//value, q2//v2" | ("q//v" | boolean | ["q", "v"])[]  }
  // { "host-cond##q": boolean | "v" }
    utils_1.set_findOptByHost((rules, cssCheckEl, mapMode) => {
    const isKTip = utils_1.isTY(rules, 3 /* kTY.num */);
    let host, path;
    for (const hostLine of rules == null ? [] : utils_1.splitEntries_(isKTip ? utils_1.VTr(rules) : rules, ";")) {
      const items = utils_1.splitEntries_(hostLine, "##");
      let isOnHost = items.length > 1, sel = items[+isOnHost], cond = isOnHost ? items[0] : "";
      let _j = cond.split("##");
      _j.length > 1 && (cond = _j[0], sel = [ [ _j[1], sel ] ]);
      let matchPath = cond.includes("/");
      const re = cond && /[*+?^$\\(]/.test(cond) && utils_1.tryCreateRegExp(cond);
      path || cond && (host = utils_1.Lower(utils_1.loc_.host), path = host + "/" + utils_1.Lower(utils_1.loc_.pathname));
      if (re ? re.test(matchPath ? path : host) : matchPath ? path.startsWith(cond) : cond ? host === cond || host.endsWith("." + cond) : sel) {
        if (!mapMode) {
          return isKTip || cssCheckEl === 0 || sel && utils_1.safeCall(exports.testMatch, sel, _cssChecker || cssCheckEl || (_cssChecker = exports.createElement_("p"))) != null ? sel : void 0;
        }
        for (const rawEntry of utils_1.splitEntries_(sel, ",")) {
          let ret = 0;
          if (rawEntry && rawEntry !== "true" && rawEntry !== "false") {
            const entry = utils_1.splitEntries_(rawEntry, "//"), len = entry.length, val = len < 2 || entry[1];
            const matched = len < 2 && mapMode > 2 || utils_1.safeCall(exports.testMatch, entry[0] || "*", cssCheckEl);
            ret = len < 2 ? matched != null && (mapMode < 2 /* kNextTarget.realClick */ || matched) || 0 : matched ? utils_1.isTY(val) ? val ? (mapMode > 2 || utils_1.safeCall(exports.testMatch, val, cssCheckEl) != null) && val + (len > 2 ? ",true" : "") : mapMode > 1 : !!val : 0;
          } else {
            ret = rawEntry || 0;
          }
          if (ret !== 0) {
            ret += "";
            return ret === "true" || ret !== "false" && (ret + "").trim();
          }
        }
      }
    }
  });
  Object.defineProperty(exports, "findSelectorByHost", {
    enumerable: true,
    get() {
      return utils_2.findOptByHost;
    }
  });
  const elFromPoint_ = (center, baseEl) => {
    const root = center && (baseEl ? exports.isNode_(baseEl, 11 /* kNode.DOCUMENT_FRAGMENT_NODE */) ? baseEl : exports.IsAInB_(baseEl) && exports.getRootNode_mounted(baseEl) : utils_1.doc);
    const el = root && root.elementFromPoint(center[0], center[1]);
    return el && el !== utils_1.doc.body ? el : null;
  };
  exports.elFromPoint_ = elFromPoint_;
  //#endregion
  //#region action section
  /** Note: still call functions even if Vim+ has been destroyed */  let OnDocLoaded_;
  exports.OnDocLoaded_ = OnDocLoaded_;
  let onReadyState_;
  exports.onReadyState_ = onReadyState_;
  function set_OnDocLoaded_(_newOnDocLoaded) {
    exports.OnDocLoaded_ = OnDocLoaded_ = _newOnDocLoaded;
  }
  exports.set_OnDocLoaded_ = set_OnDocLoaded_;
  function set_onReadyState_(_newOnReady) {
    exports.onReadyState_ = onReadyState_ = _newOnReady;
  }
  exports.set_onReadyState_ = set_onReadyState_;
  exports.createElement_ = utils_1.doc.createElement.bind(utils_1.doc);
  function set_createElement_(_newCreateEl) {
    exports.createElement_ = _newCreateEl;
  }
  exports.set_createElement_ = set_createElement_;
  const appendNode_s = (parent, child) => {
    parent.append(child);
 // lgtm [js/xss] lgtm [js/xss-through-dom]
    };
  exports.appendNode_s = appendNode_s;
  exports.append_not_ff = (parent, child) => {
    exports.ElementProto_not_ff.append.call(parent, child);
  };
  const removeEl_s = el => {
    el.remove();
  };
  exports.removeEl_s = removeEl_s;
  const setClassName_s = (el, className) => {
    el.className = className;
  };
  exports.setClassName_s = setClassName_s;
  const setVisibility_s = (el, visible) => {
    el.style.visibility = visible ? "" : exports.HDN;
  };
  exports.setVisibility_s = setVisibility_s;
  const setDisplaying_s = (el, display) => {
    el.style.display = display ? "" : exports.NONE;
  };
  exports.setDisplaying_s = setDisplaying_s;
  const setOrRemoveAttr_s = (el, attr, newVal) => {
    newVal != null ? el.setAttribute(attr, newVal) : el.removeAttribute(attr);
  };
  exports.setOrRemoveAttr_s = setOrRemoveAttr_s;
  const toggleClass_s = (el, className, force) => {
    const list = el.classList;
    force != null ? list.toggle(className, !!force) : list.toggle(className);
  };
  exports.toggleClass_s = toggleClass_s;
  exports.textContent_s = (el, text) => text ? el.textContent = text : el.textContent;
  const attachShadow_ = box => box.attachShadow({
    mode: "closed"
  });
  exports.attachShadow_ = attachShadow_;
  const scrollIntoView_ = (el, instant, dir, _unused) => {
    // although Chrome 114 still ignores `behavior: "instant"`, here still set it for the future
    exports.ElementProto_not_ff.scrollIntoView.call(el, {
      block: "nearest",
      behavior: instant ? "instant" : _unused
    });
  };
  exports.scrollIntoView_ = scrollIntoView_;
  const modifySel = (sel, extend, di, g) => {
    sel.modify(extend ? "extend" : "move", exports.kDir[+di], g);
  };
  exports.modifySel = modifySel;
  const inputSelRange = (input, start, end, di) => {
    input.setSelectionRange(start, end, exports.kDir[di | 0]);
  };
  exports.inputSelRange = inputSelRange;
  exports.rAF_ = f => requestAnimationFrame(f);
  const runJS_ = (code, returnEl) => {
    const docEl = exports.docEl_unsafe_();
    const script = returnEl || exports.createElement_("script"), kJS = "allow-scripts";
    const sandbox = !utils_1.isTop && (exports.frameElement_() || {}).sandbox;
    if (sandbox && !sandbox.contains(kJS)) {
      exports.appendNode_s(exports.createElement_("a"), script);
    } else {
      docEl ? exports.append_not_ff(docEl, script) : exports.appendNode_s(utils_1.doc, script);
      // https://bugs.chromium.org/p/chromium/issues/detail?id=1207006#c4
      exports.setOrRemoveAttr_s(script, "on" + exports.INP, code);
      exports.dispatchEvent_(script, exports.newEvent_(exports.INP, 1, 1, 1));
    }
    return returnEl != null ? script : exports.removeEl_s(script);
  };
  exports.runJS_ = runJS_;
  // preventScroll seems not to work on MS Edge (Chromium), but here keeps it, to match the spec better
    const focus_ = el => {
    el.focus && el.focus({
      preventScroll: false
    });
  };
  exports.focus_ = focus_;
  const blur_unsafe = el => {
    // in `Element::blur`, Chromium will check `AdjustedFocusedElementInTreeScope() == this` firstly
    el && utils_1.isTY(el.blur, 2 /* kTY.func */) && el.blur();
  };
  exports.blur_unsafe = blur_unsafe;
  const dispatchEvent_ = (target, event) => target.dispatchEvent(event);
  exports.dispatchEvent_ = dispatchEvent_;
  const dispatchAsync_ = (target, event, focusOpt) => new Promise(resolve => {
    utils_1.queueTask_(() => {
      const ret = event === 1 /* kDispatch.clickFn */ ? target.click() : event === 2 /* kDispatch.focusFn */ ? target.focus(focusOpt) : target.dispatchEvent(event);
      resolve(ret);
    });
  });
  exports.dispatchAsync_ = dispatchAsync_;
});
//#endregion