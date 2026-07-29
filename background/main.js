"use strict";
__filename = "background/main.js";
define([ "require", "exports", "./store", "./utils", "./browser", "./settings", "./ports", "./key_mappings", "./run_commands", "./side_panel", "./normalize_urls", "./parse_urls", "./exclusions", "./ui_css", "./eval_urls", "./open_urls", "./all_commands", "./request_handlers", "./tools" ], (require, exports, store_1, BgUtils_, browser_1, settings_, ports_1, key_mappings_1, run_commands_1, side_panel_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  BgUtils_ = __importStar(BgUtils_);
  settings_ = __importStar(settings_);
  const executeShortcutEntry = cmd => {
    const ref = store_1.framesForTab_.get(store_1.curTabId_);
    cmd === "quickNext" /* kShortcutAliases.nextTab1 */ && (cmd = "nextTab");
    const map = key_mappings_1.shortcutRegistry_;
    if (store_1.bgIniting_ !== 6 /* BackendHandlersNS.kInitStat.FINISHED */) {} else if (map && map.get(cmd)) {
      ref == null || ref.flags_ & 4 /* Frames.Flags.userActed */ || store_1.curTabId_ < 0 ? run_commands_1.executeShortcut(cmd, ref) : browser_1.tabsGet(store_1.curTabId_, tab => {
        run_commands_1.executeShortcut(cmd, tab && tab.status === "complete" ? store_1.framesForTab_.get(tab.id) : null);
        return browser_1.runtimeError_();
      });
    } else {
      // usually, only userCustomized* and those from 3rd-party extensions will enter this branch
      if (map && map.get(cmd) !== null) {
        map.set(cmd, null);
        console.log("Shortcut %o has not been configured.", cmd);
      }
      ref && store_1.set_cPort(ref.cur_);
      ports_1.showHUD(`Shortcut "${cmd}" has not been configured.`);
    }
  };
  store_1.set_onInit_(() => {
    if (store_1.bgIniting_ !== 6 /* BackendHandlersNS.kInitStat.FINISHED */) {
      return;
    }
    if (store_1.onInit_) {
      BgUtils_.nextTick_(settings_.ready_.then.bind(settings_.ready_, store_1.onInit_));
      store_1.set_onInit_(null);
      return;
      // all code below requires all necessary have inited when calling this
        }
    if (!store_1.keyFSM_) {
      settings_.postUpdate_("keyMappings");
      store_1.os_ || (key_mappings_1.visualKeys_["m-s-c"] = 36 /* VisualAction.YankRichText */);
    }
    settings_.postUpdate_("exclusionListenHash");
    settings_.postUpdate_("vomnibarOptions");
    // media watchers should be setup after vomnibarOptions
    settings_.postUpdate_("autoDarkMode");
    settings_.postUpdate_("autoReduceMotion");
    browser_1.browser_.runtime.onConnectExternal.addListener(port => {
      let arr, {sender, name} = port;
      if (sender && ports_1.isExtIdAllowed(sender) && name.startsWith("vim-plus." /* PortNameEnum.Prefix */) && (arr = name.split("@" /* PortNameEnum.Delimiter */)).length > 1) {
        if (arr[1] !== store_1.CONST_.GitVer) {
          port.postMessage({
            N: 2 /* kBgReq.injectorRun */ ,
            t: 1
 /* InjectorTask.reload */          });
          port.disconnect();
          return;
        }
        ports_1.OnConnect(port, arr[0].slice(9 /* PortNameEnum.PrefixLen */) | 1024 /* PortType.otherExtension */);
      } else {
        port.disconnect();
      }
    });
    browser_1.browser_.extension.isAllowedIncognitoAccess(isAllowedAccess => {
      store_1.CONST_.DisallowIncognito_ = isAllowedAccess === false;
    });
  });
  {
    let lacking = store_1.bgC_.map((i, ind) => i ? -1 : ind).filter(i => i >= 0);
    if (lacking.length > 0) {
      throw new Error("Some functions in bgC_ are not inited: " + lacking.join(", "));
    }
    lacking = store_1.reqH_.map((i, ind) => i ? -1 : ind).filter(i => i >= 0);
    if (lacking.length > 0) {
      throw new Error("Some functions in reqH_ are not inited: " + lacking.join(", "));
    }
  }
  browser_1.browser_.runtime.onConnect.addListener(port => {
    if (store_1.bgIniting_ !== 6 /* BackendHandlersNS.kInitStat.FINISHED */) {
      port.disconnect();
      return;
    }
    return ports_1.OnConnect(port, port.name | 0);
  });
  browser_1.browser_.commands.onCommand.addListener(cmd => {
    // chrome.commands is a privileged user gesture — open side panel with no await hop.
    if (cmd === "openSidePanel") {
      side_panel_1.openSidePanelImmediate_() || side_panel_1.openSidePanelBestEffort_(null).then(ok => {
        ok || side_panel_1.explainSidePanelGesture_();
      });
      return;
    }
    executeShortcutEntry(cmd);
  });
  settings_.ready_.then(() => {
    settings_.postUpdate_("extAllowList");
    browser_1.browser_.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
      // https://stackoverflow.com/questions/66618136#:~:text=If%20you%20also%20use%20sendMessage
      const requireResp = false;
      if (!ports_1.isExtIdAllowed(sender)) {
        sendResponse(false);
        return;
      }
      if (typeof message === "string") {
        run_commands_1.executeExternalCmd({
          command: message
        }, sender);
      } else if (typeof message === "object" && message) {
        switch (message.handler) {
         case "shortcut" /* kFgReq.shortcut */ :
          let shortcut = message.shortcut;
          shortcut && executeShortcutEntry(shortcut + "");
          break;

         case "id" /* kFgReq.id */ :
          sendResponse({
            name: "Vim+",
            host: location.host,
            shortcuts: true,
            injector: store_1.CONST_.Injector_,
            version: store_1.CONST_.VerCode_
          });
          return;

         case 99 /* kFgReq.inject */ :
          sendResponse({
            s: message.scripts ? store_1.CONST_.ContentScripts_ : null,
            version: store_1.CONST_.VerCode_,
            host: "",
            h: "@" /* PortNameEnum.Delimiter */ + store_1.CONST_.GitVer
          });
          return;

         case "command" /* kFgReq.command */ :
          run_commands_1.executeExternalCmd(message, sender);
          break;
        }
      }
      requireResp && sendResponse(true);
    });
    settings_.postUpdate_("vomnibarPage", null);
    settings_.postUpdate_("searchUrl", null);
 // will also update newTabUrl
    });
  // Not exist on Thunderbird
  browser_1.Tabs_.onReplaced.addListener((addedTabId, removedTabId) => {
    const frames = store_1.framesForTab_.get(removedTabId);
    store_1.lastKeptTabId_ === removedTabId && store_1.set_lastKeptTabId_(addedTabId);
    if (!frames) {
      return;
    }
    store_1.framesForTab_.delete(removedTabId);
    store_1.framesForTab_.set(addedTabId, frames);
    for (const port of frames.ports_) {
      port.s.tabId_ = addedTabId;
    }
    frames.cur_.s.tabId_ = addedTabId;
    for (const port of store_1.framesForOmni_) {
      port.s.tabId_ === removedTabId && (port.s.tabId_ = addedTabId);
    }
  });
  store_1.Completion_.filter_ = (a, b, c) => {
    setTimeout(() => {
      store_1.Completion_.filter_(a, b, c);
    }, 210);
  };
  store_1.set_bgIniting_(store_1.bgIniting_ | 4 /* BackendHandlersNS.kInitStat.main */);
  store_1.onInit_();
  browser_1.browser_.runtime.getManifest().content_scripts.length === 1 && browser_1.browser_.scripting.registerContentScripts([ {
    id: "extend_click",
    js: [ "content/extend_click_vc.js" ],
    matches: [ "<all_urls>" ],
    allFrames: true,
    runAt: "document_start",
    world: "MAIN"
  } ]).catch(err => {
    const msg = err + "";
    msg.includes("Duplicate script ID") || console.log("Can not register extend_click:", err);
  });
  // @ts-ignore // will run only on <kbd>F5</kbd>, not on runtime.reload
});