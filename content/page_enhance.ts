/**
 * Vim+ page enhance: reading progress, spotlight / focus-lens, hide images,
 * device frames, highlighter mode, zen chrome hide.
 * Exposed as globalThis.__vpEnhance for background inject/quick-actions.
 */
import { isTop, doc, setupEventListener } from "../lib/utils"
import { OnDocLoaded_ } from "../lib/dom_utils"

type SpotMode = "" | "spotlight" | "lens"

interface DevicePreset { id: string; w: number; h: number; label: string }

const DEVICES: ReadonlyArray<DevicePreset> = [
  { id: "iphone", w: 390, h: 844, label: "iPhone 14" },
  { id: "pixel", w: 412, h: 915, label: "Pixel 7" },
  { id: "ipad", w: 820, h: 1180, label: "iPad Air" },
  { id: "galaxy", w: 360, h: 800, label: "Galaxy S21" },
  { id: "desktop", w: 0, h: 0, label: "Desktop" },
  { id: "mobile", w: 390, h: 844, label: "Mobile" }
]

const DEFAULT_HL_COLORS: ReadonlyArray<{ k: string; c: string; name: string }> = [
  { k: "1", c: "#fef08a", name: "Yellow" },
  { k: "2", c: "#bbf7d0", name: "Green" },
  { k: "3", c: "#fbcfe8", name: "Pink" },
  { k: "4", c: "#bfdbfe", name: "Blue" },
  { k: "5", c: "#fdba74", name: "Orange" },
  { k: "0", c: "transparent", name: "Clear" }
]

let HL_COLORS: Array<{ k: string; c: string; name: string }> =
    DEFAULT_HL_COLORS.map(x => ({ k: x.k, c: x.c, name: x.name }))

const applyHighlighterPalette_ = (raw: string): void => {
  const parts = (raw || "").split(",")
  for (let i = 0; i < 5; i++) {
    const c = (parts[i] || "").trim()
    const ok = c.charAt(0) === "#" && c.length >= 4 && c.length <= 9
        && c.indexOf(";") < 0 && c.indexOf("{") < 0
    HL_COLORS[i]!.c = ok ? c : DEFAULT_HL_COLORS[i]!.c
  }
}

const STYLE_IDS = {
  progress: "vp-reading-progress-style",
  spot: "vp-spotlight-style",
  hideimg: "vp-hide-img-style",
  device: "vp-device-style",
  deviceBody: "vp-device-body-style",
  zen: "vp-zen-style",
  hl: "vp-hl-style"
}

let progressOn = true
let progressColor = "#e11d48"
let progressHeight = 2
/** Extra CSS from Options → Reading progress CSS (user override) */
let progressExtraCss = ""
let showInfinity = true
let spotMode: SpotMode = ""
let hlMode = false
let hlColor = "#fef08a"
let deviceId = ""
let zenOn = false
let hideImgOn = false
let spotX = 0, spotY = 0, spotR = 150
let spotlightRadius = 150
let progressEl: HTMLElement | null = null
let infinityEl: HTMLElement | null = null
let spotEl: HTMLElement | null = null
let hlBar: HTMLElement | null = null
let lastDocH = 0
let grewNearBottom = false
let hlUndo: HTMLElement[] = []
let progressTrackEl: HTMLElement | null = null
let progressListenersOn = false
let progressRaf = 0
let progressPollTimer = 0
let progressMO: { disconnect (): void, observe (t: Node, o: object): void } | null = null

const D = doc as any
const W = globalThis as any

const chromeApi = (): any => W.chrome

const ensureStyle_ = (id: string, css: string): void => {
  let el = D.getElementById(id) as any
  if (!el) {
    el = D.createElement("style")
    el.id = id
    ;(D.head || D.documentElement).appendChild(el)
  }
  el.textContent = css
}

const removeEl_ = (id: string): void => {
  const el = D.getElementById(id)
  if (el && el.parentNode) { (el.parentNode as any).removeChild(el) }
}

const removeNode_ = (el: any): void => {
  if (el && el.parentNode) { (el.parentNode as any).removeChild(el) }
}

const progressColorSafe_ = (): string => {
  const rawColor = (progressColor || "").trim()
  const unsafe = rawColor.indexOf(";") >= 0 || rawColor.indexOf("{") >= 0 || rawColor.indexOf("}") >= 0
  return rawColor && rawColor.length < 48 && !unsafe ? rawColor : "#e11d48"
}

const loadSettings_ = (): void => {
  const ch = chromeApi()
  if (!ch || !ch.storage || !ch.storage.local) {
    // Still show bar with defaults if storage is slow/unavailable
    if (progressOn) { applyProgressUI_(false) }
    return
  }
  try {
    ch.storage.local.get(
        ["readingProgress", "readingProgressColor", "readingProgressHeight",
          "readingProgressCss", "showInfiniteScrollMark", "highlighterColors", "spotlightRadius"],
        (items: any): void => {
          if (items) {
            // Default ON when unset; only turn off for explicit false
            if (typeof items["readingProgress"] === "boolean") {
              progressOn = items["readingProgress"]
            } else if (items["readingProgress"] == null) {
              progressOn = true
            }
            if (typeof items["readingProgressColor"] === "string" && items["readingProgressColor"].trim()) {
              progressColor = items["readingProgressColor"].trim()
            }
            const rawH = items["readingProgressHeight"]
            const hNum = typeof rawH === "number" ? rawH
                : (typeof rawH === "string" ? parseInt(rawH, 10) : 0)
            if (hNum > 0) {
              progressHeight = Math.min(12, Math.max(1, hNum | 0))
            }
            if (typeof items["readingProgressCss"] === "string") {
              progressExtraCss = items["readingProgressCss"]
            }
            if (typeof items["showInfiniteScrollMark"] === "boolean") {
              showInfinity = items["showInfiniteScrollMark"]
            }
            if (typeof items["highlighterColors"] === "string") {
              applyHighlighterPalette_(items["highlighterColors"])
            }
            const rawR = items["spotlightRadius"]
            const rNum = typeof rawR === "number" ? rawR
                : (typeof rawR === "string" ? parseInt(rawR, 10) : 0)
            if (rNum >= 80 && rNum <= 400) {
              spotlightRadius = rNum
              if (!spotMode || spotMode === "spotlight") { spotR = spotlightRadius }
            }
          }
          // Rebuild styles (color/height may have changed) but keep bar alive
          applyProgressUI_(true)
        })
  } catch {
    if (progressOn) { applyProgressUI_(false) }
  }
}

