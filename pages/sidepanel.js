import { post_ } from "./async_bg.js";

const $ = sel => document.querySelector(sel);

const listEl = $("#list");

const qEl = $("#q");

const toastEl = $("#toast");

const hostEl = $("#host");

const metaEl = $("#meta");

const badgeEl = $("#badge");

const sitePowerEl = document.getElementById("site-power");

let mode = "keys";

let tabId = -1;

let keys = [];

let cmds = [];

let toastTimer = 0;

let tabs = [];

let reading = [];

let closed = [];

let rows = [];

let sel = 0;

const pageActions = [ {
  kind: "page",
  label: "Toggle bookmark",
  action: "bookmark",
  sub: "ym"
}, {
  kind: "page",
  label: "Add to Reading List",
  action: "readingList",
  sub: "yr"
}, {
  kind: "page",
  label: "Toggle tab group",
  action: "toggleGroup",
  sub: "yg"
}, {
  kind: "page",
  label: "Copy page URL",
  action: "copyUrl",
  sub: "yy"
}, {
  kind: "page",
  label: "Copy page title",
  action: "copyTitle",
  sub: "yY"
}, {
  kind: "page",
  label: "Reload tab",
  action: "reload",
  sub: "r"
}, {
  kind: "page",
  label: "Discard (sleep) tab",
  action: "discard",
  sub: "zd"
}, {
  kind: "page",
  label: "Pin / unpin",
  action: "pin",
  sub: "a-p"
}, {
  kind: "page",
  label: "Mute / unmute",
  action: "mute",
  sub: "a-m"
}, {
  kind: "page",
  label: "Duplicate tab",
  action: "duplicate",
  sub: "yt"
}, {
  kind: "page",
  label: "Cycle browser windows",
  action: "cycleWindows",
  sub: "gW"
}, {
  kind: "page",
  label: "Window switcher (omnibar)",
  action: "runCommand",
  command: "Vomnibar.activateWindows",
  sub: "gA"
}, {
  kind: "page",
  label: "Dock left",
  action: "runCommand",
  command: "dockWindowLeft",
  sub: "Alt+\u2190"
}, {
  kind: "page",
  label: "Dock right",
  action: "runCommand",
  command: "dockWindowRight",
  sub: "Alt+\u2192"
}, {
  kind: "page",
  label: "Show last download",
  action: "showLastDownload",
  sub: "yl"
}, {
  kind: "page",
  label: "Open Downloads",
  action: "openDownloads",
  sub: "gD"
}, {
  kind: "page",
  label: "Open History",
  action: "openHistoryPage",
  sub: "gH"
}, {
  kind: "page",
  label: "Open Extensions",
  action: "openExtensions"
}, {
  kind: "page",
  label: "Open Keyboard shortcuts",
  action: "openShortcuts"
}, {
  kind: "page",
  label: "Show help on page",
  action: "help",
  sub: "?"
}, {
  kind: "page",
  label: "Open wiki / docs",
  action: "wiki",
  sub: "docs"
}, {
  kind: "page",
  label: "Toggle Vim+ for this site",
  action: "toggleSite",
  sub: "power"
}, {
  kind: "page",
  label: "Disable Vim+ once (this tab)",
  action: "disableOnce"
}, {
  kind: "page",
  label: "Enable Vim+",
  action: "enable"
} ];

const setSitePowerUI = off => {
  if (sitePowerEl) {
    sitePowerEl.classList.toggle("on", !off);
    sitePowerEl.classList.toggle("off", off);
    sitePowerEl.title = off ? "Vim+ is OFF for this site \u2014 click to turn on" : "Vim+ is ON for this site \u2014 click to turn off";
  }
  badgeEl && (badgeEl.textContent = off ? "OFF" : "ON");
};

const toast = msg => {
  toastEl.textContent = msg || "";
  toastTimer && clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.textContent = "";
  }, 2500);
};

const statusLabel = status => status === 1 ? "PARTIAL" : status === 2 ? "OFF" : "ON";

