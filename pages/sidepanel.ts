import { post_ } from "./async_bg"
import { kPgReq } from "../background/page_messages"

type Mode = "keys" | "cmds" | "tabs" | "closed" | "read" | "page"
type Row = { kind: string, label: string, sub?: string, key?: string
  , command?: string, tabId?: number, url?: string, action?: string, sessionId?: string }

const $ = <T extends HTMLElement>(sel: string): T => document.querySelector(sel) as T
const listEl = $("#list")
const qEl = $<HTMLInputElement>("#q")
const toastEl = $("#toast")
const hostEl = $("#host")
const metaEl = $("#meta")
const badgeEl = $("#badge")
const sitePowerEl = document.getElementById("site-power") as HTMLElement | null

let mode: Mode = "keys"
let tabId = -1
let keys: Array<{ key: string, command: string }> = []
let cmds: Array<{ name: string, bg: boolean, title?: string, cmd?: string, cat?: string }> = []
let toastTimer = 0
let tabs: Array<{ id: number, title: string, url: string, active: boolean }> = []
let reading: Array<{ title: string, url: string, hasBeenRead: boolean }> = []
let closed: Array<{ title: string, url: string, sessionId: string, isWindow: boolean }> = []
let rows: Row[] = []
let sel = 0

const pageActions: Row[] = [
  { kind: "page", label: "Toggle bookmark", action: "bookmark", sub: "ym" },
  { kind: "page", label: "Add to Reading List", action: "readingList", sub: "yr" },
  { kind: "page", label: "Toggle tab group", action: "toggleGroup", sub: "yg" },
  { kind: "page", label: "Copy page URL", action: "copyUrl", sub: "yy" },
  { kind: "page", label: "Copy page title", action: "copyTitle", sub: "yY" },
  { kind: "page", label: "Reload tab", action: "reload", sub: "r" },
  { kind: "page", label: "Discard (sleep) tab", action: "discard", sub: "zd" },
  { kind: "page", label: "Pin / unpin", action: "pin", sub: "a-p" },
  { kind: "page", label: "Mute / unmute", action: "mute", sub: "a-m" },
  { kind: "page", label: "Duplicate tab", action: "duplicate", sub: "yt" },
  { kind: "page", label: "Cycle browser windows", action: "cycleWindows", sub: "gW" },
  { kind: "page", label: "Window switcher (omnibar)", action: "runCommand", command: "Vomnibar.activateWindows", sub: "gA" },
  { kind: "page", label: "Dock left", action: "runCommand", command: "dockWindowLeft", sub: "Alt+←" },
  { kind: "page", label: "Dock right", action: "runCommand", command: "dockWindowRight", sub: "Alt+→" },
  { kind: "page", label: "Show last download", action: "showLastDownload", sub: "yl" },
  { kind: "page", label: "Open Downloads", action: "openDownloads", sub: "gD" },
  { kind: "page", label: "Open History", action: "openHistoryPage", sub: "gH" },
  { kind: "page", label: "Open Extensions", action: "openExtensions" },
  { kind: "page", label: "Open Keyboard shortcuts", action: "openShortcuts" },
  { kind: "page", label: "Show help on page", action: "help", sub: "?" },
  { kind: "page", label: "Open wiki / docs", action: "wiki", sub: "docs" },
  { kind: "page", label: "Toggle Vim+ for this site", action: "toggleSite", sub: "power" },
  { kind: "page", label: "Disable Vim+ once (this tab)", action: "disableOnce" },
  { kind: "page", label: "Enable Vim+", action: "enable" },
]

const setSitePowerUI = (off: boolean): void => {
  if (sitePowerEl) {
    sitePowerEl.classList.toggle("on", !off)
    sitePowerEl.classList.toggle("off", off)
    sitePowerEl.title = off
        ? "Vim+ is OFF for this site — click to turn on"
        : "Vim+ is ON for this site — click to turn off"
  }
  if (badgeEl) {
    badgeEl.textContent = off ? "OFF" : "ON"
  }
}

const toast = (msg: string): void => {
  toastEl.textContent = msg || ""
  if (toastTimer) { clearTimeout(toastTimer) }
  toastTimer = setTimeout((): void => { toastEl.textContent = "" }, 2500)
}

const statusLabel = (status: number): string =>
  status === 1 ? "PARTIAL" : status === 2 ? "OFF" : "ON"