/** Scroll metrics that work before/after layout and for scrollingElement-based pages. */
const getScrollMetrics_ = (): { y: number, maxScroll: number, scrollH: number, view: number } => {
  const root = D.documentElement as HTMLElement | null
  const body = D.body as HTMLElement | null
  const se = (D.scrollingElement || root || body) as HTMLElement | null
  const scrollH = Math.max(
    se && se.scrollHeight || 0,
    root && root.scrollHeight || 0,
    body && body.scrollHeight || 0,
    root && root.offsetHeight || 0,
    body && body.offsetHeight || 0
  )
  const view = Math.max(
    1,
    W.innerHeight || 0,
    root && root.clientHeight || 0,
    se && se.clientHeight || 0
  )
  // Prefer the real scrolling root's scrollTop; fall back to window offsets
  let y = 0
  if (se && typeof se.scrollTop === "number" && se.scrollTop > 0) {
    y = se.scrollTop
  } else if (typeof W.pageYOffset === "number") {
    y = W.pageYOffset
  } else if (typeof W.scrollY === "number") {
    y = W.scrollY
  } else if (root) {
    y = root.scrollTop || 0
  } else if (body) {
    y = body.scrollTop || 0
  }
  // Also consider visualViewport offset on mobile
  try {
    if (W.visualViewport && typeof W.visualViewport.pageTop === "number") {
      y = Math.max(y, W.visualViewport.pageTop)
    }
  } catch { /* empty */ }
  const maxScroll = Math.max(0, scrollH - view)
  return { y, maxScroll, scrollH, view }
}

const writeProgressFill_ = (p: number): void => {
  if (!progressEl || !progressTrackEl) { return }
  const clamped = Math.max(0, Math.min(1, p))
  // CSS var on track drives the fill (stylesheet uses scaleX(var(--vp-read-p)))
  progressTrackEl.style.setProperty("--vp-read-p", String(clamped))
  // Inline transform as backup if a site clobbers custom properties
  progressEl.style.setProperty("transform", "scaleX(" + clamped.toFixed(4) + ")", "important")
  progressEl.setAttribute("aria-valuenow", String(Math.round(clamped * 100)))
}

/**
 * Reading progress bar — always-on scrollbar-like chrome for every page.
 * Fill uses scaleX + CSS var (never frozen by width:0 !important alone).
 */
const applyProgressUI_ = (forceStyle: boolean): void => {
  if (!isTop) { return }
  if (!progressOn) {
    tearDownProgressUI_()
    return
  }
  const h = Math.max(2, Math.min(12, progressHeight | 0))
  const color = progressColorSafe_()
  const needStyle = forceStyle || !D.getElementById(STYLE_IDS.progress)
  if (needStyle) {
    ensureStyle_(STYLE_IDS.progress, `
#vp-read-progress-track{
  position:fixed!important;top:0!important;left:0!important;right:0!important;
  height:${h}px!important;z-index:2147483646!important;pointer-events:none!important;
  margin:0!important;padding:0!important;border:none!important;
  background:transparent!important;box-shadow:none!important;
  overflow:hidden!important;isolation:isolate!important;
  --vp-read-p:0;
}
#vp-read-progress-fill,#vp-read-progress{
  position:absolute!important;top:0!important;left:0!important;bottom:0!important;
  width:100%!important;max-width:100%!important;height:100%!important;
  margin:0!important;padding:0!important;border:none!important;
  transform:scaleX(var(--vp-read-p,0))!important;transform-origin:left center!important;
  will-change:transform!important;
  background:${color}!important;
  box-shadow:none!important;
  transition:transform 90ms ease-out!important;
  pointer-events:none!important;
}
#vp-read-infinity{
  position:fixed!important;top:${h + 8}px!important;right:12px!important;
  z-index:2147483647!important;pointer-events:none!important;
  font:600 11px/1 ui-sans-serif,system-ui,sans-serif!important;color:${color}!important;
  opacity:0!important;transition:opacity .18s ease!important;
  letter-spacing:.04em!important;text-shadow:none!important;
}
#vp-read-infinity.on{opacity:.45!important}
` + (progressExtraCss ? "\n/* user readingProgressCss */\n" + progressExtraCss : ""))
  }
  ensureProgressNodes_()
  bindProgressListeners_()
  updateProgress_()
}

const ensureProgressNodes_ = (): void => {
  if (!progressOn) { return }
  const host = D.body || D.documentElement
  if (!host) { return }
  // Reuse live nodes if SPA has not wiped them
  let track = D.getElementById("vp-read-progress-track") as HTMLElement | null
  let fill = D.getElementById("vp-read-progress-fill") as HTMLElement | null
  let inf = D.getElementById("vp-read-infinity") as HTMLElement | null
  if (track && fill && track.contains(fill)) {
    progressTrackEl = track
    progressEl = fill
    infinityEl = inf
    if (inf && !inf.parentNode) { host.appendChild(inf) }
    return
  }
  // Recreate
  if (track) { removeNode_(track) }
  if (fill && fill.parentNode) { removeNode_(fill) }
  if (inf) { removeNode_(inf) }
  progressTrackEl = D.createElement("div")
  progressTrackEl!.id = "vp-read-progress-track"
  progressTrackEl!.setAttribute("aria-hidden", "true")
  progressEl = D.createElement("div")
  progressEl!.id = "vp-read-progress-fill"
  progressEl!.setAttribute("aria-hidden", "true")
  progressEl!.setAttribute("role", "progressbar")
  progressEl!.setAttribute("aria-valuemin", "0")
  progressEl!.setAttribute("aria-valuemax", "100")
  infinityEl = D.createElement("div")
  infinityEl!.id = "vp-read-infinity"
  infinityEl!.textContent = "∞"
  infinityEl!.setAttribute("aria-hidden", "true")
  progressTrackEl!.appendChild(progressEl!)
  host.appendChild(progressTrackEl!)
  host.appendChild(infinityEl!)
}