const buildRows = () => {
  const needle = qEl.value.trim().toLowerCase();
  const match = s => !needle || s.toLowerCase().includes(needle);
  rows = [];
  if (mode === "keys") {
    for (const k of keys) {
      (match(k.key) || match(k.command)) && rows.push({
        kind: "keys",
        label: k.command,
        key: k.key,
        command: k.command,
        sub: k.key
      });
    }
  } else if (mode === "cmds") {
    for (const c of cmds) {
      const title = c.title || c.name;
      const short = c.cmd ? ":" + c.cmd : "";
      (match(title) || match(c.name) || match(short) || c.cat && match(c.cat)) && rows.push({
        kind: "cmds",
        label: title,
        command: c.name,
        key: short,
        sub: c.cat || ""
      });
    }
  } else if (mode === "tabs") {
    for (const t of tabs) {
      (match(t.title) || match(t.url)) && rows.push({
        kind: "tabs",
        label: (t.active ? "\u25cf " : "") + (t.title || t.url),
        sub: t.url,
        tabId: t.id,
        url: t.url
      });
    }
  } else if (mode === "closed") {
    for (const c of closed) {
      (match(c.title) || match(c.url)) && rows.push({
        kind: "closed",
        label: (c.isWindow ? "\u25a3 " : "\xb7 ") + c.title,
        sub: c.url,
        sessionId: c.sessionId
      });
    }
  } else if (mode === "read") {
    for (const r of reading) {
      (match(r.title) || match(r.url)) && rows.push({
        kind: "read",
        label: (r.hasBeenRead ? "\u2713 " : "\xb7 ") + (r.title || r.url),
        sub: r.url,
        url: r.url
      });
    }
  } else {
    for (const p of pageActions) {
      (match(p.label) || p.sub && match(p.sub)) && rows.push(p);
    }
  }
  sel >= rows.length && (sel = Math.max(0, rows.length - 1));
  renderList();
};

const renderList = () => {
  listEl.textContent = "";
  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = mode === "read" ? "Nothing saved for later. Save this page with Enter in Page \u2192 Read later." : mode === "closed" ? "No closed sessions \u2014 close a tab then return here" : mode === "keys" ? "No matching keys" : "No matches";
    listEl.append(empty);
    return;
  }
  const frag = document.createDocumentFragment();
  rows.forEach((row, i) => {
    const el = document.createElement("div");
    el.className = "row" + (i === sel ? " sel" : "");
    el.setAttribute("role", "option");
    el.setAttribute("aria-selected", i === sel ? "true" : "false");
    if (row.kind === "tabs" && row.url && /^https?:/.test(row.url)) {
      const img = document.createElement("img");
      img.className = "fav";
      img.width = 16;
      img.height = 16;
      img.alt = "";
      img.src = "/_favicon/?pageUrl=" + encodeURIComponent(row.url) + "&size=16";
      el.append(img);
    }
    if (row.key) {
      const kbd = document.createElement("kbd");
      kbd.textContent = row.key;
      el.append(kbd);
    }
    const main = document.createElement("span");
    main.className = "main";
    main.textContent = row.label;
    el.append(main);
    if (row.sub && row.sub !== row.key) {
      const sub = document.createElement("span");
      sub.className = "sub";
      sub.textContent = row.sub;
      el.append(sub);
    }
    el.onmouseenter = () => {
      sel = i;
      highlight();
    };
    el.onclick = () => {
      sel = i;
      activate();
    };
    frag.append(el);
  });
  listEl.append(frag);
  const selected = listEl.children[sel];
  selected && selected.scrollIntoView({
    block: "nearest"
  });
};

const highlight = () => {
  const children = listEl.children;
  for (let i = 0; i < children.length; i++) {
    children[i].classList.toggle("sel", i === sel);
  }
  const selected = children[sel];
  selected && selected.scrollIntoView({
    block: "nearest"
  });
};

const openExtPage = (path, msg) => {
  post_(15 /* kPgReq.focusOrLaunch */ , {
    u: location.origin + path
  });
  toast(msg);
};

const refreshTabId = async () => {
  try {
    const init = await post_(34 /* kPgReq.sidePanelInit */);
    init && typeof init.tabId === "number" && init.tabId >= 0 && (tabId = init.tabId);
  } catch (_a) {}
};

