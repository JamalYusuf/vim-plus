"use strict";
__filename = "background/help_dialog.js";
define([ "require", "exports", "./store", "./utils", "./browser", "./i18n" ], (require, exports, store_1, BgUtils_, browser_1, i18n_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.normalizeCmdName_ = exports.render_ = void 0;
  BgUtils_ = __importStar(BgUtils_);
  let html_ = null;
  let i18n_;
  const descriptions_ = new Map;
  const parseHTML = template => {
    const noShadow = false, noAllInitial = false /* BrowserVer.CSS$All$$initial$MayBreakHelpDialog */ /* BrowserVer.CSS$All$$initial$MayBreakHelpDialog */ , noContain = false /* BrowserVer.CSS$Contain$BreaksHelpDialogSize */ /* BrowserVer.CSS$Contain$BreaksHelpDialogSize */;
    let pos = template.indexOf("</style>") + 8, head = template.slice(0, pos), body = template.slice(pos).trim();
    if (noShadow || noContain || noAllInitial) {
      noContain && (head = head.replace(/contain:[\w\s!]+/g, "contain: none !important"));
      noAllInitial && (head = head.replace("initial", "inherit"));
      noShadow && (head = head.replace(/[#.][A-Z][^,{};]*[,{]/g, "#VimiumUI $&"));
    }
    body = body.replace(/\$(\w+)/g, (_, s) => {
      var _a;
      return (_a = i18n_.get(s)) !== null && _a !== void 0 ? _a : s;
    });
    const wiki = browser_1.browser_.runtime.getURL("pages/wiki.html");
    const options = browser_1.browser_.runtime.getURL("pages/options.html");
    const consts = BgUtils_.safer_({
      homePage: wiki,
      wikiPage: wiki,
      wikiKeys: wiki + "#keys",
      wikiHashbangs: wiki + "#hashbangs",
      wikiPanel: wiki + "#side-panel",
      wikiFaq: wiki + "#faq",
      wikiPalette: wiki + "#command-palette",
      wikiDaily: wiki + "#daily-loop",
      optionsPage: options,
      version: store_1.CONST_.VerName_,
      release: wiki + "#changelog",
      reviewPage: wiki + "#about",
      webStore: "",
      // Real Chrome keyboard-shortcut manager (not a wiki page)
      browserHelp: "chrome://extensions/shortcuts",
      authorSite: "https://jamal.dev"
    });
    body = body.replace(/\{\{(\w+)}}/g, (_, group) => consts[group] || _);
    return [ head, body ];
  };
  const render_ = (isOptionsPage, showNames) => {
    i18n_ = store_1.helpDialogData_[1];
    if (!html_ || store_1.helpDialogData_[0]) {
      html_ = parseHTML(store_1.helpDialogData_[0]);
      store_1.helpDialogData_[0] = "";
    }
    const commandToKeys = new Map, hideUnbound = !isOptionsPage;
    showNames = isOptionsPage || !!showNames;
    store_1.keyToCommandMap_.forEach((registry, key) => {
      if (/^<v-.\w*>/.test(key)) {
        return;
      }
      let rawCommand = registry.command_;
      if (registry.alias_ === 38 /* kBgCmd.runKey */ && registry.background_) {
        store_1.inlineRunKey_(registry);
        rawCommand = registry.command_;
      }
      const command = exports.normalizeCmdName_(rawCommand);
      let keys = commandToKeys.get(command);
      keys ? keys.push([ key, registry ]) : commandToKeys.set(command, [ [ key, registry ] ]);
    });
    const title2 = isOptionsPage ? " " + i18n_.get("cmdList") : "";
    const result = BgUtils_.safer_({
      title2: title2 && (title2.includes(" ", 1) ? title2 : title2.trimLeft()),
      name2: " - " + i18n_1.extTrans_("name").split(" - ")[1],
      tip: showNames && i18n_.get("tipClickToCopy") || "",
      lbPad: showNames ? '\n\t\t<tr><td class="HelpTd TdBottom">&#160;</td></tr>' : ""
    });
    const div = html_[1].replace(/\{\{(\w+)}}/g, (_, group) => {
      var _a;
      return (_a = result[group]) !== null && _a !== void 0 ? _a : renderGroup(group, commandToKeys, hideUnbound, showNames);
    });
    return html_[0] + div;
  };
  exports.render_ = render_;
  const includes = (name, part) => name.includes(part);
  const startsWith = (name, tail) => name.startsWith(tail);
  const endsWith = (name, tail) => name.endsWith(tail);
  const normalizeCmdName_ = command => {
    includes(command, "Mode") && includes(command, ".activate") && (command = includes(command, "ModeTo") ? command.replace("ModeTo", "") : command.replace("Mode", ""));
    endsWith(command, "Unhover") ? command = command.replace("Unhover", "Leave") : endsWith(command, "Goto") ? command = command.replace("Goto", "") : command === "clearContentSetting" ? command = `${command}s` : includes(command, "CS") ? command = startsWith(command, "clear") ? "clearContentSettings" : command.replace("CS", "ContentSetting") : includes(command, "vateUrl") ? command = command.replace("vateUrl", "vateEditUrl") : endsWith(command, "TabSelection") ? command = command.replace("TabSelection", "Tabs") : command === "quickNext" /* kShortcutAliases.nextTab1 */ ? command = "nextTab" : command === "newTab" ? command = "createTab" : command === "closeSomeOtherTabs" ? command = "closeOtherTabs" : command === "simBackspace" ? command = "simulateBackspace" : command === "showHUD" || command === "showHud" ? command = "showTip" : command === "wait" && (command = "blank");
    return command;
  };
  exports.normalizeCmdName_ = normalizeCmdName_;
  const renderGroup = (group, commandToKeys, hideUnbound, showNames) => {
    const cmdParams = i18n_.get("cmdParams") || " (use *)";
    let html = "";
    const cmdList = commandGroups_[group];
    for (let i = 0; i < cmdList.length; i++) {
      const command = cmdList[i];
      let keys = commandToKeys.get(command);
      if (hideUnbound && !keys) {
        continue;
      }
      const isAdvanced = i < cmdList.length - 1 && cmdList[i + 1] === 1;
      isAdvanced && i++;
      const _next = i < cmdList.length - 1 ? cmdList[i + 1] : "a";
      const params = _next[0] === "$" ? (i++, _next.slice(1)) : "";
      let keyLen = -2, bindings = "", description = descriptions_.get(command);
      if (!description) {
        description = [ i18n_.get(command).replace("<", "&lt;").replace(">", "&gt;"), params ? cmdParams.replace("*", () => params) : " " ];
 // lgtm [js/incomplete-sanitization]
                descriptions_.set(command, description);
        description || console.log("Assert error: lack a description for %c%s", "color:red", command);
      }
      if (keys && keys.length > 0) {
        bindings = '\n\t\t<span class="HelpKey">';
        for (let i = 0; i < keys.length; i++) {
          if (keyLen > 42 && i < keys.length - 1) {
            bindings += `</span>\n\t<span>+ ${keys.length - i} \u2026`;
            break;
          }
          const item = keys[i];
          const key = BgUtils_.escapeText_(item[0]);
          keyLen >= 0 && (bindings += '</span> <span class="HelpKey">');
          bindings += key;
          keyLen += item[0].length + 2;
        }
        bindings += "</span>\n\t";
      }
      const curDesc = showNames ? description[0] + description[1] : description[0];
      // keep rendering if not hideUnbound
            if (keyLen <= 12) {
        html += commandHTML_(isAdvanced, bindings, curDesc, showNames ? command : "");
      } else {
        html += commandHTML_(isAdvanced, bindings, "", "");
        html += commandHTML_(isAdvanced, "", curDesc, showNames ? command : "");
      }
    }
    return html;
  };
  const commandHTML_ = (isAdvanced, bindings, description, command) => {
    let html = isAdvanced ? '<tr class="HelpAdv">\n\t' : "<tr>\n\t";
    if (description) {
      html += '<td class="HelpTd HelpKeys">';
      html += bindings;
      html += '</td>\n\t<td class="HelpTd HelpCommandInfo">';
      html += description;
      if (command) {
        html += '<span class="HelpCommandName" role="button">(';
        html += command;
        html += ")</span>\n\t";
      }
    } else {
      html += '<td class="HelpTd HelpKeys HelpLongKeys" colspan="2">';
      html += bindings;
    }
    return html + "</td>\n</tr>\n";
  };
  const commandGroups_ = {
    pageNavigation: [ "LinkHints.activate", '$button=""/right, touch=false/true/"auto"', "LinkHints.activateOpenInNewTab", "LinkHints.activateOpenInNewForegroundTab", "LinkHints.activateWithQueue", "scrollDown", "$keepHover=true|false|auto|never", "scrollUp", "$keepHover=true|false|auto|never", "scrollLeft", "scrollRight", "scrollToTop", "scrollToBottom", "scrollToLeft", 1, "scrollToRight", 1, "scrollPageDown", "scrollPageUp", "scrollPxDown", 1, "scrollPxUp", 1, "scrollPxLeft", 1, "scrollPxRight", 1, "scrollFullPageDown", "scrollFullPageUp", "scrollSelect", 1, '$dir=down|up, position=""|begin|end', "reload", "$hard", "reloadTab", "reloadGivenTab", 1, "$hard", "zoom", "$in, out, reset", "zoomIn", 1, "zoomOut", 1, "zoomReset", 1, "toggleUrl", 1, "toggleViewSource", 1, "copyCurrentUrl", "$type=url/title/frame, decoded", "copyCurrentTitle", "switchFocus", '$flash, select=""/all/all-line/start/end', "focusInput", '$keep, select=""/all/all-line/start/end', "LinkHints.activateCopyLinkUrl", "LinkHints.activateCopyLinkText", "$join:boolean/string", "openCopiedUrlInCurrentTab", "openCopiedUrlInNewTab", "goUp", "$trailingSlash=null/true/false", "goToRoot", "LinkHints.activateCopyImage", 1, "$richText=safe", "LinkHints.activateDownloadImage", 1, "LinkHints.activateOpenImage", 1, "$auto=true", "LinkHints.activateDownloadLink", 1, "LinkHints.activateOpenIncognito", 1, "LinkHints.activateOpenUrl", 1, "LinkHints.activateFocus", "LinkHints.activateHover", 1, "$showUrl=true", "LinkHints.activateLeave", 1, "LinkHints.unhoverLast", 1, "LinkHints.activateSearchLinkText", "LinkHints.activateEdit", "LinkHints.activateSelect", "$visual=true, caret, then:{}", "LinkHints.click", "$direct=true|element|sel|focus|click|sel,focus,click", "simulateBackspace", "dispatchEvent", 1, '$key="key,keyCode,code",init:{}', "goNext", "$sed=true, patterns:string, rel:string, noRel, isNext", "goPrevious", "nextFrame", "mainFrame", "parentFrame", "enterInsertMode", "$key:string, unhover, reset", "enterVisualMode", "enterVisualLineMode", "Marks.activateCreate", "$swap", "Marks.activate", "$prefix=true, swap, mapKey", "Marks.clearLocal", 1, "Marks.clearGlobal", 1, "openUrl", "$url:string, urls:string[], reuse=newFg/current/newBg/reuse, incognito, window, position", "focusOrLaunch", 1, "$url:string, prefix" ],
    vomnibarCommands: [ "Vomnibar.activate", '$keyword="", url:boolean/string', "Vomnibar.activateInNewTab", "$keyword, url", "Vomnibar.activateBookmarks", "Vomnibar.activateBookmarksInNewTab", "Vomnibar.activateHistory", "Vomnibar.activateHistoryInNewTab", "Vomnibar.activateTabs", "Vomnibar.activateWindows", 1, "Vomnibar.activateEditUrl", 1, "Vomnibar.activateEditUrlInNewTab", 1, "LinkHints.activateOpenVomnibar", "$url, newtab, then:{}", "toggleVomnibarStyle", 1, "$style=dark, current" ],
    historyNavigation: [ "goBack", "$reuse=current/newBg/newFg", "goForward", "reopenTab", 1 ],
    findCommands: [ "enterFindMode", "$last, selected=true", "performFind", "performBackwardsFind", "performAnotherFind", "findSelected", "$selected=line/any/auto-line", "findSelectedBackwards", "clearFindHistory", 1 ],
    tabManipulation: [ "nextTab", "$blur, wrap=true", "previousTab", "$blur, wrap=true", "firstTab", "lastTab", "createTab", "duplicateTab", "removeTab", '$keepWindow=""/always, mayClose, goto=""/left/right/previous', "removeRightTab", 1, "restoreTab", "restoreGivenTab", 1, "discardTab", 1, "moveTabToNextWindow", 1, "$last, position, right=true, tabs", "moveTabToNewWindow", 1, "$limited=null/true/false", "moveTabToIncognito", 1, "joinTabs", "sortTabs", "$sort=recency|createTime", "toggleTabGroup", 1, "$title, color", "collapseTabGroup", 1, "$collapsed", "renameTabGroup", 1, "$title, color", "moveTabToGroup", 1, "$title", "openSidePanel", 1, "addToReadingList", 1, "toggleBookmark", 1, "cycleWindows", 1, "dockWindow", 1, "$direction=left|right|up|down|max|center, step, first", "dockWindowLeft", 1, "dockWindowRight", 1, "dockWindowUp", 1, "dockWindowDown", 1, "dockWindowMax", 1, "showLastDownload", 1, "$open", "openDownloads", 1, "openHistoryPage", 1, "openExtensions", 1, "openShortcuts", 1, "enterPictureInPicture", 1, "togglePinTab", "toggleMuteTab", "$all, other", "visitPreviousTab", "$blur, acrossWindows, onlyActive", "closeTabsOnLeft", 1, "$$count=0", "closeTabsOnRight", 1, "$$count=0", "closeOtherTabs", 1, '$filter=""/url/url+hash/url+title', "moveTabLeft", 1, "$group=true", "moveTabRight", 1, "$group=true", "toggleContentSetting", 1, "$type=images", "enableContentSettingTemp", 1, "clearContentSettings", 1, "copyWindowInfo", 1, '$format="${title}: ${url}", join:true/string, decoded', "captureTab", "toggleWindow", '$states="normal,maximized"' ],
    misc: [ "showHelp", "autoCopy", "$text: string, url, decoded", "autoOpen", "searchAs", "$copied=true, selected=true", "searchInAnother", "$keyword, reuse=current/newFg/newBg/reuse", "showTip", "$text:string", "openBookmark", "$title, path", "addBookmark", 1, "$folder:string", "toggleStyle", 1, "$id/selector:string, css: string", "toggleLinkHintCharacters", 1, "$value:string", "editText", 1, "$run:string, dom=false", "toggleSwitchTemp", 1, "$key:string, [value:any]", "passNextKey", 1, "$expect:string, normal", "debugBackground", 1, "reset", 1, "runKey", 1, "$expect:Envs, keys:KeySequence[]|string", "sendToExtension", 1, "$id:string, data:any, raw", "confirm", 1, "$ask:string, $then, $else", "blank", 1 ]
  };
  commandGroups_.misc.push("closeDownloadBar", 1);
  store_1.IsEdg_ && commandGroups_.tabManipulation.push("toggleReaderMode", 1);
});