const tearDownProgressUI_ = (): void => {
  removeEl_(STYLE_IDS.progress)
  if (progressEl) { removeNode_(progressEl); progressEl = null }
  if (progressTrackEl) { removeNode_(progressTrackEl); progressTrackEl = null }
  if (infinityEl) { removeNode_(infinityEl); infinityEl = null }
  if (progressPollTimer) {
    try { W.clearInterval(progressPollTimer) } catch { /* empty */ }
    progressPollTimer = 0
  }
  if (progressRaf) {
    try { W.cancelAnimationFrame(progressRaf) } catch { /* empty */ }
    progressRaf = 0
  }
}

const updateProgress_ = (): void => {
  if (!progressOn) { return }
  // SPA / late body: ensure nodes still exist
  if (!progressEl || !progressTrackEl || !progressEl.isConnected || !progressTrackEl.isConnected) {
    ensureProgressNodes_()
  }
  if (!progressEl || !progressTrackEl) { return }
  const m = getScrollMetrics_()
  let p = 0
  if (m.maxScroll <= 1) {
    // Short page: empty at top; full if somehow scrolled
    p = m.y > 2 ? 1 : 0
  } else {
    p = Math.max(0, Math.min(1, m.y / m.maxScroll))
  }
  writeProgressFill_(p)
  if (m.scrollH > lastDocH + 400) {
    if (p > 0.72) { grewNearBottom = true }
    lastDocH = m.scrollH
  } else if (m.scrollH + 80 < lastDocH) {
    lastDocH = m.scrollH
  }
  const likelyInfinite = grewNearBottom && m.scrollH > m.view * 3.5
  if (infinityEl) {
    if (showInfinity && likelyInfinite) { infinityEl.classList.add("on") }
    else { infinityEl.classList.remove("on") }
  }
}

const onScrollOrResize_ = (): void => {
  if (progressRaf) { return }
  progressRaf = W.requestAnimationFrame ? W.requestAnimationFrame((): void => {
    progressRaf = 0
    updateProgress_()
  }) : (progressRaf = 0, updateProgress_(), 0)
}

const bindProgressListeners_ = (): void => {
  if (progressListenersOn) { return }
  progressListenersOn = true
  // Immediate — don't wait for DOMContentLoaded (bar should work like a scrollbar)
  setupEventListener(0, "scroll", onScrollOrResize_, 0, 0)
  setupEventListener(0, "resize", onScrollOrResize_, 0, 0)
  setupEventListener(0, "wheel", onScrollOrResize_, 0, 0)
  setupEventListener(0, "touchmove", onScrollOrResize_, 0, 0)
  try {
    D.addEventListener("scroll", onScrollOrResize_, { capture: true, passive: true })
  } catch {
    try { D.addEventListener("scroll", onScrollOrResize_, true) } catch { /* empty */ }
  }
  try {
    if (W.visualViewport && W.visualViewport.addEventListener) {
      W.visualViewport.addEventListener("scroll", onScrollOrResize_, { passive: true })
      W.visualViewport.addEventListener("resize", onScrollOrResize_, { passive: true })
    }
  } catch { /* empty */ }
  // Poll lightly so SPA layout growth / non-window scrollers still update
  try {
    progressPollTimer = W.setInterval((): void => {
      if (progressOn) { updateProgress_() }
    }, 400) as unknown as number
  } catch { /* empty */ }
  // Re-attach if the page replaces <body>
  try {
    const MO = (W as any).MutationObserver as (new (cb: () => void) => {
      disconnect (): void, observe (t: Node, o: object): void
    }) | undefined
    if (MO && !progressMO) {
      progressMO = new MO((): void => {
        if (!progressOn) { return }
        if (!progressTrackEl || !(progressTrackEl as any).isConnected) {
          ensureProgressNodes_()
          updateProgress_()
        }
      })
      progressMO.observe(D.documentElement || D, { childList: true, subtree: true })
    }
  } catch { /* empty */ }
}

const ensureSpotLayer_ = (): void => {
  if (spotEl) { return }
  ensureStyle_(STYLE_IDS.spot, `
#vp-spot-layer{position:fixed;inset:0;z-index:2147483645;pointer-events:none;
backdrop-filter:blur(7px) brightness(.92);-webkit-backdrop-filter:blur(7px) brightness(.92);
--vp-sx:50%;--vp-sy:40%;--vp-sr:150px;
-webkit-mask-image:radial-gradient(circle var(--vp-sr) at var(--vp-sx) var(--vp-sy),
  transparent 0%,transparent 55%,#000 100%);
mask-image:radial-gradient(circle var(--vp-sr) at var(--vp-sx) var(--vp-sy),
  transparent 0%,transparent 55%,#000 100%)}
#vp-spot-layer.lens{
-webkit-mask-image:radial-gradient(ellipse calc(var(--vp-sr)*1.6) var(--vp-sr) at var(--vp-sx) var(--vp-sy),
  transparent 0%,transparent 50%,#000 100%);
mask-image:radial-gradient(ellipse calc(var(--vp-sr)*1.6) var(--vp-sr) at var(--vp-sx) var(--vp-sy),
  transparent 0%,transparent 50%,#000 100%)}
`)
  spotEl = D.createElement("div")
  spotEl!.id = "vp-spot-layer"
  ;(D.documentElement || D.body).appendChild(spotEl)
}

