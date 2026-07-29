import { CurCVer_, CurFFVer_, OnChrome, OnEdge, OnFirefox, $, import2_, OnSafari, enableNextTick_, isVApiReady_, simulateClick_, post_, prevent_, escapeAllForRe_ } from "./async_bg.js";

import { bgSettings_, ExclusionRulesOption_, Option_, oTrans_, getSettingsCache_ } from "./options_base.js";

import { exportBtn_, saveBtn_ } from "./options_defs.js";

import { manifest_ } from "./options_permissions.js";

import { delayed_task, clear_delayed_task, onHash_, noBlobSupport_cr_mv2_ } from "./options_wnd.js";

const kSettingsToUpgrade_ = [ "ignoreKeyboardLayout", "ignoreCapsLock", "mapModifier" ];

const createURLSafe = text => {
  const blob = new Blob([ text ], {
    type: "application/json",
    endings: "native"
  });
  return URL.createObjectURL(blob);
};

const showHelp = event => {
  if (!VApi || !VApi.z) {
    isVApiReady_.then(showHelp.bind(null, event));
    return;
  }
  let node, root = VApi.y().r, diff = false;
  event && event !== "force" && prevent_(event);
  if (root && (node = root.querySelector("#HCls"))) {
    if (event !== "force" && root.querySelector(".HelpCommandName") != null) {
      simulateClick_(node);
      return;
    }
    const node2 = root.querySelector("#HDlg");
    const outerBox = node2 && node2.parentElement || node2;
    diff = !!outerBox && outerBox.remove !== HTMLElement.prototype.remove;
    outerBox && (outerBox.remove = HTMLElement.prototype.remove);
  }
  VApi.r[0](40 /* kFgReq.pages */ , {
    i: 1,
    q: [ {
      n: 24 /* kPgReq.initHelp */ ,
      q: null
    } ]
  }, diff || location.hash === "#commands" ? () => {
    const misc = VApi && VApi.y();
    const node2 = misc && misc.r && misc.r.querySelector("#HDlg");
    if (!node2) {
      return;
    }
    const outerBox = node2.parentElement || node2;
    outerBox.remove = () => {
      HTMLElement.prototype.remove.call(outerBox);
      location.hash = "";
      $("#optionalPermissionsBox").style.display != "none" && onHash_("#optionalPermissions");
    };
  } : () => {});
};

$("#showCommands").onclick = showHelp;

ExclusionRulesOption_.prototype.sortRules_ = function(element) {
  if (element && this.timer_) {
    return;
  }
  const rules = this.readValueFromElement_(), hostRe = /^([:^]?[a-z\-?*]+:\/\/)?((?:[^\/]|\/])+)(\/[^\]].*|\/?$)/, escapedDotRe = /\\\./g;
  let key, arr;
  for (const rule of rules) {
    if ((arr = hostRe.exec(key = rule.pattern.replace("(?:[^./]+\\.)*?", "*."))) && arr[1] && arr[2]) {
      key = arr[3] ? arr[3].replace(escapedDotRe, ".") : "";
      arr = arr[2].replace(escapedDotRe, ".").split(".");
      arr.reverse();
      key = arr.join(".") + key;
    }
    rule.key_ = key;
  }
  rules.sort((a, b) => a.key_ < b.key_ ? -1 : a.key_ === b.key_ ? 0 : 1);
  this.populateElement_(rules);
  this.onUpdated_();
  if (!element) {
    return;
  }
  let self = this;
  this.timer_ = setTimeout((el, text) => {
    el.firstChild.data = text, self.timer_ = 0;
  }, 1e3, element, element.firstChild.data);
  element.firstChild.data = oTrans_("3_2");
};

$("#exclusionSortButton").onclick = function() {
  Option_.all_.exclusionRules.sortRules_(this);
};

function formatDate_(time) {
  return new Date(+time - 6e4 * (new Date).getTimezoneOffset()).toJSON().slice(0, -5).replace("T", " ");
}

let _lastBlobURL = "";