const buildRows = (): void => {
  const needle = qEl.value.trim().toLowerCase()
  const match = (s: string): boolean => !needle || s.toLowerCase().includes(needle)
  rows = []
  if (mode === "keys") {
    for (const k of keys) {
      if (match(k.key) || match(k.command)) {
        rows.push({ kind: "keys", label: k.command, key: k.key, command: k.command, sub: k.key })
      }
    }
  } else if (mode === "cmds") {
    for (const c of cmds) {
      const title = c.title || c.name
      const short = c.cmd ? ":" + c.cmd : ""
      if (match(title) || match(c.name) || match(short) || (c.cat && match(c.cat))) {
        rows.push({ kind: "cmds", label: title, command: c.name, key: short, sub: c.cat || "" })
      }
    }
  } else if (mode === "tabs") {
    for (const t of tabs) {
      if (match(t.title) || match(t.url)) {
        rows.push({
          kind: "tabs", label: (t.active ? "● " : "") + (t.title || t.url),
          sub: t.url, tabId: t.id, url: t.url
        })
      }
    }
  } else if (mode === "closed") {
    for (const c of closed) {
      if (match(c.title) || match(c.url)) {
        rows.push({
          kind: "closed",
          label: (c.isWindow ? "▣ " : "· ") + c.title,
          sub: c.url, sessionId: c.sessionId
        })
      }
    }
  } else if (mode === "read") {
    for (const r of reading) {
      if (match(r.title) || match(r.url)) {
        rows.push({
          kind: "read", label: (r.hasBeenRead ? "✓ " : "· ") + (r.title || r.url),
          sub: r.url, url: r.url
        })
      }
    }
  } else {
    for (const p of pageActions) {
      if (match(p.label) || (p.sub && match(p.sub))) { rows.push(p) }
    }
  }
  if (sel >= rows.length) { sel = Math.max(0, rows.length - 1) }
  renderList()
}

const renderList = (): void => {
  listEl.textContent = ""
  if (!rows.length) {
    const empty = document.createElement("div")
    empty.className = "empty"
    empty.textContent = mode === "read" ? "Nothing saved for later. Save this page with Enter in Page → Read later."
        : mode === "closed" ? "No closed sessions — close a tab then return here"
        : mode === "keys" ? "No matching keys"
        : "No matches"
    listEl.appendChild(empty)
    return
  }
  const frag = document.createDocumentFragment()
  rows.forEach((row, i): void => {
    const el = document.createElement("div")
    el.className = "row" + (i === sel ? " sel" : "")
    el.setAttribute("role", "option")
    el.setAttribute("aria-selected", i === sel ? "true" : "false")
    if (row.kind === "tabs" && row.url && (<RegExpOne> /^https?:/).test(row.url)) {
      const img = document.createElement("img")
      img.className = "fav"
      img.width = 16
      img.height = 16
      img.alt = ""
      img.src = "/_favicon/?pageUrl=" + encodeURIComponent(row.url) + "&size=16"
      el.appendChild(img)
    }
    if (row.key) {
      const kbd = document.createElement("kbd")
      kbd.textContent = row.key
      el.appendChild(kbd)
    }
    const main = document.createElement("span")
    main.className = "main"
    main.textContent = row.label
    el.appendChild(main)
    if (row.sub && row.sub !== row.key) {
      const sub = document.createElement("span")
      sub.className = "sub"
      sub.textContent = row.sub
      el.appendChild(sub)
    }
    el.onmouseenter = (): void => { sel = i; highlight() }
    el.onclick = (): void => { sel = i; void activate() }
    frag.appendChild(el)
  })
  listEl.appendChild(frag)
  const selected = listEl.children[sel] as HTMLElement | undefined
  selected && selected.scrollIntoView({ block: "nearest" })
}

const highlight = (): void => {
  const children = listEl.children
  for (let i = 0; i < children.length; i++) {
    children[i].classList.toggle("sel", i === sel)
  }
  const selected = children[sel] as HTMLElement | undefined
  selected && selected.scrollIntoView({ block: "nearest" })
}

const openExtPage = (path: string, msg: string): void => {
  void post_(kPgReq.focusOrLaunch, { u: location.origin + path })
  toast(msg)
}