const updateSpotPos_ = (): void => {
  if (!spotEl) { return }
  spotEl.style.setProperty("--vp-sx", spotX + "px")
  spotEl.style.setProperty("--vp-sy", spotY + "px")
  spotEl.style.setProperty("--vp-sr", spotR + "px")
}

const onPointerMove_ = (e: Event): void => {
  const pe = e as any
  spotX = pe.clientX
  spotY = pe.clientY
  if (spotMode === "lens") {
    let el: any = pe.target
    while (el && el !== D.body) {
      const tag = el.tagName || ""
      const isH = tag.length === 2 && tag.charCodeAt(0) === 72 /* H */
          && tag.charCodeAt(1) >= 49 && tag.charCodeAt(1) <= 54
      if (tag === "P" || tag === "LI" || tag === "BLOCKQUOTE" || tag === "PRE" || tag === "TD"
          || tag === "ARTICLE" || tag === "SECTION" || isH) {
        const r: any = el.getBoundingClientRect()
        spotX = r.left + r.width / 2
        spotY = r.top + r.height / 2
        spotR = Math.max(80, Math.min(280, Math.max(r.height as number, (r.width as number) * 0.35) * 0.7))
        break
      }
      el = el.parentElement
    }
  } else {
    spotR = spotlightRadius
  }
  updateSpotPos_()
}

const setSpotMode_ = (mode: SpotMode): string => {
  if (spotMode === mode || mode === "") {
    spotMode = ""
    if (spotEl) { removeNode_(spotEl); spotEl = null }
    removeEl_(STYLE_IDS.spot)
    setupEventListener(0, "pointermove", onPointerMove_, 1, 1)
    return "spotlight/lens off"
  }
  spotMode = mode
  ensureSpotLayer_()
  spotEl!.className = mode === "lens" ? "lens" : ""
  setupEventListener(0, "pointermove", onPointerMove_, 0, 1)
  spotX = (W.innerWidth || 800) / 2
  spotY = (W.innerHeight || 600) / 2
  updateSpotPos_()
  return mode + " on"
}

const toggleHideImages_ = (): string => {
  hideImgOn = !hideImgOn
  if (!hideImgOn) {
    removeEl_(STYLE_IDS.hideimg)
    return "images shown"
  }
  ensureStyle_(STYLE_IDS.hideimg, `
img,picture,video,svg:not([id^="vp-"]),[role=img],.emoji,source[type^="image"]{
  visibility:hidden!important;opacity:0!important}
`)
  return "images hidden"
}

const toggleZen_ = (): string => {
  zenOn = !zenOn
  if (!zenOn) {
    removeEl_(STYLE_IDS.zen)
    return "zen off"
  }
  ensureStyle_(STYLE_IDS.zen, `
header,nav,footer,aside,
[role=banner],[role=navigation],[role=complementary],
.sidebar,.side-bar,.site-header,.site-footer,.top-bar,.navbar,.nav-bar,
#sidebar,#header,#footer,#nav,.ad,.ads,.advertisement,
[class*="cookie"],[id*="cookie"],[class*="newsletter"],
[class*="share-"],[class*="social-"]{display:none!important}
body{max-width:46rem!important;margin:0 auto!important;padding:1.25rem!important}
`)
  return "zen on (page chrome hidden — use :zen for toolbar-free window)"
}

const setDevice_ = (id: string): string => {
  const key = (id || "desktop").toLowerCase()
  let preset: DevicePreset | undefined
  for (let i = 0; i < DEVICES.length; i++) {
    if (DEVICES[i]!.id === key || DEVICES[i]!.label.toLowerCase() === key) {
      preset = DEVICES[i]
      break
    }
  }
  removeEl_(STYLE_IDS.device)
  removeEl_(STYLE_IDS.deviceBody)
  removeEl_("vp-device-badge")
  if (D.documentElement) { D.documentElement.classList.remove("vp-device-mode") }
  if (!preset || preset.w <= 0) {
    deviceId = ""
    return "desktop view"
  }
  deviceId = preset.id
  if (D.documentElement) { D.documentElement.classList.add("vp-device-mode") }
  ensureStyle_(STYLE_IDS.device, `
html.vp-device-mode,html.vp-device-mode body{background:#18181b!important}
#vp-device-badge{position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:2147483646;
background:#e11d48;color:#fff;font:11px/1.2 system-ui,sans-serif;padding:4px 10px;
pointer-events:none;letter-spacing:.04em}
`)
  ensureStyle_(STYLE_IDS.deviceBody, `
body{max-width:${preset.w}px!important;margin:0 auto!important;
box-shadow:0 0 0 1px #3f3f46,0 12px 40px rgba(0,0,0,.35)!important}
`)
  const badge = D.createElement("div")
  badge.id = "vp-device-badge"
  badge.textContent = preset.label + " · " + preset.w + "×" + preset.h
  ;(D.documentElement || D.body).appendChild(badge)
  return preset.label + " frame (" + preset.w + "px)"
}

const ensureHlStyle_ = (): void => {
  ensureStyle_(STYLE_IDS.hl, `
mark[data-vp-hl]{border-radius:2px;padding:0 1px;box-decoration-break:clone;-webkit-box-decoration-break:clone}
#vp-hl-bar{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:2147483646;
display:flex;gap:6px;align-items:center;background:#18181b;border:1px solid #e11d48;
padding:8px 12px;box-shadow:0 8px 28px rgba(0,0,0,.45);font:12px system-ui,sans-serif;color:#fafafa}
#vp-hl-bar button{border:2px solid transparent;width:22px;height:22px;cursor:pointer;padding:0}
#vp-hl-bar button.on{border-color:#fff;outline:1px solid #e11d48}
#vp-hl-bar .vp-hl-tip{opacity:.75;margin-left:6px;white-space:nowrap}
#vp-hl-bar .vp-hl-x{background:transparent;color:#fda4af;border:1px solid #52525b;width:auto;padding:2px 8px}
`)
}