const runAction = async (action, command) => {
  if (action === "options") {
    openExtPage("/pages/options.html", "Opening options\u2026");
    return;
  }
  if (action === "wiki") {
    openExtPage("/pages/wiki.html#getting-started", "Opening wiki\u2026");
    return;
  }
  if (action === "help") {
    // Prefer on-page help; also open wiki getting-started as a reliable fallback
    const res = await post_(38 /* kPgReq.runPageAction */ , {
      action: "help",
      tabId: tabId >= 0 ? tabId : void 0
    });
    if (!res || !res.ok) {
      openExtPage("/pages/wiki.html#getting-started", "Opening help wiki\u2026");
      return;
    }
    toast(res && res.message || "Help");
    return;
  }
  await refreshTabId();
  const res = await post_(38 /* kPgReq.runPageAction */ , {
    action,
    tabId: tabId >= 0 ? tabId : void 0,
    command
  });
  toast(res && res.message || (res && res.ok ? "OK" : "Failed"));
  if (action === "readingList") {
    reading = await post_(37 /* kPgReq.readingListItems */) || [];
    mode === "read" && buildRows();
  }
  if (action === "runCommand" || action === "toggleGroup" || action === "pin" || action === "mute" || action === "discard" || action === "duplicate" || action === "disableSite" || action === "toggleSite" || action === "disableOnce" || action === "enable") {
    tabs = await post_(36 /* kPgReq.recentTabs */) || [];
    mode === "tabs" && buildRows();
    // Prefer immediate toggle result; else re-query
        if (res && typeof res.siteDisabled === "boolean") {
      setSitePowerUI(res.siteDisabled);
    } else {
      try {
        const init = await post_(34 /* kPgReq.sidePanelInit */);
        if (init) {
          setSitePowerUI(!!init.siteDisabled);
          hostEl.textContent = init.host || init.url || hostEl.textContent;
          metaEl.textContent = `v${init.ver}` + (init.runnable ? "" : " \xb7 not injected on this page") + (init.siteDisabled ? " \xb7 site excluded" : "");
        }
      } catch (_a) {}
    }
  }
};

const activate = async () => {
  const row = rows[sel];
  if (!row) {
    return;
  }
  if (row.kind === "tabs" && row.tabId != null) {
    await post_(25 /* kPgReq.callApi */ , {
      module: "tabs",
      name: "update",
      args: [ row.tabId, {
        active: true
      } ]
    });
    toast("Switched tab");
    return;
  }
  if (row.kind === "closed" && row.sessionId) {
    const res = await post_(41 /* kPgReq.restoreSession */ , {
      sessionId: row.sessionId
    });
    toast(res && res.message || (res && res.ok ? "Restored" : "Failed"));
    closed = await post_(40 /* kPgReq.closedSessions */) || [];
    buildRows();
    return;
  }
  if (row.kind === "read" && row.url) {
    post_(15 /* kPgReq.focusOrLaunch */ , {
      u: row.url
    });
    toast("Opening\u2026");
    return;
  }
  if (row.kind === "cmds" && row.command) {
    await runAction("quickAction", row.command);
    return;
  }
  if (row.kind === "keys") {
    row.command && await runAction("runCommand", row.command);
    return;
  }
  row.kind === "page" && row.action && await runAction(row.action, row.command);
};

const setMode = m => {
  mode = m;
  const modeBtns = Array.from(document.querySelectorAll("#mode-tabs button"));
  for (const b of modeBtns) {
    b.classList.toggle("active", b.getAttribute("data-mode") === m);
  }
  const placeholders = {
    keys: "Filter keys\u2026  e.g. scroll, f, o",
    cmds: "Filter commands\u2026  :read :hl :zen",
    tabs: "Filter tabs\u2026  Enter open \xb7 x close \xb7 p pin \xb7 m mute",
    closed: "Filter closed sessions\u2026  Enter to restore",
    read: "Filter reading list\u2026",
    page: "Filter page actions\u2026"
  };
  qEl.placeholder = placeholders[m];
  sel = 0;
  buildRows();
  qEl.focus();
};