const buildExportedFile = (now, want_static) => {
  let exported_object;
  exported_object = Object.create(null);
  exported_object.name = "Vim+";
  if (!want_static) {
    exported_object["@time"] = now.toLocaleString();
    exported_object.time = now.getTime();
  }
  exported_object.environment = {
    extension: manifest_.version,
    platform: bgSettings_.platform_
  };
  exported_object.environment.chromium = CurCVer_;
  const storage = getSettingsCache_(), all = bgSettings_.defaults_;
  const storedKeys = Object.keys(storage).sort();
  omniBlockListRe = null;
  for (const key of storedKeys) {
    const storedVal = storage[key], defaultVal = all[key];
    if (storedVal === defaultVal) {
      continue;
    }
    typeof defaultVal !== "string" ? exported_object[key] = storedVal : storedVal.includes("\n") ? (exported_object[key] = storedVal.split("\n").map(line => maskStr(key, line))).push("") : exported_object[key] = maskStr(key, storedVal);
  }
  omniBlockListRe = null;
  if (exported_object.keyLayout != null) {
    const keyLayout = exported_object.keyLayout;
    keyLayout & 9 /* kKeyLayout.ignoreIfAlt */ && (exported_object[kSettingsToUpgrade_[0]] = keyLayout & 8 /* kKeyLayout.ignoreIfAlt */ ? 1 : 2);
    keyLayout & 528 /* kKeyLayout.ignoreCapsOnMac */ && (exported_object[kSettingsToUpgrade_[1]] = keyLayout & 512 /* kKeyLayout.ignoreCapsOnMac */ ? 1 : 2);
    keyLayout & 192 /* kKeyLayout.MapModifierMask */ && (exported_object[kSettingsToUpgrade_[2]] = keyLayout & 64 /* kKeyLayout.mapLeftModifiers */ ? 1 : 2);
  }
  let exported_data = JSON.stringify(exported_object, null, "\t") + "\n";
  const arr = exported_data.split("\n");
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].replace(/[\u4e00-\u9fff]/g, "  ").length + 1 > 120 && /^\s+"\w+":/.test(arr[i])) {
      let left = arr[i].split(":", 1)[0] + ":", right = arr[i].slice(left.length).trimLeft();
      right = right.replace(/[\u4e00-\u9fff]/g, "  ").length + 4 > 120 ? right : "\t\t" + right;
      arr[i] = left + "\n" + right;
    }
  }
  exported_data = arr.join("\n");
  exported_object.environment.platform === "win" && (
  // in case "endings" didn't work
  exported_data = exported_data.replace(/\n/g, "\r\n"));
  return {
    text: exported_data,
    options: storedKeys.length
  };
};

exportBtn_.onclick = event => {
  if (_lastBlobURL) {
    URL.revokeObjectURL(_lastBlobURL);
    _lastBlobURL = "";
  }
  const now = new Date;
  const all_static = !!event && (event.ctrlKey || event.metaKey || event.shiftKey);
  const blob_data = buildExportedFile(now, all_static).text, d_s = formatDate_(now);
  let file_name = "vimium_c-";
  file_name += all_static ? "settings" : d_s.replace(/[\-:]/g, "").replace(" ", "_");
  file_name += ".json";
  {
    const nodeA = document.createElement("a");
    nodeA.download = file_name;
    nodeA.href = createURLSafe(blob_data);
    simulateClick_(nodeA);
    // not `URL.revokeObjectURL(nodeA.href);` so that it works almost all the same
    // on old Chrome before BrowserVer.MinCanNotRevokeObjectURLAtOnce
        _lastBlobURL = nodeA.href;
  }
  console.info("EXPORT settings to %c%s%c at %c%s%c.", "color:darkred", file_name, "color:auto", "color:darkblue", d_s, "color:auto");
};

function maskStr(key, str) {
  // this solution is from https://stackoverflow.com/a/30106551/5789722
  return str && (key === "omniBlockList" || isExpectingHidden(str)) ? "$base64:" + btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_s, hex) => String.fromCharCode(parseInt(hex, 16)))) : str;
}

let omniBlockListRe = null;

/** @see {@link ../background/browsing_data_manager.ts#updateHooks_.omniBlockList} */ function isExpectingHidden(word) {
  if (omniBlockListRe == null) {
    const arr = [];
    for (let line of bgSettings_.get_("omniBlockList").split("\n")) {
      line.trim() && line[0] !== "#" && arr.push(line);
    }
    omniBlockListRe = arr.length > 0 && new RegExp(arr.map(s => escapeAllForRe_(s)).join("|"), "");
  }
  return omniBlockListRe !== false && omniBlockListRe.test(word);
}

function decodeStrOption(new_value) {
  new_value instanceof Array && (new_value = new_value.join("\n").trimRight());
  new_value = new_value.replace(/\r\n?/g, "\n").replace(/\xa0/g, " ");
  return new_value.replace(/^\$base64:(.*)/gm, (f, masked) => {
    try {
      return decodeURIComponent([].map.call(atob(masked), ch => "%" + ("00" + ch.charCodeAt(0).toString(16)).slice(-2)).join(""));
    } catch (_a) {}
    return f;
  });
}