const refreshTabId = async (): Promise<void> => {
  try {
    const init = await post_(kPgReq.sidePanelInit)
    if (init && typeof init.tabId === "number" && init.tabId >= 0) { tabId = init.tabId }
  } catch { /* empty */ }
}

const runAction = async (action: string, command?: string): Promise<void> => {
  if (action === "options") {
    openExtPage("/pages/options.html", "Opening options…")
    return
  }
  if (action === "wiki") {
    openExtPage("/pages/wiki.html#getting-started", "Opening wiki…")
    return
  }
  if (action === "help") {
    // Prefer on-page help; also open wiki getting-started as a reliable fallback
    const res = await post_(kPgReq.runPageAction, {
      action: "help" as never, tabId: tabId >= 0 ? tabId : undefined
    })
    if (!(res && res.ok)) {
      openExtPage("/pages/wiki.html#getting-started", "Opening help wiki…")
      return
    }
    toast((res && res.message) || "Help")
    return
  }
  await refreshTabId()
  const res = await post_(kPgReq.runPageAction, {
    action: action as never, tabId: tabId >= 0 ? tabId : undefined, command
  })
  toast((res && res.message) || (res && res.ok ? "OK" : "Failed"))
  if (action === "readingList") {
    reading = (await post_(kPgReq.readingListItems)) || []
    if (mode === "read") { buildRows() }
  }
  if (action === "runCommand" || action === "toggleGroup" || action === "pin" || action === "mute"
      || action === "discard" || action === "duplicate" || action === "disableSite"
      || action === "toggleSite" || action === "disableOnce" || action === "enable") {
    tabs = (await post_(kPgReq.recentTabs)) || []
    if (mode === "tabs") { buildRows() }
    // Prefer immediate toggle result; else re-query
    if (res && typeof res.siteDisabled === "boolean") {
      setSitePowerUI(res.siteDisabled)
    } else {
      try {
        const init = await post_(kPgReq.sidePanelInit)
        if (init) {
          setSitePowerUI(!!init.siteDisabled)
          hostEl.textContent = init.host || init.url || hostEl.textContent
          metaEl.textContent = `v${init.ver}` + (init.runnable ? "" : " · not injected on this page")
              + (init.siteDisabled ? " · site excluded" : "")
        }
      } catch { /* empty */ }
    }
  }
}

const activate = async (): Promise<void> => {
  const row = rows[sel]
  if (!row) { return }
  if (row.kind === "tabs" && row.tabId != null) {
    await post_(kPgReq.callApi, { module: "tabs", name: "update", args: [row.tabId, { active: true }] })
    toast("Switched tab")
    return
  }
  if (row.kind === "closed" && row.sessionId) {
    const res = await post_(kPgReq.restoreSession, { sessionId: row.sessionId })
    toast((res && res.message) || (res && res.ok ? "Restored" : "Failed"))
    closed = (await post_(kPgReq.closedSessions)) || []
    buildRows()
    return
  }
  if (row.kind === "read" && row.url) {
    void post_(kPgReq.focusOrLaunch, { u: row.url })
    toast("Opening…")
    return
  }
  if (row.kind === "cmds" && row.command) {
    await runAction("quickAction", row.command)
    return
  }
  if (row.kind === "keys") {
    if (row.command) { await runAction("runCommand", row.command) }
    return
  }
  if (row.kind === "page" && row.action) {
    await runAction(row.action, row.command)
  }
}

const setMode = (m: Mode): void => {
  mode = m
  const modeBtns = Array.from(document.querySelectorAll("#mode-tabs button")) as HTMLElement[]
  for (const b of modeBtns) {
    b.classList.toggle("active", b.getAttribute("data-mode") === m)
  }
  const placeholders: Record<Mode, string> = {
    keys: "Filter keys…  e.g. scroll, f, o",
    cmds: "Filter commands…  :read :hl :zen",
    tabs: "Filter tabs…  Enter open · x close · p pin · m mute",
    closed: "Filter closed sessions…  Enter to restore",
    read: "Filter reading list…",
    page: "Filter page actions…"
  }
  qEl.placeholder = placeholders[m]
  sel = 0
  buildRows()
  qEl.focus()
}

