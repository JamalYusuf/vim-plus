/**
 * Options page: five conceptual tabs + filter. Notes (help column) stay visible.
 *
 * Start  — where Vim+ is allowed to run (sites, permissions)
 * Keys   — what you press (maps, hints, layout)
 * Search — how you look things up (engines, hashbangs, omnibar)
 * Look   — how it looks (theme, HUD, CSS, reading, :view FX)
 * Advanced — power-user edges (clip, sync, other extensions)
 *
 * Rows are assigned by option field id (FIELD_SEC), not caption keywords.
 * Number keys are not bound here — they are Vim counts on this page.
 */
type SecId = "start" | "keys" | "search" | "look" | "advanced" | "hide"

interface SecDef {
  id: Exclude<SecId, "hide">
  label: string
  hint: string
}

const SECTIONS: SecDef[] = [
  { id: "start", label: "Start", hint: "Excluded sites and permissions" },
  { id: "keys", label: "Keys", hint: "Mappings, hints, and keyboard layout" },
  { id: "search", label: "Search", hint: "Engines, hashbangs, and the omnibar" },
  { id: "look", label: "Look", hint: "Theme, colors, reading, and CSS" },
  { id: "advanced", label: "Advanced", hint: "Clip rewrite, sync, and other extensions" }
]

/**
 * Option element id → tab. Keep in sync when adding a control.
 * Welcome has no field (data-sec="start"). The old "Advanced Options"
 * header is data-sec="hide".
 */
const FIELD_SEC: { [id: string]: Exclude<SecId, "hide"> } = {
  exclusionRules: "start",
  exclusionOnlyFirstMatch: "start",
  exclusionListenHash: "start",
  exclusionAddButton: "start",
  exclusionSortButton: "start",
  optionalPermissions: "start",
  "in-incognito": "start",
  "on-file-urls": "start",
  showInIncognito: "start",

  keyMappings: "keys",
  linkHintCharacters: "keys",
  linkHintNumbers: "keys",
  alwaysIgnore: "keys",
  ignoreIfAlt: "keys",
  ignoreIfNotASCII: "keys",
  ignoreCaps: "keys",
  mapModifier: "keys",
  inPrivResistFp: "keys",
  testKeyInInput: "keys",
  filterLinkHints: "keys",
  waitForEnter: "keys",
  mouseReachable: "keys",
  grabBackFocus: "keys",
  regexFindMode: "keys",
  ignoreReadonly: "keys",
  passEsc: "keys",
  keyboard: "keys",
  showAdvancedCommands: "keys",

  searchUrl: "search",
  hashbangs: "search",
  searchEngines: "search",
  preferBrowserSearch: "search",
  newTabUrl: "search",
  previousPatterns: "search",
  nextPatterns: "search",
  vomnibarOptions: "search",
  vomnibarPage: "search",
  titleIgnoreList: "search",
  omniBlockList: "search",

  hideHud: "look",
  autoDarkMode: "look",
  autoReduceMotion: "look",
  showActionIcon: "look",
  showContextMenu: "look",
  readingProgress: "look",
  readingProgressColor: "look",
  readingProgressHeight: "look",
  readingProgressCss: "look",
  showInfiniteScrollMark: "look",
  userDefinedCss: "look",
  viewFxCss: "look",
  accentColor: "look",
  hintBg: "look",
  hintFg: "look",
  findHighlightColor: "look",
  highlighterColors: "look",
  spotlightRadius: "look",
  readerFontSize: "look",
  readerWidth: "look",
  smoothScroll: "look",
  scrollStepSize: "look",
  keyupTime: "look",

  dockWindowStep: "advanced",
  clipSub: "advanced",
  extAllowList: "advanced",
  localeEncoding: "advanced",
  notifyUpdate: "advanced",
  vimSync: "advanced"
}

/** Built-in :view CSS (must match DEFAULT_VIEW_FX_CSS in background/quick_actions.ts). */
const BUILTIN_VIEW_FX = `# :view color profiles — one "name: css" line each
# Known names: gray, blue, inv, sepia, blur, contrast, dim, focus
# jumble scrambles text in JS and cannot be overridden here
# Delete all and save to restore these built-ins
gray: html{filter:grayscale(1)!important}
blue: html{filter:sepia(.35) hue-rotate(180deg) saturate(1.4)!important}
inv: html{filter:invert(1) hue-rotate(180deg)!important}
sepia: html{filter:sepia(.85) contrast(1.05)!important}
blur: html{filter:blur(1.2px)!important}
contrast: html{filter:contrast(1.45) saturate(1.1)!important}
dim: html{filter:brightness(.72)!important}
focus: html{background:#111!important}body{max-width:42rem;margin:0 auto!important;padding:1rem 1.25rem!important;background:#111!important;color:#e8e8e8!important;box-shadow:0 0 0 100vmax rgba(0,0,0,.55)!important}
`

