"use strict";
__filename = "content/mode_find.js";
define([ "require", "exports", "../lib/utils", "../lib/keyboard_utils", "../lib/dom_utils", "../lib/rect", "./dom_ui", "./visual", "./scroller", "./marks", "./hud", "./port", "./insert", "./async_dispatcher", "./key_handler", "./link_actions" ], function(require, exports, utils_1, keyboard_utils_1, dom_utils_1, rect_1, dom_ui_1, visual_1, scroller_1, marks_1, hud_1, port_1, insert_1, async_dispatcher_1, key_handler_1, link_actions_1) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.extendToCurRange = exports.toggleSelectableStyle = exports.executeFind = exports.updateQuery = exports.execCommand = exports.activate = exports.set_findCSS = exports.kInsertText = exports.deactivate = exports.find_input = exports.styleSelColorOut = exports.styleSelColorIn = exports.styleInHUD = exports.styleSelectable = exports.find_box = exports.find_hasResults = exports.find_query = exports.findCSS = void 0;
  let isActive = 0;
  let query_ = "";
  exports.find_query = query_;
  let query0_ = "";
  let parsedQuery_ = "";
  let parsedRegexp_ = null;
  let lastInputTime_ = 0;
  let historyIndex = 0;
  let notEmpty;
  let isQueryRichText_ = true;
  let isRegex = null;
  let ignoreCase = null;
  let wholeWord = false;
  let wrapAround = true;
  let hasResults = false;
  exports.find_hasResults = hasResults;
  let matchCount = 0;
  let latest_options_;
  let coords = null;
  let initialRange = null;
  let hasInitialRange;
  let activeRegexIndex = 0;
  let regexMatches = null;
  let root_ = null;
  let box_ = null;
  exports.find_box = box_;
  let outerBox_ = null;
  let innerDoc_ = null;
  let input_ = null;
  exports.find_input = input_;
  let suppressOnInput_;
  let countEl = null;
  let findCSS = null;
  exports.findCSS = findCSS;
  let styleSelColorIn;
  exports.styleSelColorIn = styleSelColorIn;
  let styleSelColorOut;
  exports.styleSelColorOut = styleSelColorOut;
  let styleSelectable;
  exports.styleSelectable = styleSelectable;
  let styleInHUD = null;
  exports.styleInHUD = styleInHUD;
  let onUnexpectedBlur = null;
  let doesCheckAlive = 0;
  let highlighting;
  let isSmall;
  let postLock = null;
  let cachedInnerText;
  let deactivate;
  exports.deactivate = deactivate;
  let canvas;
  let delayedScrollIntoViewTick_ = 0;
  const kIT = "insertText";
  exports.kInsertText = kIT;
  function set_findCSS(_newFindCSS) {
    exports.findCSS = findCSS = _newFindCSS;
  }
  exports.set_findCSS = set_findCSS;
  const activate = options => {
    const initSelColors = adjust_type => {
      const css = findCSS.c, sin = exports.styleSelColorIn = styleSelColorIn = dom_ui_1.createStyle(css);
      dom_ui_1.ui_box ? dom_ui_1.adjustUI() : dom_ui_1.addUIElement(sin, adjust_type, true);
      dom_utils_1.removeEl_s(sin);
      exports.styleSelColorOut = styleSelColorOut = dom_ui_1.createStyle(css);
    };
    const initStartPoint = keep => {
      const sel = dom_ui_1.getSelected();
      if (initialRange = rect_1.selRange_(sel)) {
        hasInitialRange = options.t && +dom_ui_1.maySelectRight_(sel) + 1;
        keep ? initialRange = initialRange.cloneRange() : dom_ui_1.collpaseSelection(dom_utils_1.getSelection_());
 // `range.collapse` doesn't work when inside a ShadowRoot (C72)
            } else {
        (initialRange = utils_1.doc.createRange()).setStart(utils_1.doc.body || dom_utils_1.docEl_unsafe_(), hasInitialRange = 0);
      }
      hasInitialRange || initialRange.collapse(true);
      options.r && (coords = [ scrollX, scrollY ]);
    };
    const focusFocusEdge = evenIfEditable => {
      const el = dom_utils_1.getSelectionFocusEdge_(dom_ui_1.getSelected());
      if (el && (evenIfEditable || !dom_utils_1.getEditableType_(el))) {
        dom_ui_1.flash_(el);
        dom_utils_1.hasTag_("label", el) && el.control && el.tabIndex < 0 || dom_utils_1.focus_(el);
      }
    };
    /** return an element if no <a> else null */    const focusFoundLinkIfAny = () => {
      let cur = dom_utils_1.SafeEl_not_ff_(dom_ui_1.getSelectionParent_unsafe(dom_ui_1.getSelected()));
      const link = cur && dom_utils_1.findAnchor_(cur);
      return link ? dom_utils_1.focus_(link) : cur;
    };
    const setFirstQuery = query => {
      hud_1.hudHide(1 /* TimerType.noTimer */);
 // delay hudHide, so that avoid flicker on Firefox
            doFocus();
      query0_ = "";
      query_ || setQuery(query);
      isQueryRichText_ = true;
      notEmpty = !!query_;
      notEmpty && exports.execCommand("selectAll");
    };
    const setQuery = query => {
      if (query !== query0_ && innerDoc_) {
        if (!query && historyIndex > 0) {
          --historyIndex;
        } else {
          suppressOnInput_ = 1;
          if (query !== 1) {
            exports.execCommand("selectAll");
            exports.execCommand(kIT, 0, query);
 // "\xa0" is not needed, because of `white-space: pre;`
                    } else {
            exports.execCommand("undo");
          }
          suppressOnInput_ = 0;
          onInput();
          scrollTo_(query === 1 ? 3 : 0);
        }
      }
    };
    const postActivate = () => {
      const postExit = skip => {
        // safe if destroyed, because `el.onblur = Exit`
        if (skip && !skip.isTrusted) {
          return;
        }
        postLock && utils_1.setupEventListener(postLock, dom_utils_1.BU, postExit, 1);
        if (!postLock) {
          return;
        }
        postLock = null;
        utils_1.setupEventListener(0, dom_utils_1.CLK, postExit, 1);
        keyboard_utils_1.removeHandler_(9 /* kHandler.postFind */);
        insert_1.setupSuppress();
      };
      const el = insert_1.insert_Lock_();
      if (!el) {
        postExit();
        return;
      }
      keyboard_utils_1.whenNextIsEsc_(9 /* kHandler.postFind */ , 6 /* kModeId.Find */ , postExit);
      if (el === postLock) {
        return;
      }
      if (postLock) {
        utils_1.setupEventListener(postLock, dom_utils_1.BU, postExit, 1);
      } else {
        utils_1.setupEventListener(0, dom_utils_1.CLK, postExit);
        insert_1.setupSuppress(postExit);
      }
      postLock = el;
      utils_1.setupEventListener(el, dom_utils_1.BU, postExit);
    };
    const onInput = e => {
      if (e) {
        utils_1.Stop_(e);
        if (!(e.type < "i") && !e.isTrusted) {
          return;
        }
        if (suppressOnInput_ || e.isComposing) {
          utils_1.clearTimeout_(highlightTimeout_);
          return;
        }
      }
      const query = input_.innerText.replace(/\xa0/g, " ").replace(/\n$/, "");
      let s = query_;
      if (hasResults || isRegex || wholeWord || !notEmpty || !query.startsWith(s) || query.includes("\\", s.length - 1)) {
        coords && marks_1.scrollToMark(coords);
        exports.updateQuery(query);
        if (suppressOnInput_) {
          showCount(1);
          return;
        }
        restoreSelection();
        exports.executeFind(isRegex ? regexMatches ? regexMatches[0] : "" : parsedQuery_, {
          j: 1,
          c: options.d,
          t: options.t
        });
        showCount(1);
        lastInputTime_ = utils_1.getTime();
        highlightTimeout_ = options.m ? highlightTimeout_ || utils_1.timeout_(highlightMany, 200) : 0;
      } else {
        query0_ = query;
        showCount(0);
      }
    };
    const showCount = changed => {
      let count = matchCount;
      changed && (countEl.dataset.vimium = suppressOnInput_ ? utils_1.VTr(79 /* kTip.paused */) : parsedQuery_ ? utils_1.VTr(count > 1 ? 26 /* kTip.nMatches */ : count ? 27 /* kTip.oneMatch */ : hasResults ? 28 /* kTip.someMatches */ : 29 /* kTip.noMatches */ , [ count ]) : "");
      count = rect_1.dimSize_(input_, 4 /* kDim.scrollW */) + countEl.offsetWidth + 35 & -32;
      (!isSmall || count > 151) && (outerBox_.style.width = (isSmall = count < 152) ? 0 : count + "px");
    };
    const scrollTo_ = action => {
      const sel = dom_ui_1.getSelectionOf(root_);
      if (action > 2) {
        sel + "" === input_.innerText ? dom_ui_1.collpaseSelection(sel, 1 /* VisualModeNS.kDir.right */ , 1) : historyIndex++;
      } else if (action) {
        const node = dom_utils_1.getAccessibleSelectedNode(sel, 1);
        node && dom_utils_1.isNode_(node, 3 /* kNode.TEXT_NODE */) ? sel.collapse(node, action > 1 ? node.length : 0) : action = 9;
      }
      const bbox = action < 9 && dom_ui_1.getSelectionBoundingBox_(sel);
      if (bbox) {
        const newLeft = utils_1.max_(0, rect_1.dimSize_(input_, 8 /* kDim.positionX */) + bbox.l - rect_1.dimSize_(input_, 2 /* kDim.elClientW */));
        input_.scrollTop += bbox.t;
        input_.scrollLeft = newLeft;
      }
    };
    const restoreSelection = isCur => {
      const sel = dom_utils_1.getSelection_(), range = isCur ? sel.isCollapsed ? null : rect_1.selRange_(sel) : initialRange;
      if (!range) {
        return;
      }
      // Note: it works even when range is inside a shadow root (tested on C72 stable)
            dom_ui_1.resetSelectionToDocStart(sel, range);
    };
    const highlightMany = () => {
      const oldActiveRegexIndex = activeRegexIndex;
      const arr = [], opt = {
        h: [ scrollX, scrollY, arr ],
        i: 1,
        c: options.m || 20
      };
      const sel = dom_ui_1.getSelected();
      if (hasResults && !dom_utils_1.singleSelectionElement_unsafe(sel)) {
        const range = rect_1.selRange_(sel), viewBox = rect_1.getViewBox_(1);
        rect_1.prepareCrop_();
        highlightTimeout_ && toggleStyle(0);
        range && dom_ui_1.collpaseSelection(sel);
        exports.executeFind("", opt);
        if (range) {
          dom_ui_1.resetSelectionToDocStart(sel, range);
          activeRegexIndex = oldActiveRegexIndex;
          opt.c = -opt.c;
          exports.executeFind("", opt);
        }
        insert_1.insert_Lock_() && dom_utils_1.blur_unsafe(insert_1.raw_insert_lock);
        highlighting && highlighting();
                rect_1.setupPageLevelCrops(viewBox);
        const cbs = arr.map(rect_1.cropRectS_).map(cr => cr ? dom_ui_1.flash_(null, cr, -1, " Sel SelH", viewBox) : key_handler_1.noopHandler);
        activeRegexIndex = oldActiveRegexIndex;
        range ? dom_ui_1.resetSelectionToDocStart(sel, range) : restoreSelection();
        highlighting = () => {
          highlighting = 0;
          utils_1.clearTimeout_(clearTimeout);
          cbs.map(utils_1.callFunc);
        };
        const clearTimeout = highlightTimeout_ || arr.length && utils_1.timeout_(highlighting, 2400);
        highlightTimeout_ && utils_1.timeout_(hookSel, 0);
      } else {
        highlighting && highlighting();
      }
      highlightTimeout_ = 0;
    };
    exports.findCSS = findCSS = options.f || findCSS;
    if (!dom_utils_1.isHTML_()) {
      return;
    }
    let highlightTimeout_ = 0, initial_query = options.s ? dom_ui_1.getSelectionText() : "";
    (initial_query.length > 99 || initial_query.includes("\n")) && options.s & 1 && (initial_query = "");
    isQueryRichText_ = !initial_query;
    initial_query || options.s & 4 ? options.q = initial_query : initial_query = options.q;
    latest_options_ = options;
    isActive || initial_query === query_ && options.l || marks_1.setPreviousMarkPosition(1);
    dom_ui_1.checkDocSelectable();
    rect_1.getZoom_();
    dom_ui_1.ensureBorder();
    /** Note: host page may have no range (type is "None"), if:
         * * press <Enter> on HUD to exit FindMode
         * * a host script has removed all ranges
         */    exports.deactivate = deactivate = deactivate || (i => {
      const styleSheet = styleSelColorIn && styleSelColorIn.sheet, knownHasResults = hasResults;
      const knownOptions = latest_options_;
      const maxNotRunPost = knownOptions.p ? 4 : 5;
      let el, el2;
      lastInputTime_ = isActive = 0;
      i === 2 /* FindAction.ExitNoAnyFocus */ ? hookSel(1) : focus();
      coords && marks_1.scrollToMark(coords);
      exports.find_hasResults = hasResults = isSmall = notEmpty = wholeWord = false;
      wrapAround = true;
      keyboard_utils_1.removeHandler_(6 /* kHandler.find */);
      outerBox_ && dom_utils_1.removeEl_s(outerBox_);
      highlighting && highlighting();
      utils_1.clearTimeout_(highlightTimeout_);
      box_ === utils_1.deref_(async_dispatcher_1.lastHovered_) && async_dispatcher_1.set_lastHovered_(async_dispatcher_1.set_lastBubbledHovered_(null));
      if (knownOptions.t) {
        exports.extendToCurRange(initialRange, hasInitialRange, i !== 6 /* FindAction.ExitForEnter */ , styleSheet);
      } else {
        i > 4 /* FindAction.MaxExitButNoWork */ && focusFocusEdge(i > 5 && knownHasResults);
        if ((i === 5 /* FindAction.ExitForEsc */ || !knownHasResults || visual_1.deactivate) && styleSheet) {
          toggleStyle(1);
          restoreSelection(1);
        }
      }
      parsedQuery_ = exports.find_query = query_ = query0_ = "";
      historyIndex = matchCount = doesCheckAlive = hasInitialRange = 0;
      exports.styleInHUD = styleInHUD = onUnexpectedBlur = outerBox_ = isRegex = ignoreCase = exports.find_box = box_ = innerDoc_ = root_ = exports.find_input = input_ = countEl = parsedRegexp_ = canvas = exports.deactivate = deactivate = utils_1.vApi.n = latest_options_ = initialRange = regexMatches = coords = cachedInnerText = null;
      if (visual_1.deactivate) {
        visual_1.deactivate(2);
        return;
      }
      if (i > 4 /* FindAction.MaxExitButNoWork */ && knownHasResults && (!el || el !== insert_1.insert_Lock_())) {
        let container = focusFoundLinkIfAny();
        if (container && i === 5 /* FindAction.ExitForEsc */ && (el2 = dom_utils_1.deepActiveEl_unsafe_()) && dom_utils_1.getEditableType_(el2) > 2 /* EditableType.MaxNotEditableElement */ && dom_utils_1.contains_s(container, el2)) {
          rect_1.getZoom_(el2);
          rect_1.prepareCrop_();
          async_dispatcher_1.select_(el2).then(() => {
            exports.toggleSelectableStyle();
            i > maxNotRunPost && postActivate();
          });
          return;
        }
        if (el) {
          // always call scrollIntoView if only possible, to keep a consistent behavior
          const pos = false /* BrowserVer.MinScrollIntoViewOptions */;
          // ScrollIntoView to notify it's `<tab>`'s current target since Min$ScrollIntoView$SetTabNavigationNode (C51)
                    dom_utils_1.scrollIntoView_(el);
          pos && marks_1.scrollToMark(pos);
        }
      }
      exports.toggleSelectableStyle();
      if (i > maxNotRunPost) {
        postActivate();
        i > 5 && port_1.runFallbackKey(knownOptions, knownHasResults ? 0 : 2);
      }
    });
    isActive && dom_ui_1.adjustUI();
    if (options.l) {
      if (initial_query = options.s & 4 ? initial_query : initial_query || query_) {
        styleSelColorOut || initSelColors(2 /* AdjustType.MustAdjust */);
        const isNewQuery = initial_query !== query_;
        initialRange || query_ || initStartPoint(1);
        if (options.e) {
          activeRegexIndex = 0;
          restoreSelection();
        }
        if (isNewQuery) {
          exports.updateQuery(initial_query);
          if (isActive) {
            dom_utils_1.textContent_s(input_, initial_query);
            showCount(1);
          }
        }
        (options.e || isNewQuery) && (activeRegexIndex -= options.c > 0 ? 1 : -1);
        isQueryRichText_ = true;
        const hud_showing = !isActive && hud_1.hud_opacity === 1;
        hud_showing && hud_1.toggleOpacity(0);
        exports.toggleSelectableStyle();
        exports.executeFind("", options);
        hasResults && options.m && highlightMany();
        hud_showing && hud_1.toggleOpacity(1);
        if (hasResults) {
          focusFoundLinkIfAny();
          isActive || keyboard_utils_1.whenNextIsEsc_(6 /* kHandler.find */ , 6 /* kModeId.Find */ , () => {
            const old = initialRange;
            deactivate(2 /* FindAction.ExitNoAnyFocus */);
            toggleStyle(1);
            dom_ui_1.resetSelectionToDocStart(dom_utils_1.getSelection_(), old);
            return 2 /* HandlerResult.Prevent */;
          });
          postActivate();
        } else {
          toggleStyle(1);
          isActive || exports.toggleSelectableStyle();
        }
      }
      port_1.runFallbackKey(options, initial_query ? hasResults ? 0 : 81 /* kTip.noMatchFor */ : options.s & 1 ? 122 /* kTip.noLineSelected */ : options.s & 2 ? 123 /* kTip.noTextSelected */ : 41 /* kTip.noOldQuery */ , initial_query);
    } else if (isActive) {
      setFirstQuery(initial_query);
      // not reinstall keydown handler - make code smaller
        } else {
      initStartPoint(options.t);
      parsedQuery_ = exports.find_query = query_ = "";
      parsedRegexp_ = regexMatches = null;
      activeRegexIndex = 0;
      query0_ = initial_query;
      const outerBox = outerBox_ = dom_utils_1.createElement_("div"), st = outerBox.style;
      st.width = "0";
      dom_utils_1.setDisplaying_s(outerBox);
      rect_1.wdZoom_ !== 1 && (st.zoom = "" + 1 / rect_1.wdZoom_);
      dom_utils_1.setClassName_s(outerBox, "R UI HUD" + utils_1.fgCache.d);
      exports.find_box = box_ = dom_utils_1.createElement_("iframe");
      dom_utils_1.setClassName_s(box_, "R UI Find");
      box_.onload = utils_1.vApi.n = later => {
        //#region on load
        const onLoad2 = () => {
          const docEl = innerDoc_.documentElement, body = innerDoc_.body, zoom = wnd.devicePixelRatio, list = innerDoc_.createDocumentFragment(), addElement = (tag, id) => {
            const newEl = innerDoc_.createElement(tag || "span");
            id && (newEl.id = id, dom_utils_1.appendNode_s(list, newEl));
            return newEl;
          };
          addElement(0, "s");
          const el = exports.find_input = input_ = addElement(0, "i");
          addElement(0, "h");
          el.contentEditable = "plaintext-only";
          countEl = addElement(0, "c");
          dom_ui_1.createStyle(findCSS.i, exports.styleInHUD = styleInHUD = addElement("style"));
          // add `<div>` to fix that a body with backgroundColor doesn't follow border-radius on FF63; and on Linux
          // an extra <div> may be necessary for Ctrl+A on some pages
                    const box = body, root = dom_utils_1.attachShadow_(box), AlwaysInShadow = true /* BrowserVer.MinShadowDOMV0 */ /* FirefoxBrowserVer.MinContentEditableInShadowSupportIME */;
          const root2 = AlwaysInShadow || root !== box ? addElement("div") : box;
          dom_utils_1.setClassName_s(root2, "r" + utils_1.fgCache.d);
          root2.spellcheck = false;
          dom_utils_1.appendNode_s(root2, list);
          if (AlwaysInShadow || root !== box) {
            root_ = root;
            // here can not use `box.contentEditable = "true"`, otherwise Backspace will break on Firefox, Win
                        utils_1.setupEventListener(root2, dom_utils_1.MDW, onMousedown, 0, 1);
            root.append(root2, styleInHUD);
          } else {
            dom_utils_1.appendNode_s(docEl, styleInHUD);
          }
          body.role = "textbox";
          body.ariaMultiLine = true;
          (AlwaysInShadow || root2 !== body) && dom_utils_1.setClassName_s(body, utils_1.fgCache.d.trim());
          zoom < 1 && (docEl.style.zoom = "" + 1 / zoom);
          dom_utils_1.setDisplaying_s(outerBox_, 1);
          keyboard_utils_1.replaceOrSuppressMost_(6 /* kHandler.find */ , onHostKeydown);
          setFirstQuery(query0_);
          // fix that: Ctrl+F, "a", focus content, press `/` to enter find mode, then activeElement is indeed the <span ce>
          // but it's not in "input mode" and no characters can be typed
                    utils_1.timeout_(doFocus, 100);
        };
        const onIframeFocus = function(event) {
          // here not stop prop, so that other extensions can trace where's keybaord focus
          if (!event.isTrusted) {
            return;
          }
          if (event.type === "blur") {
            const delta = utils_1.getTime() - lastInputTime_;
            if (delta <= 35 && delta >= 0) {
              lastInputTime_ = 0;
              utils_1.timeout_(doFocus, 0);
            }
            return;
          }
          doesCheckAlive && event.target === this && utils_1.onWndFocus();
          utils_1.Stop_(event);
        };
        const onIframeUnload = e => {
          isActive && !e.isTrusted && deactivate(4 /* FindAction.ExitUnexpectedly */);
        };
        const onMousedown = function(event) {
          const target = event.target;
          if (utils_1.isAlive_ && target !== input_ && (!root_ || dom_utils_1.parentNode_unsafe_s(target) === this || target === this) && event.isTrusted) {
            keyboard_utils_1.prevent_(event);
            doFocus();
            scrollTo_(dom_utils_1.compareDocumentPosition(target, input_) & 2 /* kNode.DOCUMENT_POSITION_PRECEDING */ ? 2 : 1);
          }
        };
        const onIFrameKeydown = event => {
          utils_1.Stop_(event);
          if (!event.isTrusted && event.z !== utils_1.fgCache) {
            return;
          }
          const n = event.keyCode;
          const eventWrapper = {
            c: " " /* kChar.INVALID */ ,
            e: event,
            i: n,
            v: ""
          };
          let isUp = event.type[3] > "e" /* kChar.e */ && !key_handler_1.set_isCmdTriggered(0);
          const isEscDownUp = false;
          if (!n || n === 229 /* kKeyCode.ime */ || scroller_1.keyIsDown && scroller_1.onScrolls(eventWrapper) || isUp && !isEscDownUp) {
            if (isUp && utils_1.keydownEvents_[n]) {
              utils_1.keydownEvents_[n] = 0;
              keyboard_utils_1.prevent_(event);
            }
            return;
          }
          const consumedByHost = key_handler_1.currentKeys && key_handler_1.checkKeyOnTop(eventWrapper), key = keyboard_utils_1.getMappedKey(eventWrapper, 6 /* kModeId.Find */), keybody = keyboard_utils_1.keybody_(key);
          const i = consumedByHost ? 10 /* FindAction.ConsumedByHost */ : key.includes("a-") && event.altKey ? 0 /* FindAction.DoNothing */ : keybody === keyboard_utils_1.ENTER ? key > "s" ? -1 /* FindAction.PassDirectly */ : suppressOnInput_ && key === keyboard_utils_1.ENTER ? 8 /* FindAction.ResumeFind */ : (query0_ && port_1.post_({
            H: 3 /* kFgReq.findQuery */ ,
            q: query0_
          }), 6 /* FindAction.ExitForEnter */) : keybody !== keyboard_utils_1.DEL && keybody !== keyboard_utils_1.BSP ? keyboard_utils_1.isEscape_(key) ? 5 /* FindAction.ExitForEsc */ : /^[cm]-s-c$/.test(key) ? 9 /* FindAction.CopySel */ : 0 /* FindAction.DoNothing */ : query_ || n === 46 /* kKeyCode.deleteKey */ && utils_1.os_ || keyboard_utils_1.isRepeated_(eventWrapper) ? -1 /* FindAction.PassDirectly */ : 1 /* FindAction.Exit */;
          let scroll, h = 2 /* HandlerResult.Prevent */;
          port_1.runtime_port || port_1.runtimeConnect();
          if (i < 0) {
            h = 1 /* HandlerResult.Suppress */;
          } else if (i || eventWrapper.v && (key_handler_1.checkKey(eventWrapper, eventWrapper.v), 
          1)) {} else if (keybody !== key) {
            if (key === "a-f1") {
              rect_1.getZoom_();
              rect_1.prepareCrop_();
              visual_1.highlightRange(dom_ui_1.getSelected());
            } else {
              key < "c" || key > "n" ? h = 1 /* HandlerResult.Suppress */ : (scroll = keyboard_utils_1.keyNames_.indexOf(keybody), 
              scroll > 2 && scroll - 5 ? scroller_1.beginScroll(eventWrapper, key, keybody) : keybody === "j" /* kChar.j */ || keybody === "k" /* kChar.k */ ? // not use `> kChar.i` in case of keys like `<c-j123>`
              onHostKeydown(eventWrapper) : h = 1 /* HandlerResult.Suppress */);
            }
          } else if (key === "f1" /* kChar.f1 */) {
            exports.execCommand(keyboard_utils_1.DEL);
          } else if (key === "f2" /* kChar.f2 */) {
            focus();
            hasResults && focusFocusEdge(1);
          } else if (key === "up" /* kChar.up */ || key === "down" /* kChar.down */) {
            scroll = historyIndex + (key < "u" ? -1 : 1);
            if (scroll >= 0) {
              historyIndex = scroll;
              key > "u" ? port_1.send_(3 /* kFgReq.findQuery */ , scroll, setQuery) : setQuery(1);
            }
          } else {
            h = 1 /* HandlerResult.Suppress */;
          }
          h > 1 && (keyboard_utils_1.prevent_(event), keyboard_utils_1.consumeKey_mac(n, event));
          i < 1 || (i === 8 /* FindAction.ResumeFind */ ? setQuery(input_.innerText.replace("\\0", "")) : i === 9 /* FindAction.CopySel */ ? port_1.post_({
            H: 18 /* kFgReq.copy */ ,
            s: "" + dom_utils_1.getSelection_()
          }) : i < 7 /* FindAction.MinNotExit */ && deactivate(i));
        };
        const onHostKeydown = event => {
          let keybody, key = keyboard_utils_1.getMappedKey(event, 6 /* kModeId.Find */);
          if (key === "f2" /* kChar.f2 */) {
            onUnexpectedBlur && onUnexpectedBlur();
            doFocus();
            return 2 /* HandlerResult.Prevent */;
          }
          if (key.length > 1 && "c-m-".includes(key[0] + key[1]) && ((keybody = keyboard_utils_1.keybody_(key)) === "j" /* kChar.j */ || keybody === "k" /* kChar.k */)) {
            if (!hasResults && wrapAround) {} else if (key.length > 4) {
              highlightMany();
            } else {
              exports.executeFind("", {
                c: -(keybody > "j" /* kChar.j */),
                i: 1,
                t: options.t
              });
              options.m && !highlighting && (highlightTimeout_ || (highlightTimeout_ = utils_1.timeout_(highlightMany, 200)));
            }
            return 2 /* HandlerResult.Prevent */;
          }
          if (!insert_1.insert_Lock_() && keyboard_utils_1.isEscape_(key)) {
            keyboard_utils_1.prevent_(event.e);
            deactivate(3 /* FindAction.ExitNoFocus */);
 // should exit
                        return 2 /* HandlerResult.Prevent */;
          }
          return event.v ? 2 /* HandlerResult.Prevent */ : 0 /* HandlerResult.Nothing */;
        };
        try {
          innerDoc_ = isActive ? box_.contentDocument : null;
        } catch (_a) {}
        if (!innerDoc_) {
          if (isActive) {
            deactivate(4 /* FindAction.ExitUnexpectedly */);
            hud_1.hudTip(39 /* kTip.findFrameFail */ , 2);
          }
          return;
        }
        const wnd = box_.contentWindow, f = wnd.addEventListener.bind(wnd), now = utils_1.getTime(), t = true;
        let tick = 0;
        utils_1.vApi.n = 0;
        outerBox_.onmousedown = onMousedown;
        f(dom_utils_1.MDW, onMousedown, t);
        f("keydown", onIFrameKeydown, t);
        f("keyup", onIFrameKeydown, t);
        f(dom_utils_1.INP, onInput, t);
        f(dom_utils_1.PGH, onIframeUnload, t);
        options.m && f("compositionstart", () => {
          utils_1.clearTimeout_(highlightTimeout_);
        }, t);
        f("compositionend", onInput, t);
        utils_1.suppressCommonEvents(wnd, dom_utils_1.CLK);
 // no `<a>`, so no `auxclick` events
                f(dom_utils_1.BU, onUnexpectedBlur = event => {
          const delta = utils_1.getTime() - now;
          if (event && isActive && delta < 500 && delta > -99 && event.target === wnd) {
            wnd.closed || utils_1.timeout_(doFocus, 17 * tick++);
          } else {
            utils_1.setupEventListener(wnd, dom_utils_1.BU, onUnexpectedBlur, 1, 1);
            onUnexpectedBlur = null;
          }
        }, t);
        f("focus", onIframeFocus, t);
        f("blur", onIframeFocus, t);
        box_.onload = later ? null : e => {
          e.target.onload = null;
          isActive && onLoad2();
        };
        later && onLoad2();
        //#endregion
            };
      keyboard_utils_1.replaceOrSuppressMost_(6 /* kHandler.find */);
      styleSelColorOut || initSelColors(0 /* AdjustType.NotAdjust */);
      exports.toggleSelectableStyle(1);
      isActive = 1;
      dom_utils_1.appendNode_s(outerBox, box_);
      dom_ui_1.addUIElement(outerBox, 1 /* AdjustType.DEFAULT */ , hud_1.hud_box);
    }
  };
  exports.activate = activate;
  const doFocus = () => {
    if (!isActive) {
      return;
    }
    doesCheckAlive = 0;
    // fix that: search for "a" in VFind, Ctrl+F, "a", Esc, select any normal text using mouse - then `/` can not refocus
        root_.activeElement === input_ && input_.blur();
    dom_utils_1.focus_(input_);
    doesCheckAlive = 1;
  };
  const execCommand = (cmd, doc1, value) => {
    (doc1 || innerDoc_).execCommand(cmd, false, value);
  };
  exports.execCommand = execCommand;
  const updateQuery = query => {
    const normLetters = str => str.normalize("NFD").replace(/[\u0300-\u0331\u24b6-\u24e9\uff21-\uff56]/g, ch => {
      const i = ch.charCodeAt(0);
      return i < 818 ? "" : String.fromCharCode(i - (i < 9472 ? i < 9424 ? 9333 : 9327 : 65248));
    });
    const WB = "\\b";
    let delta, ww = suppressOnInput_ = false, isRe = null, matches = null;
    let text;
    exports.find_query = query_ = query0_ = query;
    wrapAround = true;
    ignoreCase = null;
    query = isQueryRichText_ ? query.replace(/\\[acirw0\\]/gi, str => {
      let flag = str.charCodeAt(1), enabled = flag > 96;
      if (flag === 92 /* kCharCode.backslash */) {
        return str;
      }
      flag &= -33 /* kCharCode.CASE_DELTA */;
      if (flag === 73 /* kCharCode.I */ || flag === 67 /* kCharCode.C */) {
        ignoreCase = enabled === (flag === 73 /* kCharCode.I */);
      } else if (flag === 82 /* kCharCode.R */) {
        isRe = enabled;
      } else if (flag === 16 /* kCharCode.CASE_DELTA */) {
        suppressOnInput_ = 1;
      } else {
        if (isRe) {
          return str;
        }
        flag > 65 /* kCharCode.A */ ? ww = enabled : wrapAround = enabled;
      }
      return "";
    }) : query;
    if (isQueryRichText_) {
      if (isRe === null && !ww) {
        isRe = utils_1.fgCache.r;
        delta = 2 * +query.startsWith(WB) + +query.endsWith(WB);
        if (delta === 3 && !isRe && query.length > 3) {
          query = query.slice(2, -2);
          ww = true;
        } else {
          delta && delta < 3 && (isRe = true);
        }
      }
      text = query.replace(/\\\\/g, "\\");
      if (ww && isRe) {
        query = WB + utils_1.escapeAllForRe(text) + WB;
        ww = false;
        isRe = true;
      }
      query = isRe ? query !== "\\b\\b" && query !== WB ? query : "" : text;
    }
    parsedQuery_ = query;
    isRegex = !!isRe;
    wholeWord = ww;
    notEmpty = !!query;
    ignoreCase = ignoreCase != null ? ignoreCase : utils_1.Lower(query) === query;
    const didNorm = !isRe && !!latest_options_.n;
    isRe || (query = isActive ? utils_1.escapeAllForRe(didNorm ? normLetters(query) : query) : "");
    let re = query && utils_1.tryCreateRegExp(ww ? WB + query + WB : query, ignoreCase ? "gim" : "gm") || null;
    if (re && !suppressOnInput_) {
      let now = utils_1.getTime();
      if (cachedInnerText && cachedInnerText.n === didNorm && (delta = utils_1.abs_(now - cachedInnerText.t)) < (didNorm || cachedInnerText.i.length > 1e5 ? 6e3 : 3e3)) {
        query = cachedInnerText.i;
        delta < 500 && (cachedInnerText.t = now);
      } else {
        let el = dom_utils_1.fullscreenEl_unsafe_();
        while (el && el.lang == null) {
          // in case of SVG elements
          el = dom_utils_1.GetParent_unsafe_(el, 1 /* PNType.DirectElement */);
        }
        query = el && utils_1.isTY(text = el.innerText) && text || dom_utils_1.docEl_unsafe_().innerText + "";
        query = didNorm ? normLetters(query) : query;
        cachedInnerText = {
          i: query,
          t: now,
          n: didNorm
        };
      }
      matches = query.match(re);
    }
    regexMatches = isRe ? matches : null;
    parsedRegexp_ = isRe ? re : null;
    activeRegexIndex = 0;
    matchCount = matches ? matches.length : 0;
  };
  exports.updateQuery = updateQuery;
  const executeFind = (query, options) => {
    let el, newRange, newAnchor, posChange, found, par, q, highlight = utils_1.safer(options).h, noColor = highlight || options.noColor, count = options.c | 0 || 1, back = count < 0, timesRegExpNotMatch = 0, notSens = ignoreCase && !options.caseSensitive;
    /** Note: FirefoxBrowserVer.MinFollowSelectionColorOnInactiveFrame
         * Before Firefox 68, it's impossible to replace the gray bg color for blurred selection:
         * In https://hg.mozilla.org/mozilla-central/file/tip/layout/base/nsDocumentViewer.cpp#l3463 ,
         * `nsDocViewerFocusListener::HandleEvent` calls `SetDisplaySelection(SELECTION_DISABLED)`,
         *   if only a trusted "blur" event gets dispatched into Document
         * See https://bugzilla.mozilla.org/show_bug.cgi?id=1479760 .
         */    noColor || toggleStyle(0);
    back && (count = -count);
    const isRe = isRegex, pR = parsedRegexp_;
    const wndSel = dom_utils_1.getSelection_();
    let oldReInd, selNone, regexpNoMatchLimit = 9 * count, dedupID = count + 1;
    let curSel, oldAnchor = !options.j && wrapAround && dom_utils_1.getAccessibleSelectedNode(dom_ui_1.getSelected());
    while (0 < count) {
      oldReInd = activeRegexIndex;
      q = query || (isRe ? regexMatches ? regexMatches[activeRegexIndex = highlight ? back ? utils_1.max_(0, oldReInd - 1) : utils_1.min_(oldReInd + 1, matchCount - 1) : (oldReInd + (back ? -1 : 1) + matchCount) % matchCount] : "" : parsedQuery_);
      found = !!q && window.find(q, !notSens, back, !highlight && wrapAround, wholeWord, false, false);
      if (!found) {
        break;
      }
      // if true, then the matched text may have `user-select: none`
            selNone = dedupID > count && !(wndSel + "");
      /**
             * Warning: on Firefox and before {@link #FirefoxBrowserVer.Min$find$NotReturnFakeTrueOnPlaceholderAndSoOn},
             * `found` may be unreliable,
             * because Firefox may "match" a placeholder and cause `getSelection().type` to be `"None"`
             */      if (pR && !selNone && (par = dom_ui_1.getSelectionParent_unsafe(curSel = dom_ui_1.getSelected(), pR)) === 0 && timesRegExpNotMatch++ < regexpNoMatchLimit) {
        activeRegexIndex = oldReInd;
      } else if (highlight) {
        const sx = highlight[0] - scrollX, sy = highlight[1] - scrollY;
        (sx || sy) && rect_1.scrollWndBy_(sx, sy);
        curSel = dom_ui_1.getSelected();
        let rect = dom_ui_1.getSelectionBoundingBox_(curSel);
        rect = sx || sy ? rect : rect && rect_1.cropRectS_(rect);
        if (rect) {
          back ? highlight[2].unshift(rect) : highlight[2].push(rect);
        } else if ((newAnchor = dom_utils_1.getAccessibleSelectedNode(curSel, 1)) && (newAnchor = dom_utils_1.getNodeChild_(newAnchor, curSel, 1))) {
          newRange = rect_1.selRange_(curSel, 1).cloneRange();
          back ? newRange.setEndBefore(newAnchor) : newRange.setStartAfter(newAnchor);
          newRange.collapse(!back);
          dom_ui_1.resetSelectionToDocStart(curSel, newRange);
        }
        count--;
        timesRegExpNotMatch = 0;
      } else {
        count--;
      }
      if (selNone) {
        dedupID = highlight ? 2 : ++count;
        dom_utils_1.modifySel(wndSel, 0, !back, dom_utils_1.kGCh);
      }
    }
    if (found && !highlight && (par = par || dom_ui_1.getSelectionParent_unsafe(curSel = dom_ui_1.getSelected()))) {
      newAnchor = dom_utils_1.getAccessibleSelectedNode(curSel);
      posChange = oldAnchor && newAnchor && dom_utils_1.compareDocumentPosition(oldAnchor, newAnchor);
      newAnchor = newAnchor && (dom_utils_1.isNode_(newAnchor, 3 /* kNode.TEXT_NODE */) ? dom_utils_1.parentNode_unsafe_s(newAnchor) : dom_utils_1.getNodeChild_(newAnchor, curSel));
      scrollSelectionAfterFind(par, newAnchor && dom_utils_1.isNode_(newAnchor, 1 /* kNode.ELEMENT_NODE */) ? newAnchor : 0, curSel);
      posChange && /** go back */ !!(posChange & 2 /* kNode.DOCUMENT_POSITION_PRECEDING */) !== back && hud_1.hudTip(23 /* kTip.wrapWhenFind */ , 1, utils_1.VTr(back ? 24 /* kTip.atStart */ : 25 /* kTip.atEnd */));
    }
    found && options.t && exports.extendToCurRange(initialRange, hasInitialRange);
    noColor || utils_1.timeout_(hookSel, 0);
    (el = insert_1.insert_Lock_()) && !dom_utils_1.isSelected_() && el.blur();
    options.i || (exports.find_hasResults = hasResults = found);
  };
  exports.executeFind = executeFind;
  const scrollSelectionAfterFind = (par, newAnchor, sel) => {
    const kMayInTextBox = true;
    const kHasInlineStart = true /* BrowserVer.MinCSSBlockInlineStartEnd */;
    const newStyle = newAnchor && dom_utils_1.getComputedStyle_(newAnchor);
    const specialFixForTransparent = newStyle && newStyle.color.includes("(0, 0, 0");
    const px2int = s => +s.slice(0, -2);
    const ltr = newStyle && newStyle.direction !== "rtl";
    const textStyle = !kMayInTextBox || !newStyle || dom_utils_1.getEditableType_(newAnchor) < 4 ? 0 : newStyle.writingMode[0] > "s" ? 1 : [ newStyle.font, px2int(newStyle.lineHeight), rect_1.dimSize_(newAnchor, 2 /* kDim.elClientW */), rect_1.dimSize_(newAnchor, 3 /* kDim.elClientH */), px2int(newStyle.fontSize), px2int(kHasInlineStart ? newStyle.borderInlineStartWidth : ltr ? newStyle.borderLeftWidth : newStyle.borderRightWidth), px2int(kHasInlineStart ? newStyle.paddingInlineStart : ltr ? newStyle.paddingLeft : newStyle.paddingRight), px2int(newStyle.paddingTop) + px2int(newStyle.borderTopWidth), newStyle.whiteSpace ];
    const scrollManually = latest_options_ && latest_options_.u;
    let context, widthOrEnd;
    // `window.find()` may auto make a target scroll into view smoothly, but a manual `scrollBy` breaks the animation
        const oldInvisibility = dom_utils_1.isSafeEl_(par) && (rect_1.set_cropNotReady_(2), 
    kMayInTextBox && utils_1.isTY(textStyle, 1 /* kTY.obj */) || scrollManually ? rect_1.view_(par) : rect_1.isNotInViewport(par));
    let selRect;
    const flashOutline = () => {
      if (selRect = textStyle ? selRect : dom_ui_1.getSelectionBoundingBox_(sel, 1)) {
        link_actions_1.removeFlash && link_actions_1.removeFlash();
        link_actions_1.set_removeFlash(dom_ui_1.flash_(null, selRect, +oldInvisibility && 1200 /* GlobalConsts.DefaultRectFlashTime */ , " Sel"));
      }
    };
    const tick = ++delayedScrollIntoViewTick_;
    if (kMayInTextBox && utils_1.isTY(textStyle, 1 /* kTY.obj */)) {
      context = (canvas = canvas || dom_utils_1.createElement_("canvas")).getContext("2d");
      const full = newAnchor.value.slice(0, dom_utils_1.textOffset_(newAnchor, 1 /* VisualModeNS.kDir.right */));
      let offset = dom_utils_1.textOffset_(newAnchor);
      const strArrBefore = full.slice(0, offset).split("\n"), lineStrBefore = strArrBefore.pop();
      const getWidth = s => s.length < 400 ? context.measureText(s).width : s.length * textStyle[4] / 2;
      context.font = textStyle[0];
      const has_neg_sc_pos = true /* BrowserVer.MinEnsuredNegativeScrollPosIfRTL */;
      const max_width = textStyle[2];
      const baseScPosX = has_neg_sc_pos || ltr ? 0 : rect_1.dimSize_(newAnchor, 4 /* kDim.scrollW */) - max_width;
      let start = getWidth(lineStrBefore), top = strArrBefore.length;
      if (dom_utils_1.getEditableType_(newAnchor) < 5 && textStyle[8] !== "pre" && textStyle[8] !== "nowrap") {
        widthOrEnd = max_width / textStyle[4] * 2;
        top = strArrBefore.reduce((old, x) => old + utils_1.math.ceil(x.length / widthOrEnd), 0) + (start / max_width | 0);
        start %= max_width;
      }
      top *= textStyle[1];
      const scX = (ltr ? 1 : -1) * utils_1.max_(0, start - max_width / 2) + baseScPosX;
      const scY = utils_1.max_(0, top - (textStyle[3] - textStyle[1]) / 2);
      newAnchor.scrollTo(rect_1.instantScOpt(scX, scY));
      selRect = rect_1.boundingRect_(newAnchor);
      widthOrEnd = utils_1.max_(4, getWidth(full.slice(offset).split("\n", 1)[0]));
      offset = rect_1.dimSize_(newAnchor, 6 /* kDim.scPosX */);
      offset = ltr ? offset : utils_1.max_(0, has_neg_sc_pos ? -offset : baseScPosX - offset);
      start = utils_1.max_(0, textStyle[6] + utils_1.min_(start - offset, max_width));
      widthOrEnd = utils_1.min_(start + widthOrEnd, max_width);
      offset = ltr ? selRect.l + textStyle[5] : selRect.r - textStyle[5];
      top += selRect.t + textStyle[7] - rect_1.dimSize_(newAnchor, 7 /* kDim.scPosY */);
      selRect = {
        l: ltr ? offset + start : offset - widthOrEnd,
        t: top,
        r: ltr ? offset + widthOrEnd : offset - start,
        b: top + textStyle[1]
      };
      flashOutline();
      isActive || (canvas = null);
    } else if (oldInvisibility && !scrollManually) {
      selRect = rect_1.boundingRect_(newAnchor);
      utils_1.timeout_(() => {
        const hasScrolled = (rect2, threshold) => utils_1.abs_(rect2.t - selRect.t) > threshold || utils_1.abs_(rect2.l - selRect.l) > threshold;
        if (tick !== delayedScrollIntoViewTick_) {} else if (hasScrolled(rect_1.boundingRect_(newAnchor), 2)) {
          utils_1.timeout_(() => {
            if (tick === delayedScrollIntoViewTick_) {
              hasScrolled(rect_1.boundingRect_(newAnchor), 15) || rect_1.view_(newAnchor);
              flashOutline();
            }
          }, 200);
        } else {
          rect_1.view_(newAnchor);
          flashOutline();
        }
      }, 50);
    } else {
      flashOutline();
    }
    specialFixForTransparent && (styleSelColorOut.disabled = true);
  };
  const hookSel = t => {
    utils_1.setupEventListener(0, "selectionchange",  toggleStyle, t);
  };
  /** must be called after initing */  const toggleStyle = disable => {
    const sout = styleSelColorOut, sin = styleSelColorIn;
    if (!sout) {
      return;
    }
    hookSel(1);
    disable = !!disable;
    // Note: `<doc/root>.adoptedStyleSheets` should not be modified in an extension world
        if (!isActive && disable) {
      exports.toggleSelectableStyle();
      dom_utils_1.removeEl_s(sout);
      dom_utils_1.removeEl_s(sin);
      exports.styleSelColorOut = styleSelColorOut = exports.styleSelColorIn = styleSelColorIn = null;
      return;
    }
    if (dom_utils_1.parentNode_unsafe_s(sout) !== dom_ui_1.ui_box) {
      dom_ui_1.ui_box.insertBefore(sout, styleSelectable && dom_utils_1.parentNode_unsafe_s(styleSelectable) === dom_ui_1.ui_box ? styleSelectable : null);
      dom_ui_1.addUIElement(sin, 0 /* AdjustType.NotAdjust */ , true);
    }
    sout.sheet && (sout.sheet.disabled = disable);
    sin.sheet && (sin.sheet.disabled = disable);
  };
  const toggleSelectableStyle = enable => {
    !enable || dom_utils_1.docSelectable_ && !findCSS.s.includes("\n") ? styleSelectable && (dom_utils_1.removeEl_s(styleSelectable), 
    exports.styleSelectable = styleSelectable = null) : dom_utils_1.appendNode_s(dom_ui_1.ui_box, exports.styleSelectable = styleSelectable = dom_ui_1.createStyle(findCSS.s, styleSelectable));
  };
  exports.toggleSelectableStyle = toggleSelectableStyle;
  const extendToCurRange = (range, hasRange, abortCur, hasStyle) => {
    const sel = dom_ui_1.getSelected(), focused = dom_utils_1.getAccessibleSelectedNode(sel, 1), focusedOffset = dom_utils_1.selOffset_(sel, 1), anchor = dom_utils_1.getAccessibleSelectedNode(sel), anchorOffset = dom_utils_1.selOffset_(sel), isCurLeft = abortCur || !!focused && !dom_utils_1.getDirectionOfNormalSelection(sel, anchor, focused);
    hasStyle && toggleStyle(1);
    if (hasRange && (abortCur || focused && dom_utils_1.getEditableType_(dom_utils_1.singleSelectionElement_unsafe(sel) || dom_utils_1.docEl_unsafe_()) < 4)) {
      const {startContainer: start, startOffset, endContainer: end, endOffset} = range;
      const isLeft = abortCur ? hasRange < 2 : anchor && (start === focused ? focusedOffset < startOffset : dom_utils_1.compareDocumentPosition(start, focused) & 2 /* kNode.DOCUMENT_POSITION_PRECEDING */);
      dom_utils_1.getSelection_().setBaseAndExtent(isLeft ? end : start, isLeft ? endOffset : startOffset, abortCur ? isLeft ? start : end : isLeft !== isCurLeft ? anchor : focused, abortCur ? isLeft ? startOffset : endOffset : isLeft !== isCurLeft ? anchorOffset : focusedOffset);
    }
  };
  exports.extendToCurRange = extendToCurRange;
});