void (async (): Promise<void> => {
  try {
    const [init, keyList, tabList, readList, catalog, closedList] = await Promise.all([
      post_(kPgReq.sidePanelInit),
      post_(kPgReq.keyBindingsList),
      post_(kPgReq.recentTabs),
      post_(kPgReq.readingListItems).catch((): typeof reading => []),
      post_(kPgReq.commandCatalog),
      post_(kPgReq.closedSessions).catch((): typeof closed => [])
    ])
    tabId = init.tabId
    keys = keyList || []
    tabs = tabList || []
    reading = readList || []
    cmds = catalog || []
    closed = closedList || []
    hostEl.textContent = init.host || init.url || "(no page)"
    setSitePowerUI(!!init.siteDisabled)
    metaEl.textContent = `v${init.ver}`
        + (init.runnable ? "" : " · not injected on this page")
        + (init.siteDisabled ? " · site excluded" : "")
        + (init.status != null && !init.siteDisabled ? " · frame " + statusLabel(init.status) : "")
    buildRows()
  } catch (e) {
    toast("Could not load command center — reload the extension")
    try { metaEl.textContent = "offline / SW error" } catch { /* empty */ }
    console.warn("sidepanel init failed", e)
  }
  document.documentElement!.classList.remove("loading")
  try { qEl.focus() } catch { /* empty */ }
})()

qEl.addEventListener("input", (): void => { sel = 0; buildRows() })

const modeBtns = Array.from(document.querySelectorAll("#mode-tabs button")) as HTMLElement[]
for (const btn of modeBtns) {
  btn.addEventListener("click", (): void => {
    setMode((btn.getAttribute("data-mode") || "keys") as Mode)
  })
}

const actionBtns = Array.from(document.querySelectorAll("#actions button")) as HTMLElement[]
for (const btn of actionBtns) {
  btn.addEventListener("click", (): void => {
    void runAction(btn.getAttribute("data-act") || "")
  })
}

// Header / site controls
const bindClick = (id: string, act: string): void => {
  const el = document.getElementById(id)
  if (el) { el.addEventListener("click", (): void => { void runAction(act) }) }
}
bindClick("btn-options", "options")
bindClick("btn-help", "help")
bindClick("btn-wiki", "wiki")
bindClick("site-power", "toggleSite")

const stopEv = (ev: Event): void => {
  const e = ev as Event & { preventDefault (): void }
  e.preventDefault && e.preventDefault()
}

document.addEventListener("keydown", (ev: KeyboardEvent): void => {
  const t = ev.target as HTMLElement
  const inInput = t === qEl
  const emptyQ = !qEl.value
  const key = (ev.key || "") + ""
  const ctrl = ev.ctrlKey || ev.metaKey
  if (key === "Escape") {
    if (qEl.value) { qEl.value = ""; sel = 0; buildRows(); stopEv(ev); return }
  }
  if (key === "ArrowDown" || key === "n" && ctrl || (key === "j" && (emptyQ || !inInput))) {
    if (rows.length) { sel = (sel + 1) % rows.length; highlight(); stopEv(ev) }
    return
  }
  if (key === "ArrowUp" || key === "p" && ctrl || (key === "k" && (emptyQ || !inInput))) {
    if (rows.length) { sel = (sel - 1 + rows.length) % rows.length; highlight(); stopEv(ev) }
    return
  }
  if (key === "Enter") {
    void activate()
    stopEv(ev)
    return
  }
  if (!ctrl && !ev.altKey && (emptyQ || !inInput)) {
    const row = rows[sel]
    if (mode === "tabs" && row && row.tabId != null) {
      if (key === "x") {
        void post_(kPgReq.callApi, { module: "tabs", name: "remove" as never, args: [row.tabId] as never })
        tabs = tabs.filter(tb => tb.id !== row.tabId)
        buildRows()
        toast("Closed tab")
        stopEv(ev)
        return
      }
      if (key === "p") {
        void runAction("pin")
        stopEv(ev)
        return
      }
      if (key === "m") {
        void runAction("mute")
        stopEv(ev)
        return
      }
    }
    if (mode === "read" && row && row.url && key === "x") {
      void runAction("readingListRemove", row.url)
      reading = reading.filter(r => r.url !== row.url)
      buildRows()
      stopEv(ev)
      return
    }
  }
  if (ev.altKey || ev.ctrlKey || ev.metaKey) { return }
  if (key >= "1" && key <= "6" && (emptyQ || !inInput)) {
    const modes: Mode[] = ["keys", "cmds", "tabs", "closed", "read", "page"]
    setMode(modes[+key - 1])
    stopEv(ev)
  }
})
