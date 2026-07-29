"use strict";
__filename = "background/sync.js";
define([ "require", "exports", "./store", "./utils", "./browser", "./settings" ], (require, exports, store_1, BgUtils_, browser_1, settings_) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  BgUtils_ = __importStar(BgUtils_);
  settings_ = __importStar(settings_);
  const doNotSync = BgUtils_.safer_({
    // Note: need to keep synced with pages/options_ext.ts#_importSettings
    findModeRawQueryList: 1,
    innerCSS: 1,
    keyboard: 1,
    newTabUrl_f: 1,
    vomnibarPage_f: 1
  });
  const browserStorage_ = browser_1.browser_.storage;
  const kCloud = "sync.cloud:";
  let __sync;
  let to_update = null, toCleanDuringUpgrade = null;
  let keyInDownloading = "";
  let changes_to_merge = null;
  let textDecoder = null;
  let innerRestoreSettings = null;
  const storage = () => __sync || (__sync = browserStorage_ && browserStorage_.sync);
  const HandleStorageUpdate = (changes, area) => {
    const waitAndUpdate = items => {
      if (changes_to_merge) {
        BgUtils_.safer_(items);
        for (const key in changes_to_merge) {
          const key2 = key.split(":")[0], isSame = key2 === key;
          if (isSame || !(key2 in changes_to_merge)) {
            const change = isSame ? changes_to_merge[key] : null;
            storeAndPropagate(key2, change != null ? change.newValue : items[key2], items);
          }
        }
        changes_to_merge = null;
      }
    };
    BgUtils_.safer_(changes);
    changes_to_merge ? Object.assign(changes_to_merge, changes) : changes_to_merge = changes;
    if (innerRestoreSettings) {
      innerRestoreSettings.then(() => HandleStorageUpdate({}, area));
      return;
    }
    changes = changes_to_merge;
    changes_to_merge = null;
    for (const key in changes) {
      const change = changes[key], is_part = key.includes(":"), result = is_part ? 8 : storeAndPropagate(key, change != null ? change.newValue : null);
      if (result === 8) {
        changes_to_merge = changes;
        storage().get(waitAndUpdate);
        return;
      }
      delete changes[key];
    }
  };
  function _now() {
    return new Date(Date.now() - 6e4 * (new Date).getTimezoneOffset()).toJSON().slice(0, -5).replace("T", " ");
  }
  const log = console.log.bind(console, "[%s]", {
    toString: _now
  });
  /** return `8` only when expect a valid `map` */  const storeAndPropagate = (key, value, map) => {
    const serialized = value && typeof value === "object" && value.$_serialize || "";
    let tmpStr;
    if (!(key in settings_.defaults_) || !shouldSyncKey(key)) {
      const toUpgrade = serialized || !settings_.needToUpgradeSettings_ ? -1 : settings_.kSettingsToUpgrade_.indexOf(key);
      if (toUpgrade >= 0 && (tmpStr = store_1.storageCache_.get(key), tmpStr != null ? tmpStr + "" : null) !== (value != null ? value + "" : null)) {
        settings_.setInLocal_(key, value != null ? value : null);
        settings_.reloadFromLegacy_(toUpgrade);
      }
      return;
    }
    const defaultVal = settings_.defaults_[key], kThis = "sync.this:";
    if (serialized) {
      if (serialized === "split" && !map) {
        return 8;
      }
      value = deserialize(key, value, map);
      if (value === 8) {
        // still lack fields
        return;
      }
    }
    if (value == null) {
      if (store_1.settingsCache_[key] != defaultVal) {
        innerRestoreSettings || log(kThis, "reset", key);
        setAndPost(key, defaultVal);
      }
      return;
    }
    let curJSON, curVal = store_1.settingsCache_[key];
    let jsonVal, notJSON;
    if (notJSON = typeof defaultVal !== "object" || !value || typeof value !== "object") {
      jsonVal = value;
      curJSON = curVal;
    } else {
      jsonVal = JSON.stringify(value);
      curJSON = JSON.stringify(curVal);
    }
    if (jsonVal === curJSON) {
      return;
    }
    jsonVal === (notJSON ? defaultVal : JSON.stringify(defaultVal)) && (value = defaultVal);
    innerRestoreSettings || log(kThis, "update", key, typeof value === "string" ? (value.length > 32 ? value.slice(0, 30) + "..." : value).replace(/\n/g, "\\n") : value);
    setAndPost(key, value);
  };
  const setAndPost = (key, value) => {
    keyInDownloading = key;
    key === "keyLayout" && (value = value & -33 /* kKeyLayout.inPrivResistFp_ff */ | store_1.settingsCache_[key] & 32 /* kKeyLayout.inPrivResistFp_ff */);
    settings_.set_(key, value);
    keyInDownloading = "";
    key in settings_.valuesToLoad_ && settings_.broadcast_({
      N: 6 /* kBgReq.settingsUpdate */ ,
      d: [ settings_.valuesToLoad_[key] ]
    });
  };
  const TrySet = (key, value) => {
    const type = shouldSyncKey(key) ? 1 : settings_.kSettingsToUpgrade_.includes(key) ? 2 : 0;
    if (!type || key === keyInDownloading) {
      return;
    }
    if (!to_update) {
      setTimeout(DoUpdate, 800);
      to_update = BgUtils_.safeObj_();
    }
    if (type === 1) {
      key === "keyLayout" && (value &= -33 /* kKeyLayout.inPrivResistFp_ff */);
      to_update[key] = value;
    } else {
      (toCleanDuringUpgrade || (toCleanDuringUpgrade = [])).push(key);
    }
  };
  globalThis.serializeSync = (key, val) => {
    let serialized = serialize(key, val, new TextEncoder);
    return serialized ? typeof serialized === "object" ? serialized : {
      $_serialize: "single",
      d: JSON.parse(serialized)
    } : val;
  };
  globalThis.deserializeSync = (key, val, items) => {
    if (items) {
      val = val || items[key] || val;
    } else {
      items = val;
      val = items && items[key] || val;
    }
    if (!val || !val.$_serialize) {
      return val;
    }
    let result = deserialize(key, val, items);
    return result != null ? result : val;
  };
  /** Chromium's base::JsonWriter will translate all "<" to "\u003C"
     * https://cs.chromium.org/chromium/src/extensions/browser/api/storage/settings_storage_quota_enforcer.cc?dr=CSs&q=Allocate&g=0&l=37e
     * https://cs.chromium.org/chromium/src/base/json/json_writer.cc?dr=CSs&q=EscapeJSONString&g=0&l=104
     * https://cs.chromium.org/chromium/src/base/json/string_escape.cc?dr=CSs&q=EscapeSpecialCodePoint&g=0&l=35
     */
  const fixCharsInJSON = text => text.replace(/[<`\u2028\u2029]/g, s => s === "<" ? "`l" : s === "`" ? "`d" : s === "\u2028" ? "`r" : "`n");
  const escapeQuotes = text => text.replace(/"|\\[\\"]/g, s => s === '"' ? "`q" : s === '\\"' ? "`Q" : "`S");
  const revertEscaping = text => {
    const map = {
      Q: '\\"',
      S: "\\\\",
      d: "`",
      l: "<",
      n: "\u2029",
      q: '"',
      r: "\u2028"
    };
    return text.replace(/`[QSdlnqr]/g, s => map[s[1]]);
  };
  // Note: allow failures
    const deserialize = (key, value, map) => {
    let serialized = "";
    switch (value.$_serialize) {
     case "split":
      // check whether changes are only synced partially
      for (let {k: prefix, s: slice} = value, i = 0; i < slice; i++) {
        let part = map[key + ":" + i];
        if (!part || typeof part !== "string" || !part.startsWith(prefix)) {
          return 8;
        }
 // only parts
                serialized += part.slice(prefix.length);
      }
      break;

     case "single":
      return JSON.parse(revertEscaping(JSON.stringify(value.d)));

     default:
      // in case of methods in newer versions
      log("Error: can not support the data format in synced settings data:", key, ":", value.$_serialize);
      return null;
    }
    if (typeof settings_.defaults_[key] === "string") {
      serialized = revertEscaping(serialized);
      return serialized;
    }
    serialized = revertEscaping(JSON.stringify(serialized));
    return JSON.parse(serialized.slice(1, -1));
  };
  const serialize = (key, value, encoder) => {
    if (!value || (typeof value !== "string" ? typeof value !== "object" : value.length < 8192 /* GlobalConsts.SYNC_QUOTA_BYTES_PER_ITEM */ / 6 - 40)) {
      return;
    }
    let jsonStr = JSON.stringify(value), encoded = "";
    if (jsonStr.length < 8192 /* GlobalConsts.SYNC_QUOTA_BYTES_PER_ITEM */ / 6 - 40) {
      return;
    }
    const ensureSingleBytes = str => str.replace(/[^\x00-\xff]/g, ch => {
      let code = ch.charCodeAt(0);
      return "\\u" + (code > 4095 ? "" : "0") + code.toString(16);
    });
    const hasEncoder = true;
    const lenStdJSON = jsonStr.length;
    jsonStr = fixCharsInJSON(jsonStr);
    const lenPreConverted = jsonStr.length;
 // /[<`\u2028\u2029]/g, and `"\\u003C".length` is 6
        if (3 * (lenPreConverted - lenStdJSON) + lenStdJSON * 3 < 8093) {
      return;
    }
    encoded = hasEncoder ? encoder.encode(jsonStr) : jsonStr = ensureSingleBytes(jsonStr);
    if (encoded.length < 8093) {
      const lenUpperLimit = hasEncoder ? encoded.length + 4 * (lenPreConverted - lenStdJSON) : Math.ceil((encoded.length - lenPreConverted) / 5 * 3 + 6 * (lenPreConverted - lenStdJSON) + (lenStdJSON - (encoded.length - lenPreConverted) / 5 - (lenPreConverted - lenStdJSON)));
      return lenUpperLimit < 8093 ? void 0 : jsonStr;
    }
    let slice = 0, prefix = Date.now().toString(36) + ":", dict = {};
    jsonStr = typeof settings_.defaults_[key] === "string" ? jsonStr.slice(1, -1) : escapeQuotes(jsonStr);
    if (hasEncoder) {
      textDecoder || (textDecoder = new TextDecoder);
      encoded = encoder.encode(jsonStr);
    } else {
      encoded = ensureSingleBytes(jsonStr);
    }
    for (let start = 0, end = encoded.length; start < end; ) {
      let part, pos = Math.min(start + 8134, end), delta = 0;
      if (hasEncoder) {
        // find a boundary of char points
        for (;pos < end && (encoded[pos] & 192) === 128; pos++) {}
        part = textDecoder.decode(encoded.subarray(start, pos));
      } else {
        part = encoded.slice(start, pos);
      }
      jsonStr = part.slice(-6);
      delta = pos < end ? jsonStr.lastIndexOf("\\") : -1;
      if (delta > 0 && delta > jsonStr.length - 2) {
        part += "b";
        delta = 1;
      } else if (delta > 0 && jsonStr[delta + 1] === "u") {
        delta = jsonStr.length - delta;
 // then delta in [2..5]
                for (let i = delta; i++ < 6; part += "b") {}
      } else {
        delta = 0;
      }
      part = JSON.parse(`"${part}"`);
      if (delta) {
        let hadConsumedSlash = part.endsWith("b");
        hadConsumedSlash || (pos -= delta);
        part = part.slice(0, delta > 1 && hadConsumedSlash ? delta - 6 : -1);
      }
      dict[key + ":" + slice++] = prefix + part;
      start = pos;
      if (slice >= 13 /* GlobalConsts.MaxSyncedSlices */) {
        // force to throw all the left, so that all slices can be cleaned when the value gets short again
        break;
      }
    }
    dict[key] = {
      $_serialize: "split",
      k: prefix,
      s: slice
    };
    return dict;
  };
  const DoUpdate = () => {
    const items = to_update, upgradedItems = toCleanDuringUpgrade;
    const removed = [], updated = [], reset = [], delayedSerializedItems = BgUtils_.safeObj_(), serializedDict = {};
    to_update = toCleanDuringUpgrade = null;
    if (!items || store_1.sync_ !== TrySet) {
      return;
    }
    let encoder = Object.keys(items).length > 0 ? new TextEncoder : null;
    for (const _key in items) {
      const key = _key;
      let value = items[key], defaultVal = settings_.defaults_[key], startToResetList = typeof defaultVal === "string" || typeof defaultVal === "object" && key !== "vimSync" ? 0 : 13 /* GlobalConsts.MaxSyncedSlices */;
      if (value != null) {
        let serialized = serialize(key, value, encoder);
        if (serialized && typeof serialized === "object") {
          delayedSerializedItems[key] = serialized;
          startToResetList = serialized[key].s;
        } else {
          serializedDict[key] = serialized ? {
            $_serialize: "single",
            d: JSON.parse(serialized)
          } : value;
          updated.push(key);
        }
      } else {
        removed.push(key);
      }
      for (;startToResetList < 13 /* GlobalConsts.MaxSyncedSlices */; startToResetList++) {
        reset.push(key + ":" + startToResetList);
      }
    }
    textDecoder = encoder = null;
    upgradedItems && removed.push(...upgradedItems);
    reset.push(...removed);
    removed.length > 0 && log(kCloud, "reset", removed.join(", "));
    reset.length > 0 && storage().remove(reset);
    if (updated.length > 0) {
      log(kCloud, "update", updated.join(", "));
      storage().set(serializedDict);
    }
    for (let key in delayedSerializedItems) {
      storage().set(delayedSerializedItems[key], () => {
        const err = browser_1.runtimeError_();
        err ? log("Failed to update", key, ":", err.message || err) : log(kCloud, "update (serialized) " + key);
        return err;
      });
    }
  };
  const shouldSyncKey = key => !(key in doNotSync);
  const beginToRestore = (items, resolve) => {
    BgUtils_.safer_(items);
    const vimSync = items.vimSync || store_1.settingsCache_.vimSync == null && store_1.hasEmptyLocalStorage_;
    store_1.updateHooks_.vimSync(false, "vimSync");
 // turn off sync_ for a
        if (!vimSync) {
      resolve();
      return;
 // no settings have been modified
        }
    if (!items.vimSync) {
      // cloud may be empty, but the local computer wants to sync, so enable it
      log(kCloud, "enable vimSync");
      items.vimSync = true;
      storage().set({
        vimSync: true
      });
    }
    const toReset = [];
    const legacy = null;
    for (let key in store_1.settingsCache_) {
      // although storeAndPropagate indeed checks @shouldSyncKey(key)
      // here check it for easier debugging
      if (store_1.settingsCache_[key] !== settings_.defaults_[key]) {
        !(key in items) && shouldSyncKey(key) && (key === "keyLayout" && settings_.needToUpgradeSettings_ & 2 || toReset.push(key));
        legacy && legacy.length && legacy.removeItem(key);
      }
    }
    for (let key of toReset) {
      storeAndPropagate(key, null);
    }
    for (const key in items) {
      key.includes(":") || storeAndPropagate(key, items[key], items);
    }
    settings_.postUpdate_("vimSync");
    setTimeout(() => {
      resolve();
    }, 4);
    log(kCloud, "download settings");
  };
  store_1.updateHooks_.vimSync = value => {
    if (!storage()) {
      return;
    }
    const areaOnChanged = storage().onChanged;
    const event = areaOnChanged;
    const listener = HandleStorageUpdate;
    if (!value) {
      event.removeListener(listener);
      store_1.set_sync_(store_1.blank_);
      return;
    }
    if (store_1.sync_ !== TrySet) {
      event.addListener(listener);
      store_1.set_sync_(TrySet);
    } else if (to_update) {
      log(kCloud, "save immediately");
      DoUpdate();
    }
  };
  settings_.ready_.then(() => {
    const vimSync = store_1.settingsCache_.vimSync;
    if (vimSync === false || !vimSync && !store_1.hasEmptyLocalStorage_) {
      store_1.set_installation_(null);
    } else if (store_1.installation_) {
      // on startup
      innerRestoreSettings = store_1.installation_.then(reason => {
        store_1.set_installation_(null);
        return !!reason && reason.reason === "install";
      }).then(installed => new Promise(r => {
        storage() ? storage().get(items => {
          const err = browser_1.runtimeError_();
          const first = installed && store_1.hasEmptyLocalStorage_ && (err || Object.keys(items).length === 0);
          const callback = first ? () => {
            settings_.set_("keyLayout", 2 /* kKeyLayout.IfFirstlyInstalled */);
            r();
          } : r;
          if (err) {
            store_1.updateHooks_.vimSync = store_1.blank_;
            callback();
            log("Error: failed to get storage:", err, "\n\tSo disable syncing temporarily.");
          } else {
            beginToRestore(items, callback);
          }
          return err;
        }) : r();
      })).then(() => {
        store_1.set_restoreSettings_(null), innerRestoreSettings = null;
      });
      store_1.set_restoreSettings_(Promise.race([ innerRestoreSettings, new Promise(resolve => {
        setTimeout(resolve, 800);
      }) ]).then(() => {
        store_1.set_restoreSettings_(null);
        store_1.settingsCache_.vimSync && store_1.sync_ !== TrySet && settings_.postUpdate_("vimSync");
      }));
    } else {
      // on reload ./sync
      settings_.postUpdate_("vimSync");
    }
  });
});