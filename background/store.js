"use strict";
__filename = "background/store.js";
define([ "require", "exports" ], (require, exports) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.CONST_ = exports.set_os_ = exports.set_CurFFVer_ = exports.set_runOnTee_ = exports.set_updateToLocal_ = exports.set_shownHash_ = exports.set_evalVimiumUrl_ = exports.set_substitute_ = exports.set_readInnerClipboard_ = exports.set_paste_ = exports.set_copy_ = exports.set_restoreSettings_ = exports.set_sync_ = exports.set_setIcon_ = exports.runOnTee_ = exports.shownHash_ = exports.updateToLocal_ = exports.evalVimiumUrl_ = exports.substitute_ = exports.readInnerClipboard_ = exports.paste_ = exports.copy_ = exports.restoreSettings_ = exports.sync_ = exports.setIcon_ = exports.getNextFakeTabId = exports.Completion_ = exports.blank_ = exports.set_offscreenPort_ = exports.replaceTeeTask_ = exports.set_focusAndExecuteOn_ = exports.set_inlineRunKey_ = exports.set_runOneMapping_ = exports.set_installation_ = exports.set_cmdInfo_ = exports.set_bgC_ = exports.set_reqH_ = exports.set_omniConfVer_ = exports.set_contentConfVer_ = exports.set_lastKeptTabId_ = exports.set_hasGroupPermission_ff_ = exports.set_iconData_ = exports.set_onInit_ = exports.set_bgIniting_ = exports.set_visualWordsRe_ = exports.set_needIcon_ = exports.set_isHighContrast_ff_ = exports.set_innerCSS_ = exports.set_findCSS_ = exports.set_vomnibarPage_f = exports.set_newTabUrl_f = exports.set_hasEmptyLocalStorage_ = exports.set_cEnv = exports.get_cEnv = exports.set_cRepeat = exports.set_cPort = exports.set_cOptions = exports.get_cOptions = exports.set_cKey = exports.set_mappedKeyTypes_ = exports.set_keyToCommandMap_ = exports.set_mappedKeyRegistry_ = exports.set_keyFSM_ = exports.set_helpDialogData_ = exports.set_findBookmark_ = exports.set_urlDecodingDict_ = exports.set_incognitoMarkCache_ = exports.set_incognitoFindHistoryList_ = exports.set_saveRecency_ = exports.set_curIncognito_ = exports.set_lastWndId_ = exports.set_curWndId_ = exports.set_curTabId_ = exports.set_lastVisitTabTime_ = exports.offscreenPort_ = exports.teeTask_ = exports.focusAndExecuteOn_ = exports.inlineRunKey_ = exports.runOneMapping_ = exports.cmdInfo_ = exports.bgC_ = exports.cRepeat = exports.cPort = exports.cKey = exports.innerClipboard_ = exports.mappedKeyTypes_ = exports.keyToCommandMap_ = exports.mappedKeyRegistry_ = exports.keyFSM_ = exports.findBookmark_ = exports.urlDecodingDict_ = exports.historyCache_ = exports.bookmarkCache_ = exports.incognitoMarkCache_ = exports.incognitoFindHistoryList_ = exports.saveRecency_ = exports.curIncognito_ = exports.lastWndId_ = exports.curWndId_ = exports.curTabId_ = exports.lastVisitTabTime_ = exports.recencyForTab_ = exports.framesForOmni_ = exports.framesForTab_ = exports.lastKeptTabId_ = exports.updateHooks_ = exports.reqH_ = exports.onInit_ = exports.bgIniting_ = exports.extAllowList_ = exports.newTabUrls_ = exports.helpDialogData_ = exports.iconData_ = exports.visualWordsRe_ = exports.needIcon_ = exports.isHighContrast_ff_ = exports.innerCSS_ = exports.findCSS_ = exports.omniConfVer_ = exports.contentConfVer_ = exports.vomnibarBgOptions_ = exports.omniPayload_ = exports.searchEngines_ = exports.contentPayload_ = exports.vomnibarPage_f = exports.newTabUrl_f = exports.storageCache_ = exports.settingsCache_ = exports.hasGroupPermission_ff_ = exports.hasEmptyLocalStorage_ = exports.UseZhLang_ = exports.Origin2_ = exports.installation_ = exports.os_ = exports.CurFFVer_ = exports.CurCVer_ = exports.IsEdg_ = exports.OnSafari = exports.OnEdge = exports.OnFirefox = exports.OnChrome = exports.OnOther_ = void 0;
  //#region platform info
    exports.OnOther_ = 1 /* Build.BTypes */;
  exports.OnChrome = true /* BrowserType.Chrome */ /* BrowserType.Chrome */;
  exports.OnFirefox = false /* BrowserType.Firefox */ /* BrowserType.Firefox */;
  exports.OnEdge = false /* BrowserType.Edge */ /* BrowserType.Edge */;
  exports.OnSafari = false /* BrowserType.Safari */ /* BrowserType.Safari */;
  const uad = navigator.userAgentData;
  const brands = uad.brands;
  let tmpBrand;
  exports.IsEdg_ = !!brands.find(i => i.brand.includes("Edge") || i.brand.includes("Microsoft"));
  exports.CurCVer_ = (tmpBrand = brands.find(i => i.brand.includes("Chromium"))) && parseInt(tmpBrand.version) > 82 ? parseInt(tmpBrand.version) : 0 | (navigator.userAgent.match(/\bChrom(?:e|ium)\/(\d+)/) || [ 0, 998 /* BrowserVer.assumedVer */ ])[1];
  exports.CurFFVer_ = 999 /* FirefoxBrowserVer.assumedVer */ /* FirefoxBrowserVer.assumedVer */;
  exports.os_ = 2 /* kOS.win */;
  exports.Origin2_ = location.origin + "/";
  exports.UseZhLang_ = navigator.language.startsWith("zh");
  //#endregion
  //#region runtime configuration
    exports.hasEmptyLocalStorage_ = false;
  exports.hasGroupPermission_ff_ = false;
  exports.settingsCache_ = {};
  exports.storageCache_ = new Map;
  exports.newTabUrl_f = "", exports.vomnibarPage_f = "";
  exports.contentPayload_ = {
    v: exports.CurCVer_,
    d: "",
    g: false,
    m: false
  };
  exports.searchEngines_ = {
    map: new Map,
    rules: [],
    keywords: null
  };
  exports.omniPayload_ = {
    v: exports.IsEdg_ ? -exports.CurCVer_ : exports.CurCVer_,
    c: "",
    i: 0,
    l: 0,
    m: null,
    n: 0,
    s: "",
    t: ""
  };
  exports.vomnibarBgOptions_ = {
    actions: [],
    maxBoxHeight_: 0
  };
  exports.contentConfVer_ = 0;
  exports.omniConfVer_ = 0;
  exports.needIcon_ = false;
  exports.newTabUrls_ = new Map;
  exports.extAllowList_ = new Map;
  exports.bgIniting_ = 0 /* BackendHandlersNS.kInitStat.START */;
  exports.updateHooks_ = {};
  exports.lastKeptTabId_ = -1;
  //#endregion
  //#region info about opened tabs
    exports.framesForTab_ = new Map;
  exports.framesForOmni_ = [];
  exports.recencyForTab_ = new Map;
  exports.lastVisitTabTime_ = 0;
  exports.curTabId_ = -1 /* GlobalConsts.TabIdNone */;
  exports.curWndId_ = -1 /* GlobalConsts.WndIdNone */;
  exports.lastWndId_ = -1 /* GlobalConsts.WndIdNone */;
  exports.curIncognito_ = 0 /* IncognitoType.ensuredFalse */ /* IncognitoType.mayFalse */;
  exports.saveRecency_ = null;
  //#endregion
  //#region navigation and finding/marking history
    exports.incognitoFindHistoryList_ = null;
  exports.incognitoMarkCache_ = null;
  exports.bookmarkCache_ = {
    bookmarks_: [],
    dirs_: [],
    status_: 0 /* CompletersNS.BookmarkStatus.notInited */ ,
    stamp_: 0
  };
  exports.historyCache_ = {
    history_: null,
    domains_: new Map,
    lastRefresh_: 0,
    updateCount_: 0,
    toRefreshCount_: 0
  };
  exports.urlDecodingDict_ = new Map;
  //#endregion
  //#region command context
    exports.keyFSM_ = null;
  exports.mappedKeyRegistry_ = null;
  exports.mappedKeyTypes_ = 0 /* kMapKey.NONE */;
  exports.innerClipboard_ = new Map;
  exports.cKey = 0 /* kKeyCode.None */;
  let cOptions = null;
  exports.cPort = null;
  /** any change to `cRepeat` should ensure it won't be `0` */  exports.cRepeat = 1;
  let cEnv = null;
  exports.teeTask_ = null;
  exports.offscreenPort_ = null;
  //#endregion
  //#region variable setter
    const set_lastVisitTabTime_ = _newLastVisit => {
    exports.lastVisitTabTime_ = _newLastVisit;
  };
  exports.set_lastVisitTabTime_ = set_lastVisitTabTime_;
  const set_curTabId_ = _newCurTabId => {
    exports.curTabId_ = _newCurTabId;
  };
  exports.set_curTabId_ = set_curTabId_;
  const set_curWndId_ = _newCurWndId => {
    exports.curWndId_ = _newCurWndId;
  };
  exports.set_curWndId_ = set_curWndId_;
  const set_lastWndId_ = _newLastWndId => {
    exports.lastWndId_ = _newLastWndId;
  };
  exports.set_lastWndId_ = set_lastWndId_;
  const set_curIncognito_ = _newIncog => exports.curIncognito_ = _newIncog;
  exports.set_curIncognito_ = set_curIncognito_;
  const set_saveRecency_ = _newRecSaver => {
    exports.saveRecency_ = _newRecSaver;
  };
  exports.set_saveRecency_ = set_saveRecency_;
  const set_incognitoFindHistoryList_ = l => exports.incognitoFindHistoryList_ = l;
  exports.set_incognitoFindHistoryList_ = set_incognitoFindHistoryList_;
  const set_incognitoMarkCache_ = _c => exports.incognitoMarkCache_ = _c;
  exports.set_incognitoMarkCache_ = set_incognitoMarkCache_;
  const set_urlDecodingDict_ = newDecoding => {
    exports.urlDecodingDict_ = newDecoding;
  };
  exports.set_urlDecodingDict_ = set_urlDecodingDict_;
  const set_findBookmark_ = newFind => {
    exports.findBookmark_ = newFind;
  };
  exports.set_findBookmark_ = set_findBookmark_;
  const set_helpDialogData_ = _newDat => exports.helpDialogData_ = _newDat;
  exports.set_helpDialogData_ = set_helpDialogData_;
  const set_keyFSM_ = _newKeyFSM => {
    exports.keyFSM_ = _newKeyFSM;
  };
  exports.set_keyFSM_ = set_keyFSM_;
  const set_mappedKeyRegistry_ = _newDict => {
    exports.mappedKeyRegistry_ = _newDict;
  };
  exports.set_mappedKeyRegistry_ = set_mappedKeyRegistry_;
  const set_keyToCommandMap_ = _newMap => {
    exports.keyToCommandMap_ = _newMap;
  };
  exports.set_keyToCommandMap_ = set_keyToCommandMap_;
  const set_mappedKeyTypes_ = _newTypes => {
    exports.mappedKeyTypes_ = _newTypes;
  };
  exports.set_mappedKeyTypes_ = set_mappedKeyTypes_;
  const set_cKey = _newKey => {
    exports.cKey = _newKey;
  };
  exports.set_cKey = set_cKey;
  const get_cOptions = () => cOptions;
  exports.get_cOptions = get_cOptions;
  const set_cOptions = _newOpts => {
    cOptions = _newOpts;
  };
  exports.set_cOptions = set_cOptions;
  const set_cPort = _newPort => {
    exports.cPort = _newPort;
  };
  exports.set_cPort = set_cPort;
  const set_cRepeat = _newRepeat => {
    exports.cRepeat = _newRepeat;
  };
  exports.set_cRepeat = set_cRepeat;
  const get_cEnv = () => cEnv;
  exports.get_cEnv = get_cEnv;
  const set_cEnv = _newEnv => {
    cEnv = _newEnv;
  };
  exports.set_cEnv = set_cEnv;
  const set_hasEmptyLocalStorage_ = _newEmpty => {
    exports.hasEmptyLocalStorage_ = _newEmpty;
  };
  exports.set_hasEmptyLocalStorage_ = set_hasEmptyLocalStorage_;
  const set_newTabUrl_f = _newNTP => {
    exports.newTabUrl_f = _newNTP;
  };
  exports.set_newTabUrl_f = set_newTabUrl_f;
  const set_vomnibarPage_f = _newOmniP => {
    exports.vomnibarPage_f = _newOmniP;
  };
  exports.set_vomnibarPage_f = set_vomnibarPage_f;
  const set_findCSS_ = _newFindCSS => {
    exports.findCSS_ = _newFindCSS;
  };
  exports.set_findCSS_ = set_findCSS_;
  const set_innerCSS_ = _newInnerCSS => {
    exports.innerCSS_ = _newInnerCSS;
  };
  exports.set_innerCSS_ = set_innerCSS_;
  const set_isHighContrast_ff_ = _newHC => {
    exports.isHighContrast_ff_ = _newHC;
  };
  exports.set_isHighContrast_ff_ = set_isHighContrast_ff_;
  const set_needIcon_ = _newNeedIcon => {
    exports.needIcon_ = _newNeedIcon;
  };
  exports.set_needIcon_ = set_needIcon_;
  const set_visualWordsRe_ = _newVisualWord => {
    exports.visualWordsRe_ = _newVisualWord;
  };
  exports.set_visualWordsRe_ = set_visualWordsRe_;
  const set_bgIniting_ = _newIniting_ => {
    exports.bgIniting_ = _newIniting_;
  };
  exports.set_bgIniting_ = set_bgIniting_;
  const set_onInit_ = _newInit => {
    exports.onInit_ = _newInit;
  };
  exports.set_onInit_ = set_onInit_;
  const set_iconData_ = _newIconData => {
    exports.iconData_ = _newIconData;
  };
  exports.set_iconData_ = set_iconData_;
  const set_hasGroupPermission_ff_ = _newAllowed => {
    exports.hasGroupPermission_ff_ = _newAllowed;
  };
  exports.set_hasGroupPermission_ff_ = set_hasGroupPermission_ff_;
  const set_lastKeptTabId_ = _newKeptTabId => {
    exports.lastKeptTabId_ = _newKeptTabId;
  };
  exports.set_lastKeptTabId_ = set_lastKeptTabId_;
  const set_contentConfVer_ = _newContConfVer => exports.contentConfVer_ = _newContConfVer;
  exports.set_contentConfVer_ = set_contentConfVer_;
  const set_omniConfVer_ = _newOmniConfVer => exports.omniConfVer_ = _newOmniConfVer;
  exports.set_omniConfVer_ = set_omniConfVer_;
  const set_reqH_ = _newRH => {
    exports.reqH_ = _newRH;
  };
  exports.set_reqH_ = set_reqH_;
  const set_bgC_ = _newBgC => {
    exports.bgC_ = _newBgC;
  };
  exports.set_bgC_ = set_bgC_;
  const set_cmdInfo_ = _newCmdInfo => {
    exports.cmdInfo_ = _newCmdInfo;
  };
  exports.set_cmdInfo_ = set_cmdInfo_;
  const set_installation_ = _newInstallation => {
    exports.installation_ = _newInstallation;
  };
  exports.set_installation_ = set_installation_;
  const set_runOneMapping_ = _newF => {
    exports.runOneMapping_ = _newF;
  };
  exports.set_runOneMapping_ = set_runOneMapping_;
  const set_inlineRunKey_ = _newInlineRunKey => {
    exports.inlineRunKey_ = _newInlineRunKey;
  };
  exports.set_inlineRunKey_ = set_inlineRunKey_;
  const set_focusAndExecuteOn_ = _newFAE => {
    exports.focusAndExecuteOn_ = _newFAE;
  };
  exports.set_focusAndExecuteOn_ = set_focusAndExecuteOn_;
  const replaceTeeTask_ = (expected, newTask) => {
    const old = exports.teeTask_, matches = !expected || old && old.i === expected;
    exports.teeTask_ = matches ? newTask : old;
    return matches ? old : null;
  };
  exports.replaceTeeTask_ = replaceTeeTask_;
  const set_offscreenPort_ = _newOffscrPort => {
    exports.offscreenPort_ = _newOffscrPort;
  };
  exports.set_offscreenPort_ = set_offscreenPort_;
  //#endregion
  //#region some shared util functions
    const blank_ = () => {};
  exports.blank_ = blank_;
  exports.Completion_ = {};
  let fakeTabId = -4 /* GlobalConsts.MaxImpossibleTabId */;
  const getNextFakeTabId = () => fakeTabId--;
  exports.getNextFakeTabId = getNextFakeTabId;
  exports.setIcon_ = exports.blank_;
  exports.sync_ = exports.blank_;
  exports.restoreSettings_ = null;
  exports.copy_ = () => "";
  let paste_ = () => "";
  exports.paste_ = paste_;
  let readInnerClipboard_ = () => "";
  exports.readInnerClipboard_ = readInnerClipboard_;
  let substitute_ = s => s;
  exports.substitute_ = substitute_;
  let evalVimiumUrl_ = () => null;
  exports.evalVimiumUrl_ = evalVimiumUrl_;
  exports.updateToLocal_ = null;
  exports.shownHash_ = null;
  const set_setIcon_ = _newSetIcon => {
    exports.setIcon_ = _newSetIcon;
  };
  exports.set_setIcon_ = set_setIcon_;
  const set_sync_ = _newSync => {
    exports.sync_ = _newSync;
  };
  exports.set_sync_ = set_sync_;
  const set_restoreSettings_ = _newRestore => {
    exports.restoreSettings_ = _newRestore;
  };
  exports.set_restoreSettings_ = set_restoreSettings_;
  const set_copy_ = _newCopy => {
    exports.copy_ = _newCopy;
  };
  exports.set_copy_ = set_copy_;
  const set_paste_ = _newPaste => {
    exports.paste_ = _newPaste;
  };
  exports.set_paste_ = set_paste_;
  const set_readInnerClipboard_ = _newRIC => {
    exports.readInnerClipboard_ = _newRIC;
  };
  exports.set_readInnerClipboard_ = set_readInnerClipboard_;
  const set_substitute_ = _newSed => {
    exports.substitute_ = _newSed;
  };
  exports.set_substitute_ = set_substitute_;
  const set_evalVimiumUrl_ = _newEval => {
    exports.evalVimiumUrl_ = _newEval;
  };
  exports.set_evalVimiumUrl_ = set_evalVimiumUrl_;
  const set_shownHash_ = _newHash => {
    exports.shownHash_ = _newHash;
  };
  exports.set_shownHash_ = set_shownHash_;
  const set_updateToLocal_ = _newBackup => {
    exports.updateToLocal_ = _newBackup;
  };
  exports.set_updateToLocal_ = set_updateToLocal_;
  const set_runOnTee_ = _newRunOnTee_ => {
    exports.runOnTee_ = _newRunOnTee_;
  };
  exports.set_runOnTee_ = set_runOnTee_;
  exports.set_CurFFVer_ = exports.blank_;
  exports.set_os_ = newOS => {
    exports.os_ = newOS;
  };
  //#endregion
    exports.CONST_ = {
    BrowserProtocol_: "chrome",
    BaseCSSLength_: 0,
    // should keep lower case
    NtpNewTab_: exports.IsEdg_ ? /^https:\/\/(ntp|www)\.msn\.\w+\/(edge|spartan)\/ntp\b/ : "chrome-search://local-ntp/local-ntp.html",
    DisallowIncognito_: false,
    ContentScripts_: null,
    VerCode_: "",
    VerName_: "",
    GitVer: "dev" /* BuildStr.Commit */ ,
    Injector_: "/lib/injector.js",
    TeeFrame_: "/front/vomnibar-tee.html",
    OffscreenFrame_: "/front/offscreen.html",
    HelpDialogJS: "/background/help_dialog.js",
    OptionsPage_: "pages/options.html" /* GlobalConsts.OptionsPage */ ,
    Platform_: "browser",
    BrowserName_: "",
    HomePage_: "https://jamal.dev",
    GlobalCommands_: null,
    ShowPage_: "/pages/show.html",
    VomnibarPageInner_: "",
    VomnibarScript_: "/front/vomnibar.js",
    VomnibarScript_f_: ""
  };
});