async function _importSettings(time, new_data, is_recommended) {
  let env = new_data.environment, plat = env && env.platform || "", raw_ext_ver = env && env.extension && env.extension + "" || "", ext_ver = parseFloat(raw_ext_ver || 0) || 0, ext_ver_f = ext_ver > 1 ? raw_ext_ver.split(".", 2).join(".") : "", newer = ext_ver > parseFloat(manifest_.version);
  plat && (plat = ("" + plat).slice(0, 10));
  if (!confirm(oTrans_("confirmImport", [ oTrans_(is_recommended !== true ? "backupFile" : "recommendedFile"), ext_ver_f ? oTrans_("fileVCVer").replace("*", ext_ver_f) : "", (ext_ver_f ? oTrans_("fileVCVer_2").replace("*", ext_ver_f) : "") + (newer ? oTrans_("fileVCNewer") : ""), plat ? oTrans_("filePlatform", [ oTrans_(plat) || plat[0].toUpperCase() + plat.slice(1) ]) : oTrans_("commonPlatform"), time ? oTrans_("atTime", [ formatDate_(time) ]) : oTrans_("before") ]))) {
    VApi && VApi.h(1 /* kTip.raw */ , 0, oTrans_("cancelImport"));
    return;
  }
  const now = new Date;
  const old_settings_file = buildExportedFile(now, false);
  Object.setPrototypeOf(new_data, null);
  {
    const dict2 = new_data["chromium" in new_data ? "chromium" : "chrome"];
    dict2 && typeof dict2 === "object" && Object.assign(new_data, dict2);
  }
  if (new_data.vimSync == null) {
    const curSync = bgSettings_.get_("vimSync"), keep = curSync && confirm(oTrans_("keepSyncing"));
    new_data.vimSync = keep || curSync == null && null;
    curSync && console.log("Before importing: You chose to", keep ? "keep settings synced." : "stop syncing settings.");
    // if `new_data.vimSync` was undefined, then now it's null
    // this is useful, in case the below "iterating over local storage and setting-null" was changed
    }
  const logUpdate = function(method, key, a2, a3) {
    let hasA3 = arguments.length > 3, val = hasA3 ? a3 : a2, args = [ "%s %c%s", method, "color:darkred", key ];
    val = typeof val !== "string" || val.length <= 72 ? val : val.slice(0, 71).trimRight() + " \u2026";
    hasA3 && args.push(a2);
    args.push(val);
    really_updated++;
    console.log.apply(console, args);
  };
  let really_updated = 0;
  console.group("Import settings at " + formatDate_(+now + 1));
  enableNextTick_(8 /* kReadyInfo.LOCK */);
  time > 1e4 ? console.info("load settings saved at %c%s%c.", "color:darkblue", formatDate_(time), "color:auto") : console.info("load the settings:", is_recommended ? "recommended." : "saved before.");
  const delKeys = keys => keys.split(/\s+/g).forEach(k => k && delete new_data[k]);
  delKeys("name time environment author description chrome chromium firefox edge safari");
  for (let key in new_data) {
    key[0] === "@" && delete new_data[key];
  }
  const normalizeExtOrigin_ = key => {
    let newUrl = new_data[key];
    typeof newUrl === "string" && newUrl.includes("extension://", 2) && (/^(chrome|edge)-/.test(newUrl) ? newUrl.startsWith("edge-") && (new_data[key] = newUrl.replace("edge-", "chrome-")) : delete new_data[key]);
  };
  normalizeExtOrigin_("vomnibarPage");
  normalizeExtOrigin_("newTabUrl");
  const storage = getSettingsCache_(), all = bgSettings_.defaults_, _ref = Option_.all_;
  for (const key in storage) {
    storage[key] === all[key] || key in new_data || (new_data[key] = null);
  }
  delKeys("findModeRawQueryList innerCSS findCSS omniCSS newTabUrl_f vomnibarPage_f\n      focusNewTabContent dialogMode");
  const legacyNames_ = {
    __proto__: null,
    extWhiteList: "extAllowList",
    phraseBlacklist: "omniBlockList"
  };
  for (let key in legacyNames_) {
    if (key in new_data) {
      new_data[legacyNames_[key]] = new_data[key];
      delete new_data[key];
    }
  }
  if (new_data.keyLayout == null) {
    let ikl = new_data[kSettingsToUpgrade_[0]], icl = new_data[kSettingsToUpgrade_[1]], mm = new_data[kSettingsToUpgrade_[2]];
    if (ikl !== void 0 || icl !== void 0 || mm !== void 0) {
      ikl = ikl !== null ? ikl + "" : ikl;
      icl = icl !== null ? icl + "" : icl;
      mm = mm !== null ? mm + "" : mm;
      let kl;
      kl = ikl == null ? 4 /* kKeyLayout.inCmdIgnoreIfNotASCII */ : ikl === "2" || ikl === "true" ? 1 /* kKeyLayout.alwaysIgnore */ : ikl === "1" ? 12 /* kKeyLayout.inCmdIgnoreIfNotASCII */ : 4 /* kKeyLayout.inCmdIgnoreIfNotASCII */;
      kl |= icl == null || kl === 1 /* kKeyLayout.alwaysIgnore */ ? 0 : icl === "2" || icl === "true" ? 16 /* kKeyLayout.ignoreCaps */ : icl === "1" ? 512 /* kKeyLayout.ignoreCapsOnMac */ : 0;
      kl |= mm == null ? 0 : mm === "2" ? 128 /* kKeyLayout.mapRightModifiers */ : mm === "1" ? 64 /* kKeyLayout.mapLeftModifiers */ : 0;
      kl |= 256 /* kKeyLayout.fromOld */;
      new_data.keyLayout = kl;
    }
  }
  for (const key2 of kSettingsToUpgrade_) {
    delete new_data[key2];
  }
  if (new_data.vimSync !== bgSettings_.get_("vimSync")) {
    logUpdate("import", "vimSync", new_data.vimSync);
    await bgSettings_.set_("vimSync", new_data.vimSync);
    await _ref.vimSync.fetch_();
  }
  {
    // delay the update of keyMappings
    const tmp1 = _ref.keyMappings;
    if (tmp1 !== void 0) {
      delete _ref.keyMappings;
      _ref.keyMappings = tmp1;
    }
  }
  await Promise.all(Object.values(_ref).map(async item => {
    let key = item.field_, new_value = new_data[key];
    delete new_data[key];
    if (!(key in all)) {
      return;
    }
 // such as "optionalPermissions"
        if (new_value == null) {
      // NOTE: we assume all nullable settings have the same default value: null
      new_value = all[key];
    } else {
      typeof all[key] === "string" && (new_value = decodeStrOption(new_value));
      new_value = await item.normalize_(new_value);
    }
    if (!item.areEqual_(await item.innerFetch_(), new_value)) {
      logUpdate("import", key, new_value);
      await bgSettings_.set_(key, new_value);
      key in bgSettings_.valuesToLoad_ && Option_.syncToFrontend_.push(key);
      await item.fetch_();
      return item.onSave_();
    }
    if (!item.saved_) {
      return item.fetch_();
    }
  })).catch(err => {
    logUpdate("[ERROR] importing options failed", "cause:", err);
  });
  await Promise.all(Object.keys(new_data).map(async key => {
    let new_value = new_data[key];
    if (new_value == null) {
      if (key in all) {
        new_value = all[key];
        if (bgSettings_.get_(key) !== new_value) {
          logUpdate("reset", key, new_value);
          return bgSettings_.set_(key, new_value);
        }
      } else if (key.includes("|")) {
        logUpdate("remove", key, "(from local)");
        return post_(28 /* kPgReq.setInLocal */ , {
          key,
          val: null
        });
      }
    }
    typeof all[key] === "string" && (new_value = decodeStrOption(new_value));
    if (key in all) {
      if (bgSettings_.get_(key) !== new_value) {
        logUpdate("update", key, new_value);
        return bgSettings_.set_(key, new_value);
      }
    } else if (key.includes("|")) {
      new_value = "" + new_value;
      logUpdate("save", key, new_value);
      return post_(28 /* kPgReq.setInLocal */ , {
        key,
        val: new_value
      });
    }
  })).catch(err => {
    logUpdate("[ERROR] saving fields failed", "cause:", err);
  });
  enableNextTick_(0 /* kReadyInfo.NONE */ , 8 /* kReadyInfo.LOCK */);
  await 0;
  saveBtn_.onclick(false);
  if (really_updated <= 0) {
    console.info("no differences found.");
  } else if (old_settings_file.options > 0) {
    const text = createURLSafe(old_settings_file.text);
    console.info("[message] you may recover old configuration of %d option(s), by open the %s URL below ON THIS TAB:\n%c%s", old_settings_file.options, text.slice(0, 5), "color: #15c;", text);
  }
  console.info("import settings: finished.");
  console.groupEnd();
  const root = VApi && VApi.y().r;
  const node = root && root.querySelector("#HCls");
  node && // reload help dialog
  showHelp("force");
  VApi && VApi.h(1 /* kTip.raw */ , 0, oTrans_("importOK"));
}