const unwrapMark_ = (mark: any): void => {
  const p: any = mark.parentNode
  if (!p) { return }
  while (mark.firstChild) { p.insertBefore(mark.firstChild, mark) }
  p.removeChild(mark)
}

const applyHighlightToSelection_ = (color: string): number => {
  const sel = D.getSelection ? D.getSelection() : null
  if (!sel || sel.isCollapsed || !sel.rangeCount) { return 0 }
  try {
    const range = sel.getRangeAt(0)
    if (color === "transparent") {
      const root: any = range.commonAncestorContainer
      const host = root.nodeType === 1 ? root : root.parentElement
      if (!host || !host.querySelectorAll) { return 0 }
      const marks = host.querySelectorAll("mark[data-vp-hl]")
      let n = 0
      for (let i = 0; i < marks.length; i++) {
        if (sel.containsNode(marks[i], true)) {
          unwrapMark_(marks[i])
          n++
        }
      }
      sel.removeAllRanges()
      if (n) { hlSaveAll_() }
      return n
    }
    const mark = D.createElement("mark")
    mark.setAttribute("data-vp-hl", "1")
    mark.style.background = color
    mark.style.color = "inherit"
    try {
      range.surroundContents(mark)
    } catch {
      const frag = range.extractContents()
      mark.appendChild(frag)
      range.insertNode(mark)
    }
    mark.setAttribute("data-vp-id", "h" + Date.now().toString(36) + hlUndo.length)
    mark.setAttribute("data-vp-c", color)
    hlUndo.push(mark)
    if (hlUndo.length > 40) { hlUndo.shift() }
    sel.removeAllRanges()
    hlSaveAll_()
    return 1
  } catch {
    return 0
  }
}

const setHlButtons_ = (): void => {
  if (!hlBar) { return }
  const buttons = hlBar.querySelectorAll("button")
  for (let i = 0; i < buttons.length; i++) {
    const b = buttons[i] as any
    const dc = b.getAttribute("data-c")
    if (dc) {
      if (dc === hlColor) { b.classList.add("on") }
      else { b.classList.remove("on") }
    }
  }
}

const buildHlBar_ = (): void => {
  if (hlBar) { return }
  ensureHlStyle_()
  hlBar = D.createElement("div")
  hlBar!.id = "vp-hl-bar"
  hlBar!.setAttribute("role", "toolbar")
  hlBar!.setAttribute("aria-label", "Highlighter")
  for (let i = 0; i < HL_COLORS.length; i++) {
    const col = HL_COLORS[i]!
    if (col.c === "transparent") {
      const b = D.createElement("button")
      b.className = "vp-hl-x"
      b.textContent = "Clear"
      b.title = "Clear selection highlights (0)"
      b.onclick = (): void => { applyHighlightToSelection_("transparent") }
      hlBar!.appendChild(b)
      continue
    }
    const b = D.createElement("button")
    b.style.background = col.c
    b.title = col.name + " (" + col.k + ")"
    b.setAttribute("data-c", col.c)
    if (col.c === hlColor) { b.classList.add("on") }
    b.onclick = (): void => {
      hlColor = col.c
      setHlButtons_()
    }
    hlBar!.appendChild(b)
  }
  const tip = D.createElement("span")
  tip.className = "vp-hl-tip"
  tip.textContent = "select · 1–5 color · u undo · Esc"
  hlBar!.appendChild(tip)
  const exit = D.createElement("button")
  exit.className = "vp-hl-x"
  exit.textContent = "Esc"
  exit.onclick = (): void => { setHlMode_(false) }
  hlBar!.appendChild(exit)
  ;(D.documentElement || D.body).appendChild(hlBar)
}

const onHlMouseUp_ = (): void => {
  if (!hlMode) { return }
  applyHighlightToSelection_(hlColor)
}

const onHlKey_ = (e: Event): void => {
  if (!hlMode) { return }
  const ke = e as any
  const k = ke.key as string
  if (k === "Escape") {
    if (ke.preventDefault) { ke.preventDefault() }
    if (ke.stopPropagation) { ke.stopPropagation() }
    setHlMode_(false)
    return
  }
  if (k === "u" || k === "U") {
    const last = hlUndo.pop()
    if (last) { unwrapMark_(last); hlSaveAll_() }
    if (ke.preventDefault) { ke.preventDefault() }
    return
  }
  let hit: { k: string; c: string; name: string } | null = null
  for (let i = 0; i < HL_COLORS.length; i++) {
    if (HL_COLORS[i]!.k === k) { hit = HL_COLORS[i]!; break }
  }
  if (hit) {
    hlColor = hit.c
    setHlButtons_()
    applyHighlightToSelection_(hit.c)
    if (ke.preventDefault) { ke.preventDefault() }
  }
}

const setHlMode_ = (on?: boolean): string => {
  const next = on == null ? !hlMode : on
  hlMode = next
  if (!hlMode) {
    if (hlBar) { removeNode_(hlBar); hlBar = null }
    setupEventListener(0, "mouseup", onHlMouseUp_, 1, 1)
    setupEventListener(0, "keydown", onHlKey_, 1, 1)
    return "highlighter off"
  }
  buildHlBar_()
  setupEventListener(0, "mouseup", onHlMouseUp_, 0, 1)
  setupEventListener(0, "keydown", onHlKey_, 0, 1)
  return "highlighter on — select text · keys 1–5"
}

