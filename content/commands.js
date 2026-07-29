"use strict";
__filename = "content/commands.js";
define([ "require", "exports", "../lib/utils", "../lib/dom_utils", "../lib/keyboard_utils", "../lib/rect", "./port", "./dom_ui", "./hud", "./key_handler", "./link_hints", "./marks", "./mode_find", "./insert", "./visual", "./scroller", "./omni", "./pagination", "./local_links", "./async_dispatcher", "./request_handlers" ], (require, exports, utils_1, dom_utils_1, keyboard_utils_1, rect_1, port_1, dom_ui_1, hud_1, key_handler_1, link_hints_1, marks_1, mode_find_1, insert_1, visual_1, scroller_1, omni_1, pagination_1, local_links_1, async_dispatcher_1, request_handlers_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.RSC = void 0;
  exports.RSC = "readystatechange";
  port_1.set_contentCommands_([ 
  /* kFgCmd.callTee: */ options => {
    const timer = utils_1.timeout_(port_1.send_.bind(0, 45 /* kFgReq.recheckTee */ , 0, used => {
      used || utils_1.onWndFocus === oldWndFocus || utils_1.onWndFocus(0);
    }), options.t);
    const oldWndFocus = utils_1.onWndFocus, focused = dom_utils_1.docHasFocus_() && dom_utils_1.deepActiveEl_unsafe_();
    const frame = dom_utils_1.createElement_("iframe");
    frame.src = options.u;
    frame.allow = options.a;
    dom_utils_1.setClassName_s(frame, options.c);
    utils_1.set_onWndFocus(frame.onerror = /** true: on error; 0: timed out; void: ok */ event => {
      utils_1.set_onWndFocus(oldWndFocus), frame.onerror = null;
      utils_1.clearTimeout_(timer);
      (event || event !== 0 && options.i) && port_1.send_(46 /* kFgReq.afterTee */ , event ? -options.i : options.i, request_handlers_1.showFrameMask);
      focused && dom_utils_1.isSafeEl_(focused) && dom_utils_1.IsAInB_(focused, utils_1.doc) && (dom_utils_1.isIFrameElement(focused) ? dom_ui_1.focusIframeContentWnd_(focused) : dom_utils_1.focus_(focused));
      dom_utils_1.removeEl_s(frame);
      utils_1.isEnabled_ || dom_ui_1.adjustUI(2);
    });
    dom_ui_1.addUIElement(frame, 1 /* AdjustType.Normal */ , true);
  }, 
  /* kFgCmd.findMode: */ mode_find_1.activate, 
  /* kFgCmd.linkHints: */ link_hints_1.activate, 
  /* kFgCmd.marks: */ marks_1.activate, 
  /* kFgCmd.scroll: */ scroller_1.activate, 
  /* kFgCmd.visualMode: */ visual_1.activate, 
  /* kFgCmd.vomnibar: */ omni_1.activate, 
  /* kFgCmd.insertMode: */ opt => {
    if (opt.u) {
      /*#__ENABLE_SCOPED__*/
      const done = dom_utils_1.derefInDoc_(async_dispatcher_1.lastHovered_) ? 0 : 2;
      async_dispatcher_1.catchAsyncErrorSilently(async_dispatcher_1.wrap_enable_bubbles(opt, async_dispatcher_1.unhover_async, [])).then(() => {
        hud_1.hudTip(4 /* kTip.didUnHoverLast */);
        opt.i || port_1.runFallbackKey(opt, done);
      });
    }
    if (opt.r) {
       insert_1.resetInsertAndScrolling();
      link_hints_1.clear(2 - opt.r), visual_1.deactivate && visual_1.deactivate();
      mode_find_1.deactivate && mode_find_1.deactivate(2 /* FindAction.ExitNoAnyFocus */);
      omni_1.hide(), dom_ui_1.hideHelp && dom_ui_1.hideHelp();
      /** only need a part of actions in {@link ./insert.ts#onWndBlur} */      scroller_1.scrollTick(0);
      key_handler_1.onPassKey ? key_handler_1.onPassKey() : utils_1.esc(3 /* HandlerResult.ExitNormalMode */);
    }
    if (opt.i) {
      insert_1.set_insert_global_(opt);
      opt.h && hud_1.hudShow(1 /* kTip.raw */ , opt.h);
    }
    opt.u || opt.i || port_1.runFallbackKey(opt, 0);
  }, 
  /* kFgCmd.toggle: */ options => {
    const key = options.k, backupKey = "_" + key, cur = utils_1.safer(utils_1.fgCache)[key];
    let u, val = options.v;
    val === null && cur === !!cur && (val = !cur);
    if (utils_1.inherited_) {
      return;
    }
    if (utils_1.fgCache[backupKey] === u) {
      utils_1.fgCache[backupKey] = cur;
    } else if (cur === val) {
      val = utils_1.fgCache[backupKey];
      utils_1.fgCache[backupKey] = u;
    }
    utils_1.fgCache[key] = val;
    options.n && port_1.post_({
      H: 38 /* kFgReq.optionToggled */ ,
      k: options.n,
      v: val
    });
  }, 
  /* kFgCmd.passNextKey: */ (options, count0) => {
    const keys = utils_1.safer({});
    const ignoreCase = options.ignoreCase;
    const expectedKeys = options.expect, hasExpected = utils_1.isTY(expectedKeys) && !!expectedKeys;
    let keyCount = 0, count = count0 > 0 ? count0 : -count0;
    keyboard_utils_1.removeHandler_(1 /* kHandler.passNextKey */);
    key_handler_1.onPassKey ? key_handler_1.onPassKey() : utils_1.esc(3 /* HandlerResult.ExitNormalMode */);
    const oldEsc = utils_1.esc;
    if (hasExpected || !!options.normal === count0 > 0) {
      if (!hasExpected && !key_handler_1.passKeys && !insert_1.insert_Lock_() && !utils_1.isTY(options.normal)) {
        return hud_1.hudTip(6 /* kTip.noPassKeys */);
      }
      hasExpected && keyboard_utils_1.replaceOrSuppressMost_(1 /* kHandler.passNextKey */ , event => {
        const rawKey = keyboard_utils_1.getMappedKey(event, 0 /* kModeId.Plain */);
        const key = rawKey.length > 1 ? `<${rawKey}>` : ignoreCase ? utils_1.Lower(rawKey) : rawKey;
        const matched = !!key && (ignoreCase ? utils_1.Lower(expectedKeys) : expectedKeys).slice(count - 1).startsWith(key);
        matched && (count += key.length);
        if (count > expectedKeys.length || key && !matched) {
          count = +!matched;
          utils_1.esc(3 /* HandlerResult.ExitNormalMode */);
          matched || keyboard_utils_1.suppressTail_(200 /* GlobalConsts.TimeOfSuppressingTailKeydownEvents */ , 0);
        } else {
          utils_1.esc(0 /* HandlerResult.Nothing */);
        }
        return matched || options.consume !== false ? 2 /* HandlerResult.Prevent */ : 0 /* HandlerResult.Nothing */;
      });
      insert_1.set_passAsNormal(1);
      utils_1.set_esc(i => {
        if (i === 2 /* HandlerResult.Prevent */ && 0 >= --count || i === 3 /* HandlerResult.ExitNormalMode */) {
          keyboard_utils_1.removeHandler_(1 /* kHandler.passNextKey */);
          utils_1.set_esc(oldEsc);
          insert_1.set_passAsNormal(0);
          hud_1.hudHide();
          port_1.runFallbackKey(options, count ? 2 : 0);
          return oldEsc(2 /* HandlerResult.Prevent */);
        }
        if (i - 4 /* HandlerResult.RefreshPassAsNormal */) {
          oldEsc(0 /* HandlerResult.Nothing */);
          key_handler_1.set_nextKeys(key_handler_1.keyFSM);
        }
        if (keyCount - count || !hud_1.hud_text) {
          keyCount = count;
          hud_1.hudShow(expectedKeys ? 31 /* kTip.expectKeys */ : 7 /* kTip.normalMode */ , expectedKeys ? expectedKeys.slice(count - 1) : count > 1 ? utils_1.VTr(8 /* kTip.nTimes */ , [ count ]) : "");
        }
        return i;
      });
      utils_1.esc(0 /* HandlerResult.Nothing */);
      return;
    }
    const shouldExit_delayed_mac = (event, isDown) => {
      if (!utils_1.os_ && keyCount && (isDown || !keyboard_utils_1.getKeyStat_(event))) {
        for (const rawKey in keys) {
          const key = +rawKey;
          keys[key] && utils_1.timeStamp_(event) - keys[key] > ((key > 18 /* kKeyCode.maxAcsKeys */ ? key < 91 || key > 93 /* kKeyCode.os_ff_mac */ : key < 16 /* kKeyCode.minAcsKeys */) ? utils_1.fgCache.k[0] + 800 : 5e3) && (keys[key] = false, 
          --keyCount);
        }
        keyCount > 0 || (keyCount = 0, --count) || key_handler_1.onPassKey();
      }
      return !count;
    };
    keyboard_utils_1.replaceOrSuppressMost_(1 /* kHandler.passNextKey */ , event => {
      if (!keyboard_utils_1.isRepeated_(event) && shouldExit_delayed_mac(event.e, 1)) {
        return 0 /* HandlerResult.Nothing */;
      }
      keyCount += !keys[event.i];
      keys[event.i] = utils_1.os_ ? 1 : utils_1.timeStamp_(event.e);
      return -1 /* HandlerResult.PassKey */;
    });
    key_handler_1.set_onPassKey(event => {
      if (event && shouldExit_delayed_mac(event, 0)) {} else if (event && keys[event.keyCode] ? --keyCount > 0 || (keyCount = 0, 
      --count) : event === 0 && keyCount || count) {
        keys[event && event.keyCode] = 0;
        keyCount || hud_1.hudShow(9 /* kTip.passNext */ , count > 1 ? utils_1.VTr(8 /* kTip.nTimes */ , [ count ]) : "");
      } else {
        keyboard_utils_1.removeHandler_(1 /* kHandler.passNextKey */);
        key_handler_1.set_onPassKey(null);
        hud_1.hudHide();
        port_1.runFallbackKey(options, count ? 2 : 0);
      }
    });
    key_handler_1.onPassKey(0);
  }, 
  /* kFgCmd.goNext: */ req => {
    let parApi, chosen;
    rect_1.set_cropNotReady_(2);
    utils_1.isTop || !(parApi = dom_ui_1.getParentVApi()) || parApi.a(utils_1.keydownEvents_) ? (chosen = dom_utils_1.isHTML_() && (req.r && pagination_1.findNextInRel(req) || req.p.length && pagination_1.findNextInText(req.p, req))) ? chosen[1].j(chosen[0], req) : port_1.runFallbackKey(req, 10 /* kTip.noLinksToGo */ , utils_1.VTr(114 /* kTip.prev */ + req.n)) : parApi.f(10 /* kFgCmd.goNext */ , req, 1);
  }, 
  /* kFgCmd.autoOpen: */ options => {
    const selected = options.selected, str = options.s && !selected ? "" : dom_ui_1.getSelectionText(1) || (options.text || "") + "", urlOpt = options.url, getUrl = urlOpt === "raw" ? utils_1.locHref : utils_1.vApi.u, trimmed = str.trim(), rawCopied = options.copied, copied = rawCopied || rawCopied == null;
    options.copy && (trimmed || !options.o) && port_1.post_({
      H: 18 /* kFgReq.copy */ ,
      s: str,
      u: str ? "" : urlOpt ? getUrl() : utils_1.doc.title,
      n: options
    });
    options.o && (trimmed && dom_ui_1.evalIfOK(trimmed) ? port_1.runFallbackKey(options, 0) : port_1.post_({
      H: 8 /* kFgReq.openUrl */ ,
      c: copied,
      u: trimmed,
      n: options
    }));
    options.s && !options.o && port_1.post_({
      H: 6 /* kFgReq.searchAs */ ,
      u: getUrl(),
      c: copied,
      t: selected ? trimmed : "",
      n: options
    });
  }, 
  /* kFgCmd.focusInput: */ (options, count) => {
    const S = "IH IHS";
    const act = options.act || options.action, selAction = options.select;
    const checkOrView = act === "last-visible" ? rect_1.isNotInViewport : rect_1.view_;
    const second_last = dom_utils_1.derefInDoc_(insert_1.insert_last2_), known_last = dom_utils_1.derefInDoc_(insert_1.insert_last_) || second_last;
    const selectOrClick = (el, rect, onlyOnce) => dom_utils_1.getEditableType_(el) ? async_dispatcher_1.select_(el, rect, onlyOnce, selAction, onlyOnce) : async_dispatcher_1.click_async(el, rect, 1).then(() => {
      onlyOnce && dom_ui_1.flash_(el);
    });
    let actRet = 0;
    if (act && (act[0] !== "l" || known_last && !insert_1.raw_insert_lock)) {
      /*#__ENABLE_SCOPED__*/
      let newEl = insert_1.raw_insert_lock;
      if (newEl && dom_utils_1.getEditableType_(newEl) > 2 /* EditableType.MaxNotEditableElement */) {
        if (act === keyboard_utils_1.BSP) {
          rect_1.set_cropNotReady_(2);
          !rect_1.view_(newEl, 1) && dom_utils_1.isStyleVisible_(newEl) && mode_find_1.execCommand(keyboard_utils_1.DEL, utils_1.doc);
        } else {
          insert_1.insert_last_mutable && insert_1.set_insert_last2_(insert_1.insert_last_);
          insert_1.set_insert_last_(utils_1.weakRef_not_ff(newEl));
          insert_1.set_is_last_mutable(0);
          newEl.blur();
        }
      } else if (newEl = null, known_last) {
        if (dom_utils_1.getEditableType_(known_last) > 2 /* EditableType.MaxNotEditableElement */ && !(actRet = checkOrView(newEl = known_last)) && dom_utils_1.isStyleVisible_(newEl) || actRet - 1 /* kInvisibility.OutOfView */ && second_last && dom_utils_1.getEditableType_(second_last) > 2 /* EditableType.MaxNotEditableElement */ && !checkOrView(newEl = second_last) && dom_utils_1.isStyleVisible_(newEl)) {
          actRet = 0;
          insert_1.set_is_last_mutable(1);
          rect_1.getZoom_(newEl);
          rect_1.prepareCrop_();
          const rect1 = rect_1.getVisibleClientRect_(newEl) || rect_1.cropRectS_(rect_1.padClientRect_(rect_1.getBoundingClientRect_(newEl), 3));
          let flash = options.flash, p = async_dispatcher_1.select_(newEl, rect1, flash, selAction, true);
          flash || p.then(() => {
            rect_1.prepareCrop_();
            const rect = rect_1.getVisibleClientRect_(newEl);
            const topmost = rect && dom_utils_1.elFromPoint_(rect_1.center_(rect, null), newEl);
            topmost && !dom_utils_1.contains_s(newEl, topmost) && dom_ui_1.flash_(null, rect);
          });
        } else {
          actRet = act[0] === "l" ? -1 : newEl ? (dom_ui_1.flash_(newEl), 12 /* kTip.focusedIsHidden */ /* kTip.noFocused */) : 11;
        }
      } else {
        actRet = 11 /* kTip.noFocused */;
      }
      if (actRet >= 0) {
        port_1.runFallbackKey(options, actRet);
        return;
      }
    }
    insert_1.insert_inputHint && (insert_1.insert_inputHint.h = null);
    const arr = rect_1.getViewBox_();
    rect_1.prepareCrop_(1);
    // here those editable and inside UI root are always detected, in case that a user modifies the shadow DOM
        const visibleInputs = local_links_1.traverse(link_hints_1.kSafeAllSelector, options, local_links_1.getEditable), keep = options.keep, pass = options.passExitKey, reachable = options.reachable;
    (reachable != null ? reachable && !(utils_1.isTY(reachable, 3 /* kTY.num */) && visibleInputs.length > reachable) : utils_1.fgCache.e) && !dom_ui_1.ourDialogEl_ && local_links_1.filterOutNonReachable(visibleInputs, 1) || dom_ui_1.filterOutInert(visibleInputs);
    let sel = visibleInputs.length, firstInput = visibleInputs[0];
    if (sel < 2) {
      insert_1.exitInputHint();
      sel ? selectOrClick(firstInput[0], firstInput[1], true).then(() => {
        port_1.runFallbackKey(options, options.verify === false || insert_1.insert_Lock_() || dom_utils_1.deepActiveEl_unsafe_() ? 0 : 13 /* kTip.noInputToFocus */);
      }) : port_1.runFallbackKey(options, 13 /* kTip.noInputToFocus */);
      return;
    }
    let ind = 0;
    for (;ind < sel; ind++) {
      const hint = visibleInputs[ind], j = hint[0].tabIndex;
      hint[2] = j > 0 ? j : j < 0 ? -ind - sel : -ind;
    }
    visibleInputs.sort((a, b) => a[2] < 1 || b[2] < 1 ? b[2] - a[2] : a[2] - b[2]);
    const scrollPos = [ scrollX, scrollY ];
    const refineRect = el => {
      const rect = rect_1.padClientRect_(rect_1.getBoundingClientRect_(el), 3);
      rect.l--, rect.t--, rect.r--, rect.b--;
      return rect;
    };
    const updateHint = hint => {
      const d2 = dom_utils_1.getEditableType_(hint.d) ? hint.d : insert_1.insert_Lock_();
      if (d2) {
        const rect = refineRect(d2);
        const offset = dom_utils_1.fullscreenEl_unsafe_() ? [ 0, 0 ] : [ scrollX - scrollPos[0], scrollY - scrollPos[1] ];
        rect_1.setBoundary_(hint.m.style, rect, 2, offset);
      }
      dom_utils_1.setClassName_s(hint.m, S);
    };
    let hints = visibleInputs.map(link => {
      const marker = dom_utils_1.createElement_("span");
      dom_utils_1.setClassName_s(marker, "IH");
      rect_1.setBoundary_(marker.style, refineRect(link[0]));
      return {
        m: marker,
        d: link[0]
      };
    });
    count -= count > 0;
    let preferredSelector = utils_1.findOptByHost(options.prefer, 0) || "";
    if (utils_1.abs_(count) > 2 * sel) {
      sel = count < 0 ? 0 : sel - 1;
    } else {
      for (ind = 0; ind < sel && hints[ind].d !== known_last; ) {
        ind++;
      }
      if (ind >= sel) {
        for (ind = 0; ind < sel && hints[ind].d !== second_last; ) {
          ind++;
        }
      }
      if (preferredSelector.endsWith("!") ? preferredSelector = preferredSelector.slice(0, -1) : ind >= sel) {
        for (ind = preferredSelector && utils_1.safeCall(dom_utils_1.testMatch, preferredSelector, visibleInputs[0][0]) === false ? 0 : sel; ind < sel && !dom_utils_1.testMatch(preferredSelector, visibleInputs[ind][0]); ind++) {}
      }
      sel = ((ind + count) % sel + sel) % sel;
    }
    insert_1.exitInputHint();
 // avoid masking inputs
        selectOrClick(hints[sel].d, visibleInputs[sel][1]).then(() => {
      updateHint(hints[sel]);
      dom_ui_1.ensureBorder();
      insert_1.set_inputHint({
        b: dom_ui_1.addElementList(hints, arr, !(dom_ui_1.usePopover_ > 7) || dom_utils_1.MayWoPopover && dom_utils_1.withoutPopover_() ? 0 : 6),
        h: hints
      });
      hints = 0;
      keyboard_utils_1.replaceOrSuppressMost_(13 /* kHandler.focusInput */ , event => {
        const keyCode = event.i, isIME = keyCode === 229 /* kKeyCode.ime */ , repeat = keyboard_utils_1.isRepeated_(event), key = isIME || repeat ? "" : keyboard_utils_1.getMappedKey(event, 2 /* kModeId.Insert */), isEsc = keyboard_utils_1.isEscape_(key) || key.startsWith("c-v-" /* GlobalConsts.ForcedMapNum */);
        if (key === "tab" /* kChar.tab */ || key === "s-tab") {
          const hints2 = insert_1.insert_inputHint.h, oldSel = sel, len = hints2.length;
          sel = (oldSel + (key < "t" ? len - 1 : 1)) % len;
          insert_1.set_isHintingInput(1);
          keyboard_utils_1.prevent_(event.e);
 // in case that selecting is too slow
                    selectOrClick(hints2[sel].d).then(() => {
            insert_1.set_isHintingInput(0);
            updateHint(hints2[sel]);
            dom_utils_1.setClassName_s(hints2[oldSel].m, "IH");
          });
          return 2 /* HandlerResult.Prevent */;
        }
        if (!repeat && (keep ? isEsc || keyboard_utils_1.keybody_(key) === keyboard_utils_1.ENTER && key < "s" && (key[0] !== "e" || dom_utils_1.hasTag_(dom_utils_1.INP, insert_1.insert_inputHint.h[sel].d)) : !isIME && keyCode !== 123 /* kKeyCode.f12 */ && keyCode !== 16 /* kKeyCode.shiftKey */)) {
          insert_1.exitInputHint();
          return isEsc ? keep || !insert_1.raw_insert_lock ? 2 /* HandlerResult.Prevent */ : pass ? -1 /* HandlerResult.PassKey */ : 0 /* HandlerResult.Nothing */ : 0 /* HandlerResult.Nothing */;
        }
        return 0 /* HandlerResult.Nothing */;
      });
    });
  }, 
  /* kFgCmd.editText: */ (options, count) => {
    const editable = insert_1.insert_Lock_() && dom_utils_1.getEditableType_(insert_1.raw_insert_lock) > 2 /* EditableType.MaxNotEditableElement */ ? insert_1.raw_insert_lock : 0, html = dom_utils_1.isHTML_();
    editable || options.dom ? utils_1.timeout_(() => {
      let commands = utils_1.splitEntries_(options.run, ",");
      let sel, absCount = utils_1.abs_(count), firstCmd = 0, neverMatchCond = 1;
      let cur, offset, dir;
      let start, end, start0, rawOffset;
      while (0 < absCount--) {
        for (var i = 0; i < commands.length; i += 3) {
          var cmd = commands[i].trim(), rawA1 = commands[i + 1] || "", a1 = rawA1.trim(), rawA2 = commands[i + 2] || "";
          if (cmd === "exec") {
            html && mode_find_1.execCommand(a1, utils_1.doc, rawA2);
          } else if (cmd === "replace") {
            rawOffset = editable && dom_utils_1.textOffset_(editable);
            start = rawOffset || 0, end = editable && dom_utils_1.textOffset_(editable, 1);
            end = end != null ? end : editable.value.length;
            cur = 0, offset = 0, start0 = start;
            html && mode_find_1.execCommand(mode_find_1.kInsertText, utils_1.doc, rawA1.replace(/[$%]s|(?:%[a-f\d]{2})+/gi, (s, ind) => {
              if (s[1] !== "s") {
                offset -= s.length;
                s = utils_1.safeCall(decodeURIComponent, s) || s;
                offset += s.length;
                return s;
              }
              cur === 0 && (cur = dom_ui_1.getSelectionText(1), start += ind + offset);
              offset += cur.length - 2;
              end = start0 + ind + offset + 2;
              return cur;
            }));
            cur === 0 && (offset += rawA1.length, start += offset, end += offset);
            editable === insert_1.insert_Lock_() && rawOffset != null && dom_utils_1.inputSelRange(editable, start, end);
          } else if (cmd === "select") {
            const activeEl = link_hints_1.findAnElement_(options, i > firstCmd ? 1 : count)[0];
            activeEl && (activeEl.select ? activeEl.select() : dom_ui_1.selectNode_(activeEl));
          } else if (sel = sel || dom_ui_1.getSelected(), cmd === "when" || cmd === "if") {
            firstCmd += 3;
            for (const cond of utils_1.Lower(a1 + ";" + rawA2).split(/[;&+\s]+/)) {
              if (cond === "caret" || cond === "range" ? cond > "r" !== rect_1.isSelARange(sel) : cond === "input" || cond === "dom" ? cond < "i" !== !editable : /^(multi|single|one)/.test(cond) ? cond < "o" !== rect_1.isSelMultiline(sel) : /^for|^back/.test(cond) && cond > "f" !== dom_ui_1.maySelectRight_(sel)) {
                while (/when|if/.test(commands[i])) {
                  i += 3;
                }
                break;
              }
              neverMatchCond = 0;
            }
          } else if (cmd !== "blank") {
            // a1: string := count | anchor | focus(ed) | forward(s) | backward(s) | begin | start | end
            dir = (i > firstCmd || count > 0) === (a1[4] === "s" ? dom_ui_1.maySelectRight_(sel) : a1[0] === "a" ? !dom_ui_1.maySelectRight_(sel) : a1 > "c" /* kChar.c */ && a1 < "s");
            cmd === "collapse" ? dom_ui_1.collpaseSelection(sel, dir, 1) : dom_utils_1.modifySel(sel, cmd === "auto" ? rect_1.isSelARange(sel) : cmd < "f" /* kChar.f */ , dir, rawA2.trim());
          }
        }
      }
      port_1.runFallbackKey(options, firstCmd && neverMatchCond ? 2 : 0);
    }, 0) : port_1.runFallbackKey(options, 2);
  }, 
  /* kFgCmd.scrollSelect: */ (options, count) => {
    const {dir, position: pos} = options;
    const el = insert_1.insert_Lock_();
    if (!el || !dom_utils_1.hasTag_("select", el)) {
      return;
    }
    let step, max = el.options.length, old = el.selectedIndex, absCount = count > 0 ? count : -count;
    step = pos ? (pos > "e" && pos < "m" && pos !== "home") === count > 0 ? max - absCount : absCount - 1 : old + (utils_1.isTY(dir) ? dir > "p" ? -1 : 1 : dir || 1) * count;
    step = step >= max ? max - 1 : step < 0 ? 0 : step;
    el.selectedIndex = step;
    port_1.runFallbackKey(options, step !== old ? 0 : 2);
  }, 
  /* kFgCmd.toggleStyle: */ options => {
    let par, id = options.id, nodes = dom_utils_1.querySelectorAll_unsafe_(id ? "#" + id : options.selector), disable = options.disabled, el = nodes && nodes[0];
    if (el) {
      (el.sheet || el).disabled = disable != null ? !!disable : !el.disabled;
    } else if (id) {
      el = dom_ui_1.createStyle(options.css);
      el.id = id;
      par = dom_utils_1.SafeEl_not_ff_(utils_1.doc.head || dom_utils_1.docEl_unsafe_());
      par && dom_utils_1.appendNode_s(par, el);
    }
    (el || id) && port_1.runFallbackKey(options, 0);
  }, 
  /* kFgCmd.dispatchEventCmd: */ (options, count) => {
    let event, delay = options.delay, init = options.init;
    let useResult, result;
    let activeEl;
    const docBody = dom_utils_1.SafeEl_not_ff_(utils_1.doc.body || dom_utils_1.docEl_unsafe_());
    if (options.esc) {
      utils_1.keydownEvents_[0 /* kKeyCode.None */ ] = 0;
      result = !!insert_1.insert_Lock_() || count > 0;
      insert_1.raw_insert_lock || insert_1.insert_global_ ? insert_1.exitInsertMode(insert_1.raw_insert_lock || dom_utils_1.activeEl_unsafe_()) : result && key_handler_1.onEscDown(0, 0 /* kKeyCode.None */ , count > 1);
      utils_1.keydownEvents_[0 /* kKeyCode.None */ ] = 0;
      useResult = 1;
    } else {
      const found = link_hints_1.findAnElement_(options, count, 1);
      activeEl = found[0];
      if (!activeEl) {
        return port_1.runFallbackKey(options, 2, "", delay);
      }
      found[1] && rect_1.view_(activeEl);
      const useClick = options.c && activeEl.click;
      const xy = !useClick && options.xy;
      const point = xy && rect_1.center_(rect_1.getVisibleBoundingRect_(activeEl) || rect_1.getVisibleClientRect_(activeEl), xy);
      if (point) {
        init.screenX = init.clientX = point[0];
        init.screenY = init.clientY = point[1];
      }
      async_dispatcher_1.setupIDC_cr(init);
      try {
        event = new window[options.class](options.type, init);
      } catch (_a) {}
      if (event) {
        if (options.t) {
          event.z = utils_1.fgCache;
          activeEl = dom_utils_1.deepActiveEl_unsafe_(1) === mode_find_1.find_box ? mode_find_1.find_input : activeEl;
        }
        useResult = !useClick && options.return;
        // earlier, in case listeners are too slow
                useResult || port_1.runFallbackKey(options, activeEl !== docBody ? 0 : 2, "", delay);
        const q = dom_utils_1.dispatchAsync_(activeEl, useClick ? 1 /* kDispatch.clickFn */ : event);
        useResult && q.then(result2 => port_1.runFallbackKey(options, result2 ? 0 : 2, "", delay));
        return;
      }
      hud_1.hudTip(1 /* kTip.raw */ , 0, options.e);
    }
    useResult && port_1.runFallbackKey(options, result ? 0 : 2, "", delay);
  }, 
  /* kFgCmd.showHelpDialog: */ options => {
    // Note: not suppress key on the top, because help dialog may need a while to render,
    // and then a keyup may occur before or after it
    const html = options.h, notHTML = !dom_utils_1.isHTML_(), oldHide = dom_ui_1.hideHelp;
    oldHide && oldHide();
    if (oldHide && !options.f || html && notHTML) {
      return;
    }
    if (!html) {
      utils_1.isTop && notHTML || port_1.post_({
        H: 14 /* kFgReq.initHelp */ ,
        a: options,
        w: rect_1.wndSize_(1) < 400 || rect_1.wndSize_() < 320 || notHTML
      });
      return;
    }
    let shouldShowAdvanced = options.c, optionUrl = options.o;
    const outerBox = dom_utils_1.createElement_("div");
    dom_utils_1.setClassName_s(outerBox, "R H" + utils_1.fgCache.d);
    let box;
    outerBox.innerHTML = html;
    box = outerBox.lastChild;
    box.onclick = box.onauxclick = utils_1.Stop_;
    utils_1.suppressCommonEvents(box, dom_utils_1.MDW);
    utils_1.setupEventListener(box, dom_utils_1.DAC, scroller_1.onActivate);
    const closeBtn = dom_utils_1.querySelector_unsafe_("#HCls", box), optLink = dom_utils_1.querySelector_unsafe_("#HOpt", box), advCmd = dom_utils_1.querySelector_unsafe_("#HAdv", box), toggleAdvanced = () => {
      const el2 = advCmd.firstChild;
      el2.innerText = el2.dataset["sh"[+shouldShowAdvanced]];
      dom_utils_1.toggleClass_s(box, "HelpDA");
    };
    dom_ui_1.set_hideHelp(closeBtn.onclick = event => {
      dom_ui_1.set_hideHelp(null);
      dom_ui_1.set_helpBox(null);
      event && keyboard_utils_1.prevent_(event);
      let i = utils_1.deref_(async_dispatcher_1.lastHovered_);
      i && dom_utils_1.contains_s(outerBox, i) && async_dispatcher_1.set_lastHovered_(async_dispatcher_1.set_lastBubbledHovered_(null));
      (i = utils_1.deref_(scroller_1.currentScrolling)) && dom_utils_1.contains_s(box, i) && scroller_1.setNewScrolling(null);
      keyboard_utils_1.removeHandler_(12 /* kHandler.helpDialog */);
      dom_utils_1.removeEl_s(outerBox);
      dom_ui_1.setupExitOnClick(9 /* kExitOnClick.REMOVE */);
    });
    // Wiki / Options / chrome://shortcuts must go through the background — page anchors cannot open them.
        const wireLaunch = el => {
      if (!el) {
        return;
      }
      const a = el;
      const open = event => {
        if (event.button > 1) {
          return;
        }
        keyboard_utils_1.prevent_(event);
        const raw = a.getAttribute("data-vim-url") || a.getAttribute("href") || a.href || "";
        if (!raw) {
          return;
        }
        port_1.post_({
          H: 22 /* kFgReq.focusOrLaunch */ ,
          u: raw
        });
        dom_ui_1.hideHelp(event);
      };
      a.onclick = a.onauxclick = open;
    };
    if (optLink && !utils_1.locHref().startsWith(optionUrl)) {
      wireLaunch(optLink);
      // Prefer options page URL from payload when present
            optionUrl && optLink.setAttribute("data-vim-url", optionUrl);
    } else {
      optLink && dom_utils_1.removeEl_s(optLink);
    }
    const launchers = dom_utils_1.querySelectorAll_unsafe_(".HLaunch", box) || [];
    for (let i = 0; i < launchers.length; i++) {
      const node = launchers[i];
      if (optLink && node === optLink) {
        continue;
      }
      wireLaunch(node);
    }
    advCmd.onclick = event => {
      keyboard_utils_1.prevent_(event);
      shouldShowAdvanced = !shouldShowAdvanced;
      toggleAdvanced();
      port_1.post_({
        H: 2 /* kFgReq.setSetting */ ,
        k: 0,
        v: shouldShowAdvanced
      });
    };
    shouldShowAdvanced && toggleAdvanced();
    dom_ui_1.ensureBorder();
 // safe to skip `getZoom_`
        dom_ui_1.addUIElement(outerBox, 1 /* AdjustType.Normal */ , true);
    options.e && dom_ui_1.setupExitOnClick(1 /* kExitOnClick.helpDialog */);
    dom_utils_1.docHasFocus_() || utils_1.vApi.f();
    scroller_1.setNewScrolling(box);
    dom_ui_1.set_helpBox(box);
    keyboard_utils_1.handler_stack.splice((keyboard_utils_1.handler_stack.indexOf(8 /* kHandler.omni */) + 1 || keyboard_utils_1.handler_stack.length + 2) - 2, 0, event => {
      if (!insert_1.insert_Lock_() && keyboard_utils_1.isEscape_(keyboard_utils_1.getMappedKey(event, 1 /* kModeId.Normal */))) {
        dom_ui_1.removeSelection(dom_ui_1.ui_root) || dom_ui_1.hideHelp();
        return 2 /* HandlerResult.Prevent */;
      }
      return 0 /* HandlerResult.Nothing */;
    }, 12 /* kHandler.helpDialog */);
    // if no [tabindex=0], `.focus()` works if :exp and since MinElement$Focus$MayMakeArrowKeySelectIt or on Firefox
        utils_1.timeout_(() => {
      dom_utils_1.focus_(box);
    }, 17);
  }, 
  /* kFgCmd.framesGoBack: */ (options, rawStep) => {
    const maxStep = utils_1.min_(utils_1.abs_(rawStep), history.length - 1), realStep = rawStep < 0 ? -maxStep : maxStep;
    options.r && utils_1.abs_(rawStep) === 1 ? utils_1.timeout_(() => {
      if (options.u) {
        utils_1.loc_.href = options.u;
      } else {
        if (dom_ui_1.checkHidden(18 /* kFgCmd.framesGoBack */ , options, 1)) {
          return;
        }
        utils_1.loc_.reload(!!options.hard);
      }
      port_1.runFallbackKey(options, false);
    }, 17) : 
    // maxStep > 1 && reuse == null || maxStep && reuse && !isCurrent
    port_1.post_({
      H: 31 /* kFgReq.framesGoBack */ ,
      s: options.r ? rawStep : realStep,
      o: options
    });
  }, 
  /* kFgCmd.goToMark: */ marks_1.goToMark_, 
  /* kFgCmd.pictureInPicture: */ () => {
    const docPip = utils_1.doc;
    if (docPip.pictureInPictureElement && docPip.exitPictureInPicture) {
      docPip.exitPictureInPicture().then(() => {
        hud_1.hudTip(1 /* kTip.raw */ , 0, "Exited PiP");
      }, () => {
        hud_1.hudTip(1 /* kTip.raw */ , 0, "PiP exit failed");
      });
      return;
    }
    const raw = dom_utils_1.querySelectorAll_unsafe_("video");
    const videos = raw || [];
    let best = null, bestArea = 0;
    for (let i = 0; i < videos.length; i++) {
      const v = videos[i];
      if (!v || v.disablePictureInPicture || !v.requestPictureInPicture) {
        continue;
      }
      const r = rect_1.getBoundingClientRect_(v);
      const area = Math.max(0, r.width) * Math.max(0, r.height);
      if (area > bestArea || area === bestArea && !v.paused) {
        best = v;
        bestArea = area;
      }
    }
    if (!best || !best.requestPictureInPicture) {
      hud_1.hudTip(1 /* kTip.raw */ , 0, "No video for Picture-in-Picture");
      return;
    }
    try {
      if (best.paused) {
        const p = best.play();
        p && typeof p.then === "function" && p.then(() => {}, () => {});
      }
    } catch (_a) {}
    best.requestPictureInPicture().then(() => {
      hud_1.hudTip(1 /* kTip.raw */ , 0, "Picture-in-Picture");
    }, () => {
      hud_1.hudTip(1 /* kTip.raw */ , 0, "PiP needs a user gesture on the video first");
    });
  } ]);
});