function importSettings_(time, data, is_recommended) {
  let new_data = null, e = null, err_msg = "";
  try {
    let d = parseJSON_(is_recommended ? data : data.replace(/\xa0/g, " "));
    d instanceof Error ? e = d : d ? new_data = d : err_msg = oTrans_("notJSON");
  } catch (_e) {
    e = _e;
  }
  if (e != null) {
    err_msg = e ? (e.message || e) + "" : oTrans_("exc") + (e !== "" ? e : oTrans_("unknown"));
    let arr = /^(\d+):(\d+)$/.exec(err_msg);
    err_msg = arr ? oTrans_("JSONParseError", [ arr[1], arr[2] ]) : err_msg;
  }
  if (!new_data) {
    return alert(err_msg);
  }
  {
    time = +new Date(new_data.time || (typeof time === "object" ? +time : time)) || 0;
    const okNames = [ "Vim+", "vim+", "VimPlus", "Vimium++" ];
    if (!okNames.includes(new_data.name) || time < 1e4 && time > 0) {
      err_msg = oTrans_("notVCJSON");
      return alert(err_msg);
    }
  }
  const promisedChecker = Option_.all_.keyMappings.checker_ ? Promise.resolve() : import2_("./options_checker.js");
  const t2 = time, d2 = new_data;
  promisedChecker.then(() => {
    setTimeout(_importSettings, 17, t2, d2, is_recommended);
  });
}

