"use strict";
__filename = "content/hud.js";
define([ "require", "exports", "../lib/utils", "../lib/keyboard_utils", "../lib/dom_utils", "./dom_ui", "./link_hints", "./insert", "./visual", "./mode_find", "./key_handler" ], (require, exports, utils_1, keyboard_utils_1, dom_utils_1, dom_ui_1, link_hints_1, insert_1, visual_1, mode_find_1, key_handler_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.toggleOpacity = exports.hudHide = exports.hudShow = exports.hudTip = exports.hud_tipTimer = exports.hud_opacity = exports.hud_text = exports.hud_box = void 0;
  let tweenId = 0 /* TimerID.None */ , tweenStart = 0;
  let box = null;
  exports.hud_box = box;
  let $text = null;
  let text = "";
  exports.hud_text = text;
  let opacity_ = 0, dom_opacity_ = 1;
  exports.hud_opacity = opacity_;
  let timer = 0 /* TimerID.None */;
  exports.hud_tipTimer = timer;
  const hudTip = (tid, duration, args, embed) => {
    exports.hudShow(tid, args, embed);
    text && (exports.hud_tipTimer = timer = utils_1.timeout_(exports.hudHide, (duration || (tid === 20 /* kTip.copiedIs */ && (mode_find_1.find_box || visual_1.visual_mode_name) ? .5 : 1.5)) * 1e3 | 0));
  };
  exports.hudTip = hudTip;
  const hudShow = (tid, args, embed) => {
    if (!dom_utils_1.isHTML_()) {
      return;
    }
    exports.hud_text = text = utils_1.VTr(tid, args);
    exports.hud_opacity = opacity_ = 1;
    utils_1.clearTimeout_(timer);
    exports.hud_tipTimer = timer = 0 /* TimerID.None */;
    embed || tweenId || (tweenId = utils_1.interval_(tween, 40), tweenStart = utils_1.getTime());
    if (box) {
      dom_utils_1.toggleClass_s(box, "HL", 0);
      (embed || dom_opacity_) && ($text.data = text);
      embed && exports.toggleOpacity(1);
      return;
    }
    exports.hud_box = box = dom_utils_1.createElement_("div");
    dom_utils_1.setClassName_s(box, "R HUD" + utils_1.fgCache.d);
    dom_utils_1.appendNode_s(box, $text = new Text(text));
 // lgtm [js/superfluous-trailing-arguments]
        if (!embed) {
      exports.toggleOpacity(0);
      dom_ui_1.ui_box || dom_ui_1.ensureBorder();
 // safe to skip `getZoom_`
        }
    dom_ui_1.addUIElement(box, link_hints_1.allHints ? 0 /* AdjustType.NotAdjust */ : 1 /* AdjustType.DEFAULT */);
  };
  exports.hudShow = hudShow;
  const tween = fake => {
    let opacity = fake ? 0 : dom_opacity_;
    if (opacity === opacity_) {} else {
      if (opacity === 0) {
        $text.data = text;
        exports.toggleOpacity(fake || utils_1.fgCache.m ? 1 : .25);
        fake && (tweenId = 0);
        return dom_ui_1.adjustUI();
      }
      !utils_1.fgCache.m && !utils_1.doc.hidden && utils_1.getTime() - tweenStart < 996 ? 
      // in "efficiency mode" of MS Edge 98, step of interval or following timeout may be increased into 1 second
      opacity += opacity < opacity_ ? .25 : -.25 : opacity = opacity_;
    }
    opacity ? exports.toggleOpacity(opacity) : exports.hudHide(1 /* TimerType.noTimer */);
    if (opacity !== opacity_) {
      return;
    }
    utils_1.clearTimeout_(tweenId);
    tweenId = 0;
  };
  const hudHide = info => {
    const n = keyboard_utils_1.handler_stack.length;
    utils_1.clearTimeout_(timer);
    exports.hud_tipTimer = timer = 0 /* TimerID.None */;
    exports.hud_opacity = opacity_ = 0;
    exports.hud_text = text = "";
    if (n && keyboard_utils_1.handler_stack[n - 1] === 3 /* kHandler.onTopNormal */) {
      exports.hudShow(80 /* kTip.onTopNormal */ , key_handler_1.currentKeys);
    } else if (mode_find_1.find_box || !link_hints_1.isHintsActive || link_hints_1.hintManager) {
      if (!mode_find_1.find_box && visual_1.visual_mode_name) {
        exports.hudShow(82 /* kTip.inVisualMode */ , utils_1.VTr(67 /* kTip.OFFSET_VISUAL_MODE */ + visual_1.visual_mode_name), info);
      } else if (!mode_find_1.find_box && insert_1.insert_global_ && insert_1.insert_global_.h) {
        exports.hudShow(1 /* kTip.raw */ , insert_1.insert_global_.h);
      } else if (insert_1.passAsNormal) {
        utils_1.esc(4 /* HandlerResult.RefreshPassAsNormal */);
      } else if (insert_1.readonlyFocused_ > 0 && insert_1.set_readonlyFocused_(insert_1.raw_insert_lock ? 1 : 0) && !utils_1.fgCache.h) {
        exports.hudShow(119 /* kTip.readOnly */);
      } else if (box) {
        if (info !== 1 /* TimerType.noTimer */ && utils_1.isEnabled_) {
          if (!tweenId && utils_1.isAlive_) {
            tweenId = utils_1.interval_(tween, 40);
            tweenStart = utils_1.getTime();
          }
        } else {
          exports.toggleOpacity(0);
          $text.data = "";
          dom_utils_1.toggleClass_s(box, "HL", 0);
          utils_1.isEnabled_ && utils_1.isLocked_ < 3 /* Frames.Flags.lockedAndDisabled */ || dom_ui_1.adjustUI(2);
        }
      }
    } else {
      link_hints_1.setMode(link_hints_1.hintMode_);
    }
  };
  exports.hudHide = hudHide;
  const toggleOpacity = opacity => {
    dom_opacity_ = opacity;
    box.style.opacity = opacity < 1 ? opacity : "";
    dom_utils_1.setVisibility_s(box, !!opacity);
  };
  exports.toggleOpacity = toggleOpacity;
});