const clearAllHighlights_ = (): string => {
  const marks = D.querySelectorAll("mark[data-vp-hl]")
  let n = 0
  for (let i = 0; i < marks.length; i++) {
    unwrapMark_(marks[i])
    n++
  }
  hlUndo = []
  hlSaveAll_()
  return "cleared " + n + " highlights"
}

const offAllView_ = (): string => {
  setSpotMode_("")
  if (zenOn) { toggleZen_() }
  if (hideImgOn) { toggleHideImages_() }
  if (deviceId) { setDevice_("desktop") }
  if (hlMode) { setHlMode_(false) }
  return "view extras cleared"
}

const status_ = (): string => {
  const parts: string[] = []
  if (spotMode) { parts.push(spotMode) }
  if (zenOn) { parts.push("zen") }
  if (hideImgOn) { parts.push("no-img") }
  if (deviceId) { parts.push(deviceId) }
  if (hlMode) { parts.push("hl") }
  if (progressOn) { parts.push("progress") }
  return parts.length ? parts.join(", ") : "default"
}

const dispatch_ = (cmd: string, arg?: string): string => {
  const c = (cmd || "").toLowerCase()
  switch (c) {
  case "spotlight": case "spot":
    return setSpotMode_(spotMode === "spotlight" ? "" : "spotlight")
  case "lens": case "focuslens": case "flens":
    return setSpotMode_(spotMode === "lens" ? "" : "lens")
  case "zen":
    return toggleZen_()
  case "hideimg": case "noimg": case "images":
    return toggleHideImages_()
  case "hl": case "highlight": case "highlighter":
    return setHlMode_()
  case "hl-off":
    return setHlMode_(false)
  case "hl-clear":
    return clearAllHighlights_()
  case "device":
    return setDevice_((arg || "desktop").toLowerCase())
  case "progress":
    progressOn = !progressOn
    applyProgressUI_(true)
    return progressOn ? "progress on" : "progress off"
  case "status":
    return status_()
  case "off-view": case "off":
    return offAllView_()
  default:
    if (c.indexOf("device:") === 0) { return setDevice_(c.slice(7)) }
    return "unknown: " + c
  }
}

const HL_STORE = "vpPageHighlights"

const hlPageKey_ = (): string => {
  try {
    const loc = W.location
    return (loc.origin || "") + (loc.pathname || "") + (loc.search || "")
  } catch { return "" }
}

const hlEnsureBaseCss_ = (): void => {
  ensureStyle_("vp-hl-css",
      "mark[data-vp-hl]{border-radius:2px;padding:0 2px;cursor:pointer;position:relative;"
      + "box-decoration-break:clone;-webkit-box-decoration-break:clone}"
      + "mark[data-vp-hl]:hover{outline:2px solid #e11d48;outline-offset:1px}"
      + "mark[data-vp-hl] .vp-hl-badge{display:inline-block;margin-left:3px;padding:0 4px;"
      + "border-radius:8px;background:#e11d48;color:#fff;font:10px/1.4 system-ui,sans-serif;"
      + "vertical-align:super}"
      + "#vp-hl-pop{position:fixed;z-index:2147483647;width:min(320px,92vw);background:#18181b;"
      + "color:#fafafa;border:2px solid #e11d48;box-shadow:0 12px 40px rgba(0,0,0,.5);"
      + "padding:12px;font:13px/1.4 system-ui,sans-serif}"
      + "#vp-hl-pop h4{margin:0 0 8px;font-size:13px;color:#fda4af}"
      + "#vp-hl-pop .vp-hl-clist{max-height:140px;overflow:auto;margin:0 0 8px;padding:0;list-style:none}"
      + "#vp-hl-pop .vp-hl-clist li{padding:6px 0;border-bottom:1px solid #27272a}"
      + "#vp-hl-pop .vp-hl-clist time{display:block;font-size:10px;color:#a1a1aa;margin-bottom:2px}"
      + "#vp-hl-pop textarea{width:100%;min-height:56px;box-sizing:border-box;background:#0c0c0e;"
      + "color:#fafafa;border:1px solid #3f3f46;padding:6px;font:13px system-ui,sans-serif;resize:vertical}"
      + "#vp-hl-pop .row{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}"
      + "#vp-hl-pop button{cursor:pointer;border:1px solid #52525b;background:#27272a;color:#fff;"
      + "padding:6px 10px;font:12px system-ui,sans-serif}"
      + "#vp-hl-pop button.primary{background:#e11d48;border-color:#e11d48}"
      + "#vp-hl-pop button.danger{color:#fda4af}")
}

const hlUpdateBadge_ = (mark: any, comments: any[]): void => {
  let badge = mark.querySelector && mark.querySelector(".vp-hl-badge")
  if (!comments || !comments.length) {
    if (badge && badge.parentNode) { badge.parentNode.removeChild(badge) }
    mark.title = "Click to comment or remove highlight"
    return
  }
  if (!badge) {
    badge = D.createElement("span")
    badge.className = "vp-hl-badge"
    badge.setAttribute("data-vp-ui", "1")
    mark.appendChild(badge)
  }
  badge.textContent = String(comments.length)
  mark.title = comments.length + " comment(s) — click to view"
}

let hlSaveTimer = 0
const HL_MAX_PAGES = 200

const hlSaveAll_ = (): void => {
  if (hlSaveTimer) { W.clearTimeout(hlSaveTimer) }
  hlSaveTimer = W.setTimeout(hlFlushSave_, 300)
}