(async () => {
  try {
    const [init, keyList, tabList, readList, catalog, closedList] = await Promise.all([ post_(34 /* kPgReq.sidePanelInit */), post_(35 /* kPgReq.keyBindingsList */), post_(36 /* kPgReq.recentTabs */), post_(37 /* kPgReq.readingListItems */).catch(() => []), post_(39 /* kPgReq.commandCatalog */), post_(40 /* kPgReq.closedSessions */).catch(() => []) ]);
    tabId = init.tabId;
    keys = keyList || [];
    tabs = tabList || [];
    reading = readList || [];
    cmds = catalog || [];
    closed = closedList || [];
    hostEl.textContent = init.host || init.url || "(no page)";
    setSitePowerUI(!!init.siteDisabled);
    metaEl.textContent = `v${init.ver}` + (init.runnable ? "" : " \xb7 not injected on this page") + (init.siteDisabled ? " \xb7 site excluded" : "") + (init.status == null || init.siteDisabled ? "" : " \xb7 frame " + statusLabel(init.status));
    buildRows();
  } catch (e) {
    toast("Could not load command center \u2014 reload the extension");
    try {
      metaEl.textContent = "offline / SW error";
    } catch (_a) {}
    console.warn("sidepanel init failed", e);
  }
  document.documentElement.classList.remove("loading");
  try {
    qEl.focus();
  } catch (_b) {}
})();

qEl.addEventListener("input", () => {
  sel = 0;
  buildRows();
});

const modeBtns = Array.from(document.querySelectorAll("#mode-tabs button"));

for (const btn of modeBtns) {
  btn.addEventListener("click", () => {
    setMode(btn.getAttribute("data-mode") || "keys");
  });
}

const actionBtns = Array.from(document.querySelectorAll("#actions button"));

for (const btn of actionBtns) {
  btn.addEventListener("click", () => {
    runAction(btn.getAttribute("data-act") || "");
  });
}

// Header / site controls
const bindClick = (id, act) => {
  const el = document.getElementById(id);
  el && el.addEventListener("click", () => {
    runAction(act);
  });
};

bindClick("btn-options", "options");

bindClick("btn-help", "help");

bindClick("btn-wiki", "wiki");

bindClick("site-power", "toggleSite");

const stopEv = ev => {
  const e = ev;
  e.preventDefault && e.preventDefault();
};

document.addEventListener("keydown", ev => {
  const t = ev.target;
  const inInput = t === qEl;
  const emptyQ = !qEl.value;
  const key = (ev.key || "") + "";
  const ctrl = ev.ctrlKey || ev.metaKey;
  if (key === "Escape" && qEl.value) {
    qEl.value = "";
    sel = 0;
    buildRows();
    stopEv(ev);
    return;
  }
  if (key === "ArrowDown" || key === "n" && ctrl || key === "j" && (emptyQ || !inInput)) {
    if (rows.length) {
      sel = (sel + 1) % rows.length;
      highlight();
      stopEv(ev);
    }
    return;
  }
  if (key === "ArrowUp" || key === "p" && ctrl || key === "k" && (emptyQ || !inInput)) {
    if (rows.length) {
      sel = (sel - 1 + rows.length) % rows.length;
      highlight();
      stopEv(ev);
    }
    return;
  }
  if (key === "Enter") {
    activate();
    stopEv(ev);
    return;
  }
  if (!ctrl && !ev.altKey && (emptyQ || !inInput)) {
    const row = rows[sel];
    if (mode === "tabs" && row && row.tabId != null) {
      if (key === "x") {
        post_(25 /* kPgReq.callApi */ , {
          module: "tabs",
          name: "remove",
          args: [ row.tabId ]
        });
        tabs = tabs.filter(tb => tb.id !== row.tabId);
        buildRows();
        toast("Closed tab");
        stopEv(ev);
        return;
      }
      if (key === "p") {
        runAction("pin");
        stopEv(ev);
        return;
      }
      if (key === "m") {
        runAction("mute");
        stopEv(ev);
        return;
      }
    }
    if (mode === "read" && row && row.url && key === "x") {
      runAction("readingListRemove", row.url);
      reading = reading.filter(r => r.url !== row.url);
      buildRows();
      stopEv(ev);
      return;
    }
  }
  if (ev.altKey || ev.ctrlKey || ev.metaKey) {
    return;
  }
  if (key >= "1" && key <= "6" && (emptyQ || !inInput)) {
    const modes = [ "keys", "cmds", "tabs", "closed", "read", "page" ];
    setMode(modes[+key - 1]);
    stopEv(ev);
  }
});