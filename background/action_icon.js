"use strict";
__filename = "background/action_icon.js";
define([ "require", "exports", "./store", "./utils", "./i18n", "./browser", "./ports" ], (require, exports, store_1, BgUtils_, i18n_1, browser_1, ports_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.toggleIconBuffer_ = exports.browserAction_ = void 0;
  BgUtils_ = __importStar(BgUtils_);
  const knownIcons_ = [ "/icons/enabled.bin", "/icons/partial.bin", "/icons/disabled.bin" ];
  exports.browserAction_ = browser_1.browser_.action;
  let tabIds_cr_;
  const onerror = err => {
    if (store_1.setIcon_ === store_1.blank_) {
      return;
    }
    console.log("Can not access binary icon data:", err);
    store_1.set_setIcon_(store_1.blank_);
    store_1.set_needIcon_(false);
    store_1.updateHooks_.showActionIcon = void 0;
    Promise.resolve(i18n_1.extTrans_("name")).then(name => {
      exports.browserAction_.setTitle({
        title: name + "\n\nFailed in showing dynamic icons."
      });
    });
  };
  const loadBinaryImagesAndSetIcon_cr = type => {
    const path = knownIcons_[type];
    const loadFromRawArray = array => {
      const uint8Array = new Uint8ClampedArray(array), firstSize = array.byteLength / 5, small = Math.sqrt(firstSize / 4) | 0, large = small + small, cache = BgUtils_.safeObj_();
      cache[small] = new ImageData(uint8Array.subarray(0, firstSize), small, small);
      cache[large] = new ImageData(uint8Array.subarray(firstSize), large, large);
      store_1.iconData_[type] = cache;
      const arr = tabIds_cr_.get(type);
      tabIds_cr_.delete(type);
      for (let w = 0, h = arr.length; w < h; w++) {
        store_1.framesForTab_.has(arr[w]) && store_1.setIcon_(arr[w], type, true);
      }
    };
    {
      const p = fetch(path).then(r => r.arrayBuffer()).then(loadFromRawArray);
      p.catch(onerror);
    }
  };
  const toggleIconBuffer_ = () => {
    const enabled = store_1.needIcon_;
    if (enabled === !!store_1.iconData_) {
      return;
    }
    store_1.set_setIcon_(enabled ? doSetIcon_ : store_1.blank_);
    const iter = ({cur_: {s: sender}, flags_}) => {
      if (sender.status_ !== 0 /* Frames.Status.enabled */) {
        if (flags_ & 512 /* Frames.Flags.ResReleased */ && enabled) {
          sender.status_ = 0 /* Frames.Status.enabled */;
          return;
        }
        store_1.setIcon_(sender.tabId_, enabled ? sender.status_ : 0 /* Frames.Status.enabled */);
      }
    };
    const cond = () => store_1.needIcon_ === enabled;
    if (!enabled) {
      setTimeout(() => {
        if (store_1.needIcon_ || store_1.iconData_ == null) {
          return;
        }
        store_1.set_iconData_(null);
        tabIds_cr_ = null;
      }, 200);
      return;
    }
    store_1.set_iconData_([ null, null, null ]);
    tabIds_cr_ = new Map;
    // only do partly updates: ignore "rare" cases like `sender.s` is enabled but the real icon isn't
    ports_1.asyncIterFrames_(0 /* Frames.Flags.blank */ , iter, cond);
  };
  exports.toggleIconBuffer_ = toggleIconBuffer_;
  /** Firefox does not use ImageData as inner data format
     * * https://dxr.mozilla.org/mozilla-central/source/toolkit/components/extensions/schemas/manifest.json#577
     *   converts ImageData objects in parameters into data:image/png,... URLs
     * * https://dxr.mozilla.org/mozilla-central/source/browser/components/extensions/parent/ext-browserAction.js#483
     *   builds a css text of "--webextension-***: url(icon-url)",
     *   and then set the style of an extension's toolbar button to it
     */  const doSetIcon_ = (tabId, type, isLater) => {
    let data;
    if (tabId < 0) {} else if (data = store_1.iconData_[type]) {
      const f = exports.browserAction_.setIcon;
      const args = {
        tabId,
        imageData: data
      };
      isLater ? f(args, browser_1.runtimeError_) : f(args);
    } else if (tabIds_cr_.has(type)) {
      tabIds_cr_.get(type).push(tabId);
    } else {
      setTimeout(loadBinaryImagesAndSetIcon_cr, 0, type);
      tabIds_cr_.set(type, [ tabId ]);
    }
  };
  exports.toggleIconBuffer_();
});