const hlFlushSave_ = (): void => {
  hlSaveTimer = 0
  const ch = chromeApi()
  if (!ch || !ch.storage || !ch.storage.local) { return }
  const pageKey = hlPageKey_()
  if (!pageKey) { return }
  const marks = D.querySelectorAll("mark[data-vp-hl]")
  const items: any[] = []
  const seen: any = {}
  for (let i = 0; i < marks.length; i++) {
    const m = marks[i]
    const clone = m.cloneNode(true)
    const ui = clone.querySelectorAll ? clone.querySelectorAll("[data-vp-ui],.vp-hl-badge") : []
    for (let u = 0; u < ui.length; u++) {
      if (ui[u].parentNode) { ui[u].parentNode.removeChild(ui[u]) }
    }
    let t: any = (clone.textContent || "") + ""
    t = t.replace(/\s+/g, " ").trim()
    if (!t) { continue }
    const n = seen[t] || 0
    seen[t] = n + 1
    let comments: any[] = []
    try { comments = JSON.parse(m.getAttribute("data-vp-comments") || "[]") || [] } catch { /* empty */ }
    items.push({
      id: m.getAttribute("data-vp-id") || ("h" + i),
      c: m.getAttribute("data-vp-c") || m.style.background || "#fef08a",
      t: t,
      n: n,
      comments: comments,
      at: Date.now()
    })
  }
  try {
    ch.storage.local.get([HL_STORE], (res: any): void => {
      const bag = (res && res[HL_STORE]) || {}
      if (items.length) { bag[pageKey] = items }
      else { delete bag[pageKey] }
      const keys = Object.keys(bag)
      if (keys.length > HL_MAX_PAGES) {
        keys.sort((a, b): number => {
          const aa = bag[a], bb = bag[b]
          const ta = (aa && aa[0] && aa[0].at) || 0
          const tb = (bb && bb[0] && bb[0].at) || 0
          return ta - tb
        })
        const drop = keys.length - HL_MAX_PAGES
        for (let i = 0; i < drop; i++) { delete bag[keys[i]!] }
      }
      const payload: any = {}
      payload[HL_STORE] = bag
      ch.storage.local.set(payload)
    })
  } catch { /* empty */ }
}

const hlOpenPop_ = (mark: any): void => {
  hlEnsureBaseCss_()
  const old = D.getElementById("vp-hl-pop")
  if (old && old.parentNode) { old.parentNode.removeChild(old) }
  let comments: any[] = []
  try { comments = JSON.parse(mark.getAttribute("data-vp-comments") || "[]") || [] } catch { /* empty */ }
  const pop = D.createElement("div")
  pop.id = "vp-hl-pop"
  pop.setAttribute("data-vp-ui", "1")
  const rect = mark.getBoundingClientRect()
  let top = rect.bottom + 8
  let left = Math.max(8, Math.min(rect.left, (W.innerWidth || 800) - 340))
  if (top + 220 > (W.innerHeight || 600)) { top = Math.max(8, rect.top - 220) }
  pop.style.top = top + "px"
  pop.style.left = left + "px"
  let listHtml = ""
  for (let i = 0; i < comments.length; i++) {
    const cm = comments[i]
    const when = cm.at ? new Date(cm.at).toLocaleString() : ""
    const safe = String(cm.text || "").split("<").join("&lt;")
    listHtml += "<li><time>" + when + "</time>" + safe + "</li>"
  }
  if (!listHtml) { listHtml = "<li style='opacity:.6'>No comments yet</li>" }
  pop.innerHTML =
      "<h4>Highlight</h4>"
      + "<ul class='vp-hl-clist'>" + listHtml + "</ul>"
      + "<textarea id='vp-hl-note' placeholder='Add a comment…'></textarea>"
      + "<div class='row'>"
      + "<button type='button' class='primary' data-a='add'>Add comment</button>"
      + "<button type='button' data-a='close'>Close</button>"
      + "<button type='button' class='danger' data-a='remove'>Remove highlight</button>"
      + "</div>"
  ;(D.body || D.documentElement).appendChild(pop)
  pop.onclick = (ev: any): void => {
    const t = ev.target
    if (!t || !t.getAttribute) { return }
    const act = t.getAttribute("data-a")
    if (!act) { return }
    if (ev.stopPropagation) { ev.stopPropagation() }
    if (act === "close") {
      if (pop.parentNode) { pop.parentNode.removeChild(pop) }
      return
    }
    if (act === "remove") {
      const p: any = mark.parentNode
      if (p) {
        while (mark.firstChild) {
          if (mark.firstChild.nodeType === 1 && mark.firstChild.getAttribute
              && mark.firstChild.getAttribute("data-vp-ui")) {
            mark.removeChild(mark.firstChild)
            continue
          }
          p.insertBefore(mark.firstChild, mark)
        }
        p.removeChild(mark)
      }
      hlSaveAll_()
      if (pop.parentNode) { pop.parentNode.removeChild(pop) }
      return
    }
    if (act === "add") {
      const ta = pop.querySelector("#vp-hl-note")
      const text = ((ta && (ta as any).value) || "").trim()
      if (!text) { return }
      comments.push({ text: text, at: new Date().toISOString() })
      mark.setAttribute("data-vp-comments", JSON.stringify(comments))
      hlUpdateBadge_(mark, comments)
      hlSaveAll_()
      hlOpenPop_(mark)
    }
  }
}

const hlBindClicks_ = (): void => {
  if (W.__vpHlClickBound) { return }
  W.__vpHlClickBound = true
  setupEventListener(0, "click", (e: Event): void => {
    const ev = e as any
    let el: any = ev.target
    while (el && el !== D.body) {
      if (el.id === "vp-hl-pop" || (el.closest && el.closest("#vp-hl-pop"))) { return }
      if (el.id === "vp-hl-bar" || (el.closest && el.closest("#vp-hl-bar"))) { return }
      if (el.getAttribute && el.getAttribute("data-vp-hl")) {
        if (ev.preventDefault) { ev.preventDefault() }
        if (ev.stopPropagation) { ev.stopPropagation() }
        hlOpenPop_(el)
        return
      }
      el = el.parentElement
    }
  }, 0, 1)
}

