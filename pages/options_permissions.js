import { $, OnEdge, browser_, OnFirefox, OnChrome, nextTick_, CurCVer_, IsEdg_, post_, pageLangs_, prevent_ } from "./async_bg.js";

import { Option_, oTrans_, bgSettings_, delayBinding_ } from "./options_base.js";

import { registerClass_, createNewOption_, TextOption_ } from "./options_defs.js";

// When loading Vim+ on Chrome 60 startup using scripts/chrome2.sh, an options page may have no chrome.permissions
const _rawPermissionAPI = browser_.permissions;

const wrapApi = funcName => {
  if (!_rawPermissionAPI) {
    return function() {
      return post_(25 /* kPgReq.callApi */ , {
        module: "permissions",
        name: funcName,
        args: [].slice.call(arguments)
      });
    };
  }
  const func = _rawPermissionAPI[funcName];
  return function() {
    const arr = [].slice.call(arguments);
    return new Promise(resolve => {
      arr.push(res => {
        const err = browser_.runtime.lastError;
        resolve(err ? [ void 0, err ] : [ res, void 0 ]);
        return err;
      });
      func.apply(_rawPermissionAPI, arr);
    });
  };
};

const browserPermissions_ = {
  contains: wrapApi("contains"),
  request: wrapApi("request"),
  remove: wrapApi("remove")
};

const navPermissions_ = navigator.permissions;

const kShelf = "downloads.shelf", kNTP = "chrome://new-tab-page/*", kCrURL = "chrome://*/*";

const i18nItems = {
  "clipboard-read": "opt_clipboardRead",
  [kCrURL]: "opt_chromeUrl",
  [kNTP]: "opt_cNewtab",
  [kShelf]: "opt_closeShelf"
};

const placeholder = $("#optionalPermissionsTemplate");

const template = placeholder.content.firstElementChild;

const container = placeholder.parentElement;

const navPermissionTip = $("#navPermissionTip");

const gotoCrSC = $("#gotoCrSC");

const shownItems = [];

export const manifest_ = browser_.runtime.getManifest();

let optional_permissions = manifest_.optional_permissions || [];

const navNames = [ "clipboard-read" ];

