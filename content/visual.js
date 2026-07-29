"use strict";
__filename = "content/visual.js";
define([ "require", "exports", "../lib/utils", "../lib/keyboard_utils", "../lib/dom_utils", "../lib/rect", "./dom_ui", "./scroller", "./mode_find", "./insert", "./hud", "./port", "./key_handler" ], (require, exports, utils_1, keyboard_utils_1, dom_utils_1, rect_1, dom_ui_1, scroller_1, mode_find_1, insert_1, hud_1, port_1, key_handler_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.highlightRange = exports.activate = exports.deactivate = exports.visual_mode_name = void 0;
  let modeName;
  exports.visual_mode_name = modeName;
  /** need real diType */  let kGranularity;
  let keyMap;
  let rightWhiteSpaceRe;
  /** @safe_di */  let deactivate;
  exports.deactivate = deactivate;
  /** count = 0 means fromFind */  const activate = (options, count) => {
    /** @safe_di requires selection is None on called, and may change `selection_`; not use `diType_` */
    const establishInitialSelectionAnchor = () => {
      curSelection && curSelection.type === "None" || console.log('Assert error: VVisual.selection_ && VVisual.selection_.type === "None"');
      let node, str, offset;
      if (!dom_utils_1.isHTML_()) {
        return 0;
      }
      rect_1.prepareCrop_();
      const nodes = utils_1.doc.createTreeWalker(scope || utils_1.doc.body || dom_utils_1.docEl_unsafe_(), NodeFilter.SHOW_TEXT);
      while (node = nodes.nextNode()) {
        if (50 <= (str = node.data).length && 50 < str.trim().length) {
          const element = node.parentElement;
          if (element && dom_utils_1.isSafeEl_(element) && rect_1.getVisibleClientRect_(element) && !dom_utils_1.getEditableType_(element)) {
            break;
          }
        }
      }
      if (!node) {
        if (scope) {
          curSelection = dom_utils_1.getSelection_();
          scope = null;
          return establishInitialSelectionAnchor();
        }
        return 0;
      }
      offset = str.match(/^\s*/)[0].length;
      curSelection.collapse(node, offset);
      di_ = 1 /* kDirTy.right */;
      return dom_utils_1.rangeCount_(curSelection);
    };
    /**
         * @safe_di if action !== true
         * @not_related_to_di otherwise
         */    const yank = action => {
      const str = dom_ui_1.getSelectionText(1, curSelection);
      action < 8 /* kYank.NotExit */ && deactivate();
      if (str || options.t) {
        if (str && action < 7 /* kYank.MIN */) {
          port_1.post_({
            H: 8 /* kFgReq.openUrl */ ,
            u: str,
            r: action,
            o: utils_1.parseOpenPageUrlOptions(options)
          });
        } else if (options.t || action > 8) {
          mode_find_1.execCommand("copy", utils_1.doc);
          hud_1.hudTip(20 /* kTip.copiedIs */ , 0, "# " + str);
        } else {
          port_1.post_({
            H: 18 /* kFgReq.copy */ ,
            s: str,
            o: utils_1.parseOpenPageUrlOptions(options)
          });
        }
      } else {
        hud_1.hudTip(15 /* kTip.noTextCopied */);
      }
    };
    /** @safe_di if not `magic` */    const getDirection = magic => {
      if (di_ !== 2 /* kDirTy.unknown */) {
        return di_;
      }
      const oldDiType = diType_, sel = curSelection, anchorNode = dom_utils_1.getAccessibleSelectedNode(sel);
      let num2, num1 = -2;
      if (!oldDiType || oldDiType & 9 /* DiType.Complicated */) {
        const focusNode = dom_utils_1.getAccessibleSelectedNode(sel, 1);
        // common HTML nodes
                if (anchorNode !== focusNode) {
          diType_ = 0 /* DiType.Normal */;
          return di_ = dom_utils_1.getDirectionOfNormalSelection(sel, anchorNode, focusNode);
        }
        num1 = dom_utils_1.selOffset_(sel);
        // here rechecks `!anchorNode` is just for safety.
                if ((num2 = dom_utils_1.selOffset_(sel, 1) - num1) || !anchorNode || dom_utils_1.isNode_(anchorNode, 3 /* kNode.TEXT_NODE */)) {
          diType_ = 0 /* DiType.Normal */;
          return di_ = num2 >= 0 ? 1 /* kDirTy.right */ : 0 /* kDirTy.left */;
        }
      }
      // editable text elements
            if (insert_1.raw_insert_lock && dom_utils_1.parentNode_unsafe_s(insert_1.raw_insert_lock) === anchorNode) {
        if (oldDiType & 1 /* DiType.Unknown */ && dom_utils_1.getEditableType_(insert_1.raw_insert_lock) > 2 /* EditableType.MaxNotEditableElement */) {
          const child = dom_utils_1.getNodeChild_(anchorNode, sel, num1 + 2);
          insert_1.raw_insert_lock !== child && child || dom_utils_1.textOffset_(insert_1.raw_insert_lock) != null && (diType_ = 2 /* DiType.TextBox */ | oldDiType & 4 /* DiType.isUnsafe */);
        }
        if (diType_ & 2 /* DiType.TextBox */) {
          return di_ = dom_ui_1.doesSelectRightInEditableLock() ? 1 /* kDirTy.right */ : 0 /* kDirTy.left */;
        }
      }
      // nodes under shadow DOM or in other unknown edge cases
      // (edge case: an example is, focusNode is a <div> and focusOffset points to #text, and then collapse to it)
            diType_ = oldDiType & 1 /* DiType.Unknown */ ? 8 /* DiType.Complicated */ | oldDiType & 4 /* DiType.isUnsafe */ : oldDiType & 12 /* DiType.UnsafeComplicated */;
      if (magic === "") {
        return 2 /* kDirTy.unknown */;
      }
      const initial = magic || "" + sel;
      num1 = initial.length;
      if (!num1) {
        return di_ = 1 /* kDirTy.right */;
      }
      extend(1 /* kDirTy.right */);
      diType_ = diType_ && dom_utils_1.selOffset_(sel) !== dom_utils_1.selOffset_(sel, 1) ? 0 /* DiType.Normal */ : diType_ & -5 /* DiType.isUnsafe */;
      num2 = ("" + sel).length - num1;
      /**
             * Note (tested on C70):
             * the `extend` above may go back by 2 steps when cur pos is the right of an element with `select:all`,
             * so a detection and the third `extend` may be necessary
             */      if (num2 && !magic) {
        extend(0 /* kDirTy.left */);
        "" + sel !== initial && extend(1 /* kDirTy.right */);
      } else {
        oldLen_ = 2 + num1;
      }
      return di_ = num2 >= 0 || magic && num2 === -num1 ? 1 /* kDirTy.right */ : 0 /* kDirTy.left */;
    };
    /**
         * @must_be_range_and_know_di_if_unsafe `selType == Range && getDirection_()` is safe enough
         * @fix_unsafe_in_diType
         * @di_will_be_1
         */    const collapseToRight = /** to-right if text is left-to-right */ toRight => {
      const sel = curSelection;
      if (diType_ & 4 /* DiType.isUnsafe */) {
        // Chrome 60/70 need this "extend" action; otherwise a text box would "blur" and a mess gets selected
        const sameEnd = toRight === di_;
        const fixSelAll = sameEnd && diType_ & 8 /* DiType.Complicated */ && ("" + sel).length;
        // r / r : l ; r / l : r ; l / r : l ; l / l : r
                extend(1 - di_);
        sameEnd && extend(toRight);
        fixSelAll && ("" + sel).length !== fixSelAll && extend(1 - toRight);
      }
      dom_ui_1.collpaseSelection(sel, toRight);
      di_ = 1 /* kDirTy.right */;
    };
    /** @unknown_di_result */    const extend = (d, g) => {
      dom_utils_1.modifySel(curSelection, 1, d, kGranularity[g | 0]);
      diType_ &= -5 /* DiType.isUnsafe */;
    };
    /** @unknown_di_result */    const modify = (d, g) => {
      dom_utils_1.modifySel(curSelection, 3 /* Mode.Caret */ - mode_, d, kGranularity[g]);
    };
    const selType = () => {
      const type = typeIdx[curSelection.type];
      return type;
    };
    /** @tolerate_di_if_caret di will be 1 */    const collapseToFocus = toFocus => {
      selType() === 2 /* SelType.Range */ && collapseToRight(getDirection() ^ toFocus ^ 1);
      di_ = 1 /* kDirTy.right */;
    };
    /** @unknown_di_result */    const commandHandler = (command, count) => {
      const findV = count1 => {
        if (!mode_find_1.find_query) {
          port_1.send_(3 /* kFgReq.findQuery */ , 1, query => {
            if (query) {
              mode_find_1.updateQuery(query);
              findV(count1);
            } else {
              hud_1.hudTip(41 /* kTip.noOldQuery */ , 1);
            }
          });
          return;
        }
        const sel = curSelection, range = dom_utils_1.rangeCount_(sel) && (getDirection(""), 
        !diType_) && rect_1.selRange_(sel);
        mode_find_1.executeFind("", {
          noColor: 1,
          c: count1
        });
        if (mode_find_1.find_hasResults) {
          diType_ = 5 /* DiType.UnsafeUnknown */;
          if (mode_ === 3 /* Mode.Caret */ && selType() === 2 /* SelType.Range */) {
            options.m = 1 /* Mode.Visual */;
            port_1.contentCommands_[5 /* kFgCmd.visualMode */ ](options, 1);
          } else {
            di_ = 2 /* kDirTy.unknown */;
            commandHandler(-1 /* VisualAction.Noop */ , 1);
          }
        } else {
          range && !dom_utils_1.rangeCount_(sel) && dom_ui_1.resetSelectionToDocStart(sel, range);
          hud_1.hudTip(81 /* kTip.noMatchFor */ , 1, mode_find_1.find_query);
        }
      };
      /** if return `''`, then `@hasModified_` is not defined; `isMove` must be "in caret" */      const getNextRightCharacter = isMove => {
        const sel = curSelection;
        oldLen_ = 0;
        if (diType_ & 2 /* DiType.TextBox */) {
          return insert_1.raw_insert_lock.value.charAt(dom_utils_1.textOffset_(insert_1.raw_insert_lock, di_ === 1 /* kDirTy.right */ || dom_ui_1.doesSelectRightInEditableLock()));
        }
        if (!diType_) {
          const focusNode = dom_utils_1.getAccessibleSelectedNode(sel, 1);
          if (dom_utils_1.isNode_(focusNode, 3 /* kNode.TEXT_NODE */)) {
            const i = dom_utils_1.selOffset_(sel, 1), str = focusNode.data;
            if (str.charAt(i).trim() || i && str.charAt(i - 1).trim() && str.slice(i).trimLeft() && str[i] !== "\n") {
              return str[i];
            }
          }
        }
        let oldLen = 0;
        if (!isMove) {
          const beforeText = "" + sel;
          if (beforeText && (!getDirection(beforeText) || selType() === 1 /* SelType.Caret */)) {
            return beforeText[0];
          }
          oldLen = beforeText.length;
        }
        // here, the real di must be kDir.right (range if in visual mode else caret)
                oldLen_ || extend(1 /* kDirTy.right */);
        const afterText = "" + sel, newLen = afterText.length;
        if (newLen - oldLen) {
          // if isMove, then cur sel is >= 1 char & di is right
          isMove && /* extend() make diType safe */ collapseToRight(newLen - 1 ? 0 /* kDirTy.left */ : 1 /* kDirTy.right */);
          oldLen_ = isMove && newLen - 1 ? 0 : 2 + oldLen;
          return afterText[newLen - 1] || "";
        }
        return "";
      };
      const runMovements = (direction, granularity, count1) => {
        const isMove = mode_ - 3 /* Mode.Caret */ ? 0 : 1;
        const shouldSkipSpaceWhenMovingRight = granularity === 2 /* kVimG.vimWord */;
        let fixWord;
        // https://source.chromium.org/chromium/chromium/src/+/67fe5a41bff92a7bd4f425a24e4858317f8700e5
                let fixDeltaHasOnlySpaces_cr_win;
        if (shouldSkipSpaceWhenMovingRight || granularity === 1 /* kG.word */) {
          // https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/editing/editing_behavior.h?type=cs&q=ShouldSkipSpaceWhenMovingRight&g=0&l=99
          if (direction) {
            fixWord = utils_1.os_ > 1 /* kOS.MAX_NOT_WIN */ !== shouldSkipSpaceWhenMovingRight;
            utils_1.os_ > 1 /* kOS.MAX_NOT_WIN */ && (fixDeltaHasOnlySpaces_cr_win = moveRightByWordButNotSkipSpaces(0)) && (fixDeltaHasOnlySpaces_cr_win = --count1 ? null : fixDeltaHasOnlySpaces_cr_win);
            count1 -= fixWord > // lgtm [js/implicit-operand-conversion]
            shouldSkipSpaceWhenMovingRight;
 // lgtm [js/implicit-operand-conversion]
                    }
          granularity = 1 /* kG.word */;
        }
        const oldDi = di_;
        while (0 < count1--) {
          modify(direction, granularity);
          // it's safe to remove `isUnsafe` here, because:
          // either `count > 0` or `fixWord && _moveRight***()`
                    diType_ &= isMove ? -5 /* DiType.isUnsafe */ : diType_;
          di_ = direction - oldDi ? 2 /* kDirTy.unknown */ : oldDi;
        }
        granularity - 3 /* kG.lineBoundary */ || hud_1.hudTip(43 /* kTip.selectLineBoundary */ , 2);
        if (!fixWord) {
          fixDeltaHasOnlySpaces_cr_win !== void 0 && isMove && /* moveRightByWordButNotSkipSpaces->extend() make diType safe */ collapseToRight(1 /* kDirTy.right */);
          return;
        }
        if (!shouldSkipSpaceWhenMovingRight) {
          // false || OS === Win
          moveRightByWordButNotSkipSpaces(fixDeltaHasOnlySpaces_cr_win);
          return;
        }
        /**
                 * Chrome use ICU4c's RuleBasedBreakIterator and then DictionaryBreakEngine -> CjkBreakEngine
                 * https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/editing/
                 *  selection_modifier.cc?type=cs&q=ModifyExtendingForwardInternal&g=0&l=342
                 *  selection_modifier.cc?type=cs&q=ModifyMovingForward&g=0&l=423
                 *  visible_units_word.cc?type=cs&q=NextWordPositionInternal&g=0&l=97
                 * https://cs.chromium.org/chromium/src/third_party/icu/source/common/
                 *  rbbi.cpp?type=cs&q=RuleBasedBreakIterator::following&g=0&l=601
                 *  rbbi_cache.cpp?type=cs&q=BreakCache::following&g=0&l=248
                 *  rbbi_cache.cpp?type=cs&q=BreakCache::nextOL&g=0&l=278
                 */        let ch;
        getDirection("");
        oldLen_ = 1;
        do {
          if (!oldLen_) {
            modify(1 /* kDirTy.right */ , 0 /* kG.character */);
            // right / unknown are kept, left is replaced with right, so that keep @di safe
                        di_ = di_ || 2 /* kDirTy.unknown */;
          }
          ch = getNextRightCharacter(isMove);
          // (t/b/r/c/e/) visible_units.cc?q=SkipWhitespaceAlgorithm&g=0&l=1191
                } while (ch && rightWhiteSpaceRe.test(ch));
        if (ch && oldLen_) {
          const num1 = oldLen_ - 2, num2 = isMove || ("" + curSelection).length;
          modify(0 /* kDirTy.left */ , 0 /* kG.character */);
          if (!isMove) {
            // in most cases, initial selection won't be a caret at the middle of `[style=user-select:all]`
            // - so correct selection won't be from the middle to the end
            // if in the case, selection can not be kept during @getDi,
            // so it's okay to ignore the case
            ("" + curSelection).length - num1 && extend(1 /* kDirTy.right */);
            di_ = num2 < num1 ? 0 /* kDirTy.left */ : 1 /* kDirTy.right */;
          }
        }
      };
      /**
             * if Build.NativeWordMoveOnFirefox, then should never be called if browser is Firefox
             *
             * when by word, not skip following spaces
             */      const moveRightByWordButNotSkipSpaces = testOnlySpace_cr_win => {
        let newLen, changeLen, toGoLeft;
        if (testOnlySpace_cr_win) {
          newLen = testOnlySpace_cr_win[0], changeLen = testOnlySpace_cr_win[1], toGoLeft = testOnlySpace_cr_win[2];
        } else {
          let oldStr = "" + curSelection, oldLen = oldStr.length;
          getDirection();
          extend(1 /* kDirTy.right */ , 1 /* kG.word */);
          let newStr = "" + curSelection;
          newLen = newStr.length;
          di_ || (di_ = newStr ? 2 /* kDirTy.unknown */ : 1 /* kDirTy.right */);
          newStr = di_ < 2 /* kDirTy.unknown */ ? newStr.slice(oldLen) : getDirection() ? oldStr + newStr : oldStr.slice(0, oldLen - newLen);
          changeLen = newStr.length;
          // now di_ is correct, and can be left / right
                    newStr = rightWhiteSpaceRe.exec(newStr);
          toGoLeft = newStr ? newStr[0].length : 0;
          toGoLeft = newStr ? toGoLeft : 0;
          if (testOnlySpace_cr_win === 0) {
            return toGoLeft < changeLen ? [ newLen, changeLen, toGoLeft ] : null;
          }
        }
        const needBack = toGoLeft > 0 && toGoLeft < changeLen;
        if (needBack) {
          // after word are some spaces (>= C59) or non-word chars (< C59 || Firefox)
          if (diType_ & 2 /* DiType.TextBox */) {
            let start = dom_utils_1.textOffset_(insert_1.raw_insert_lock), end = start + newLen;
            di_ ? end -= toGoLeft : start -= toGoLeft;
            dom_utils_1.inputSelRange(insert_1.raw_insert_lock, start < end ? start : end, start < end ? end : start, di_ = start > end ? 0 /* kDirTy.left */ : 1 /* kDirTy.right */);
          } else {
            while (toGoLeft > 0) {
              extend(0 /* kDirTy.left */);
              newLen || (di_ = 0 /* kDirTy.left */);
              changeLen = newLen - ("" + curSelection).length;
              toGoLeft -= changeLen > 0 ? changeLen : -changeLen || toGoLeft;
              newLen -= changeLen;
            }
            toGoLeft < 0 && // may be a "user-select: all"
            extend(1 /* kDirTy.right */);
          }
        }
        mode_ - 3 /* Mode.Caret */ || /* extend() make diType safe */ collapseToRight(1 /* kDirTy.right */);
        return needBack;
      };
      /** @tolerate_di_if_caret */      const reverseSelection = () => {
        if (selType() !== 2 /* SelType.Range */) {
          di_ = 1 /* kDirTy.right */;
          return;
        }
        const sel = curSelection, direction = getDirection(), newDi = 1 - direction;
        if (diType_ & 2 /* DiType.TextBox */) {
          // Note: on C72/60/35, it can trigger document.onselectionchange
          dom_utils_1.inputSelRange(insert_1.raw_insert_lock, dom_utils_1.textOffset_(insert_1.raw_insert_lock), dom_utils_1.textOffset_(insert_1.raw_insert_lock, 1), newDi);
        } else if (diType_ & 8 /* DiType.Complicated */) {
          let length = ("" + sel).length, i = 0;
          collapseToRight(direction);
          for (;i < length; i++) {
            extend(newDi);
          }
          for (let tick = 0; tick < 16 && (i = ("" + sel).length - length); tick++) {
            extend(i < 0 ? newDi : direction);
          }
        } else {
          const node = dom_utils_1.getAccessibleSelectedNode(sel), offset = dom_utils_1.selOffset_(sel);
          collapseToRight(direction);
          sel.extend(node, offset);
        }
        di_ = newDi;
      };
      /** after called, VVisual must exit at once */      const selectLine = count1 => {
        const oldDi = getDirection();
        mode_ = 1 /* Mode.Visual */;
        oldDi && reverseSelection();
        modify(0 /* kDirTy.left */ , 3 /* kG.lineBoundary */);
        di_ = 0 /* kDirTy.left */;
        reverseSelection();
        while (0 < --count1) {
          modify(1 /* kDirTy.right */ , 4 /* kG.line */);
        }
        modify(1 /* kDirTy.right */ , 3 /* kG.lineBoundary */);
        const ch = getNextRightCharacter(0);
        const num1 = oldLen_;
        if (ch && num1 && ch !== "\n") {
          extend(0 /* kDirTy.left */);
          ("" + curSelection).length + 2 - num1 && extend(1 /* kDirTy.right */);
        }
      };
      const ensureLine = (command1, s0) => {
        let di = getDirection(), len = 2, noBacked = 0;
        if (command1 < 20 /* VisualAction.MinNotWrapSelectionModify */ && command1 >= 0 /* VisualAction.MinWrapSelectionModify */ && !diType_ && (di && selType() === 1 /* SelType.Caret */ || "" + curSelection === "\n")) {
          selType() === 2 /* SelType.Range */ && dom_ui_1.collpaseSelection(curSelection, 1 - di);
          di = di_ = 1 & ~command1;
          modify(di, 3 /* kG.lineBoundary */);
          selType() !== 2 /* SelType.Range */ && modify(di, 4 /* kG.line */);
          noBacked = len = 1;
        }
        for (;0 < len--; ) {
          if (noBacked !== false) {
            reverseSelection();
            di = di_ = 1 - di;
          }
          let s1 = noBacked ? "" : "" + curSelection, backed = 0;
          if (!(di ? s1.endsWith("\n") : s1.startsWith("\n"))) {
            const r1 = !diType_ && s1 && dom_utils_1.getAccessibleSelectedNode(curSelection, 1);
            const r2 = r1 && dom_utils_1.selOffset_(curSelection, 1);
            if (s1 && (len || !/\r|\n/.test(s1.slice(di ? -2 : 0).slice(0, 2)))) {
              modify(1 - di, 0 /* kG.character */);
              backed = "" + curSelection;
              backed + "\n" === s1 ? backed = 0 : backed === s1 && (backed = 0, // sel.addRange will reset selection direction on C107, so have to use extend
              r1 ? curSelection.extend(r1, r2) : modify(di, 0 /* kG.character */));
            }
            modify(di, 3 /* kG.lineBoundary */ + noBacked);
            const reduced = !len && r1 && di !== (command1 & 1);
            const s2 = backed || reduced ? "" + curSelection : "";
            if (backed && s2 === backed) {
              modify(di, 0 /* kG.character */);
              modify(di, 3 /* kG.lineBoundary */);
            } else {
              reduced && s2.length >= s0.length && curSelection.extend(r1, r2);
            }
          }
          noBacked && !diType_ && (len++, noBacked = false);
        }
      };
      let mode = mode_, s0_line = "";
      if (command > 60 /* VisualAction.MaxNotScroll */) {
        scroller_1.executeScroll(1, command - 62 /* VisualAction.ScrollDown */ ? -count : count, 0 /* kScFlag.scBy */);
        return;
      }
      if (command > 50 /* VisualAction.MaxNotNewMode */) {
        if (command > 53) {
          hud_1.hudHide();
 // it should auto keep HUD showing the mode text
                    port_1.post_({
            H: 30 /* kFgReq.findFromVisual */ ,
            c: command
          });
        } else {
          options.m = command - 50 /* VisualAction.MaxNotNewMode */;
          port_1.contentCommands_[5 /* kFgCmd.visualMode */ ](options, 1);
        }
        return;
      }
      if (scope && !dom_utils_1.rangeCount_(curSelection)) {
        scope = null;
        curSelection = dom_utils_1.getSelection_();
      }
      if (command < 46 && (!dom_utils_1.rangeCount_(curSelection) || !dom_utils_1.getAccessibleSelectedNode(curSelection))) {
        deactivate();
        keyboard_utils_1.suppressTail_(1500);
        return hud_1.hudTip(84 /* kTip.loseSel */ , 2);
      }
      if (command === 48 /* VisualAction.HighlightRange */) {
        exports.highlightRange(curSelection);
        return;
      }
      mode === 3 /* Mode.Caret */ && (command > 45 /* VisualAction.MaxNotFind */ || command < 31) && collapseToFocus(0);
      if (command > 45 /* VisualAction.MaxNotFind */) {
        findV(command - 46 /* VisualAction.PerformFind */ ? count : -count);
        return;
      }
      if (command > 30 /* VisualAction.MaxNotYank */) {
        command === 32 /* VisualAction.YankLine */ && selectLine(count);
        yank([ 7 /* kYank.Exit */ , 7 /* kYank.Exit */ , 8 /* kYank.NotExit */ , 0 /* ReuseType.current */ , -1 /* ReuseType.newFg */ , 9 /* kYank.RichTextButNotExit */ ][command - 31 /* VisualAction.Yank */ ]);
        return;
      }
      if (command > 20 /* VisualAction.MaxNotLexical */) {
        const entity = command - 20 /* VisualAction.MaxNotLexical */;
        mode_ = 1 /* VisualModeNS.Mode.Visual */;
        collapseToFocus(0);
        extend(1 /* kDirTy.right */);
        extend(0 /* kDirTy.left */ , entity);
        di_ = 0 /* kDirTy.left */;
        collapseToFocus(1);
        runMovements(1 /* kDirTy.right */ , entity - 6 /* kG.paragraphboundary */ ? entity - 3 /* kG.lineBoundary */ ? entity : 4 /* kG.line */ : 7 /* kG.paragraph */ , count);
        mode_ = mode;
        mode = 1 /* VisualModeNS.Mode.Visual */;
      } else if (command === 20 /* VisualAction.Reverse */) {
        reverseSelection();
      } else if (command >= 0 /* VisualAction.MinWrapSelectionModify */) {
        s0_line += mode === 2 /* Mode.Line */ ? curSelection : s0_line;
        runMovements(command & 1, command >> 1, count);
      }
      if (mode === 3 /* Mode.Caret */) {
        extend(1 /* kDirTy.right */);
        selType() === 1 /* SelType.Caret */ && extend(0 /* kDirTy.left */);
      } else {
        mode === 2 /* Mode.Line */ && ensureLine(command, s0_line);
      }
      getDirection("");
      diType_ & 8 /* DiType.Complicated */ || scroller_1.scrollIntoView_s(dom_utils_1.getSelectionFocusEdge_(curSelection, di_), dom_ui_1.getSelectionBoundingBox_(curSelection), command < 20 /* VisualAction.MinNotWrapSelectionModify */ ? command & 1 /* VisualAction.inc */ : 2);
    };
    const typeIdx = {
      None: 0 /* SelType.None */ ,
      Caret: 1 /* SelType.Caret */ ,
      Range: 2
 /* SelType.Range */    };
    const initialScope = {};
    let mode_ = options.m || 1 /* Mode.Visual */;
    let curSelection;
    let currentPrefix = "";
    let retainSelection;
    let di_ = 2 /* kDirTy.unknown */;
    let diType_ = 5 /* DiType.UnsafeUnknown */;
    /** 0 means it's invalid; >=2 means real_length + 2; 1 means uninited */    let oldLen_ = 0;
    mode_find_1.set_findCSS(options.f || mode_find_1.findCSS);
    if (!keyMap) {
      /** C72
             * The real is ` (!IsSpaceOrNewline(c) && c != kNoBreakSpaceCharacter) || c == '\n' `
             * in https://cs.chromium.org/chromium/src/third_party/blink/renderer/platform/wtf/text/string_impl.h?type=cs&q=IsSpaceOrNewline&sq=package:chromium&g=0&l=800
             * `IsSpaceOrNewline` says "Bidi=WS" doesn't include '\n'", it's because:
             * * the upstream is (2002/11/07) https://chromium.googlesource.com/chromium/src/+/68f88bec7f005b2abc9018b086396a88f1ffc18e%5E%21/#F3 ,
             * * and then the specification it used in `< 128 ? isspace : DirWS` was https://unicode.org/Public/2.1-Update4/PropList-2.1.9.txt
             * * it thinks the "White space" and "Bidi: Whitespace" properties are different, and Bidi:WS only includes 0020,2000..200B,2028,3000
             * While the current https://unicode.org/reports/tr44/#BC_Values_Table does not:
             * * in https://unicode.org/Public/UCD/latest/ucd/PropList.txt , WS covers `WebTemplateFramework::IsASCIISpace` totally (0009..000D,0020)
             * /\s/
             * * Run ` for(var a="",i=0,ch=''; i<=0xffff; i++) /\s/.test(String.fromCharCode(i)) && (a+='\\u' + (0x10000 + i).toString(16).slice(1)); a; ` gets
             * * \u0009\u000a\u000b\u000c\u000d\u0020\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff (C72)
             * * when <= C58 (Min$Space$NotMatch$U180e$InRegExp), there's \u180e (it's added by Unicode standard v4.0.0 and then removed since v6.3.0)
             * * compared to "\p{WS}", it ("\s") lacks \u0085 (it's added in v3.0.0), but adds an extra \ufeff
             * * "\s" in regexp is not affected by the "unicode" flag https://mathiasbynens.be/notes/es6-unicode-regex
             * During tests: not skip \u0085\u180e\u2029\u202f\ufeff since C59; otherwise all including \u0085\ufeff are skipped
             */
      /** Changes
             * MinSelExtendForwardOnlySkipWhitespaces=59
             *  : https://chromium.googlesource.com/chromium/src/+/117a5ba5073a1c78d08d3be3210afc09af96158c%5E%21/#F2
             * Min$Space$NotMatch$U180e$InRegExp=59
             */
      // on Firefox 65 stable, Win 10 x64, there're '\r\n' parts in Selection.toString()
      // ignore "\ufeff" for shorter code since it's too rare
      rightWhiteSpaceRe = /[^\S\n\u2029\u202f]+$/;
      utils_1.safer(keyMap = options.k);
      kGranularity = options.g;
    }
    /** @safe_di */    exports.deactivate = deactivate = isEscOrReinit => {
      if (isEscOrReinit === 2) {
        port_1.contentCommands_[5 /* kFgCmd.visualMode */ ](options, 0);
        return;
      }
      di_ = 2 /* kDirTy.unknown */;
      diType_ = 5 /* DiType.UnsafeUnknown */;
      getDirection("");
      const oldDiType = diType_;
      keyboard_utils_1.removeHandler_(7 /* kHandler.visual */);
      retainSelection || collapseToFocus(isEscOrReinit && mode_ !== 3 /* Mode.Caret */ ? 1 : 0);
      exports.visual_mode_name = modeName = 0 /* Mode.NotActive */;
      exports.deactivate = deactivate = null;
      const el = insert_1.insert_Lock_();
      oldDiType & 10 /* DiType.Complicated */ || el && el.blur();
      mode_find_1.toggleSelectableStyle();
      rect_1.set_scrollingTop(null);
      hud_1.hudHide();
    };
    dom_ui_1.checkDocSelectable();
    rect_1.set_scrollingTop(dom_utils_1.scrollingEl_(1));
    rect_1.getViewBox_();
    scroller_1.getPixelScaleToScroll();
    curSelection = dom_ui_1.getSelected(initialScope);
    let diff, scope = initialScope.r;
    mode_find_1.toggleSelectableStyle(1);
    {
      let type = selType();
      retainSelection = type === 2 /* SelType.Range */;
      if ((!modeName || mode_ !== 3 /* Mode.Caret */) && !insert_1.insert_Lock_() && /* (type === SelType.Caret || type === SelType.Range) */ type) {
        rect_1.prepareCrop_();
        const br = dom_ui_1.getSelectionBoundingBox_(curSelection, 1);
        if (br && rect_1.cropRectS_(br)) {
          if (type === 1 /* SelType.Caret */) {
            extend(1 /* kDirTy.right */);
            selType() === 2 /* SelType.Range */ || extend(0 /* kDirTy.left */);
          }
        } else {
          dom_ui_1.resetSelectionToDocStart(curSelection);
        }
        type = selType();
      }
      diff = type - 2 /* SelType.Range */ && mode_ - 3 /* Mode.Caret */;
      exports.visual_mode_name = modeName = mode_ = diff ? 3 /* Mode.Caret */ : mode_;
      di_ = type - 1 /* SelType.Caret */ ? 2 /* kDirTy.unknown */ : 1 /* kDirTy.right */;
      if (/* type === SelType.None */ !type && (options.$else || !establishInitialSelectionAnchor())) {
        deactivate();
        port_1.runFallbackKey(options, 55 /* kTip.needSel */);
        return;
      }
      if (mode_ === 3 /* Mode.Caret */ && type > 1) {
        // `sel` is not changed by @establish... , since `isRange`
        getDirection();
        collapseToRight(options.s != null ? +!options.s : di_ && +(("" + curSelection).length > 1));
      }
    }
    keyboard_utils_1.replaceOrSuppressMost_(7 /* kHandler.visual */ , event => {
      const doPass = utils_1.os_ && event.i === 93 /* kKeyCode.menuKey */ || event.i === 229 /* kKeyCode.ime */ , key = doPass ? "" : keyboard_utils_1.getMappedKey(event, 7 /* kModeId.Visual */), keybody = keyboard_utils_1.keybody_(key);
      let count;
      if (!key || keyboard_utils_1.isEscape_(key)) {
        !key || key_handler_1.currentKeys || currentPrefix ? event.v && (currentPrefix = "") : deactivate(1);
        // if doPass, then use nothing to bubble such an event, so handlers like LinkHints will also exit
                return event.v ? 2 /* HandlerResult.Prevent */ : utils_1.esc(key ? 2 /* HandlerResult.Prevent */ : doPass ? 0 /* HandlerResult.Nothing */ : 1 /* HandlerResult.Suppress */);
      }
      if (keyboard_utils_1.keybody_(key) === keyboard_utils_1.ENTER) {
        currentPrefix = "";
        key > "s" && mode_ !== 3 /* Mode.Caret */ && (retainSelection = 1);
        "cm".includes(key[0]) ? deactivate() : yank(key < "b" ? 8 /* kYank.NotExit */ : 7 /* kYank.Exit */);
        return utils_1.esc(2 /* HandlerResult.Prevent */);
      }
      const childAction = keyMap[currentPrefix + key], newActions = /^v\d/.test(key) ? +key.slice(1) : key === "0" && key_handler_1.currentKeys ? void 0 : childAction || keyMap[key];
      if (!(newActions >= 0)) {
        // asserts newActions is VisualAction.NextKey | undefined (NaN)
        currentPrefix = newActions < 0 ? key : "";
        return keybody < "f:" /* kChar.minNotF_num */ && keybody > "f0" /* kChar.maxNotF_num */ ? 0 /* HandlerResult.Nothing */ : newActions ? 2 /* HandlerResult.Prevent */ : (key_handler_1.set_currentKeys(key.length < 2 && +key < 10 ? key_handler_1.currentKeys + key : ""), 
        keybody.length > 1 || key !== keybody && key < "s" ? 1 /* HandlerResult.Suppress */ : 2 /* HandlerResult.Prevent */);
      }
      keyboard_utils_1.prevent_(event.e);
      count = (!currentPrefix || childAction) && key_handler_1.currentKeys | 0 || 1;
      currentPrefix = "", utils_1.esc(0 /* HandlerResult.Nothing */);
      di_ = 2 /* kDirTy.unknown */;
 // make @di safe even when a user modifies the selection
            diType_ = 5 /* DiType.UnsafeUnknown */;
      commandHandler(newActions, count);
      return 2 /* HandlerResult.Prevent */;
    });
    commandHandler(-1 /* VisualAction.Noop */ , 1);
    diff ? hud_1.hudTip(83 /* kTip.noUsableSel */ , 1) : hud_1.hudHide(count ? void 0 : 1 /* TimerType.noTimer */);
  };
  exports.activate = activate;
  const highlightRange = sel => {
    const br = dom_ui_1.getSelectionBoundingBox_(sel);
    if (br) {
      // width may be 0 in Caret mode
      let cr = rect_1.cropRectToVisible_(br.l - 4, br.t - 5, br.r + 3, br.b + 4);
      cr && dom_ui_1.flash_(null, cr, 660, " Sel");
    }
  };
  exports.highlightRange = highlightRange;
});