const hlRebuildFlat_ = (body: any): { nodes: any[], flat: string } => {
  const nodes: any[] = []
  let flat = ""
  const walker = D.createTreeWalker(body, 4 /* SHOW_TEXT */)
  let node: any
  while ((node = walker.nextNode())) {
    const pe = node.parentElement
    if (!pe) { continue }
    const tag = (pe.tagName || "").toUpperCase()
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEXTAREA"
        || tag === "INPUT") { continue }
    if (pe.closest && pe.closest("mark[data-vp-hl]")) { continue }
    nodes.push({ node: node, start: flat.length })
    flat += node.nodeValue || ""
  }
  return { nodes, flat }
}

const hlPosAt_ = (nodes: any[], flatIndex: number): any => {
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    const len = (n.node.nodeValue || "").length
    if (flatIndex <= n.start + len) {
      return { node: n.node, off: Math.max(0, flatIndex - n.start) }
    }
  }
  return null
}

/** Restore persisted highlighter marks for this URL (always on page load). */
const restorePageHighlights_ = (): void => {
  const ch = chromeApi()
  if (!ch || !ch.storage || !ch.storage.local) { return }
  const pageKey = hlPageKey_()
  if (!pageKey) { return }
  const body = D.body
  if (!body) { return }
  try {
    ch.storage.local.get([HL_STORE], (res: any): void => {
      const all = (res && res[HL_STORE]) || {}
      const list = all[pageKey] || []
      if (!list.length) {
        hlBindClicks_()
        return
      }
      hlEnsureBaseCss_()
      const have: any = {}
      const existing = D.querySelectorAll("mark[data-vp-hl]")
      for (let i = 0; i < existing.length; i++) {
        const id = existing[i].getAttribute("data-vp-id")
        if (id) { have[id] = 1 }
      }
      let { nodes, flat } = hlRebuildFlat_(body)
      for (let i = 0; i < list.length; i++) {
        const item = list[i]
        if (!item || !item.t) { continue }
        if (item.id && have[item.id]) {
          const m = D.querySelector("mark[data-vp-hl][data-vp-id=\"" + item.id + "\"]")
          if (m && item.comments) {
            m.setAttribute("data-vp-comments", JSON.stringify(item.comments))
            hlUpdateBadge_(m, item.comments)
          }
          continue
        }
        const needle = item.t
        const targetN = item.n || 0
        let found = 0
        let from = 0
        let idx = flat.indexOf(needle, from)
        while (idx >= 0) {
          if (found === targetN) {
            const startPos = hlPosAt_(nodes, idx)
            const endPos = hlPosAt_(nodes, idx + needle.length)
            if (startPos && endPos) {
              try {
                const range = D.createRange()
                range.setStart(startPos.node, startPos.off)
                range.setEnd(endPos.node, endPos.off)
                const mark = D.createElement("mark")
                mark.setAttribute("data-vp-hl", "1")
                mark.setAttribute("data-vp-c", item.c || "#fef08a")
                mark.setAttribute("data-vp-id", item.id || ("h" + i))
                mark.setAttribute("data-vp-comments", JSON.stringify(item.comments || []))
                mark.style.background = item.c || "#fef08a"
                mark.style.color = "inherit"
                try { range.surroundContents(mark) }
                catch {
                  const frag = range.extractContents()
                  mark.appendChild(frag)
                  range.insertNode(mark)
                }
                hlUpdateBadge_(mark, item.comments || [])
                if (item.id) { have[item.id] = 1 }
                const rebuilt = hlRebuildFlat_(body)
                nodes = rebuilt.nodes
                flat = rebuilt.flat
              } catch { /* empty */ }
            }
            break
          }
          found++
          from = idx + Math.max(1, needle.length)
          idx = flat.indexOf(needle, from)
        }
      }
      hlBindClicks_()
    })
  } catch { /* empty */ }
}

export const initPageEnhance = (): void => {
  if (!isTop) { return }
  W.__vpEnhance = dispatch_
  W.__vpEnhanceApi = { dispatch: dispatch_, devices: DEVICES.map(d => d.id) }
  // Progress is a default page chrome feature — on immediately for every site
  progressOn = true
  applyProgressUI_(true)
  loadSettings_()
  OnDocLoaded_((): void => {
    // Body is ready — re-host nodes if document_start attached to html only
    if (progressOn) { applyProgressUI_(false); updateProgress_() }
    restorePageHighlights_()
    let tries = 0
    const retry = (): void => {
      tries++
      restorePageHighlights_()
      if (progressOn) {
        ensureProgressNodes_()
        updateProgress_()
      }
      if (tries < 8) { W.setTimeout(retry, 500 * tries) }
    }
    W.setTimeout(retry, 200)
  })
  const ch = chromeApi()
  if (ch && ch.storage && ch.storage.onChanged) {
    try {
      ch.storage.onChanged.addListener((changes: any, area: string): void => {
        if (area !== "local") { return }
        if (changes.readingProgress || changes.readingProgressColor
            || changes.readingProgressHeight || changes.readingProgressCss
            || changes.showInfiniteScrollMark || changes.highlighterColors
            || changes.spotlightRadius) {
          loadSettings_()
        }
        if (changes[HL_STORE] || changes.vpPageHighlights) {
          restorePageHighlights_()
        }
      })
    } catch { /* empty */ }
  }
}

export const destroyPageEnhance = (): void => {
  offAllView_()
  progressOn = false
  tearDownProgressUI_()
  if (progressMO) {
    try { progressMO.disconnect() } catch { /* empty */ }
    progressMO = null
  }
  progressListenersOn = false
  try {
    delete W.__vpEnhance
    delete W.__vpEnhanceApi
  } catch { /* empty */ }
}

if (isTop) {
  try { initPageEnhance() } catch { /* empty */ }
}