/** Normalize a stored color so `<input type="color">` will accept it (#rrggbb). */
const toColorInputValue_ = (raw: string, fallback: string): string => {
  const s = ((raw || "") + "").trim()
  const hex3 = <RegExpOne> /^#([0-9a-fA-F]{3})$/
  const hex6 = <RegExpOne> /^#([0-9a-fA-F]{6})$/
  const m3 = hex3.exec(s)
  if (m3) {
    const h = m3[1]!
    return ("#" + h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2)).toLowerCase()
  }
  const m6 = hex6.exec(s)
  if (m6) { return ("#" + m6[1]).toLowerCase() }
  const fb = hex6.exec(fallback)
  return fb ? fallback.toLowerCase() : "#e11d48"
}

const bindColorFields_ = (): void => {
  const pickers = document.querySelectorAll("input[type='color'][data-color-for]")
  for (let i = 0; i < pickers.length; i++) {
    const pick = pickers[i] as HTMLInputElement
    const id = pick.getAttribute("data-color-for") || ""
    const text = document.getElementById(id) as HTMLInputElement | null
    if (!text) { continue }
    const syncPick = (): void => {
      pick.value = toColorInputValue_(text.value, pick.getAttribute("value") || "#e11d48")
    }
    syncPick()
    pick.addEventListener("input", (): void => {
      text.value = pick.value
      text.dispatchEvent(new Event("input", { bubbles: true }))
    })
    text.addEventListener("input", syncPick)
  }
}

const HL_SWATCH_DEFAULTS = ["#fef08a", "#bbf7d0", "#fbcfe8", "#bfdbfe", "#fdba74"]

const bindHighlighterSwatches_ = (): void => {
  const hidden = document.getElementById("highlighterColors") as HTMLInputElement | null
  const box = document.getElementById("hl-swatches")
  if (!hidden || !box) { return }
  const picks = box.querySelectorAll("input[type='color'][data-hl-i]")
  let writing = false
  const writeHidden = (): void => {
    const parts: string[] = []
    for (let i = 0; i < picks.length; i++) {
      parts.push((picks[i] as HTMLInputElement).value)
    }
    writing = true
    hidden.value = parts.join(",")
    hidden.dispatchEvent(new Event("input", { bubbles: true }))
    writing = false
  }
  const readHidden = (): void => {
    if (writing) { return }
    const raw = (hidden.value || "").trim()
    const parts = raw ? raw.split(",") : []
    for (let i = 0; i < picks.length; i++) {
      const p = picks[i] as HTMLInputElement
      const fallback = HL_SWATCH_DEFAULTS[i] || "#fef08a"
      p.value = toColorInputValue_((parts[i] || "").trim(), fallback)
    }
  }
  for (let i = 0; i < picks.length; i++) {
    const p = picks[i] as HTMLInputElement
    p.value = HL_SWATCH_DEFAULTS[i] || "#fef08a"
    p.addEventListener("input", writeHidden)
  }
  readHidden()
  hidden.addEventListener("input", readHidden)
  hidden.addEventListener("change", readHidden)
  // Option_ hydrates after this script — re-apply stored palette
  setTimeout(readHidden, 80)
  setTimeout(readHidden, 400)
}

const HASH_SEC: { [k: string]: Exclude<SecId, "hide"> } = {
  start: "start", welcome: "start", home: "start", exclusions: "start", exclusion: "start",
  keys: "keys", commands: "keys", installed: "keys", mapping: "keys", keyboard: "keys",
  search: "search", engines: "search", hashbang: "search", hashbangs: "search", omni: "search",
  look: "look", theme: "look", css: "look", reading: "look", view: "look", fx: "look",
  viewfx: "look", views: "look", colors: "look", hints: "look",
  advanced: "advanced", power: "advanced", clip: "advanced"
}

let inited = false
let currentSec: Exclude<SecId, "hide"> = "start"
let filterQ = ""