export class OptionalPermissionsOption_ extends Option_ {
  init_() {
    delayBinding_(this.element_, "change", this.onUpdated_);
  }
  readValueFromElement_() {
    return shownItems.map(i => i.element_.indeterminate ? "1" : i.element_.checked ? "2" : "0").join("");
  }
  innerFetch_() {
    return shownItems.map(i => i.previous_).join("");
  }
  populateElement_(value) {
    for (let i = 0; i < shownItems.length; i++) {
      const shown = shownItems[i];
      shown.element_.checked = value[i] === "2";
      shown.element_.indeterminate = value[i] === "1";
      shown.type_ === 2 && value[i] !== "1" && (shown.element_.parentElement.title = navPermissionTip.innerText);
    }
  }
  executeSave_(wanted_value) {
    const new_browser_permissions = [], new_origins = [];
    const new_nav_permissions = [];
    const changed = {};
    let waiting = 1, gotoCrContentSettings = false;
    for (let _ind = 0; _ind < shownItems.length; _ind++) {
      const i = shownItems[_ind], previous = i.previous_;
      const wanted = +wanted_value[_ind];
      if (previous === wanted) {
        continue;
      }
      const orig2 = i.name_ === kNTP ? "chrome://newtab/*" : "";
      i.previous_ = wanted;
      if (i.name_ === kCrURL && bgSettings_.get_("allBrowserUrls") !== (wanted === 2)) {
        waiting++;
        Promise.resolve(bgSettings_.get_("allBrowserUrls")).then(allBrowserUrls => {
          allBrowserUrls !== (wanted === 2) ? bgSettings_.set_("allBrowserUrls", wanted === 2).then(tryRefreshing) : tryRefreshing();
        });
      }
      if (i.type_ === 2) {
        wanted === 2 ? new_nav_permissions.push(i.name_) : gotoCrContentSettings = true;
      } else if (wanted) {
        i.name_ === kShelf && new_browser_permissions.push("downloads");
        (i.type_ === 1 ? new_origins : new_browser_permissions).push(i.name_);
        orig2 && new_origins.push(orig2);
        changed[i.name_] = i;
      } else {
        waiting++;
        browserPermissions_.remove(i.type_ === 1 ? {
          origins: orig2 ? [ i.name_, orig2 ] : [ i.name_ ]
        } : {
          permissions: i.name_ === kShelf ? [ "downloads", i.name_ ] : [ i.name_ ]
        }).then(([ok, err]) => {
          const msg1 = "Can not remove the permission %o : ", msg2 = err && err.message || err;
          (err || !ok) && console.log(msg1, i.name_, msg2);
          const box = i.element_.parentElement;
          TextOption_.showError_(err ? msg1.replace("%o", i.name_) + msg2 : "", void 0, box);
          tryRefreshing();
        });
      }
    }
    const cb = (arr, [ok, err]) => {
      (err || !ok) && console.log("Can not request permissions of %o :", arr, err && err.message || err);
      if (!ok) {
        for (const name of arr) {
          const item = changed[name];
          if (!item) {
            continue;
          }
          item.previous_ = 0;
          const box = item.element_.parentElement;
          if (!err) {
            TextOption_.showError_("", void 0, box);
            continue;
          }
          let msg = (err && err.message || JSON.stringify(err)) + "";
          if (name.startsWith("chrome://") && msg.includes("Only permissions specified in the manifest") && name.startsWith("chrome:")) {
            msg = oTrans_("optNeedChromeUrlFirst");
            msg = IsEdg_ ? msg.replace("chrome", "edge") : msg;
          }
          msg = oTrans_("exc") + msg;
          TextOption_.showError_(msg, void 0, box);
          nextTick_(() => {
            box.title = msg;
          });
        }
        this.fetch_();
      }
      tryRefreshing();
    };
    const tryRefreshing = () => {
      waiting--;
      if (waiting > 0) {
        return;
      }
      Promise.all(shownItems.map(doPermissionsContain_)).then(() => {
        this.fetch_();
        gotoCrContentSettings && gotoCrSC.click();
      });
    };
    waiting += (new_browser_permissions.length && 1) + (new_origins.length && 1);
    new_browser_permissions.length && browserPermissions_.request({
      permissions: new_browser_permissions
    }).then(cb.bind(0, new_browser_permissions));
    new_origins.length && browserPermissions_.request({
      origins: new_origins
    }).then(cb.bind(0, new_origins));
    if (new_nav_permissions.includes("clipboard-read")) {
      const clipboard = navigator.clipboard;
      waiting++;
      clipboard.readText().catch(() => {}).then(tryRefreshing);
    }
    tryRefreshing();
    return Promise.resolve(wanted_value);
  }
}

registerClass_("OptionalPermissions", OptionalPermissionsOption_);

const initOptionalPermissions = () => {
  const fragment = document.createDocumentFragment();
  let is_important = shownItems.some(i => i.name_ === "bookmarks");
  for (const shownItem of shownItems) {
    const name = shownItem.name_;
    const node = document.importNode(template, true);
    const checkbox = node.querySelector("input");
    const i18nKey = i18nItems[name];
    let i18nName = oTrans_(i18nKey || `opt_${name}`) || name;
    let suffix = "";
    if (name.startsWith("chrome:")) {
      i18nName = IsEdg_ ? i18nName.replace("chrome:", "edge:") : i18nName;
      suffix = oTrans_("optOfChromeUrl").replace(IsEdg_ ? "chrome" : "edge", "edge");
    }
    checkbox.name = name;
    is_important && (suffix += oTrans_("rec_perm"));
    checkbox.nextElementSibling.textContent = i18nName + suffix;
    if (name == "bookmarks" && fragment.childElementCount + 1 < shownItems.length) {
      node.classList.add("after-importants");
      is_important = false;
    }
    fragment.append(node);
    shownItem.element_ = checkbox;
  }
  if (optional_permissions.length !== 1 && (optional_permissions.length !== 2 || pageLangs_ !== "en")) {
    $("#optionalPermissionsHelp").classList.add("has-many");
    container.classList.add("has-many");
  }
  container.append(fragment);
  delayBinding_(container, "input", onInput, true);
  if (gotoCrSC) {
    delayBinding_(gotoCrSC, "click", onCrUrlClick, true);
    if (IsEdg_) {
      gotoCrSC.textContent = gotoCrSC.textContent.replace("chrome:", "edge:");
      gotoCrSC.href = gotoCrSC.href.replace("chrome:", "edge:");
    }
  }
};

