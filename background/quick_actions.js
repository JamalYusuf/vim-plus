"use strict";
__filename = "background/quick_actions.js";
define([ "require", "exports", "./browser", "./ports", "./store", "./run_commands", "./key_mappings" ], (require, exports, browser_1, ports_1, store_1, run_commands_1, key_mappings_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.runQuickAction_ = exports.restoreHighlightsOnTab_ = exports.qaIconType_ = exports.matchQuickActions_ = exports.QUICK_ACTIONS = exports.CATEGORY_ALIASES = void 0;
  const MS_MIN = 6e4;
  const MS_HOUR = 60 * MS_MIN;
  const MS_DAY = 24 * MS_HOUR;
  const FX_STYLE_ID = "vim-plus-page-fx";
  /** Category aliases for discovery: type `:view` / `:tab` / … to filter a group */  exports.CATEGORY_ALIASES = [ {
    cat: "Privacy",
    cmds: [ "priv", "privacy", "p" ],
    title: "Privacy",
    desc: "Shred sites, wipe tracking data"
  }, {
    cat: "History",
    cmds: [ "hist", "history", "h" ],
    title: "History",
    desc: "Clear or pause browsing history"
  }, {
    cat: "View",
    cmds: [ "view", "fx", "filter", "v" ],
    title: "View \xb7 page FX",
    desc: "Filters, spotlight, zen, device frames\u2026"
  }, 
  // Use "rd" only for category browse so :read / :reader run Reader View directly
  {
    cat: "Read",
    cmds: [ "rd", "reading" ],
    title: "Read \xb7 extract",
    desc: "Reader View, progress, highlights"
  }, {
    cat: "Tab",
    cmds: [ "tab", "tabs", "t" ],
    title: "Tab",
    desc: "Pin, mute, close, sleep, bookmark\u2026"
  }, {
    cat: "Window",
    cmds: [ "win", "window", "w", "dock" ],
    title: "Window",
    desc: "Dock, maximize, cycle windows"
  }, {
    cat: "Nav",
    cmds: [ "nav", "go", "browse" ],
    title: "Navigate",
    desc: "Back, forward, top, bottom, zoom"
  }, {
    cat: "Clip",
    cmds: [ "clip", "copy", "c" ],
    title: "Clipboard",
    desc: "URL, title, markdown article, tables\u2026"
  }, {
    cat: "Chrome",
    cmds: [ "chrome", "sys", "pages" ],
    title: "Chrome \xb7 system",
    desc: "Downloads, flags, shortcuts\u2026"
  }, {
    cat: "Vim+",
    cmds: [ "vim", "vp", "plus" ],
    title: "Vim+",
    desc: "Side panel, options, wiki, help"
  } ];
  exports.QUICK_ACTIONS = [ 
  // —— Privacy ——
  {
    id: "shred",
    cmd: "sh",
    title: "Shred domain\u2026",
    keys: [ "sh", "shred", "purge", "wipe" ],
    desc: "Wipe history + cookies/cache for a domain",
    cat: "Privacy",
    needsDomain: true
  }, {
    id: "shred-current",
    cmd: "sc",
    title: "Shred current site",
    keys: [ "sc", "shred-current", "purge-site" ],
    desc: "Wipe history + site data for this tab\u2019s domain",
    cat: "Privacy"
  }, {
    id: "clear-cookies",
    cmd: "ck",
    title: "Clear cookies (current site)",
    keys: [ "ck", "cookies", "clear-cookies" ],
    desc: "Remove cookies for this site only",
    cat: "Privacy"
  }, {
    id: "clear-cache",
    cmd: "cache",
    title: "Clear cache (current site)",
    keys: [ "cache", "clear-cache" ],
    desc: "Clear HTTP cache for this origin",
    cat: "Privacy"
  }, 
  // —— History ——
  {
    id: "h15",
    cmd: "h15",
    title: "Clear history \xb7 15 min",
    keys: [ "h15", "hist15" ],
    desc: "Delete history from the last 15 minutes",
    cat: "History"
  }, {
    id: "h1",
    cmd: "h1",
    title: "Clear history \xb7 1 hour",
    keys: [ "h1", "hist1", "dh" ],
    desc: "Delete history from the last hour",
    cat: "History"
  }, {
    id: "h24",
    cmd: "h24",
    title: "Clear history \xb7 24 hours",
    keys: [ "h24", "hist24", "today" ],
    desc: "Delete history from the last day",
    cat: "History"
  }, {
    id: "h7",
    cmd: "h7",
    title: "Clear history \xb7 7 days",
    keys: [ "h7", "hist7", "week" ],
    desc: "Delete history from the last week",
    cat: "History"
  }, {
    id: "hall",
    cmd: "hall",
    title: "Clear all history",
    keys: [ "hall", "histall" ],
    desc: "Delete all browsing history (cannot undo)",
    cat: "History"
  }, {
    id: "ph15",
    cmd: "ph15",
    title: "Pause history \xb7 15 min",
    keys: [ "ph15", "off15" ],
    desc: "Auto-delete new visits for 15 minutes",
    cat: "History"
  }, {
    id: "ph",
    cmd: "ph",
    title: "Pause history \xb7 1 hour",
    keys: [ "ph", "pause", "off" ],
    desc: "Auto-delete new visits for 1 hour",
    cat: "History"
  }, {
    id: "ph24",
    cmd: "ph24",
    title: "Pause history \xb7 24 hours",
    keys: [ "ph24", "off24" ],
    desc: "Auto-delete new visits for a day",
    cat: "History"
  }, {
    id: "ph-on",
    cmd: "phon",
    title: "Resume history",
    keys: [ "phon", "resume", "on" ],
    desc: "Cancel temporary history pause",
    cat: "History"
  }, 
  // —— View / page FX ——
  {
    id: "gray",
    cmd: "gray",
    title: "Grayscale",
    keys: [ "gray", "grey", "bw" ],
    desc: "Toggle monochrome filter",
    cat: "View"
  }, {
    id: "blue",
    cmd: "blue",
    title: "Blue filter",
    keys: [ "blue", "bluescreen" ],
    desc: "Toggle calm blue / night-ish filter",
    cat: "View"
  }, {
    id: "jumble",
    cmd: "jumble",
    title: "Jumble text",
    keys: [ "jumble", "scramble", "glitch" ],
    desc: "Toggle scrambled visible text",
    cat: "View"
  }, {
    id: "inv",
    cmd: "inv",
    title: "Invert colors",
    keys: [ "inv", "invert" ],
    desc: "Toggle color inversion",
    cat: "View"
  }, {
    id: "sepia",
    cmd: "sepia",
    title: "Sepia",
    keys: [ "sepia", "warm" ],
    desc: "Toggle warm sepia tone",
    cat: "View"
  }, {
    id: "blur",
    cmd: "blur",
    title: "Soft blur",
    keys: [ "blur", "soft" ],
    desc: "Toggle light page blur",
    cat: "View"
  }, {
    id: "contrast",
    cmd: "hicon",
    title: "High contrast",
    keys: [ "hicon", "contrast", "hc" ],
    desc: "Toggle higher contrast",
    cat: "View"
  }, {
    id: "dim",
    cmd: "dim",
    title: "Dim page",
    keys: [ "dim", "darken", "night" ],
    desc: "Toggle dimmed brightness",
    cat: "View"
  }, {
    id: "focus",
    cmd: "focus",
    title: "Focus column",
    keys: [ "focus", "col" ],
    desc: "Toggle focus column (dim the rest)",
    cat: "View"
  }, {
    id: "spotlight",
    cmd: "spot",
    title: "Spotlight",
    keys: [ "spot", "spotlight", "torch" ],
    desc: "Distraction-free window + blur except cursor (again = exit)",
    cat: "View"
  }, {
    id: "lens",
    cmd: "lens",
    title: "Focus lens",
    keys: [ "lens", "flens", "focuslens" ],
    desc: "Distraction-free + blur except paragraph under cursor",
    cat: "View"
  }, {
    id: "zen",
    cmd: "zen",
    title: "Zen window",
    keys: [ "zen", "app", "popup", "calm" ],
    desc: "Move tab into app-style window (no URL bar / tabs) \u2014 again exits",
    cat: "View"
  }, {
    id: "zenpage",
    cmd: "zenpage",
    title: "Zen page chrome",
    keys: [ "zenpage", "calm-page" ],
    desc: "Hide page nav/sidebars only (keeps normal browser window)",
    cat: "View"
  }, {
    id: "exitdf",
    cmd: "exitdf",
    title: "Exit distraction-free",
    keys: [ "exitdf", "normalwin", "undf" ],
    desc: "Restore normal browser window with URL bar",
    cat: "View"
  }, {
    id: "hideimg",
    cmd: "noimg",
    title: "Hide images",
    keys: [ "noimg", "hideimg", "imgs" ],
    desc: "Toggle hide images / video / SVG",
    cat: "View"
  }, {
    id: "iphone",
    cmd: "iphone",
    title: "Device \xb7 iPhone",
    keys: [ "iphone", "ios" ],
    desc: "Phone frame preview (body width 390px)",
    cat: "View"
  }, {
    id: "pixel",
    cmd: "pixel",
    title: "Device \xb7 Pixel",
    keys: [ "pixel", "android" ],
    desc: "Phone frame preview (Pixel width)",
    cat: "View"
  }, {
    id: "ipad",
    cmd: "ipad",
    title: "Device \xb7 iPad",
    keys: [ "ipad", "tablet" ],
    desc: "Tablet frame preview",
    cat: "View"
  }, {
    id: "galaxy",
    cmd: "galaxy",
    title: "Device \xb7 Galaxy",
    keys: [ "galaxy", "galxy", "samsung" ],
    desc: "Phone frame preview (Galaxy width)",
    cat: "View"
  }, {
    id: "desktop",
    cmd: "desk",
    title: "Device \xb7 Desktop",
    keys: [ "desk", "desktop", "dsk" ],
    desc: "Remove device frame \u2014 full width",
    cat: "View"
  }, {
    id: "mobile",
    cmd: "mobile",
    title: "Device \xb7 Mobile",
    keys: [ "mobile", "mobi" ],
    desc: "Generic mobile frame preview",
    cat: "View"
  }, {
    id: "clear-fx",
    cmd: "clear",
    title: "Clear page filters",
    keys: [ "clear", "nofx", "reset" ],
    desc: "Remove all View FX (gray/blue/jumble/\u2026)",
    cat: "View"
  }, {
    id: "off-view",
    cmd: "offv",
    title: "Clear view extras",
    keys: [ "offv", "noview" ],
    desc: "Off spotlight, zen, device frame, highlighter",
    cat: "View"
  }, 
  // —— Read / extract ——
  {
    id: "progress",
    cmd: "prog",
    title: "Reading progress",
    keys: [ "prog", "progress", "bar" ],
    desc: "Toggle top scroll progress bar (track + fill)",
    cat: "Read"
  }, {
    id: "hl",
    cmd: "hl",
    title: "Highlighter mode",
    keys: [ "hl", "highlight", "marker" ],
    desc: "Select text to mark; click mark to comment/remove (persists)",
    cat: "Read"
  }, {
    id: "hl-clear",
    cmd: "hlc",
    title: "Clear highlights",
    keys: [ "hlc", "unmark" ],
    desc: "Remove all highlights on this page (and from storage)",
    cat: "Read"
  }, {
    id: "reader",
    cmd: "read",
    title: "Reader View",
    keys: [ "read", "reader", "rv", "readable" ],
    desc: "Firefox-style Reader View (Mozilla Readability) \u2014 toggle",
    cat: "Read"
  }, 
  // —— Tab ——
  {
    id: "pin",
    cmd: "pin",
    title: "Toggle pin",
    keys: [ "pin", "unpin" ],
    desc: "Pin or unpin current tab",
    cat: "Tab"
  }, {
    id: "mute",
    cmd: "mute",
    title: "Toggle mute",
    keys: [ "mute", "unmute" ],
    desc: "Mute or unmute current tab",
    cat: "Tab"
  }, {
    id: "dup",
    cmd: "dup",
    title: "Duplicate tab",
    keys: [ "dup", "duplicate", "clone" ],
    desc: "Open a duplicate of this tab",
    cat: "Tab"
  }, {
    id: "sleep",
    cmd: "sleep",
    title: "Sleep tab",
    keys: [ "sleep", "discard" ],
    desc: "Discard tab to free memory",
    cat: "Tab"
  }, {
    id: "reload-hard",
    cmd: "rh",
    title: "Hard reload",
    keys: [ "rh", "hard", "bypass" ],
    desc: "Reload bypassing cache",
    cat: "Tab"
  }, {
    id: "reload",
    cmd: "r",
    title: "Reload tab",
    keys: [ "r", "reload" ],
    desc: "Normal reload",
    cat: "Tab"
  }, {
    id: "close",
    cmd: "x",
    title: "Close tab",
    keys: [ "x", "close", "kill" ],
    desc: "Close the current tab",
    cat: "Tab"
  }, {
    id: "close-others",
    cmd: "xo",
    title: "Close other tabs",
    keys: [ "xo", "only", "close-others" ],
    desc: "Close all tabs except this one",
    cat: "Tab"
  }, {
    id: "close-right",
    cmd: "xr",
    title: "Close tabs to the right",
    keys: [ "xr", "close-right" ],
    desc: "Close tabs to the right of current",
    cat: "Tab"
  }, {
    id: "new",
    cmd: "n",
    title: "New tab",
    keys: [ "n", "new", "nt" ],
    desc: "Open a new tab",
    cat: "Tab"
  }, {
    id: "restore",
    cmd: "u",
    title: "Restore closed tab",
    keys: [ "u", "undo", "restore" ],
    desc: "Reopen the last closed tab",
    cat: "Tab"
  }, {
    id: "bm",
    cmd: "bm",
    title: "Toggle bookmark",
    keys: [ "bm", "bookmark", "star" ],
    desc: "Bookmark or unbookmark this page",
    cat: "Tab"
  }, {
    id: "rl",
    cmd: "rl",
    title: "Reading list",
    keys: [ "rl", "later", "readlater" ],
    desc: "Add current page to Reading List",
    cat: "Tab"
  }, {
    id: "group",
    cmd: "grp",
    title: "Toggle tab group",
    keys: [ "grp", "group", "tg" ],
    desc: "Create or leave a tab group",
    cat: "Tab"
  }, 
  // —— Window ——
  {
    id: "dock-left",
    cmd: "dlft",
    title: "Dock left",
    keys: [ "dlft", "left", "dockl" ],
    desc: "Snap window to left half (repeat shrinks)",
    cat: "Window"
  }, {
    id: "dock-right",
    cmd: "drgt",
    title: "Dock right",
    keys: [ "drgt", "right", "dockr" ],
    desc: "Snap window to right half (repeat shrinks)",
    cat: "Window"
  }, {
    id: "dock-up",
    cmd: "dupp",
    title: "Dock top \u2192 full",
    keys: [ "dupp", "top", "docku", "up" ],
    desc: "Top half; again maximizes full screen",
    cat: "Window"
  }, {
    id: "dock-max",
    cmd: "max",
    title: "Maximize",
    keys: [ "max", "maximize", "full" ],
    desc: "Maximize the current window",
    cat: "Window"
  }, {
    id: "dock-center",
    cmd: "ctr",
    title: "Center window",
    keys: [ "ctr", "center", "mid" ],
    desc: "Center window at ~50% size",
    cat: "Window"
  }, {
    id: "cycle-win",
    cmd: "cw",
    title: "Cycle windows",
    keys: [ "cw", "cycle", "nextw" ],
    desc: "Focus the next browser window",
    cat: "Window"
  }, {
    id: "win-pick",
    cmd: "ww",
    title: "Window switcher",
    keys: [ "ww", "wins", "pickw" ],
    desc: "Open omnibar window picker (gA)",
    cat: "Window"
  }, 
  // —— Nav ——
  {
    id: "back",
    cmd: "b",
    title: "Go back",
    keys: [ "b", "back", "prev" ],
    desc: "History back in this tab",
    cat: "Nav"
  }, {
    id: "forward",
    cmd: "f",
    title: "Go forward",
    keys: [ "f", "fwd", "forward" ],
    desc: "History forward in this tab",
    cat: "Nav"
  }, {
    id: "top",
    cmd: "gg",
    title: "Scroll to top",
    keys: [ "gg", "top", "home" ],
    desc: "Jump to top of page",
    cat: "Nav"
  }, {
    id: "bottom",
    cmd: "G",
    title: "Scroll to bottom",
    keys: [ "G", "bottom", "end" ],
    desc: "Jump to bottom of page",
    cat: "Nav"
  }, {
    id: "zi",
    cmd: "zi",
    title: "Zoom in",
    keys: [ "zi", "zoomin", "+" ],
    desc: "Increase page zoom",
    cat: "Nav"
  }, {
    id: "zo",
    cmd: "zo",
    title: "Zoom out",
    keys: [ "zo", "zoomout", "-" ],
    desc: "Decrease page zoom",
    cat: "Nav"
  }, {
    id: "z0",
    cmd: "z0",
    title: "Reset zoom",
    keys: [ "z0", "zoom0", "zoom-reset" ],
    desc: "Reset zoom to 100%",
    cat: "Nav"
  }, {
    id: "stop",
    cmd: "stop",
    title: "Stop loading",
    keys: [ "stop", "halt" ],
    desc: "Stop the page from loading",
    cat: "Nav"
  }, 
  // —— Clipboard ——
  {
    id: "yy",
    cmd: "yy",
    title: "Copy URL",
    keys: [ "yy", "url", "copyurl" ],
    desc: "Copy current page URL",
    cat: "Clip"
  }, {
    id: "yt",
    cmd: "yt",
    title: "Copy title",
    keys: [ "yt", "title", "copytitle" ],
    desc: "Copy current page title",
    cat: "Clip"
  }, {
    id: "ym",
    cmd: "ym",
    title: "Copy markdown link",
    keys: [ "ym", "md", "markdown" ],
    desc: "Copy [title](url) markdown",
    cat: "Clip"
  }, {
    id: "yh",
    cmd: "yh",
    title: "Copy HTML link",
    keys: [ "yh", "html", "href" ],
    desc: "Copy <a href> HTML snippet",
    cat: "Clip"
  }, {
    id: "yart",
    cmd: "yart",
    title: "Copy article markdown",
    keys: [ "yart", "ymd", "copymd", "ymc" ],
    desc: "Copy article as markdown (Readability extract)",
    cat: "Clip"
  }, {
    id: "yhead",
    cmd: "yhead",
    title: "Copy headings",
    keys: [ "yhead", "heads", "toc" ],
    desc: "Copy H1\u2013H6 outline as markdown list",
    cat: "Clip"
  }, {
    id: "yp",
    cmd: "yp",
    title: "Copy paragraphs",
    keys: [ "yp", "paras", "copyparas" ],
    desc: "Copy visible paragraphs as text",
    cat: "Clip"
  }, {
    id: "ytbl",
    cmd: "ytbl",
    title: "Copy tables",
    keys: [ "ytbl", "tables", "csv" ],
    desc: "Copy HTML tables as markdown tables",
    cat: "Clip"
  }, 
  // —— Chrome system ——
  {
    id: "dl",
    cmd: "dl",
    title: "Downloads",
    keys: [ "dl", "downloads", "down" ],
    desc: "Open chrome://downloads",
    cat: "Chrome"
  }, {
    id: "hist-page",
    cmd: "hp",
    title: "History page",
    keys: [ "hp", "history-page" ],
    desc: "Open chrome://history",
    cat: "Chrome"
  }, {
    id: "ext",
    cmd: "ext",
    title: "Extensions",
    keys: [ "ext", "extensions" ],
    desc: "Open chrome://extensions",
    cat: "Chrome"
  }, {
    id: "keys",
    cmd: "keys",
    title: "Shortcuts",
    keys: [ "keys", "shortcuts", "hotkeys" ],
    desc: "Open chrome://extensions/shortcuts",
    cat: "Chrome"
  }, {
    id: "flags",
    cmd: "flags",
    title: "Chrome flags",
    keys: [ "flags", "experiments" ],
    desc: "Open chrome://flags",
    cat: "Chrome"
  }, {
    id: "inspect",
    cmd: "insp",
    title: "Inspect (devtools)",
    keys: [ "insp", "inspect", "devtools" ],
    desc: "Open chrome://inspect",
    cat: "Chrome"
  }, {
    id: "net",
    cmd: "net",
    title: "Network internals",
    keys: [ "net", "network" ],
    desc: "Open chrome://net-internals",
    cat: "Chrome"
  }, {
    id: "gpu",
    cmd: "gpu",
    title: "GPU internals",
    keys: [ "gpu" ],
    desc: "Open chrome://gpu",
    cat: "Chrome"
  }, {
    id: "ver",
    cmd: "ver",
    title: "Chrome version",
    keys: [ "ver", "version", "about" ],
    desc: "Open chrome://version",
    cat: "Chrome"
  }, {
    id: "newtab",
    cmd: "ntp",
    title: "New tab page",
    keys: [ "ntp", "newtab" ],
    desc: "Open chrome://newtab",
    cat: "Chrome"
  }, {
    id: "bookmarks",
    cmd: "bms",
    title: "Bookmarks manager",
    keys: [ "bms", "bookmarks" ],
    desc: "Open chrome://bookmarks",
    cat: "Chrome"
  }, {
    id: "passwords",
    cmd: "pw",
    title: "Password manager",
    keys: [ "pw", "passwords", "pwd" ],
    desc: "Open chrome://password-manager",
    cat: "Chrome"
  }, {
    id: "settings",
    cmd: "set",
    title: "Chrome settings",
    keys: [ "set", "cset" ],
    desc: "Open chrome://settings",
    cat: "Chrome"
  }, 
  // —— Vim+ ——
  {
    id: "panel",
    cmd: "sp",
    title: "Side panel",
    keys: [ "sp", "panel", "sidebar", "gs" ],
    desc: "Open Vim+ command center",
    cat: "Vim+"
  }, {
    id: "opts",
    cmd: "opts",
    title: "Vim+ options",
    keys: [ "opts", "options", "config" ],
    desc: "Open Vim+ options page",
    cat: "Vim+"
  }, {
    id: "wiki",
    cmd: "wiki",
    title: "Vim+ wiki",
    keys: [ "wiki", "docs" ],
    desc: "Open in-extension documentation",
    cat: "Vim+"
  }, {
    id: "help-dialog",
    cmd: "?",
    title: "Help dialog",
    keys: [ "?", "help", "cheatsheet" ],
    desc: "Show on-page key help (?)",
    cat: "Vim+"
  }, {
    id: "palette",
    cmd: "a",
    title: "Command palette index",
    keys: [ "a", "actions", "palette", "menu" ],
    desc: "List categories: :view :tab :hist :priv :win \u2026",
    cat: "Help"
  }, 
  // —— Extra power-user ——
  {
    id: "incognito",
    cmd: "incog",
    title: "New incognito window",
    keys: [ "incog", "private", "incognito" ],
    desc: "Open a new incognito window",
    cat: "Window"
  }, {
    id: "move-next-win",
    cmd: "mtw",
    title: "Move tab to next window",
    keys: [ "mtw", "move-win" ],
    desc: "Send this tab to the next browser window",
    cat: "Window"
  }, {
    id: "mute-all",
    cmd: "muteall",
    title: "Mute other tabs",
    keys: [ "muteall", "quiet" ],
    desc: "Mute every other tab in this window",
    cat: "Tab"
  }, {
    id: "pin-all-copy",
    cmd: "yc",
    title: "Copy all tab URLs",
    keys: [ "yc", "copy-all", "urls" ],
    desc: "Copy every tab URL in this window (one per line)",
    cat: "Clip"
  }, {
    id: "last-dl",
    cmd: "ldl",
    title: "Show last download",
    keys: [ "ldl", "last-dl", "lastdl" ],
    desc: "Reveal the most recent download",
    cat: "Chrome"
  }, {
    id: "pip",
    cmd: "pip",
    title: "Picture-in-Picture",
    keys: [ "pip", "popout", "float" ],
    desc: "Float the main video (PiP)",
    cat: "View"
  }, {
    id: "find",
    cmd: "find",
    title: "Find on page",
    keys: [ "find", "search-page", "/" ],
    desc: "Open Vim+ find mode",
    cat: "Nav"
  }, {
    id: "hints",
    cmd: "hints",
    title: "Link hints",
    keys: [ "hints", "f", "links" ],
    desc: "Activate link hints (f)",
    cat: "Nav"
  }, {
    id: "omni",
    cmd: "o",
    title: "Reopen omnibar (omni)",
    keys: [ "o", "omni" ],
    desc: "Stay in omni mode (refresh)",
    cat: "Vim+"
  }, {
    id: "vis",
    cmd: "vis",
    title: "Visual mode",
    keys: [ "vis", "visual", "v" ],
    desc: "Enter visual selection mode",
    cat: "Nav"
  }, {
    id: "mark",
    cmd: "mark",
    title: "Create mark",
    keys: [ "mark", "m" ],
    desc: "Create a mark at this position",
    cat: "Nav"
  }, {
    id: "unread",
    cmd: "unread",
    title: "Visit previous tab",
    keys: [ "unread", "prevtab", "^" ],
    desc: "Jump to the previously active tab",
    cat: "Tab"
  } ];
  let historyPauseUntil_ = 0;
  let historyPauseListenerOn_ = false;
  const onVisitedWhilePaused_ = item => {
    if (Date.now() > historyPauseUntil_) {
      stopHistoryPause_(false);
      return;
    }
    item.url && browser_1.browser_.history && browser_1.browser_.history.deleteUrl && browser_1.browser_.history.deleteUrl({
      url: item.url
    }, browser_1.runtimeError_);
  };
  const stopHistoryPause_ = notify => {
    historyPauseUntil_ = 0;
    if (historyPauseListenerOn_ && browser_1.browser_.history && browser_1.browser_.history.onVisited) {
      try {
        browser_1.browser_.history.onVisited.removeListener(onVisitedWhilePaused_);
      } catch (_a) {}
      historyPauseListenerOn_ = false;
    }
    notify && ports_1.showHUD("History on");
  };
  const startHistoryPause_ = ms => {
    historyPauseUntil_ = Date.now() + ms;
    if (!historyPauseListenerOn_ && browser_1.browser_.history && browser_1.browser_.history.onVisited) {
      browser_1.browser_.history.onVisited.addListener(onVisitedWhilePaused_);
      historyPauseListenerOn_ = true;
    }
    const mins = Math.round(ms / MS_MIN);
    return mins >= 60 ? `History off ${Math.round(mins / 60)}h` : `History off ${mins}m`;
  };
  const extractDomain_ = raw => {
    let s = (raw || "").trim().toLowerCase();
    if (!s) {
      return "";
    }
    s = s.replace(/^https?:\/\//, "").replace(/^www\./, "");
    s = s.split("/")[0].split("?")[0].split("#")[0];
    s.includes(":") && !s.startsWith("[") && (s = s.split(":")[0]);
    return s;
  };
  const currentDomain_ = async () => {
    try {
      const url = await ports_1.getPortUrl_(null, true);
      if (url) {
        return extractDomain_(url);
      }
    } catch (_a) {}
    return new Promise(resolve => {
      browser_1.getCurTab(tabs => {
        const t = tabs && tabs[0];
        resolve(t ? extractDomain_(browser_1.getTabUrl(t)) : "");
        return browser_1.runtimeError_();
      });
    });
  };
  const activeTabId_ = () => new Promise(resolve => {
    if (store_1.curTabId_ >= 0) {
      resolve(store_1.curTabId_);
      return;
    }
    browser_1.getCurTab(tabs => {
      resolve(tabs && tabs[0] ? tabs[0].id : -1);
      return browser_1.runtimeError_();
    });
  });
  const deleteHistorySince_ = sinceMs => {
    const history = browser_1.browser_.history;
    if (!history || !history.search) {
      return Promise.resolve(0);
    }
    return new Promise(resolve => {
      history.search({
        text: "",
        startTime: sinceMs,
        maxResults: 1e4
      }, items => {
        deleteHistoryItems_(items || []).then(resolve);
        return browser_1.runtimeError_();
      });
    });
  };
  const deleteHistoryItems_ = async items => {
    const history = browser_1.browser_.history;
    if (!history || !history.deleteUrl) {
      return 0;
    }
    let n = 0;
    for (const it of items) {
      if (!it.url) {
        continue;
      }
      await new Promise(res => {
        history.deleteUrl({
          url: it.url
        }, () => {
          n++;
          res();
          return browser_1.runtimeError_();
        });
      });
    }
    return n;
  };
  const shredDomain_ = async domain => {
    domain = extractDomain_(domain);
    if (!domain) {
      return "Need domain \u2014 try :sh example.com";
    }
    const history = browser_1.browser_.history;
    let histCount = 0;
    if (history && history.search) {
      const items = await new Promise(resolve => {
        history.search({
          text: domain,
          maxResults: 1e4,
          startTime: 0
        }, list => {
          resolve(list || []);
          return browser_1.runtimeError_();
        });
      });
      const matched = items.filter(i => {
        const u = (i.url || "").toLowerCase();
        return u.includes("://" + domain) || u.includes("://www." + domain) || u.includes("." + domain + "/") || u.endsWith("." + domain);
      });
      histCount = await deleteHistoryItems_(matched);
    }
    const bd = browser_1.browser_.browsingData;
    if (bd && bd.remove) {
      const origins = [ `http://${domain}`, `https://${domain}`, `http://www.${domain}`, `https://www.${domain}` ];
      await new Promise(resolve => {
        try {
          bd.remove({
            origins,
            since: 0
          }, {
            cache: true,
            cookies: true,
            fileSystems: true,
            indexedDB: true,
            localStorage: true,
            serviceWorkers: true,
            webSQL: true
          }, () => {
            resolve();
            return browser_1.runtimeError_();
          });
        } catch (_a) {
          resolve();
        }
      });
    }
    return `Shredded ${domain} \xb7 ${histCount} hist`;
  };
  const openChromePage_ = url => new Promise(resolve => {
    browser_1.Tabs_.create({
      url
    }, () => {
      resolve(url.replace("chrome://", ""));
      return browser_1.runtimeError_();
    });
  });
  /** Injected into the page via scripting.executeScript. Typed as any — runs in page DOM context. */  const pageFxInjector_ = (styleId, fx) => {
    const doc = globalThis.document;
    const root = doc.documentElement;
    const old = doc.getElementById(styleId);
    const prevFx = old && old.getAttribute("data-fx") || "";
    const jumbleAttr = "data-vp-jumble";
    const body = doc.body || root;
    const restoreJumble = () => {
      if (!root.hasAttribute(jumbleAttr)) {
        return;
      }
      const walk = doc.createTreeWalker(body, 4);
      let n;
      while (n = walk.nextNode()) {
        if (n.__vpOrig != null) {
          n.nodeValue = n.__vpOrig;
          delete n.__vpOrig;
        }
      }
      root.removeAttribute(jumbleAttr);
    };
    // Clear all FX
        if (fx === "off") {
      old && old.remove();
      restoreJumble();
      return "filters cleared";
    }
    // Same mode again → toggle OFF (descriptions say "Toggle …")
        if (fx === "jumble" && root.hasAttribute(jumbleAttr)) {
      restoreJumble();
      old && old.remove();
      return "jumble off";
    }
    if (old && prevFx === fx) {
      old.remove();
      return fx + " off";
    }
    // Switching modes: drop previous CSS filter; restore jumble text if leaving jumble
        old && old.remove();
    fx !== "jumble" && restoreJumble();
    if (fx === "jumble") {
      root.setAttribute(jumbleAttr, "1");
      const walk = doc.createTreeWalker(body, 4);
      let n;
      const isSpace = c => !c || c === " " || c === "\n" || c === "\t" || c === "\r";
      const scramble = s => {
        const chars = s.split("");
        for (let i = chars.length - 1; i > 0; i--) {
          if (isSpace(chars[i] || "")) {
            continue;
          }
          let j = Math.random() * (i + 1) | 0;
          while (j > 0 && isSpace(chars[j] || "")) {
            j--;
          }
          const tmp = chars[i] || "";
          chars[i] = chars[j] || "";
          chars[j] = tmp;
        }
        return chars.join("");
      };
      const skipTag = "SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|CODE|PRE";
      while (n = walk.nextNode()) {
        const pe = n.parentElement;
        if (!pe || skipTag.split("|").indexOf((pe.tagName || "").toUpperCase()) >= 0) {
          continue;
        }
        const v = n.nodeValue || "";
        if (v.trim().length < 2) {
          continue;
        }
        n.__vpOrig = v;
        n.nodeValue = scramble(v);
      }
      return "jumble on";
    }
    const cssMap = {
      gray: "html{filter:grayscale(1)!important}",
      blue: "html{filter:sepia(.35) hue-rotate(180deg) saturate(1.4)!important}",
      inv: "html{filter:invert(1) hue-rotate(180deg)!important}",
      sepia: "html{filter:sepia(.85) contrast(1.05)!important}",
      blur: "html{filter:blur(1.2px)!important}",
      contrast: "html{filter:contrast(1.45) saturate(1.1)!important}",
      dim: "html{filter:brightness(.72)!important}",
      focus: "html{background:#111!important}body{max-width:42rem;margin:0 auto!important;padding:1rem 1.25rem!important;background:#111!important;color:#e8e8e8!important;box-shadow:0 0 0 100vmax rgba(0,0,0,.55)!important}"
    };
    const css = cssMap[fx];
    if (!css) {
      return "unknown fx";
    }
    const el = doc.createElement("style");
    el.id = styleId;
    el.setAttribute("data-fx", fx);
    el.textContent = css;
    (doc.head || doc.documentElement).appendChild(el);
    return fx + " on";
  };
  const scriptingApi_ = () => browser_1.browser_.scripting;
  const applyPageFx_ = async mode => {
    const tabId = await activeTabId_();
    if (tabId < 0) {
      return "No active tab";
    }
    const scripting = scriptingApi_();
    if (!scripting || !scripting.executeScript) {
      return "scripting API unavailable";
    }
    try {
      const results = await scripting.executeScript({
        target: {
          tabId
        },
        world: "ISOLATED",
        func: pageFxInjector_,
        args: [ FX_STYLE_ID, mode ]
      });
      const msg = results && results[0] && results[0].result || mode;
      return String(msg);
    } catch (e) {
      return "FX failed (restricted page?) " + (e.message || "");
    }
  };
  /**
     * Fully self-contained page enhance (no content-script bridge).
     * State lives on globalThis.__vpSt so toggles work across injects.
     * Typed as any — runs in page isolated world via executeScript.
     */  const enhanceInjector_ = function vpEnhance(cmd, arg) {
    const g = globalThis;
    const d = g.document;
    if (!d || !d.documentElement) {
      return "No document";
    }
    const root = d.documentElement;
    g.__vpSt || (g.__vpSt = {
      hideImg: false,
      device: "",
      progress: false,
      hl: false,
      spot: "",
      zenCss: false,
      color: "#fef08a",
      undo: []
    });
    const st = g.__vpSt;
    // Keep a stable entry for Esc handlers / recursion after serialize
        g.__vpEnhance = vpEnhance;
    const DEVICES = {
      iphone: [ 390, 844, "iPhone 14" ],
      pixel: [ 412, 915, "Pixel 7" ],
      ipad: [ 820, 1180, "iPad Air" ],
      galaxy: [ 360, 800, "Galaxy S21" ],
      mobile: [ 390, 844, "Mobile" ],
      desk: [ 0, 0, "Desktop" ],
      desktop: [ 0, 0, "Desktop" ]
    };
    const putStyle = (id, css) => {
      let el = d.getElementById(id);
      if (!el) {
        el = d.createElement("style");
        el.id = id;
        (d.head || root).appendChild(el);
      }
      el.textContent = css;
    };
    const drop = id => {
      const el = d.getElementById(id);
      el && el.parentNode && el.parentNode.removeChild(el);
    };
    const c = (cmd || "").toLowerCase();
    const a = (arg || "").toLowerCase();
    // —— Hide images ——
        if (c === "hideimg" || c === "noimg" || c === "images") {
      st.hideImg = !st.hideImg;
      if (!st.hideImg) {
        drop("vp-hide-img");
        return "images shown";
      }
      putStyle("vp-hide-img", "img,picture,video,svg:not([id^=vp-]),[role=img],source[type^=image]{visibility:hidden!important;opacity:0!important;pointer-events:none!important}img{width:0!important;height:0!important;max-width:0!important}");
      return "images hidden";
    }
    // —— Device frame ——
        if (c === "device" || c === "iphone" || c === "pixel" || c === "ipad" || c === "galaxy" || c === "mobile" || c === "desk" || c === "desktop" || c === "dsk") {
      const key = c === "device" ? a || "desktop" : c === "dsk" ? "desktop" : c;
      const spec = DEVICES[key] || DEVICES.desktop;
      drop("vp-device-css");
      drop("vp-device-badge");
      root.classList.remove("vp-device-mode");
      st.device = "";
      if (!spec || !spec[0]) {
        return "desktop view (frame off)";
      }
      st.device = key;
      const w = spec[0], h = spec[1], label = spec[2];
      root.classList.add("vp-device-mode");
      putStyle("vp-device-css", "html.vp-device-mode{background:#111!important}html.vp-device-mode body{max-width:" + w + "px!important;width:" + w + "px!important;min-height:" + Math.min(h, 900) + "px!important;margin:12px auto!important;padding:0!important;box-shadow:0 0 0 12px #27272a,0 0 0 14px #e11d48,0 24px 60px rgba(0,0,0,.55)!important;border-radius:24px!important;overflow-x:hidden!important;transform-origin:top center!important}#vp-device-badge{position:fixed!important;top:6px!important;left:50%!important;transform:translateX(-50%)!important;z-index:2147483646!important;background:#e11d48!important;color:#fff!important;font:700 11px/1.2 system-ui,sans-serif!important;padding:5px 12px!important;pointer-events:none!important;letter-spacing:.04em!important}");
      const badge = d.createElement("div");
      badge.id = "vp-device-badge";
      badge.textContent = label + " \xb7 " + w + "\xd7" + h + " \xb7 :desk to exit";
      (d.body || root).appendChild(badge);
      return label + " frame " + w + "px";
    }
    // —— Reading progress (track + scaleX fill; never width:!important) ——
        if (c === "progress" || c === "prog" || c === "bar") {
      const wantOff = a === "off" || a !== "on" && st.progress;
      const onProg = () => {
        const fill = d.getElementById("vp-read-progress-fill");
        if (!fill || !st.progress) {
          return;
        }
        const body = d.body;
        const sh = Math.max(root.scrollHeight || 0, body ? body.scrollHeight : 0);
        const view = g.innerHeight || root.clientHeight || 1;
        const maxScroll = Math.max(0, sh - view);
        const y = g.pageYOffset != null ? g.pageYOffset : g.scrollY != null ? g.scrollY : root.scrollTop || body && body.scrollTop || 0;
        let p = 0;
        p = maxScroll <= 1 ? y > 0 ? 1 : 0 : Math.max(0, Math.min(1, y / maxScroll));
        fill.style.setProperty("transform", "scaleX(" + p.toFixed(4) + ")", "important");
        const inf = d.getElementById("vp-read-infinity");
        if (inf) {
          st._progLastH && sh > st._progLastH + 500 && p > .7 && (st._progInfinite = true);
          st._progLastH = sh;
          st._progInfinite && sh > view * 3 ? inf.classList.add("on") : inf.classList.remove("on");
        }
      };
      const tearDownProg = () => {
        st.progress = false;
        if (st._progScroll) {
          g.removeEventListener("scroll", st._progScroll, true);
          g.removeEventListener("resize", st._progScroll, true);
          d.removeEventListener && d.removeEventListener("scroll", st._progScroll, true);
          st._progScroll = null;
        }
        drop("vp-read-progress-track");
        drop("vp-read-progress-fill");
        drop("vp-read-infinity");
        drop("vp-prog-css");
      };
      if (wantOff) {
        tearDownProg();
        return "progress off";
      }
      tearDownProg();
      st.progress = true;
      st._progLastH = 0;
      st._progInfinite = false;
      putStyle("vp-prog-css", "#vp-read-progress-track{position:fixed!important;top:0!important;left:0!important;right:0!important;height:5px!important;z-index:2147483646!important;pointer-events:none!important;background:rgba(113,113,122,.45)!important;overflow:hidden!important;box-shadow:0 1px 0 rgba(0,0,0,.12)!important}#vp-read-progress-fill{position:absolute!important;top:0!important;left:0!important;bottom:0!important;width:100%!important;height:100%!important;transform:scaleX(0)!important;transform-origin:left center!important;background:linear-gradient(90deg,#e11d48,#fb7185 70%,#fda4af)!important;box-shadow:0 0 10px #e11d48aa!important;transition:transform 60ms linear!important;pointer-events:none!important}#vp-read-infinity{position:fixed!important;top:10px!important;right:10px!important;z-index:2147483647!important;pointer-events:none!important;font:700 13px/1 system-ui,sans-serif!important;color:#e11d48!important;opacity:0!important;transition:opacity .2s!important}#vp-read-infinity.on{opacity:.95!important}");
      const track = d.createElement("div");
      track.id = "vp-read-progress-track";
      const fill = d.createElement("div");
      fill.id = "vp-read-progress-fill";
      track.appendChild(fill);
      const inf = d.createElement("div");
      inf.id = "vp-read-infinity";
      inf.textContent = "\u221e";
      const host = d.body || root;
      host.appendChild(track);
      host.appendChild(inf);
      st._progScroll = onProg;
      g.addEventListener("scroll", onProg, true);
      g.addEventListener("resize", onProg, true);
      d.addEventListener("scroll", onProg, true);
      onProg();
      g.setTimeout(onProg, 50);
      g.setTimeout(onProg, 300);
      return "progress on";
    }
    // —— Spotlight / lens (visual overlay; DF window handled in SW) ——
    // arg: "on" | "off" | "" (toggle)
        if (c === "spotlight" || c === "spot" || c === "lens" || c === "focuslens" || c === "flens") {
      const mode = c === "lens" || c === "focuslens" || c === "flens" ? "lens" : "spotlight";
      const wantOff = a === "off" || a !== "on" && st.spot === mode;
      const clearSpot = () => {
        st.spot = "";
        if (st._spotMove) {
          g.removeEventListener("pointermove", st._spotMove, true);
          st._spotMove = null;
        }
        drop("vp-spot-layer");
        drop("vp-spot-css");
      };
      if (wantOff) {
        clearSpot();
        return mode + " off";
      }
      clearSpot();
      st.spot = mode;
      putStyle("vp-spot-css", "#vp-spot-layer{position:fixed!important;inset:0!important;z-index:2147483645!important;pointer-events:none!important;backdrop-filter:blur(8px) brightness(.88)!important;-webkit-backdrop-filter:blur(8px) brightness(.88)!important;--sx:50%;--sy:40%;--sr:160px;-webkit-mask-image:radial-gradient(circle var(--sr) at var(--sx) var(--sy),transparent 0%,transparent 52%,#000 100%)!important;mask-image:radial-gradient(circle var(--sr) at var(--sx) var(--sy),transparent 0%,transparent 52%,#000 100%)!important}#vp-spot-layer.lens{-webkit-mask-image:radial-gradient(ellipse calc(var(--sr)*1.8) var(--sr) at var(--sx) var(--sy),transparent 0%,transparent 48%,#000 100%)!important;mask-image:radial-gradient(ellipse calc(var(--sr)*1.8) var(--sr) at var(--sx) var(--sy),transparent 0%,transparent 48%,#000 100%)!important}");
      let layer = d.getElementById("vp-spot-layer");
      if (!layer) {
        layer = d.createElement("div");
        layer.id = "vp-spot-layer";
        (d.body || root).appendChild(layer);
      }
      layer.className = mode === "lens" ? "lens" : "";
      const move = e => {
        let x = e.clientX, y = e.clientY, r = 160;
        if (mode === "lens") {
          let el = e.target;
          while (el && el !== d.body) {
            const tag = (el.tagName || "") + "";
            const isH = tag.length === 2 && tag.charAt(0) === "H";
            if (tag === "P" || tag === "LI" || tag === "BLOCKQUOTE" || tag === "ARTICLE" || isH) {
              const box = el.getBoundingClientRect();
              x = box.left + box.width / 2;
              y = box.top + box.height / 2;
              r = Math.max(90, Math.min(300, Math.max(box.height, box.width * .4) * .75));
              break;
            }
            el = el.parentElement;
          }
        }
        layer.style.setProperty("--sx", x + "px");
        layer.style.setProperty("--sy", y + "px");
        layer.style.setProperty("--sr", r + "px");
      };
      st._spotMove = move;
      g.addEventListener("pointermove", move, true);
      move({
        clientX: (g.innerWidth || 800) / 2,
        clientY: (g.innerHeight || 600) / 2,
        target: d.body
      });
      return mode + " on";
    }
    // —— Zen page chrome CSS (arg on|off|toggle) ——
        if (c === "zen-css" || c === "zenpage") {
      const wantOn = a === "on" || a !== "off" && !st.zenCss;
      if (!wantOn) {
        st.zenCss = false;
        drop("vp-zen-css");
        return "page chrome restored";
      }
      st.zenCss = true;
      putStyle("vp-zen-css", "header,nav,footer,aside,[role=banner],[role=navigation],[role=complementary],.sidebar,.side-bar,.site-header,.site-footer,.top-bar,.navbar,.nav-bar,#sidebar,#header,#footer,#nav,.ad,.ads,.advertisement,[class*=cookie],[id*=cookie],[class*=newsletter],[class*=share-],[class*=social-]{display:none!important}body{max-width:46rem!important;margin:0 auto!important;padding:1.25rem!important}");
      return "page chrome hidden";
    }
    // —— Highlighter (mouse-only, persisted to chrome.storage.local) ——
    // Shared helpers live on st so restore / mode / clear all share them
        const HL_STORE = "vpPageHighlights";
    const hlPageKey = () => {
      try {
        const loc = g.location;
        return (loc.origin || "") + (loc.pathname || "") + (loc.search || "");
      } catch (_a) {
        return d.URL || "";
      }
    };
    const hlChrome = () => {
      try {
        return g.chrome && g.chrome.storage && g.chrome.storage.local;
      } catch (_a) {
        return null;
      }
    };
    const hlUnwrap = mark => {
      const p = mark && mark.parentNode;
      if (!p) {
        return;
      }
      while (mark.firstChild) {
        p.insertBefore(mark.firstChild, mark);
      }
      p.removeChild(mark);
    };
    const hlParseComments = raw => {
      if (!raw) {
        return [];
      }
      try {
        const v = JSON.parse(raw);
        return v && v.length ? v : [];
      } catch (_a) {
        return [];
      }
    };
    const hlMarkText = m => {
      // Clone and strip UI badges before reading text
      try {
        const clone = m.cloneNode(true);
        const badges = clone.querySelectorAll ? clone.querySelectorAll("[data-vp-ui],.vp-hl-badge") : [];
        for (let i = 0; i < badges.length; i++) {
          badges[i].parentNode && badges[i].parentNode.removeChild(badges[i]);
        }
        let t = (clone.textContent || "") + "";
        t = t.replace(/\s+/g, " ").trim();
        return t;
      } catch (_a) {
        let t2 = (m.textContent || "") + "";
        t2 = t2.replace(/\s+/g, " ").trim();
        return t2;
      }
    };
    const hlCollect = () => {
      const marks = d.querySelectorAll("mark[data-vp-hl]");
      const items = [];
      const seen = {};
      for (let i = 0; i < marks.length; i++) {
        const m = marks[i];
        const t = hlMarkText(m);
        if (!t) {
          continue;
        }
        const c0 = m.getAttribute("data-vp-c") || m.style.backgroundColor || m.style.background || "#fef08a";
        const n = seen[t] || 0;
        seen[t] = n + 1;
        const comments = hlParseComments(m.getAttribute("data-vp-comments") || "[]");
        items.push({
          id: m.getAttribute("data-vp-id") || "h" + Date.now().toString(36) + i,
          c: c0,
          t,
          n,
          comments
        });
      }
      return items;
    };
    const hlSave = () => {
      const api = hlChrome();
      if (!api) {
        return;
      }
      const key = hlPageKey();
      const items = hlCollect();
      try {
        api.get([ HL_STORE ], res => {
          const all = res && res[HL_STORE] || {};
          items.length ? all[key] = items : delete all[key];
          const payload = {};
          payload[HL_STORE] = all;
          api.set(payload);
        });
      } catch (_a) {}
    };
    const hlEnsureCss = () => {
      putStyle("vp-hl-css", "mark[data-vp-hl]{border-radius:2px;padding:0 2px;cursor:pointer;position:relative;box-decoration-break:clone;-webkit-box-decoration-break:clone}mark[data-vp-hl]:hover{outline:2px solid #e11d48;outline-offset:1px}mark[data-vp-hl] .vp-hl-badge{display:inline-block;margin-left:3px;padding:0 4px;border-radius:8px;background:#e11d48;color:#fff;font:10px/1.4 system-ui,sans-serif;vertical-align:super;cursor:pointer}#vp-hl-bar{position:fixed!important;bottom:20px!important;left:50%!important;transform:translateX(-50%)!important;z-index:2147483647!important;display:flex!important;flex-wrap:wrap!important;gap:8px!important;align-items:center!important;background:#18181b!important;border:2px solid #e11d48!important;padding:10px 14px!important;box-shadow:0 10px 32px rgba(0,0,0,.55)!important;font:12px/1.3 system-ui,sans-serif!important;color:#fff!important;max-width:min(96vw,520px)!important}#vp-hl-bar button{border:2px solid transparent;width:28px;height:28px;cursor:pointer;padding:0;border-radius:4px}#vp-hl-bar button.on{border-color:#fff;box-shadow:0 0 0 1px #e11d48}#vp-hl-bar .x{width:auto;padding:4px 10px;background:#27272a;color:#fda4af;border:1px solid #52525b;font:12px system-ui,sans-serif}#vp-hl-bar .x:hover{background:#3f3f46;color:#fff}#vp-hl-bar .tip{opacity:.85;margin:0 4px;white-space:normal;max-width:16em}#vp-hl-pop{position:fixed;z-index:2147483647;width:min(320px,92vw);background:#18181b;color:#fafafa;border:2px solid #e11d48;box-shadow:0 12px 40px rgba(0,0,0,.5);padding:12px;font:13px/1.4 system-ui,sans-serif;border-radius:0}#vp-hl-pop h4{margin:0 0 8px;font-size:13px;color:#fda4af}#vp-hl-pop .vp-hl-clist{max-height:140px;overflow:auto;margin:0 0 8px;padding:0;list-style:none}#vp-hl-pop .vp-hl-clist li{padding:6px 0;border-bottom:1px solid #27272a}#vp-hl-pop .vp-hl-clist time{display:block;font-size:10px;color:#a1a1aa;margin-bottom:2px}#vp-hl-pop textarea{width:100%;min-height:56px;box-sizing:border-box;background:#0c0c0e;color:#fafafa;border:1px solid #3f3f46;padding:6px;font:13px system-ui,sans-serif;resize:vertical}#vp-hl-pop .row{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}#vp-hl-pop button{cursor:pointer;border:1px solid #52525b;background:#27272a;color:#fff;padding:6px 10px;font:12px system-ui,sans-serif}#vp-hl-pop button.primary{background:#e11d48;border-color:#e11d48}#vp-hl-pop button.danger{color:#fda4af}");
    };
    const hlUpdateBadge = mark => {
      const comments = hlParseComments(mark.getAttribute("data-vp-comments") || "[]");
      let badge = mark.querySelector && mark.querySelector(".vp-hl-badge");
      if (!comments.length) {
        badge && badge.parentNode && badge.parentNode.removeChild(badge);
        mark.title = "Click to comment or remove";
        return;
      }
      if (!badge) {
        badge = d.createElement("span");
        badge.className = "vp-hl-badge";
        badge.setAttribute("data-vp-ui", "1");
        mark.appendChild(badge);
      }
      badge.textContent = String(comments.length);
      mark.title = comments.length + " comment(s) \u2014 click to view / add";
    };
    const hlTagMark = (mark, color, id, comments) => {
      mark.setAttribute("data-vp-hl", "1");
      mark.setAttribute("data-vp-c", color);
      mark.setAttribute("data-vp-id", id || "h" + Date.now().toString(36) + Math.floor(Math.random() * 1e6));
      mark.style.background = color;
      mark.style.color = "inherit";
      comments && comments.length ? mark.setAttribute("data-vp-comments", JSON.stringify(comments)) : mark.getAttribute("data-vp-comments") || mark.setAttribute("data-vp-comments", "[]");
      hlUpdateBadge(mark);
    };
    const hlClosePop = () => {
      drop("vp-hl-pop");
    };
    const hlOpenPop = mark => {
      hlEnsureCss();
      hlClosePop();
      mark.getAttribute("data-vp-id");
      const comments = hlParseComments(mark.getAttribute("data-vp-comments") || "[]");
      const pop = d.createElement("div");
      pop.id = "vp-hl-pop";
      pop.setAttribute("data-vp-ui", "1");
      const rect = mark.getBoundingClientRect();
      let top = rect.bottom + 8;
      let left = Math.max(8, Math.min(rect.left, (g.innerWidth || 800) - 340));
      top + 220 > (g.innerHeight || 600) && (top = Math.max(8, rect.top - 220));
      pop.style.top = top + "px";
      pop.style.left = left + "px";
      let listHtml = "";
      for (let i = 0; i < comments.length; i++) {
        const cm = comments[i];
        const when = cm.at ? new Date(cm.at).toLocaleString() : "";
        listHtml += "<li><time>" + when + "</time>" + (cm.text || "").replace(/</g, "&lt;") + "</li>";
      }
      listHtml || (listHtml = "<li style='opacity:.6'>No comments yet</li>");
      pop.innerHTML = "<h4>Highlight</h4><ul class='vp-hl-clist'>" + listHtml + "</ul><textarea id='vp-hl-note' placeholder='Add a comment\u2026'></textarea><div class='row'><button type='button' class='primary' data-a='add'>Add comment</button><button type='button' data-a='close'>Close</button><button type='button' class='danger' data-a='remove'>Remove highlight</button></div>";
      (d.body || root).appendChild(pop);
      pop.addEventListener("click", ev => {
        const t = ev.target;
        if (!t || !t.getAttribute) {
          return;
        }
        const act = t.getAttribute("data-a");
        if (!act) {
          return;
        }
        ev.stopPropagation && ev.stopPropagation();
        if (act === "close") {
          hlClosePop();
          return;
        }
        if (act === "remove") {
          hlUnwrap(mark);
          hlSave();
          hlClosePop();
          return;
        }
        if (act === "add") {
          const ta = pop.querySelector("#vp-hl-note");
          const text = (ta && ta.value || "").trim();
          if (!text) {
            return;
          }
          const next = comments.slice();
          next.push({
            text,
            at: (new Date).toISOString()
          });
          mark.setAttribute("data-vp-comments", JSON.stringify(next));
          hlUpdateBadge(mark);
          hlSave();
          hlOpenPop(mark);
        }
      });
      // click outside closes
            const outside = e => {
        if (!e.target) {
          return;
        }
        if (e.target.closest && (e.target.closest("#vp-hl-pop") || e.target.closest("mark[data-vp-hl]"))) {
          return;
        }
        hlClosePop();
        g.removeEventListener("mousedown", outside, true);
      };
      g.setTimeout(() => {
        g.addEventListener("mousedown", outside, true);
      }, 0);
    };
    /** Map flat string index → text node + offset */    const hlPosAt_ = (nodes, flatIndex) => {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const len = (n.node.nodeValue || "").length;
        if (flatIndex <= n.start + len) {
          return {
            node: n.node,
            off: Math.max(0, flatIndex - n.start)
          };
        }
      }
      return null;
    };
    /** Restore saved highlights — matches across text nodes. */    const hlRestore = list => {
      if (!list || !list.length) {
        return 0;
      }
      hlEnsureCss();
      const have = {};
      const existing = d.querySelectorAll("mark[data-vp-hl]");
      for (let i = 0; i < existing.length; i++) {
        const id = existing[i].getAttribute("data-vp-id");
        id && (have[id] = 1);
      }
      // Collect text nodes once
            const nodes = [];
      let flat = "";
      const walker = d.createTreeWalker(d.body || root, 4);
      let node;
      while (node = walker.nextNode()) {
        const pe = node.parentElement;
        if (!pe) {
          continue;
        }
        const tag = (pe.tagName || "").toUpperCase();
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEXTAREA" || tag === "INPUT") {
          continue;
        }
        if (pe.closest && pe.closest("mark[data-vp-hl]")) {
          continue;
        }
        nodes.push({
          node,
          start: flat.length
        });
        flat += node.nodeValue || "";
      }
      let applied = 0;
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (!item || !item.t) {
          continue;
        }
        if (item.id && have[item.id]) {
          const m = d.querySelector('mark[data-vp-hl][data-vp-id="' + item.id + '"]');
          if (m && item.comments) {
            m.setAttribute("data-vp-comments", JSON.stringify(item.comments));
            hlUpdateBadge(m);
          }
          continue;
        }
        const needle = item.t;
        const targetN = item.n || 0;
        let found = 0;
        let from = 0;
        let idx = flat.indexOf(needle, from);
        while (idx >= 0) {
          if (found === targetN) {
            const startPos = hlPosAt_(nodes, idx);
            const endPos = hlPosAt_(nodes, idx + needle.length);
            if (startPos && endPos) {
              try {
                const range = d.createRange();
                range.setStart(startPos.node, startPos.off);
                range.setEnd(endPos.node, endPos.off);
                const mark = d.createElement("mark");
                hlTagMark(mark, item.c || "#fef08a", item.id, item.comments || []);
                try {
                  range.surroundContents(mark);
                } catch (_a) {
                  const frag = range.extractContents();
                  mark.appendChild(frag);
                  range.insertNode(mark);
                }
                applied++;
                item.id && (have[item.id] = 1);
                // rebuild flat after DOM change for next items
                                nodes.length = 0;
                flat = "";
                const w2 = d.createTreeWalker(d.body || root, 4);
                let n2;
                while (n2 = w2.nextNode()) {
                  const pe2 = n2.parentElement;
                  if (!pe2) {
                    continue;
                  }
                  const tg = (pe2.tagName || "").toUpperCase();
                  if (tg === "SCRIPT" || tg === "STYLE" || tg === "NOSCRIPT" || tg === "TEXTAREA") {
                    continue;
                  }
                  if (pe2.closest && pe2.closest("mark[data-vp-hl]")) {
                    continue;
                  }
                  nodes.push({
                    node: n2,
                    start: flat.length
                  });
                  flat += n2.nodeValue || "";
                }
              } catch (_b) {}
            }
            break;
          }
          found++;
          from = idx + Math.max(1, needle.length);
          idx = flat.indexOf(needle, from);
        }
      }
      if (!st._hlMarkClick) {
        st._hlMarkClick = e => {
          let el = e.target;
          while (el && el !== d.body && el !== root) {
            if (el.id === "vp-hl-pop" || el.closest && el.closest("#vp-hl-pop")) {
              return;
            }
            if (el.id === "vp-hl-bar" || el.closest && el.closest("#vp-hl-bar")) {
              return;
            }
            if (el.getAttribute && el.getAttribute("data-vp-hl")) {
              e.preventDefault && e.preventDefault();
              e.stopPropagation && e.stopPropagation();
              hlOpenPop(el);
              return;
            }
            el = el.parentElement;
          }
        };
        g.addEventListener("click", st._hlMarkClick, true);
      }
      return applied;
    };
    const hlLoadAndRestore = () => {
      const api = hlChrome();
      if (!api) {
        return;
      }
      try {
        api.get([ HL_STORE ], res => {
          const all = res && res[HL_STORE] || {};
          const list = all[hlPageKey()] || [];
          list.length && hlRestore(list);
        });
      } catch (_a) {}
    };
    if (c === "hl-restore") {
      hlLoadAndRestore();
      return "highlights restore requested";
    }
    if (c === "hl" || c === "highlight" || c === "highlighter" || c === "marker") {
      const applySel = color => {
        const sel = d.getSelection && d.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) {
          return 0;
        }
        // don't highlight if selection is only inside toolbar
                try {
          const aEl = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
          if (aEl && aEl.closest && aEl.closest("#vp-hl-bar")) {
            return 0;
          }
        } catch (_a) {}
        try {
          const range = sel.getRangeAt(0);
          const mark = d.createElement("mark");
          hlTagMark(mark, color);
          try {
            range.surroundContents(mark);
          } catch (_b) {
            const frag = range.extractContents();
            mark.appendChild(frag);
            range.insertNode(mark);
          }
          sel.removeAllRanges();
          hlSave();
          return 1;
        } catch (_c) {
          return 0;
        }
      };
      const wantOff = a === "off" || a !== "on" && st.hl;
      if (wantOff) {
        st.hl = false;
        root.classList.remove("vp-hl-mode");
        if (st._hlUp) {
          g.removeEventListener("mouseup", st._hlUp, true);
          st._hlUp = null;
        }
        drop("vp-hl-bar");
        hlClosePop();
        // keep mark CSS + click-to-comment so saved highlights stay interactive
                return "highlighter off (marks kept)";
      }
      if (st.hl) {
        st._hlUp && g.removeEventListener("mouseup", st._hlUp, true);
        drop("vp-hl-bar");
      }
      st.hl = true;
      st.color = st.color || "#fef08a";
      root.classList.add("vp-hl-mode");
      hlEnsureCss();
      // restore any missing marks from storage
            hlLoadAndRestore();
      const bar = d.createElement("div");
      bar.id = "vp-hl-bar";
      bar.setAttribute("role", "toolbar");
      // color swatches only (no keyboard shortcuts)
            const swatches = [ {
        c: "#fef08a",
        name: "Yellow"
      }, {
        c: "#bbf7d0",
        name: "Green"
      }, {
        c: "#fbcfe8",
        name: "Pink"
      }, {
        c: "#bfdbfe",
        name: "Blue"
      }, {
        c: "#fdba74",
        name: "Orange"
      } ];
      for (let i = 0; i < swatches.length; i++) {
        const col = swatches[i];
        const b = d.createElement("button");
        b.type = "button";
        b.style.background = col.c;
        b.title = col.name;
        b.setAttribute("data-c", col.c);
        col.c === st.color && (b.className = "on");
        b.onclick = ev => {
          ev && ev.stopPropagation && ev.stopPropagation();
          st.color = col.c;
          const bs = bar.querySelectorAll("button[data-c]");
          for (let j = 0; j < bs.length; j++) {
            bs[j].className = bs[j].getAttribute("data-c") === st.color ? "on" : "";
          }
        };
        bar.appendChild(b);
      }
      const tip = d.createElement("span");
      tip.className = "tip";
      tip.textContent = "Select text to mark \xb7 click a mark to comment / remove";
      bar.appendChild(tip);
      const clearBtn = d.createElement("button");
      clearBtn.type = "button";
      clearBtn.className = "x";
      clearBtn.textContent = "Clear all";
      clearBtn.title = "Remove every highlight on this page";
      clearBtn.onclick = ev => {
        ev && ev.stopPropagation && ev.stopPropagation();
        vpEnhance("hlc");
      };
      bar.appendChild(clearBtn);
      const done = d.createElement("button");
      done.type = "button";
      done.className = "x";
      done.textContent = "Done";
      done.title = "Close toolbar (highlights stay saved)";
      done.onclick = ev => {
        ev && ev.stopPropagation && ev.stopPropagation();
        vpEnhance("hl", "off");
      };
      bar.appendChild(done);
      // prevent selection inside bar from highlighting
            bar.onmouseup = ev => {
        ev && ev.stopPropagation && ev.stopPropagation();
      };
      (d.body || root).appendChild(bar);
      st._hlUp = () => {
        if (!st.hl) {
          return;
        }
        applySel(st.color || "#fef08a");
      };
      // Mark clicks handled by st._hlMarkClick (comment popover) installed in hlRestore
            st._hlMarkClick || hlLoadAndRestore();
      g.addEventListener("mouseup", st._hlUp, true);
      return "highlighter on \u2014 select to mark, click mark to comment";
    }
    if (c === "hl-clear" || c === "hlc" || c === "unmark") {
      const marks = d.querySelectorAll("mark[data-vp-hl]");
      let n = 0;
      for (let i = 0; i < marks.length; i++) {
        hlUnwrap(marks[i]);
        n++;
      }
      // wipe storage for this page
            const api = hlChrome();
      if (api) {
        try {
          api.get([ HL_STORE ], res => {
            const all = res && res[HL_STORE] || {};
            delete all[hlPageKey()];
            const payload = {};
            payload[HL_STORE] = all;
            api.set(payload);
          });
        } catch (_a) {}
      }
      return "cleared " + n + " highlights";
    }
    // —— Clear all view extras ——
        if (c === "off-view" || c === "offv" || c === "noview" || c === "off") {
      st.hideImg && vpEnhance("hideimg");
      st.device && vpEnhance("device", "desktop");
      st.progress && vpEnhance("progress");
      st.spot && vpEnhance(st.spot, "off");
      st.zenCss && vpEnhance("zen-css", "off");
      st.hl && vpEnhance("hl", "off");
      return "view extras cleared";
    }
    return "unknown enhance: " + c;
  };
  /** Inject enhanceInjector_ into the active tab. */  const callEnhance_ = async (cmd, arg, tabId) => {
    const id = tabId != null ? tabId : await activeTabId_();
    if (id < 0) {
      return "No active tab";
    }
    const scripting = scriptingApi_();
    if (!scripting) {
      return "scripting API unavailable";
    }
    try {
      const results = await scripting.executeScript({
        target: {
          tabId: id
        },
        world: "ISOLATED",
        func: enhanceInjector_,
        args: arg != null ? [ cmd, arg ] : [ cmd ]
      });
      return String(results && results[0] && results[0].result || cmd);
    } catch (e) {
      return "Enhance failed (restricted page?): " + (e.message || e);
    }
  };
  /**
     * Move the current tab into a chrome-less popup (no URL bar / tabs),
     * or restore it to a normal window. Chrome cannot hide chrome in-place.
     */  const setDistractionFreeWindow_ = async enter => {
    const tabId = await activeTabId_();
    if (tabId < 0) {
      return "No tab";
    }
    const W = browser_1.browser_.windows;
    if (!W || !W.create || !W.get) {
      return "windows API unavailable";
    }
    return new Promise(resolve => {
      browser_1.Tabs_.get(tabId, tab => {
        if (!tab || tab.windowId == null) {
          resolve("No tab");
          return browser_1.runtimeError_();
        }
        W.get(tab.windowId, win => {
          if (!win) {
            resolve("No window");
            return browser_1.runtimeError_();
          }
          const isPopup = win.type === "popup" || win.type === "panel";
          if (enter) {
            if (isPopup) {
              resolve("already distraction-free");
              return;
            }
            W.create({
              tabId,
              type: "popup",
              focused: true,
              width: Math.min(1200, 1100),
              height: Math.min(900, 860)
            }, created => {
              if (browser_1.runtimeError_() || !created) {
                resolve("Could not enter distraction-free (popup blocked?)");
                return browser_1.runtimeError_();
              }
              resolve("distraction-free (no browser chrome)");
              return browser_1.runtimeError_();
            });
          } else {
            if (!isPopup) {
              resolve("already normal window");
              return;
            }
            W.create({
              tabId,
              type: "normal",
              focused: true
            }, () => {
              resolve(browser_1.runtimeError_() ? "Could not restore normal window" : "restored normal window");
              return browser_1.runtimeError_();
            });
          }
        });
      });
    });
  };
  /**
     * spot / lens: chrome-less popup + visual effect.
     * zen: chrome-less popup ONLY (no device frame, no page CSS) — pure app window.
     */  const toggleFocusMode_ = async mode => {
    const tabId = await activeTabId_();
    if (tabId < 0) {
      return "No tab";
    }
    const W = browser_1.browser_.windows;
    if (!W || !W.get) {
      if (mode === "zen") {
        return "windows API unavailable";
      }
      return callEnhance_(mode, "on");
    }
    return new Promise(resolve => {
      browser_1.Tabs_.get(tabId, tab => {
        if (!tab || tab.windowId == null) {
          resolve("No tab");
          return browser_1.runtimeError_();
        }
        W.get(tab.windowId, win => {
          const isPopup = !(!win || win.type !== "popup" && win.type !== "panel");
          (async () => {
            if (isPopup) {
              // Exit app window — restore normal chrome. Do not touch device frames.
              mode !== "spotlight" && mode !== "lens" || await callEnhance_(mode, "off", tabId);
              const r = await setDistractionFreeWindow_(false);
              resolve(mode + " off \xb7 " + r);
              return;
            }
            // Enter chrome-less popup (moves this tab — no URL bar / tab strip)
                        const r = await setDistractionFreeWindow_(true);
            if (mode === "zen") {
              // Zen = window only. Never apply device frames or page filters.
              resolve(r + " \xb7 zen window (no URL bar) \xb7 run :zen again to exit");
              return;
            }
            await new Promise(r2 => {
              setTimeout(() => {
                r2();
              }, 180);
            });
            const v = await callEnhance_(mode, "on", tabId);
            resolve(r + " \xb7 " + v + " \xb7 run again to exit");
          })();
          return browser_1.runtimeError_();
        });
      });
    });
  };
  /** HTML → rough markdown (good enough for articles / tables). */  const htmlToMarkdown_ = html => {
    // Use any-casts: service-worker TS lib lacks DOM string/RegExp overload quirks
    let s = html || "";
    const rep = (re, x) => {
      s = s.replace(re, x);
    };
    rep(/\r\n?/g, "\n");
    rep(/<script[\s\S]*?<\/script>/gi, "");
    rep(/<style[\s\S]*?<\/style>/gi, "");
    rep(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => "\n# " + stripTags_(t).trim() + "\n\n");
    rep(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => "\n## " + stripTags_(t).trim() + "\n\n");
    rep(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => "\n### " + stripTags_(t).trim() + "\n\n");
    rep(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, t) => "\n#### " + stripTags_(t).trim() + "\n\n");
    rep(/<h[56][^>]*>([\s\S]*?)<\/h[56]>/gi, (_, t) => "\n##### " + stripTags_(t).trim() + "\n\n");
    rep(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => "- " + stripTags_(t).trim() + "\n");
    rep(/<\/(ul|ol)>/gi, "\n");
    rep(/<(ul|ol)[^>]*>/gi, "\n");
    rep(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, t) => "\n> " + stripTags_(t).trim().split("\n").join("\n> ") + "\n\n");
    rep(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, t) => "\n```\n" + decodeEntities_(stripTags_(t)) + "\n```\n\n");
    rep(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, t) => "`" + stripTags_(t) + "`");
    rep(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, t) => "[" + stripTags_(t).trim() + "](" + href + ")");
    rep(/<img[^>]+alt=["']([^"']*)["'][^>]*>/gi, "![image]()");
    rep(/<br\s*\/?>/gi, "\n");
    rep(/<\/p>/gi, "\n\n");
    rep(/<p[^>]*>/gi, "");
    rep(/<\/?(div|span|section|article|figure|figcaption|header|footer)[^>]*>/gi, "");
    s = stripTags_(String(s));
    s = decodeEntities_(s);
    s = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    return s;
  };
  const stripTags_ = s => {
    let t = s || "";
    t = t.replace(/<[^>]+>/g, "");
    return t;
  };
  const decodeEntities_ = s => {
    let t = s || "";
    t = t.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<");
    t = t.replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return t;
  };
  const writeClipboard_ = async text => {
    if (!text) {
      return "Nothing to copy";
    }
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return "Copied (" + text.length + " chars)";
      }
    } catch (/* fall through */ _a) {/* fall through */}
    copyFallback_(text);
    return "Copied (" + text.length + " chars)";
  };
  /** Inject Readability source into the page isolated world and return ok/error. */  const injectReadabilitySource_ = src => {
    const g = globalThis;
    if (typeof g.Readability === "function") {
      return "ok";
    }
    try {
      (0, eval)(src);
    } catch (e) {
      return "eval-error: " + (e && e.message ? e.message : String(e));
    }
    return typeof g.Readability === "function" ? "ok" : "missing-after-eval";
  };
  /** Ensure Mozilla Readability is loaded in the tab isolated world. */  const ensureReadabilityLoaded_ = async tabId => {
    const scripting = scriptingApi_();
    if (!scripting) {
      return "scripting API unavailable";
    }
    // Fast path: already loaded in this world
        try {
      const pre = await scripting.executeScript({
        target: {
          tabId
        },
        world: "ISOLATED",
        func() {
          const g = globalThis;
          return typeof g.Readability === "function" ? "ok" : "no";
        }
      });
      if (pre && pre[0] && pre[0].result === "ok") {
        return null;
      }
    } catch (/* try load below */ _a) {/* try load below */}
    // 1) files: inject (classic)
        try {
      await scripting.executeScript({
        target: {
          tabId
        },
        files: [ "lib/vp_readability.js" ],
        world: "ISOLATED"
      });
      const check = await scripting.executeScript({
        target: {
          tabId
        },
        world: "ISOLATED",
        func() {
          const g = globalThis;
          return typeof g.Readability === "function" ? "ok" : "missing";
        }
      });
      if (check && check[0] && check[0].result === "ok") {
        return null;
      }
    } catch (e1) {}
    // 2) Fetch extension resource and eval in page (more reliable in some MV3 setups)
        try {
      const url = browser_1.browser_.runtime.getURL("lib/vp_readability.js");
      const resp = await fetch(url);
      if (!resp.ok) {
        return "Readability file HTTP " + resp.status + " at " + url;
      }
      const src = await resp.text();
      if (!src || src.length < 1e3) {
        return "Readability file empty/short";
      }
      const results = await scripting.executeScript({
        target: {
          tabId
        },
        world: "ISOLATED",
        func: injectReadabilitySource_,
        args: [ src ]
      });
      const r = results && results[0] && results[0].result;
      if (r === "ok") {
        return null;
      }
      return "Readability library failed to load (" + String(r) + ")";
    } catch (e) {
      return "Readability load failed: " + (e.message || e);
    }
  };
  /**
     * Parse article via Mozilla Readability.
     * Uses createHTMLDocument clone (more reliable than document.cloneNode).
     */  const readabilityParseInjector_ = () => {
    const g = globalThis;
    const R = g.Readability;
    const d = g.document;
    if (!R) {
      return {
        error: "Readability not loaded"
      };
    }
    if (!d || !d.documentElement) {
      return {
        error: "No document"
      };
    }
    try {
      let docClone;
      try {
        docClone = d.cloneNode(true);
      } catch (_a) {
        docClone = null;
      }
      if (!docClone || !docClone.documentElement) {
        docClone = d.implementation.createHTMLDocument(d.title || "");
        docClone.documentElement.innerHTML = d.documentElement.innerHTML;
      }
      const article = new R(docClone, {
        charThreshold: 100
      }).parse();
      if (!article) {
        return {
          error: "No article found (page may not be readable)"
        };
      }
      return {
        title: article.title || d.title || "",
        byline: article.byline || "",
        excerpt: article.excerpt || "",
        siteName: article.siteName || "",
        lang: article.lang || "",
        content: article.content || "",
        textContent: article.textContent || ""
      };
    } catch (e) {
      return {
        error: "Parse error: " + (e && e.message ? e.message : String(e))
      };
    }
  };
  /**
     * Firefox-style Reader View: replace page with clean article UI.
     * Toggle: second call restores the original page.
     */  const readerViewInjector_ = article => {
    const g = globalThis;
    const d = g.document;
    if (!d || !d.body) {
      return "No document body";
    }
    // Exit reader mode → restore
        if (d.documentElement.getAttribute("data-vp-reader") === "1" && g.__vpReaderBackup) {
      try {
        d.body.innerHTML = g.__vpReaderBackup.bodyHTML;
        d.body.className = g.__vpReaderBackup.bodyClass || "";
        d.title = g.__vpReaderBackup.title || d.title;
        d.documentElement.removeAttribute("data-vp-reader");
        d.documentElement.classList.remove("vp-reader-root");
        const old = d.getElementById("vp-reader-style");
        old && old.parentNode && old.parentNode.removeChild(old);
        g.scrollTo(0, g.__vpReaderBackup.scrollY || 0);
        g.__vpReaderBackup = null;
        return "Reader View off";
      } catch (e) {
        return "Restore failed: " + (e && e.message ? e.message : e);
      }
    }
    if (!article || article.error) {
      return article && article.error || "No article";
    }
    if (!article.content && !article.textContent) {
      return "Empty article content";
    }
    // Backup current page
        g.__vpReaderBackup = {
      bodyHTML: d.body.innerHTML,
      bodyClass: d.body.className || "",
      title: d.title || "",
      scrollY: g.scrollY || 0
    };
    const css = '\nhtml.vp-reader-root,html.vp-reader-root body{background:#f4f4f1!important;color:#1a1a1a!important;\nmargin:0!important;padding:0!important;min-height:100%!important}\nhtml.vp-reader-root body{font:18px/1.7 Georgia,"Times New Roman",serif!important}\n#vp-reader{max-width:36em;margin:0 auto;padding:2.5rem 1.5rem 4rem;position:relative}\n#vp-reader-toolbar{position:sticky;top:0;z-index:10;display:flex;gap:8px;align-items:center;\nflex-wrap:wrap;padding:.6rem 0 .75rem;margin:0 0 1.25rem;background:linear-gradient(#f4f4f1ee,#f4f4f1);\nborder-bottom:1px solid #ddd;font:13px/1.3 system-ui,-apple-system,sans-serif}\n#vp-reader-toolbar button{cursor:pointer;border:1px solid #ccc;background:#fff;color:#222;\npadding:6px 12px;border-radius:6px;font:13px system-ui,sans-serif}\n#vp-reader-toolbar button:hover{border-color:#e11d48;color:#e11d48}\n#vp-reader-toolbar .spacer{flex:1}\n#vp-reader h1.vp-rtitle{font:700 2em/1.25 Georgia,serif;margin:0 0 .4em;letter-spacing:-.02em}\n#vp-reader .vp-rmeta{color:#666;font:14px/1.4 system-ui,sans-serif;margin:0 0 1.5em}\n#vp-reader .vp-rcontent{font-size:1.05em}\n#vp-reader .vp-rcontent p{margin:0 0 1em}\n#vp-reader .vp-rcontent img,#vp-reader .vp-rcontent picture{max-width:100%;height:auto;border-radius:4px}\n#vp-reader .vp-rcontent a{color:#0b57d0}\n#vp-reader .vp-rcontent h2,#vp-reader .vp-rcontent h3{font-family:system-ui,sans-serif;margin:1.4em 0 .5em}\n#vp-reader.dark,html.vp-reader-root.dark,html.vp-reader-root.dark body{background:#1b1b1d!important;color:#e8e8e8!important}\nhtml.vp-reader-root.dark #vp-reader-toolbar{background:linear-gradient(#1b1b1dee,#1b1b1d);border-color:#333}\nhtml.vp-reader-root.dark #vp-reader-toolbar button{background:#2a2a2e;color:#eee;border-color:#444}\nhtml.vp-reader-root.dark #vp-reader .vp-rmeta{color:#aaa}\nhtml.vp-reader-root.dark #vp-reader .vp-rcontent a{color:#8ab4f8}\n#vp-reader.sepia,html.vp-reader-root.sepia,html.vp-reader-root.sepia body{background:#f4ecd8!important;color:#5b4636!important}\nhtml.vp-reader-root.sepia #vp-reader-toolbar{background:linear-gradient(#f4ecd8ee,#f4ecd8);border-color:#e0d4b8}\n#vp-reader.narrow{max-width:28em}#vp-reader.wide{max-width:46em}\n';
    let style = d.getElementById("vp-reader-style");
    if (!style) {
      style = d.createElement("style");
      style.id = "vp-reader-style";
      (d.head || d.documentElement).appendChild(style);
    }
    style.textContent = css;
    d.documentElement.setAttribute("data-vp-reader", "1");
    d.documentElement.classList.add("vp-reader-root");
    d.title = (article.title || "Reader") + " \xb7 Reader View";
    const byline = article.byline ? article.byline + " \xb7 " : "";
    const site = article.siteName || "";
    const wrap = d.createElement("div");
    wrap.id = "vp-reader";
    wrap.innerHTML = '<div id="vp-reader-toolbar"><button type="button" data-vp-r="close">Close Reader</button><button type="button" data-vp-r="theme">Theme</button><button type="button" data-vp-r="width">Width</button><button type="button" data-vp-r="plus">A+</button><button type="button" data-vp-r="minus">A\u2212</button><span class="spacer"></span><span style="opacity:.7">Vim+ Reader \xb7 Mozilla Readability</span></div><h1 class="vp-rtitle"></h1><p class="vp-rmeta"></p><div class="vp-rcontent"></div>';
    const h1 = wrap.querySelector(".vp-rtitle");
    const meta = wrap.querySelector(".vp-rmeta");
    const content = wrap.querySelector(".vp-rcontent");
    h1 && (h1.textContent = article.title || d.title || "Article");
    meta && (meta.textContent = byline + site);
    content && (article.content ? content.innerHTML = article.content : content.textContent = article.textContent || "");
    d.body.className = "";
    d.body.innerHTML = "";
    d.body.appendChild(wrap);
    g.scrollTo(0, 0);
    // Toolbar actions (mouse-only)
        const toolbar = wrap.querySelector("#vp-reader-toolbar");
    toolbar && toolbar.addEventListener("click", ev => {
      const t = ev.target;
      if (!t || !t.getAttribute) {
        return;
      }
      const act = t.getAttribute("data-vp-r");
      if (!act) {
        return;
      }
      if (act === "close") {
        // re-enter injector with empty to restore — call backup restore inline
        if (g.__vpReaderBackup) {
          d.body.innerHTML = g.__vpReaderBackup.bodyHTML;
          d.body.className = g.__vpReaderBackup.bodyClass || "";
          d.title = g.__vpReaderBackup.title || d.title;
          d.documentElement.removeAttribute("data-vp-reader");
          d.documentElement.classList.remove("vp-reader-root", "dark", "sepia");
          const st = d.getElementById("vp-reader-style");
          st && st.parentNode && st.parentNode.removeChild(st);
          g.scrollTo(0, g.__vpReaderBackup.scrollY || 0);
          g.__vpReaderBackup = null;
        }
        return;
      }
      if (act === "theme") {
        const html = d.documentElement;
        if (html.classList.contains("dark")) {
          html.classList.remove("dark");
          html.classList.add("sepia");
          wrap.classList.remove("dark");
          wrap.classList.add("sepia");
        } else if (html.classList.contains("sepia")) {
          html.classList.remove("sepia");
          wrap.classList.remove("sepia");
        } else {
          html.classList.add("dark");
          wrap.classList.add("dark");
        }
        return;
      }
      if (act === "width") {
        if (wrap.classList.contains("narrow")) {
          wrap.classList.remove("narrow");
          wrap.classList.add("wide");
        } else {
          wrap.classList.contains("wide") ? wrap.classList.remove("wide") : wrap.classList.add("narrow");
        }
        return;
      }
      if (act === "plus" || act === "minus") {
        const cur = parseFloat(g.getComputedStyle(wrap).fontSize) || 18;
        const next = act === "plus" ? Math.min(28, cur + 1) : Math.max(14, cur - 1);
        wrap.style.fontSize = next + "px";
      }
    });
    return "Reader View on \xb7 " + (article.title || "article");
  };
  const parseArticleInTab_ = async tabId => {
    const err = await ensureReadabilityLoaded_(tabId);
    if (err) {
      return {
        error: err
      };
    }
    const scripting = scriptingApi_();
    if (!scripting) {
      return {
        error: "scripting API unavailable"
      };
    }
    try {
      const results = await scripting.executeScript({
        target: {
          tabId
        },
        world: "ISOLATED",
        func: readabilityParseInjector_
      });
      return results && results[0] && results[0].result || {
        error: "No result"
      };
    } catch (e) {
      return {
        error: "Parse failed: " + (e.message || e)
      };
    }
  };
  const toggleReaderView_ = async () => {
    const tabId = await activeTabId_();
    if (tabId < 0) {
      return "No active tab";
    }
    const scripting = scriptingApi_();
    if (!scripting) {
      return "scripting API unavailable";
    }
    // If already in reader mode, exit without re-parsing
        try {
      const state = await scripting.executeScript({
        target: {
          tabId
        },
        world: "ISOLATED",
        func() {
          const d = globalThis.document;
          return d && d.documentElement && d.documentElement.getAttribute("data-vp-reader") === "1" ? "on" : "off";
        }
      });
      if (state && state[0] && state[0].result === "on") {
        const off = await scripting.executeScript({
          target: {
            tabId
          },
          world: "ISOLATED",
          func: readerViewInjector_,
          args: [ null ]
        });
        return String(off && off[0] && off[0].result || "Reader View off");
      }
    } catch (e) {
      return "Reader check failed: " + (e.message || e);
    }
    const article = await parseArticleInTab_(tabId);
    if (article && article.error) {
      return String(article.error);
    }
    try {
      const results = await scripting.executeScript({
        target: {
          tabId
        },
        world: "ISOLATED",
        func: readerViewInjector_,
        args: [ article ]
      });
      return String(results && results[0] && results[0].result || "Reader View on");
    } catch (e) {
      return "Reader View failed: " + (e.message || e);
    }
  };
  const extractWithReadability_ = async () => {
    const tabId = await activeTabId_();
    if (tabId < 0) {
      return "No tab";
    }
    const art = await parseArticleInTab_(tabId);
    if (!art || art.error) {
      return String(art && art.error || "Readability found no article");
    }
    const md = "# " + (art.title || "Untitled") + "\n\n" + htmlToMarkdown_(art.content || art.textContent || "");
    return {
      title: art.title || "",
      markdown: md
    };
  };
  /** Runs in page. Typed any — DOM not in SW typings. */  const copyPartsInjector_ = k => {
    const d = globalThis.document;
    const out = [];
    if (k === "headings") {
      const hs = d.querySelectorAll("h1,h2,h3,h4,h5,h6");
      for (let i = 0; i < hs.length; i++) {
        const h = hs[i];
        const level = +h.tagName.charAt(1) || 1;
        const t = (h.textContent || "").trim().replace(/\s+/g, " ");
        if (t) {
          let hashes = "";
          for (let n = 0; n < level; n++) {
            hashes += "#";
          }
          out.push(hashes + " " + t);
        }
      }
      return out.join("\n");
    }
    if (k === "paragraphs") {
      const ps = d.querySelectorAll("article p, main p, p");
      const seen = {};
      for (let i = 0; i < ps.length; i++) {
        const t = (ps[i].textContent || "").trim().replace(/\s+/g, " ");
        if (t.length > 40 && !seen[t]) {
          seen[t] = 1;
          out.push(t);
        }
      }
      return out.join("\n\n");
    }
    const tables = d.querySelectorAll("table");
    for (let ti = 0; ti < tables.length; ti++) {
      const rows = tables[ti].querySelectorAll("tr");
      if (!rows.length) {
        continue;
      }
      ti && out.push("");
      let first = true;
      for (let ri = 0; ri < rows.length; ri++) {
        const cells = rows[ri].querySelectorAll("th,td");
        const vals = [];
        for (let ci = 0; ci < cells.length; ci++) {
          vals.push((cells[ci].textContent || "").trim().replace(/\s+/g, " ").replace(/\|/g, "\\|"));
        }
        if (!vals.length) {
          continue;
        }
        out.push("| " + vals.join(" | ") + " |");
        if (first) {
          const sep = [];
          for (let vi = 0; vi < vals.length; vi++) {
            sep.push("---");
          }
          out.push("| " + sep.join(" | ") + " |");
          first = false;
        }
      }
    }
    return out.join("\n");
  };
  const copyPageParts_ = async kind => {
    const tabId = await activeTabId_();
    if (tabId < 0) {
      return "No tab";
    }
    const scripting = scriptingApi_();
    if (!scripting) {
      return "scripting API unavailable";
    }
    try {
      const results = await scripting.executeScript({
        target: {
          tabId
        },
        world: "ISOLATED",
        func: copyPartsInjector_,
        args: [ kind ]
      });
      const text = String(results && results[0] && results[0].result || "");
      return writeClipboard_(text);
    } catch (e) {
      return "Copy failed: " + (e.message || e);
    }
  };
  const tabAction_ = async kind => {
    const tabId = await activeTabId_();
    if (tabId < 0 && kind !== "n") {
      return "No tab";
    }
    return new Promise(resolve => {
      if (kind === "n") {
        browser_1.Tabs_.create({}, () => {
          resolve("New tab");
          return browser_1.runtimeError_();
        });
        return;
      }
      browser_1.Tabs_.get(tabId, tab => {
        if (!tab || browser_1.runtimeError_()) {
          resolve("No tab");
          return;
        }
        if (kind === "pin") {
          browser_1.Tabs_.update(tabId, {
            pinned: !tab.pinned
          }, () => {
            resolve(tab.pinned ? "Unpinned" : "Pinned");
            return browser_1.runtimeError_();
          });
        } else if (kind === "mute") {
          browser_1.Tabs_.update(tabId, {
            muted: !tab.mutedInfo || !tab.mutedInfo.muted
          }, () => {
            resolve("Mute toggled");
            return browser_1.runtimeError_();
          });
        } else if (kind === "dup") {
          browser_1.Tabs_.duplicate(tabId, () => {
            resolve("Duplicated");
            return browser_1.runtimeError_();
          });
        } else if (kind === "sleep") {
          browser_1.Tabs_.discard(tabId, () => {
            resolve("Tab sleeping");
            return browser_1.runtimeError_();
          });
        } else if (kind === "rh") {
          browser_1.Tabs_.reload(tabId, {
            bypassCache: true
          }, () => {
            resolve("Hard reloaded");
            return browser_1.runtimeError_();
          });
        } else if (kind === "r") {
          browser_1.Tabs_.reload(tabId, () => {
            resolve("Reloaded");
            return browser_1.runtimeError_();
          });
        } else if (kind === "x") {
          browser_1.Tabs_.remove(tabId, () => {
            resolve("Closed");
            return browser_1.runtimeError_();
          });
        } else if (kind === "back") {
          const g = browser_1.Tabs_.goBack;
          g ? g(tabId, () => {
            resolve("Back");
            return browser_1.runtimeError_();
          }) : resolve("goBack unavailable");
        } else if (kind === "forward") {
          const g = browser_1.Tabs_.goForward;
          g ? g(tabId, () => {
            resolve("Forward");
            return browser_1.runtimeError_();
          }) : resolve("goForward unavailable");
        } else {
          chrome;
 // no direct stop; use reload cancel via scripting
                    browser_1.Tabs_.update(tabId, {
            url: tab.url
          }, () => {
            resolve("Stopped/refreshed");
            return browser_1.runtimeError_();
          });
        }
      });
    });
  };
  /** Resolve a live content-script port for the tab (needed for fg cmds + visual). */  const resolveContentPort_ = tabId => {
    if (tabId < 0) {
      return null;
    }
    const frames = store_1.framesForTab_.get(tabId);
    if (!frames) {
      return null;
    }
    // Prefer main frame (frameId 0), then current, then any open port
        return ports_1.indexFrame(tabId, 0) || frames.top_ || frames.cur_ || (frames.ports_ && frames.ports_.length ? frames.ports_[0] : null);
  };
  const sleepMs_ = ms => new Promise(r => {
    setTimeout(() => {
      r();
    }, ms);
  });
  /**
     * Run a registered Vim+ command (map name from availableCommands_).
     * Resolve tab + content port (with short retries after omni closes).
     * Fg commands (LinkHints, scroll, …) and cPort-needing bg cmds (find, visual) need a port.
     */  const runVimCmd_ = async (command, options) => {
    try {
      if (!(command in key_mappings_1.availableCommands_)) {
        return "Unknown command: " + command;
      }
      const desc = key_mappings_1.availableCommands_[command];
      const needsPort = !desc || !desc[1];
 // kCxt.fg === 0 → needs content port
            let tabId = await activeTabId_();
      tabId < 0 && (tabId = await new Promise(resolve => {
        browser_1.getCurTab(tabs => {
          resolve(tabs && tabs[0] ? tabs[0].id : -1);
          return browser_1.runtimeError_();
        });
      }));
      let tab = null;
      tabId >= 0 && (tab = await new Promise(resolve => {
        browser_1.Tabs_.get(tabId, t => {
          resolve(t || null);
          return browser_1.runtimeError_();
        });
      }));
      let port = tab ? resolveContentPort_(tab.id) : null;
      // Omnibar teardown can briefly drop frame maps — retry a few times
            if (tab && !port) {
        for (let i = 0; i < 6 && !port; i++) {
          await sleepMs_(50 + i * 40);
          port = resolveContentPort_(tab.id);
        }
      }
      // Find / visual also need a port even though they are "bg" wrappers around sendFgCmd
            const needsCPort = command === "enterFindMode" || command === "enterVisualMode" || command === "enterVisualLineMode" || command === "showHelp" || command === "Marks.activateCreate" || command === "Marks.activate";
      if ((needsPort || needsCPort) && !port) {
        return "No page connection \u2014 focus a normal webpage (not chrome://) and try again";
      }
      const sender = tab ? {
        tab,
        frameId: 0,
        id: browser_1.browser_.runtime.id
      } : null;
      run_commands_1.executeExternalCmd({
        command,
        options: options || null,
        count: 1
      }, sender, port);
      return "OK \xb7 " + command;
    } catch (e) {
      return "cmd failed: " + command + " (" + (e.message || e) + ")";
    }
  };
  /** Restore last closed tab/session without needing a content port. */  const restoreClosedTab_ = async () => {
    const sessions = browser_1.browserSessions_();
    if (!sessions || !sessions.restore) {
      return "Sessions API unavailable (check sessions permission)";
    }
    try {
      // Prefer most recently closed from the list (reliable on Chrome MV3)
      if (sessions.getRecentlyClosed) {
        const list = await browser_1.Q_(sessions.getRecentlyClosed, {
          maxResults: 5
        });
        if (list && list.length) {
          for (const item of list) {
            const sid = item.tab && item.tab.sessionId || item.window && item.window.sessionId;
            if (!sid) {
              continue;
            }
            const restored = await browser_1.Q_(sessions.restore, sid);
            if (restored && (restored.tab || restored.window)) {
              return "Restored closed " + (restored.tab ? "tab" : "window");
            }
          }
        }
      }
      // Chrome: restore() with no id = last closed
            const restored = await new Promise(resolve => {
        try {
          const restoreFn = sessions.restore;
          restoreFn(void 0, s => {
            resolve(s || null);
            return browser_1.runtimeError_();
          });
        } catch (_a) {
          resolve(null);
        }
      });
      if (restored && (restored.tab || restored.window)) {
        return "Restored closed " + (restored.tab ? "tab" : "window");
      }
      return "Nothing to restore";
    } catch (e) {
      return "Restore failed: " + (e.message || e);
    }
  };
  /** Direct window dock — reliable from palette without cPort. */  const dockDirect_ = async direction => {
    const dir = (direction || "left").toLowerCase();
    const W = browser_1.Windows_;
    if (!W || !W.getCurrent || !W.update) {
      return "windows API unavailable";
    }
    return new Promise(resolve => {
      W.getCurrent(wnd => {
        if (browser_1.runtimeError_() || !wnd || wnd.id == null) {
          resolve("No window");
          return browser_1.runtimeError_();
        }
        const wndId = wnd.id;
        const left0 = wnd.left || 0;
        const top0 = wnd.top || 0;
        const ww = Math.max(wnd.width || 800, 400);
        const hh = Math.max(wnd.height || 600, 300);
        // Use screen work-area when available; else expand from current window
                const finish = (l, t, w, h) => {
          W.update(wndId, {
            state: "normal",
            left: l,
            top: t,
            width: w,
            height: h
          }, () => {
            resolve("Docked " + dir);
            return browser_1.runtimeError_();
          });
        };
        const apply = (workL, workT, workW, workH) => {
          if (dir === "max" || dir === "maximize" || dir === "full") {
            W.update(wndId, {
              state: "maximized"
            }, () => {
              resolve("Maximized");
              return browser_1.runtimeError_();
            });
            return;
          }
          if (dir === "center" || dir === "mid") {
            const w = Math.round(workW * .5), h = Math.round(workH * .5);
            finish(workL + Math.round((workW - w) / 2), workT + Math.round((workH - h) / 2), w, h);
            return;
          }
          if (dir === "left") {
            finish(workL, workT, Math.max(320, Math.round(workW / 2)), workH);
          } else if (dir === "right") {
            const w = Math.max(320, Math.round(workW / 2));
            finish(workL + workW - w, workT, w, workH);
          } else if (dir === "up" || dir === "top") {
            finish(workL, workT, workW, Math.max(240, Math.round(workH / 2)));
          } else if (dir === "down" || dir === "bottom") {
            const h = Math.max(240, Math.round(workH / 2));
            finish(workL, workT + workH - h, workW, h);
          } else {
            finish(workL, workT, Math.max(320, Math.round(workW / 2)), workH);
          }
        };
        // Prefer chrome.system.display when available (permission: system.display)
                const sys = browser_1.browser_.system;
        const display = sys && sys.display;
        if (display && display.getInfo) {
          try {
            display.getInfo(infos => {
              if (browser_1.runtimeError_() || !infos || !infos.length) {
                apply(Math.min(0, left0), Math.min(0, top0), Math.max(ww + Math.max(0, left0), 1024), Math.max(hh + Math.max(0, top0), 700));
                return browser_1.runtimeError_();
              }
              const cx = left0 + ww / 2, cy = top0 + hh / 2;
              let best = infos[0];
              for (const info of infos) {
                if (info.isEnabled === false) {
                  continue;
                }
                const a = info.workArea || info.bounds;
                if (!a) {
                  continue;
                }
                if (cx >= a.left && cx <= a.left + a.width && cy >= a.top && cy <= a.top + a.height) {
                  best = info;
                  break;
                }
                best = info;
              }
              const a = best.workArea || best.bounds;
              apply(a.left | 0, a.top | 0, a.width | 0, a.height | 0);
              return browser_1.runtimeError_();
            });
            return;
          } catch (/* fall through */ _a) {/* fall through */}
        }
        apply(Math.min(0, left0), Math.min(0, top0), Math.max(ww + Math.max(0, left0), 1024), Math.max(hh + Math.max(0, top0), 700));
      });
    });
  };
  const copyText_ = async kind => {
    const tabId = await activeTabId_();
    return new Promise(resolve => {
      browser_1.Tabs_.get(tabId, tab => {
        if (!tab) {
          resolve("No tab");
          return browser_1.runtimeError_();
        }
        const url = browser_1.getTabUrl(tab), title = tab.title || url;
        let text = url;
        kind === "title" ? text = title : kind === "md" ? text = "[" + title.split("[").join("").split("]").join("") + "](" + url + ")" : kind === "html" && (text = '<a href="' + url.split('"').join("&quot;") + '">' + title.split("<").join("&lt;") + "</a>");
        navigator && navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text).then(() => {
          resolve("Copied");
        }, () => {
          resolve(copyFallback_(text));
        }) : 
        // unlikely in SW
        resolve(copyFallback_(text));
        return browser_1.runtimeError_();
      });
    });
  };
  const copyFallback_ = text => {
    // Prefer store copy_ when available via dynamic import later; for now use offscreen-less approach
    try {
      new Promise((resolve_1, reject_1) => {
        require([ "./clipboard.js" ], resolve_1, reject_1);
      }).then(__importStar).then(m => {
        m && m.copy_ && m.copy_(text);
      });
    } catch (_a) {}
    return "Copied";
  };
  const clearOriginData_ = async types => {
    const d = await currentDomain_();
    if (!d) {
      return "No domain";
    }
    const bd = browser_1.browser_.browsingData;
    if (!bd || !bd.remove) {
      return "browsingData unavailable";
    }
    const origins = [ `http://${d}`, `https://${d}`, `http://www.${d}`, `https://www.${d}` ];
    await new Promise(resolve => {
      try {
        bd.remove({
          origins,
          since: 0
        }, types, () => {
          resolve();
          return browser_1.runtimeError_();
        });
      } catch (_a) {
        resolve();
      }
    });
    return "Cleared for " + d;
  };
  const zoom_ = async delta => {
    const tabId = await activeTabId_();
    if (tabId < 0) {
      return "No tab";
    }
    return new Promise(resolve => {
      const getZoom = browser_1.Tabs_.getZoom;
      const setZoom = browser_1.Tabs_.setZoom;
      if (!getZoom || !setZoom) {
        resolve("zoom API unavailable");
        return;
      }
      if (delta === "reset") {
        setZoom(tabId, 0, () => {
          resolve("Zoom 100%");
          return browser_1.runtimeError_();
        });
        return;
      }
      getZoom(tabId, z => {
        const next = Math.max(.25, Math.min(5, (z || 1) + delta));
        setZoom(tabId, next, () => {
          resolve("Zoom " + Math.round(next * 100) + "%");
          return browser_1.runtimeError_();
        });
      });
    });
  };
  const newIncognito_ = () => new Promise(resolve => {
    const W = browser_1.browser_.windows;
    if (!W || !W.create) {
      resolve("windows API unavailable");
      return;
    }
    W.create({
      incognito: true
    }, () => {
      resolve(browser_1.runtimeError_() ? "Incognito blocked (enable in chrome://extensions)" : "Incognito window");
      return browser_1.runtimeError_();
    });
  });
  const muteOtherTabs_ = async () => {
    const tabId = await activeTabId_();
    if (tabId < 0) {
      return "No tab";
    }
    return new Promise(resolve => {
      browser_1.Tabs_.get(tabId, tab => {
        if (!tab) {
          resolve("No tab");
          return browser_1.runtimeError_();
        }
        browser_1.Tabs_.query({
          windowId: tab.windowId,
          audible: true
        }, tabs => {
          const list = (tabs || []).filter(t => t.id !== tabId);
          let n = 0;
          for (const t of list) {
            browser_1.Tabs_.update(t.id, {
              muted: true
            }, browser_1.runtimeError_);
            n++;
          }
          resolve(n ? "Muted " + n + " tabs" : "No other audible tabs");
          return browser_1.runtimeError_();
        });
      });
    });
  };
  const copyAllTabUrls_ = async () => {
    const tabId = await activeTabId_();
    return new Promise(resolve => {
      browser_1.Tabs_.get(tabId, tab => {
        if (!tab) {
          resolve("No tab");
          return browser_1.runtimeError_();
        }
        browser_1.Tabs_.query({
          windowId: tab.windowId
        }, tabs => {
          const text = (tabs || []).map(t => browser_1.getTabUrl(t)).filter(Boolean).join("\n");
          resolve(copyFallback_(text) + " (" + (tabs || []).length + " urls)");
          return browser_1.runtimeError_();
        });
      });
    });
  };
  const closeTabsCond_ = async mode => {
    const tabId = await activeTabId_();
    if (tabId < 0) {
      return "No tab";
    }
    return new Promise(resolve => {
      browser_1.Tabs_.get(tabId, tab => {
        if (!tab) {
          resolve("No tab");
          return browser_1.runtimeError_();
        }
        browser_1.Tabs_.query({
          windowId: tab.windowId
        }, tabs => {
          if (!tabs) {
            resolve("No tabs");
            return browser_1.runtimeError_();
          }
          const ids = tabs.filter(t => {
            if (t.id === tabId || t.pinned) {
              return false;
            }
            return mode === "others" || t.index > tab.index;
          }).map(t => t.id);
          if (!ids.length) {
            resolve("Nothing to close");
            return;
          }
          browser_1.Tabs_.remove(ids, () => {
            resolve("Closed " + ids.length);
            return browser_1.runtimeError_();
          });
        });
      });
    });
  };
  /** Relevance score for palette filter — prefer exact cmds over short-key prefix noise. */  const scoreQuickAction_ = (act, q) => {
    if (!q) {
      return 1;
    }
    const title = act.title.toLowerCase();
    const desc = act.desc.toLowerCase();
    const cat = act.cat.toLowerCase();
    let s = 0;
    act.cmd !== q && act.id !== q || (s = Math.max(s, 1e4));
    act.keys.some(k => k === q) && (s = Math.max(s, 9500));
    // cmd / keys start with query (":hl" → hl before hall)
        act.cmd.startsWith(q) && (s = Math.max(s, 8500 + q.length * 20 - act.cmd.length));
    for (const k of act.keys) {
      k.startsWith(q) && (s = Math.max(s, 8e3 + q.length * 20 - k.length));
    }
    // query extends a key only if that key is long enough (avoid "hi" matching "highlight")
        for (const k of act.keys) {
      k.length >= 3 && q.startsWith(k) && q !== k && (s = Math.max(s, 1500 + k.length * 10));
    }
    act.cmd.length >= 3 && q.startsWith(act.cmd) && q !== act.cmd && (s = Math.max(s, 1500 + act.cmd.length * 10));
    title === q && (s = Math.max(s, 7e3));
    title.startsWith(q) && (s = Math.max(s, 6e3));
    // word-prefix in title (Highlighter matches "highlight")
        for (const w of title.split(/[^a-z0-9+]+/)) {
      w && (w === q || w.startsWith(q) || q.length >= 4 && w.includes(q)) && (s = Math.max(s, w === q ? 6500 : w.startsWith(q) ? 5500 : 4200));
    }
    q.length >= 3 && title.includes(q) && (s = Math.max(s, 4e3));
    q.length >= 4 && desc.includes(q) && (s = Math.max(s, 1200));
    (cat === q || cat.startsWith(q)) && (s = Math.max(s, 800));
    act.id.includes(q) && q.length >= 2 && (s = Math.max(s, 500));
    return s;
  };
  /** Build rows for omnibar. `text` is the short form filled into the bar. */  const matchQuickActions_ = (queryNoColon, max) => {
    const q = (queryNoColon || "").trim().toLowerCase();
    const parts = q.split(/\s+/).filter(Boolean);
    const head = parts[0] || "";
    const rest = parts.slice(1).join(" ");
    const out = [];
    // Empty ":" → category index + power-user hits (VS Code palette style)
        if (!head) {
      for (const c of exports.CATEGORY_ALIASES) {
        out.push({
          id: "cat-" + c.cat,
          title: "\u25b8 " + c.title,
          desc: c.desc + "  \xb7  type :" + c.cmds[0],
          url: "vimium://qa/browse/" + encodeURIComponent(c.cmds[0] || ""),
          text: ":" + (c.cmds[0] || ""),
          cat: "Category"
        });
      }
      const picks = [ "sc", "h1", "ph", "gray", "hl", "read", "pin", "mute", "yy", "dlft", "sp", "dl" ];
      for (const cmd of picks) {
        if (out.length >= max) {
          break;
        }
        const act = exports.QUICK_ACTIONS.find(a => a.cmd === cmd);
        if (!act) {
          continue;
        }
        out.push({
          id: act.id,
          title: act.title,
          desc: act.desc,
          url: "vimium://qa/" + act.id,
          text: ":" + act.cmd,
          cat: act.cat
        });
      }
      return out.slice(0, max);
    }
    // Category browse: `:view`, `:tab`, `:hist` — only when head is not also a command id/cmd
        const pureCat = exports.CATEGORY_ALIASES.find(c => c.cmds.includes(head) || c.cat.toLowerCase() === head);
    const headIsAction = exports.QUICK_ACTIONS.some(a => a.cmd === head || a.id === head);
    const useCat = !(!pureCat || headIsAction);
    let list = exports.QUICK_ACTIONS;
    let filterHead = head;
    let filterRest = rest;
    if (useCat && pureCat) {
      list = exports.QUICK_ACTIONS.filter(a => a.cat === pureCat.cat);
      filterHead = rest.split(/\s+/)[0] || "";
      filterRest = rest.split(/\s+/).slice(1).join(" ");
      if (!filterHead) {
        for (const act of list) {
          if (out.length >= max) {
            break;
          }
          out.push({
            id: act.id,
            title: act.title,
            desc: act.desc,
            url: "vimium://qa/" + act.id,
            text: ":" + act.cmd,
            cat: act.cat
          });
        }
        return out;
      }
    }
    const ranked = [];
    for (const act of list) {
      const score = scoreQuickAction_(act, filterHead);
      score > 0 && ranked.push({
        act,
        score
      });
    }
    ranked.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a.act.cmd.length !== b.act.cmd.length) {
        return a.act.cmd.length - b.act.cmd.length;
      }
      return a.act.title < b.act.title ? -1 : a.act.title > b.act.title ? 1 : 0;
    });
    for (const {act, score} of ranked) {
      if (out.length >= max) {
        break;
      }
      if (act.needsDomain) {
        const domain = extractDomain_(filterRest) || filterRest || "";
        const short = ":" + act.cmd + (domain ? " " + domain : "");
        out.push({
          id: act.id,
          title: act.title + (domain ? "  " + domain : ""),
          desc: act.desc,
          url: "vimium://qa/" + act.id + (domain ? "/" + encodeURIComponent(domain) : ""),
          text: short,
          cat: act.cat,
          score
        });
      } else {
        out.push({
          id: act.id,
          title: act.title,
          desc: act.desc,
          url: "vimium://qa/" + act.id,
          text: ":" + act.cmd,
          cat: act.cat,
          score
        });
      }
    }
    return out;
  };
  exports.matchQuickActions_ = matchQuickActions_;
  /** Icon type id for omnibar path + color (mapped from category). */  const qaIconType_ = cat => {
    const c = (cat || "").toLowerCase();
    if (c === "privacy") {
      return "qa-priv";
    }
    if (c === "history") {
      return "qa-hist";
    }
    if (c === "view") {
      return "qa-view";
    }
    if (c === "read") {
      return "qa-read";
    }
    if (c === "tab") {
      return "qa-tab";
    }
    if (c === "window") {
      return "qa-win";
    }
    if (c === "nav") {
      return "qa-nav";
    }
    if (c === "clip") {
      return "qa-clip";
    }
    if (c === "chrome") {
      return "qa-chrome";
    }
    if (c === "vim+" || c === "vim") {
      return "qa-vim";
    }
    if (c === "category") {
      return "qa-cat";
    }
    return "qa-act";
  };
  exports.qaIconType_ = qaIconType_;
  /** Restore saved highlights into a tab (page load). Safe no-op if none. */  const restoreHighlightsOnTab_ = tabId => {
    if (tabId < 0) {
      return;
    }
    callEnhance_("hl-restore", void 0, tabId).then(() => {}, () => {});
  };
  exports.restoreHighlightsOnTab_ = restoreHighlightsOnTab_;
  // Auto-restore highlights after navigation (content script may miss late DOM)
    try {
    const webNav = browser_1.browser_.webNavigation;
    webNav && webNav.onCompleted && webNav.onCompleted.addListener(details => {
      if (details.frameId !== 0) {
        return;
      }
      const u = details.url || "";
      if (!u || u.startsWith("chrome:") || u.startsWith("chrome-extension:") || u.startsWith("about:") || u.startsWith("devtools:")) {
        return;
      }
      const tid = details.tabId;
      // two attempts: early + after late content
            setTimeout(() => {
        exports.restoreHighlightsOnTab_(tid);
      }, 250);
      setTimeout(() => {
        exports.restoreHighlightsOnTab_(tid);
      }, 1500);
    });
  } catch (_a) {}
  const runQuickAction_ = path => {
    const raw = decodeURIComponent((path || "").trim());
    const slash = raw.indexOf("/");
    const id = (slash < 0 ? raw : raw.slice(0, slash)).toLowerCase();
    const arg = slash < 0 ? "" : raw.slice(slash + 1);
    const go = async () => {
      try {
        switch (id) {
         case "browse":
          return [ "Category :" + (arg || "\u2026") + " \u2014 pick a command from the list", 3 /* Urls.kEval.ERROR */ ];

         case "shred":
         case "shred-domain":
          return [ await shredDomain_(arg), 3 /* Urls.kEval.ERROR */ ];

         case "shred-current":
         case "sc":
          {
            const d = await currentDomain_();
            return [ await shredDomain_(d), 3 /* Urls.kEval.ERROR */ ];
          }

         case "clear-cookies":
         case "ck":
          return [ await clearOriginData_({
            cookies: true
          }), 3 /* Urls.kEval.ERROR */ ];

         case "clear-cache":
         case "cache":
          return [ await clearOriginData_({
            cache: true,
            cacheStorage: true
          }), 3 /* Urls.kEval.ERROR */ ];

         case "h15":
          return [ `\u2212${await deleteHistorySince_(Date.now() - 15 * MS_MIN)} hist (15m)`, 3 /* Urls.kEval.ERROR */ ];

         case "h1":
          return [ `\u2212${await deleteHistorySince_(Date.now() - MS_HOUR)} hist (1h)`, 3 /* Urls.kEval.ERROR */ ];

         case "h24":
          return [ `\u2212${await deleteHistorySince_(Date.now() - MS_DAY)} hist (24h)`, 3 /* Urls.kEval.ERROR */ ];

         case "h7":
          return [ `\u2212${await deleteHistorySince_(Date.now() - 7 * MS_DAY)} hist (7d)`, 3 /* Urls.kEval.ERROR */ ];

         case "hall":
          {
            const hist = browser_1.browser_.history;
            if (hist && hist.deleteAll) {
              await new Promise(res => {
                hist.deleteAll(() => {
                  res();
                  return browser_1.runtimeError_();
                });
              });
              return [ "All history deleted", 3 /* Urls.kEval.ERROR */ ];
            }
            return [ "deleteAll unavailable", 3 /* Urls.kEval.ERROR */ ];
          }

         case "ph15":
          return [ startHistoryPause_(15 * MS_MIN), 3 /* Urls.kEval.ERROR */ ];

         case "ph":
          return [ startHistoryPause_(MS_HOUR), 3 /* Urls.kEval.ERROR */ ];

         case "ph24":
          return [ startHistoryPause_(MS_DAY), 3 /* Urls.kEval.ERROR */ ];

         case "ph-on":
         case "phon":
          stopHistoryPause_(true);
          return [ "History on", 3 /* Urls.kEval.ERROR */ ];

         case "gray":
          return [ await applyPageFx_("gray"), 3 /* Urls.kEval.ERROR */ ];

         case "blue":
          return [ await applyPageFx_("blue"), 3 /* Urls.kEval.ERROR */ ];

         case "jumble":
          return [ await applyPageFx_("jumble"), 3 /* Urls.kEval.ERROR */ ];

         case "inv":
          return [ await applyPageFx_("inv"), 3 /* Urls.kEval.ERROR */ ];

         case "sepia":
          return [ await applyPageFx_("sepia"), 3 /* Urls.kEval.ERROR */ ];

         case "blur":
          return [ await applyPageFx_("blur"), 3 /* Urls.kEval.ERROR */ ];

         case "contrast":
         case "hicon":
         case "hc":
         case "hi":
          return [ await applyPageFx_("contrast"), 3 /* Urls.kEval.ERROR */ ];

         case "dim":
          return [ await applyPageFx_("dim"), 3 /* Urls.kEval.ERROR */ ];

         case "focus":
          return [ await applyPageFx_("focus"), 3 /* Urls.kEval.ERROR */ ];

         case "spotlight":
         case "spot":
          return [ await toggleFocusMode_("spotlight"), 3 /* Urls.kEval.ERROR */ ];

         case "lens":
         case "flens":
         case "focuslens":
          return [ await toggleFocusMode_("lens"), 3 /* Urls.kEval.ERROR */ ];

         case "zen":
         case "app":
         case "popup":
          // Pure app window — never touches device frame or page filters
          return [ await toggleFocusMode_("zen"), 3 /* Urls.kEval.ERROR */ ];

         case "zenpage":
         case "calm-page":
          return [ await callEnhance_("zen-css"), 3 /* Urls.kEval.ERROR */ ];

         case "exitdf":
         case "normalwin":
         case "undf":
          // Restore browser chrome only (do not reset device frame)
          return [ await setDistractionFreeWindow_(false), 3 /* Urls.kEval.ERROR */ ];

         case "hideimg":
         case "noimg":
         case "imgs":
          return [ await callEnhance_("hideimg"), 3 /* Urls.kEval.ERROR */ ];

         case "iphone":
         case "ios":
          return [ await callEnhance_("device", "iphone"), 3 /* Urls.kEval.ERROR */ ];

         case "pixel":
         case "android":
          return [ await callEnhance_("device", "pixel"), 3 /* Urls.kEval.ERROR */ ];

         case "ipad":
         case "tablet":
          return [ await callEnhance_("device", "ipad"), 3 /* Urls.kEval.ERROR */ ];

         case "galaxy":
         case "galxy":
         case "samsung":
          return [ await callEnhance_("device", "galaxy"), 3 /* Urls.kEval.ERROR */ ];

         case "desktop":
         case "desk":
         case "dsk":
          return [ await callEnhance_("device", "desktop"), 3 /* Urls.kEval.ERROR */ ];

         case "mobile":
         case "mobi":
          return [ await callEnhance_("device", "mobile"), 3 /* Urls.kEval.ERROR */ ];

         case "off-view":
         case "offv":
         case "noview":
          return [ await callEnhance_("off-view"), 3 /* Urls.kEval.ERROR */ ];

         case "progress":
         case "prog":
         case "bar":
          // Force ON when first used; arg "off" only via second toggle through enhance state
          return [ await callEnhance_("progress"), 3 /* Urls.kEval.ERROR */ ];

         case "hl":
         case "highlight":
         case "highlighter":
         case "marker":
          return [ await callEnhance_("hl"), 3 /* Urls.kEval.ERROR */ ];

         case "hl-clear":
         case "hlc":
         case "unmark":
          return [ await callEnhance_("hl-clear"), 3 /* Urls.kEval.ERROR */ ];

         case "reader":
         case "read":
         case "rv":
         case "readable":
         case "article":
          return [ await toggleReaderView_(), 3 /* Urls.kEval.ERROR */ ];

         case "yart":
         case "ymd":
         case "copymd":
         case "ymc":
          {
            const r = await extractWithReadability_();
            if (typeof r === "string") {
              return [ r, 3 /* Urls.kEval.ERROR */ ];
            }
            return [ await writeClipboard_(r.markdown), 3 /* Urls.kEval.ERROR */ ];
          }

         case "yhead":
         case "heads":
         case "toc":
          return [ await copyPageParts_("headings"), 3 /* Urls.kEval.ERROR */ ];

         case "yp":
         case "paras":
         case "copyparas":
          return [ await copyPageParts_("paragraphs"), 3 /* Urls.kEval.ERROR */ ];

         case "ytbl":
         case "tables":
         case "csv":
          return [ await copyPageParts_("tables"), 3 /* Urls.kEval.ERROR */ ];

         case "clear":
         case "clear-fx":
          return [ await applyPageFx_("off"), 3 /* Urls.kEval.ERROR */ ];

         case "pin":
          return [ await tabAction_("pin"), 3 /* Urls.kEval.ERROR */ ];

         case "mute":
          return [ await tabAction_("mute"), 3 /* Urls.kEval.ERROR */ ];

         case "dup":
          return [ await tabAction_("dup"), 3 /* Urls.kEval.ERROR */ ];

         case "sleep":
          return [ await tabAction_("sleep"), 3 /* Urls.kEval.ERROR */ ];

         case "rh":
         case "reload-hard":
          return [ await tabAction_("rh"), 3 /* Urls.kEval.ERROR */ ];

         case "reload":
         case "r":
          return [ await tabAction_("r"), 3 /* Urls.kEval.ERROR */ ];

         case "close":
         case "x":
          return [ await tabAction_("x"), 3 /* Urls.kEval.ERROR */ ];

         case "close-others":
         case "xo":
          return [ await closeTabsCond_("others"), 3 /* Urls.kEval.ERROR */ ];

         case "close-right":
         case "xr":
          return [ await closeTabsCond_("right"), 3 /* Urls.kEval.ERROR */ ];

         case "new":
         case "n":
          return [ await tabAction_("n"), 3 /* Urls.kEval.ERROR */ ];

         case "restore":
         case "u":
         case "undo":
          return [ await restoreClosedTab_(), 3 /* Urls.kEval.ERROR */ ];

         case "bm":
          return [ await runVimCmd_("toggleBookmark"), 3 /* Urls.kEval.ERROR */ ];

         case "rl":
          return [ await runVimCmd_("addToReadingList"), 3 /* Urls.kEval.ERROR */ ];

         case "group":
         case "grp":
          return [ await runVimCmd_("toggleTabGroup"), 3 /* Urls.kEval.ERROR */ ];

         case "dock-left":
         case "dlft":
         case "dockl":
          return [ await dockDirect_("left"), 3 /* Urls.kEval.ERROR */ ];

         case "dock-right":
         case "drgt":
         case "dockr":
          return [ await dockDirect_("right"), 3 /* Urls.kEval.ERROR */ ];

         case "dock-up":
         case "dupp":
         case "docku":
          return [ await dockDirect_("up"), 3 /* Urls.kEval.ERROR */ ];

         case "dock-down":
         case "ddown":
         case "dockd":
          return [ await dockDirect_("down"), 3 /* Urls.kEval.ERROR */ ];

         case "dock-max":
         case "max":
          return [ await dockDirect_("max"), 3 /* Urls.kEval.ERROR */ ];

         case "dock-center":
         case "ctr":
          return [ await dockDirect_("center"), 3 /* Urls.kEval.ERROR */ ];

         case "cycle-win":
         case "cw":
          return [ await runVimCmd_("cycleWindows"), 3 /* Urls.kEval.ERROR */ ];

         case "win-pick":
         case "ww":
          return [ await runVimCmd_("Vomnibar.activateWindows"), 3 /* Urls.kEval.ERROR */ ];

         case "back":
         case "b":
          return [ await tabAction_("back"), 3 /* Urls.kEval.ERROR */ ];

         case "forward":
         case "f":
         case "fwd":
          return [ await tabAction_("forward"), 3 /* Urls.kEval.ERROR */ ];

         case "top":
         case "gg":
         case "home":
          return [ await runVimCmd_("scrollToTop"), 3 /* Urls.kEval.ERROR */ ];

         case "bottom":
         case "end":
          return [ await runVimCmd_("scrollToBottom"), 3 /* Urls.kEval.ERROR */ ];

         case "zi":
          return [ await zoom_(.1), 3 /* Urls.kEval.ERROR */ ];

         case "zo":
          return [ await zoom_(-.1), 3 /* Urls.kEval.ERROR */ ];

         case "z0":
          return [ await zoom_("reset"), 3 /* Urls.kEval.ERROR */ ];

         case "stop":
          return [ await tabAction_("stop"), 3 /* Urls.kEval.ERROR */ ];

         case "yy":
          return [ await copyText_("url"), 3 /* Urls.kEval.ERROR */ ];

         case "yt":
          return [ await copyText_("title"), 3 /* Urls.kEval.ERROR */ ];

         case "ym":
          return [ await copyText_("md"), 3 /* Urls.kEval.ERROR */ ];

         case "yh":
          return [ await copyText_("html"), 3 /* Urls.kEval.ERROR */ ];

         case "dl":
          return [ "Opened " + await openChromePage_("chrome://downloads"), 3 /* Urls.kEval.ERROR */ ];

         case "hist-page":
         case "hp":
          return [ "Opened " + await openChromePage_("chrome://history"), 3 /* Urls.kEval.ERROR */ ];

         case "ext":
          return [ "Opened " + await openChromePage_("chrome://extensions"), 3 /* Urls.kEval.ERROR */ ];

         case "keys":
          return [ "Opened " + await openChromePage_("chrome://extensions/shortcuts"), 3 /* Urls.kEval.ERROR */ ];

         case "flags":
          return [ "Opened " + await openChromePage_("chrome://flags"), 3 /* Urls.kEval.ERROR */ ];

         case "inspect":
         case "insp":
          return [ "Opened " + await openChromePage_("chrome://inspect"), 3 /* Urls.kEval.ERROR */ ];

         case "net":
          return [ "Opened " + await openChromePage_("chrome://net-internals"), 3 /* Urls.kEval.ERROR */ ];

         case "gpu":
          return [ "Opened " + await openChromePage_("chrome://gpu"), 3 /* Urls.kEval.ERROR */ ];

         case "ver":
          return [ "Opened " + await openChromePage_("chrome://version"), 3 /* Urls.kEval.ERROR */ ];

         case "newtab":
         case "ntp":
          return [ "Opened " + await openChromePage_("chrome://newtab"), 3 /* Urls.kEval.ERROR */ ];

         case "bookmarks":
         case "bms":
          return [ "Opened " + await openChromePage_("chrome://bookmarks"), 3 /* Urls.kEval.ERROR */ ];

         case "passwords":
         case "pw":
          return [ "Opened " + await openChromePage_("chrome://password-manager"), 3 /* Urls.kEval.ERROR */ ];

         case "settings":
         case "set":
          return [ "Opened " + await openChromePage_("chrome://settings"), 3 /* Urls.kEval.ERROR */ ];

         case "panel":
         case "sp":
          return [ await runVimCmd_("openSidePanel"), 3 /* Urls.kEval.ERROR */ ];

         case "opts":
          return [ "Opened " + await openChromePage_(browser_1.browser_.runtime.getURL("pages/options.html")), 3 /* Urls.kEval.ERROR */ ];

         case "wiki":
          return [ "Opened " + await openChromePage_(browser_1.browser_.runtime.getURL("pages/wiki.html")), 3 /* Urls.kEval.ERROR */ ];

         case "help-dialog":
         case "help":
         case "?":
          return [ await runVimCmd_("showHelp"), 3 /* Urls.kEval.ERROR */ ];

         case "palette":
         case "a":
         case "actions":
          return [ "Categories: :priv :hist :view :read :tab :win :nav :clip :chrome :vim  \xb7  type one to drill in", 3 /* Urls.kEval.ERROR */ ];

         case "incognito":
         case "incog":
          return [ await newIncognito_(), 3 /* Urls.kEval.ERROR */ ];

         case "move-next-win":
         case "mtw":
          return [ await runVimCmd_("moveTabToNextWindow"), 3 /* Urls.kEval.ERROR */ ];

         case "mute-all":
         case "muteall":
          return [ await muteOtherTabs_(), 3 /* Urls.kEval.ERROR */ ];

         case "pin-all-copy":
         case "yc":
          return [ await copyAllTabUrls_(), 3 /* Urls.kEval.ERROR */ ];

         case "last-dl":
         case "ldl":
          return [ await runVimCmd_("showLastDownload"), 3 /* Urls.kEval.ERROR */ ];

         case "pip":
          return [ await runVimCmd_("enterPictureInPicture"), 3 /* Urls.kEval.ERROR */ ];

         case "find":
         case "search-page":
          return [ await runVimCmd_("enterFindMode"), 3 /* Urls.kEval.ERROR */ ];

         case "hints":
         case "links":
          return [ await runVimCmd_("LinkHints.activate"), 3 /* Urls.kEval.ERROR */ ];

         case "omni":
         case "o":
          return [ await runVimCmd_("Vomnibar.activate"), 3 /* Urls.kEval.ERROR */ ];

         case "vis":
         case "visual":
          return [ await runVimCmd_("enterVisualMode"), 3 /* Urls.kEval.ERROR */ ];

         case "mark":
          return [ await runVimCmd_("Marks.activateCreate"), 3 /* Urls.kEval.ERROR */ ];

         case "unread":
         case "prevtab":
          return [ await runVimCmd_("visitPreviousTab"), 3 /* Urls.kEval.ERROR */ ];

         default:
          return [ "Unknown \u2014 type :a for categories", 3 /* Urls.kEval.ERROR */ ];
        }
      } catch (e) {
        return [ "Failed: " + (e.message || e), 3 /* Urls.kEval.ERROR */ ];
      }
    };
    return go().then(pair => {
      ports_1.showHUD(pair[0]);
      return pair;
    });
  };
  exports.runQuickAction_ = runQuickAction_;
});