const fileInput = $("#settingsFile");

fileInput.onclick = null;

fileInput.onchange = function() {
  const file = this.files[0];
  this.value = "";
  if (!file) {
    return;
  }
  const max_size = Option_.all_.vimSync.previous_ ? 102400 /* GlobalConsts.SYNC_QUOTA_BYTES */ : 10485760 /* GlobalConsts.LOCAL_STORAGE_BYTES */;
  if (file.size && file.size > max_size) {
    alert(oTrans_("JSONTooLarge", [ file.name, max_size / 1024 ]));
    return;
  }
  const reader = new FileReader, lastModified = file.lastModified || file.lastModifiedDate || 0;
  reader.onload = function() {
    let result = this.result;
    return importSettings_(lastModified, result, false);
  };
  reader.readAsText(file);
};

const importTypeSelect = $("#importOptions");

importTypeSelect.onclick = null;

importTypeSelect.onchange = function() {
  $("#importButton").focus();
  if (this.value === "exported") {
    simulateClick_(fileInput);
    return;
  }
  const recommended = "../settings-template.json";
  fetch(recommended).then(r => r.text()).then(t => importSettings_(0, t, true));
  return;
};

delayed_task && (() => {
  const arr = delayed_task;
  clear_delayed_task();
  const node = $(arr[0]), event = arr[1];
  node.onclick && node.onclick(event);
})();

function parseJSON_(text) {
  const notLFRe = /[^\r\n]+/g, errMsgRe = /\b(?:position (\d+)|line (\d+) column (\d+))/, stringOrCommentRe = /"(?:\\[^\r\n]|[^"\\\r\n])*"|'(?:\\[^\r\n]|[^'\\\r\n])*'|(?:\/\/|#)[^\r\n]*|\/\*[^]*?\*\//g;
  if (!text || !(text = text.trimRight())) {
    return null;
  }
  let match, kSpaces = " ";
  try {
    const obj = JSON.parse(text.replace(stringOrCommentRe, onReplace));
    clean();
    return obj;
  } catch (e) {
    match = errMsgRe.exec(e + "");
    clean();
    if (!match || !match[0]) {
      throw e;
    }
  }
  let err_line, err_offset;
  if (match[2]) {
    err_line = +match[2];
    err_offset = +match[3];
  } else if (+match[1] > 0) {
    const lineEnd = text.includes("\r") ? text.includes("\r\n") ? "\r\n" : "\r" : "\n", arr = text.slice(0, +match[1]).split(lineEnd);
    err_line = arr.length;
    err_offset = arr[err_line - 1].length + 1;
  } else {
    err_line = err_offset = 1;
  }
  return new SyntaxError(err_line + ":" + err_offset);
  function clean() {
    return /a?/.test("");
  }
  function spaceN(str) {
    let n = str.length;
    for (;kSpaces.length < n; kSpaces += kSpaces) {}
    return kSpaces.slice(0, n);
  }
  function onReplace(str) {
    let ch = str[0];
    return ch === "/" || ch === "#" ? str.startsWith("/*") ? str.replace(notLFRe, spaceN) : spaceN(str) : str;
  }
}