const doPermissionsContain_ = item => {
  const {type_: type, name_: name} = item;
  return (type === 2 ? navPermissions_.query({
    name
  }).then(res => [ res.state === "prompt" ? 1 : res.state === "granted" ? 2 : 0, void 0 ], err => [ void 0, err ]) : browserPermissions_.contains(type === 1 ? {
    origins: [ name ]
  } : {
    permissions: name === kShelf ? [ "downloads", name ] : [ name ]
  })).then(([result]) => {
    const val = result ? item.type_ === 2 ? result : name !== kCrURL || bgSettings_.get_("allBrowserUrls") ? 2 : 1 : 0;
    item.previous_ = val;
  });
};

const onInput = e => {
  const el = e.target;
  const item = shownItems.find(i => i.element_ === el);
  if (!item) {
    if (el.localName === "label" || el.parentElement.localName === "label") {
      prevent_(e);
      e.stopImmediatePropagation();
    }
    return;
  }
  const value = el.checked;
  if (item.name_ === kCrURL || item.name_ === kNTP) {
    const isCurNTP = item.name_ === kNTP, theOtherName = isCurNTP ? kCrURL : kNTP;
    const theOther = shownItems.find(i => i.name_ === theOtherName);
    if (theOther) {
      if (isCurNTP && value && !theOther.element_.checked) {
        theOther.element_.checked = false;
        theOther.element_.indeterminate = true;
      } else if (!isCurNTP && value && el.indeterminate) {
        el.indeterminate = false;
      } else {
        theOther.element_.checked = value;
        theOther.element_.indeterminate = false;
      }
    }
  }
  item.type_ === 2 && (el.checked || (el.indeterminate = true));
};

const onCrUrlClick = e => {
  prevent_(e);
  post_(15 /* kPgReq.focusOrLaunch */ , {
    u: e.target.href,
    p: false
  });
};

{
  const ignored = [ kShelf ];
  IsEdg_ && ignored.push(kNTP);
  ignored.push("cookies");
  optional_permissions = optional_permissions.concat(manifest_.optional_host_permissions || []);
  // Modern Chrome rejects chrome:// (and similar) schemes in optional_host_permissions.
  // Keep only grantable host/permission entries for the optional-permissions UI.
  optional_permissions = optional_permissions.filter(i => !ignored.some(j => typeof j === "string" ? i === j : j.test(i)) && !/^(chrome|edge|devtools|chrome-extension):/i.test(i));
}

if (optional_permissions.length || navNames.length) {
  for (const name of navNames) {
    shownItems.push({
      name_: name,
      type_: 2,
      previous_: 1,
      element_: null
    });
  }
  for (const name of optional_permissions) {
    shownItems.push({
      name_: name,
      type_: name.includes(":") ? 1 : 0,
      previous_: 0,
      element_: null
    });
  }
  navPermissionTip && nextTick_(() => {
    navPermissionTip.style.display = "";
  });
  nextTick_(initOptionalPermissions, 9);
  Promise.all(shownItems.map(doPermissionsContain_)).then(() => {
    nextTick_(() => {
      container.dataset.model = "OptionalPermissions";
      createNewOption_(container).fetch_();
    });
  });
} else {
  nextTick_(() => {
    $("#optionalPermissionsHelp").style.display = "none";
  }, 9);
}

nextTick_(([inIncognito, onFileUrls]) => {
  if (browser_.extension.isAllowedIncognitoAccess) {
    browser_.extension.isAllowedIncognitoAccess(allowed => {
      inIncognito.checked = allowed;
    });
    browser_.extension.isAllowedFileSchemeAccess(allowed => {
      onFileUrls.checked = allowed;
    });
  } else {
    // 1. `chrome2 dist clean 126`
    // 2. open chrome://extensions/?id=hfjbmagddngcpeloejdejnfgbamkjaeg , and enable incognito
    // 3. close chrome, and then `chrome2 dist 126 exp`
    // 4. then `chrome.extension` only has `inIncognitoContext`
    post_(33 /* kPgReq.checkAllowingAccess */).then(([incognitoAccess, fileSchemeAccess]) => {
      inIncognito.checked = incognitoAccess;
      onFileUrls.checked = fileSchemeAccess;
    });
  }
  onFileUrls.onclick = inIncognito.onclick = event => {
    prevent_(event);
    post_(15 /* kPgReq.focusOrLaunch */ , {
      u: "chrome://extensions/?id=" + browser_.runtime.id,
      p: false
    });
  };
}, [ $("#in-incognito"), $("#on-file-urls") ]);