const assignRow = (tr: HTMLTableRowElement, lastSec: SecId): SecId => {
  const explicit = ((tr.getAttribute("data-sec") || "") + "").toLowerCase() as SecId
  if (explicit === "hide" || explicit === "start" || explicit === "keys"
      || explicit === "search" || explicit === "look" || explicit === "advanced") {
    return explicit
  }
  const nodes = tr.querySelectorAll("[id]")
  for (let i = 0; i < nodes.length; i++) {
    const id = (nodes[i] as HTMLElement).id
    const sec = FIELD_SEC[id]
    if (sec) { return sec }
  }
  return lastSec
}

const rowText = (tr: HTMLTableRowElement): string => {
  const bits: string[] = []
  const cap = tr.querySelector("td.caption")
  if (cap) { bits.push((cap.textContent || "") + "") }
  const labels = tr.querySelectorAll("label, .checkboxHint, .info, [data-model]")
  for (let i = 0; i < labels.length; i++) {
    const el = labels[i] as HTMLElement
    bits.push((el.textContent || "") + "")
    if (el.id) { bits.push(el.id) }
  }
  bits.push((tr.getAttribute("data-sec") || "") + "")
  return bits.join(" ").toLowerCase()
}

const init = (): void => {
  if (inited) { return }
  const wrapper = document.getElementById("wrapper")
  if (!wrapper) { return }
  const rows = Array.from(wrapper.querySelectorAll("tbody > tr")) as HTMLTableRowElement[]
  if (!rows.length) { return }
  if (document.getElementById("opt-tabs")) {
    inited = true
    return
  }
  inited = true

  let lastSec: SecId = "start"
  let lastTbody: Element | null = null
  for (const tr of rows) {
    if (tr.parentElement !== lastTbody) {
      lastTbody = tr.parentElement
      const tSec = lastTbody && lastTbody.getAttribute("data-sec")
      if (tSec === "keys" || tSec === "start" || tSec === "search"
          || tSec === "look" || tSec === "advanced") {
        lastSec = tSec
      }
    }
    const sec = assignRow(tr, lastSec)
    tr.setAttribute("data-sec", sec)
    if (sec !== "hide") { lastSec = sec }
  }

  const thead = wrapper.querySelector("thead tr td")
  const nav = document.createElement("nav")
  nav.id = "opt-tabs"
  nav.setAttribute("role", "tablist")
  nav.setAttribute("aria-label", "Options sections")

  const tabRow = document.createElement("div")
  tabRow.className = "opt-tabs-row"
  tabRow.innerHTML = SECTIONS.map((s, i) =>
      `<button type="button" role="tab" data-sec="${s.id}" aria-selected="${i === 0 ? "true" : "false"}"${
        i === 0 ? ' class="active"' : ""}>${s.label}</button>`
  ).join("") + [
    '<div class="opt-tools">',
    '<label class="opt-filter-label" for="opt-filter">Find</label>',
    '<input id="opt-filter" type="search" enterkeyhint="search" autocomplete="off"',
    ' placeholder="any option" aria-label="Find any option on this page" />',
    '<span id="opt-filter-count" class="opt-filter-count" hidden></span>',
    "</div>"
  ].join("")

  const desc = document.createElement("p")
  desc.id = "opt-sec-desc"
  desc.className = "opt-sec-desc"

  nav.appendChild(tabRow)
  nav.appendChild(desc)
  if (thead) {
    thead.appendChild(nav)
  } else if (document.body) {
    document.body.insertBefore(nav, document.body.firstChild)
  }

  const descEl = document.getElementById("opt-sec-desc")
  const filterEl = document.getElementById("opt-filter") as HTMLInputElement | null
  const countEl = document.getElementById("opt-filter-count")
  const rootEl = document.documentElement as HTMLElement
  rootEl.classList.remove("vp-help-off", "vp-help-on")

  const show = (sec: Exclude<SecId, "hide">, persist?: boolean): void => {
    currentSec = sec
    const q = filterQ
    let shown = 0
    for (const tr of rows) {
      const s = (tr.getAttribute("data-sec") || "advanced") as SecId
      if (s === "hide") {
        tr.style.display = "none"
        continue
      }
      const tabOk = !q && s === sec
      const filterOk = !!q && rowText(tr).indexOf(q) >= 0
      const vis = q ? filterOk : tabOk
      tr.style.display = vis ? "" : "none"
      if (vis) { shown++ }
    }
    const btns = tabRow.querySelectorAll("button")
    for (let i = 0; i < btns.length; i++) {
      const b = btns[i] as HTMLElement
      const on = !q && b.getAttribute("data-sec") === sec
      b.classList.toggle("active", on)
      b.setAttribute("aria-selected", on ? "true" : "false")
    }
    if (descEl) {
      const def = SECTIONS.filter(s => s.id === sec)[0]
      descEl.textContent = q
        ? (shown ? shown + " matching option" + (shown === 1 ? "" : "s") : "No matches")
        : (def ? def.hint : "")
    }
    if (countEl) {
      countEl.hidden = !q
      countEl.textContent = q ? (shown + "") : ""
    }
    if (persist !== false && !q) {
      try { sessionStorage.setItem("vp-opt-sec", sec) } catch { /* empty */ }
    }
    if (persist !== false) { window.scrollTo(0, 0) }
  }

  tabRow.addEventListener("click", (ev: Event): void => {
    const t = ev.target as HTMLElement
    if (!t || t.tagName !== "BUTTON") { return }
    const sec = (t.getAttribute("data-sec") || "start") as Exclude<SecId, "hide">
    if (filterEl && filterQ) {
      filterEl.value = ""
      filterQ = ""
    }
    show(sec)
  })

  if (filterEl) {
    filterEl.addEventListener("input", (): void => {
      filterQ = ((filterEl.value || "") + "").trim().toLowerCase()
      show(currentSec, false)
    })
    filterEl.addEventListener("keydown", (ev: KeyboardEvent): void => {
      if ((ev.key || "") === "Escape") {
        if (filterEl.value) {
          filterEl.value = ""
          filterQ = ""
          show(currentSec, false)
          ;(ev as unknown as { preventDefault (): void }).preventDefault()
        } else {
          filterEl.blur()
        }
      }
    })
  }

  document.addEventListener("keydown", (ev: KeyboardEvent): void => {
    if (ev.altKey || ev.metaKey || ev.ctrlKey) { return }
    const t = ev.target as HTMLElement | null
    const tag = ((t && t.tagName) || "") + ""
    const inField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
    const key = (ev.key || "") + ""
    // Only `/` is reserved here. Digit keys stay Vim counts — binding 1–5
    // to tabs made the page jump/shrink while typing commands.
    if (!inField && key === "/") {
      if (filterEl) {
        ;(ev as unknown as { preventDefault (): void }).preventDefault()
        filterEl.focus()
        filterEl.select()
      }
    }
  })

  let initial: Exclude<SecId, "hide"> = "start"
  try {
    const hash = ((location.hash || "") + "").replace(<RegExpOne> /^#/, "").toLowerCase()
    if (hash && HASH_SEC[hash]) {
      initial = HASH_SEC[hash]
    } else {
      const saved = sessionStorage.getItem("vp-opt-sec") as Exclude<SecId, "hide"> | null
      if (saved && SECTIONS.some(s => s.id === saved)) { initial = saved }
    }
  } catch { /* empty */ }
  show(initial)

  bindColorFields_()
  bindHighlighterSwatches_()

  const fill = document.getElementById("viewFxFillDefaults")
  const ta = document.getElementById("viewFxCss") as HTMLTextAreaElement | null
  if (fill && ta) {
    fill.addEventListener("click", (ev: Event): void => {
      (ev as Event & { preventDefault (): void }).preventDefault()
      if (ta.value.trim() && !confirm("Replace the current :view CSS with the built-in profiles?")) {
        return
      }
      ta.value = BUILTIN_VIEW_FX
      ta.dispatchEvent(new Event("input", { bubbles: true }))
      ta.focus()
    })
  }

  const hint = document.getElementById("vp-shortcut-hint")
  const link = document.getElementById("vp-open-shortcuts")
  if (link) {
    link.addEventListener("click", (ev: Event): void => {
      (ev as Event & { preventDefault (): void }).preventDefault()
      try {
        chrome.tabs.create({ url: "chrome://extensions/shortcuts" })
      } catch { /* empty */ }
    })
  }
  try {
    chrome.commands.getAll((cmds): void => {
      const sp = cmds && cmds.filter(c => c.name === "openSidePanel")[0]
      if (hint && (!sp || !sp.shortcut)) {
        hint.hidden = false
      }
    })
  } catch { /* empty */ }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", (): void => { setTimeout(init, 50) })
} else {
  setTimeout(init, 80)
}
