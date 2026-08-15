import { WIKI_PAGES, wikiPageById, type WikiPage } from "./wiki-content.js"

const $ = <T extends HTMLElement>(s: string): T => document.querySelector(s) as T

const tocEl = $("#toc")
const titleEl = $("#title")
const subtitleEl = $("#subtitle")
const bodyEl = $("#body")
const verEl = $("#ver")
const filterEl = $<HTMLInputElement>("#nav-filter")
const relatedEl = $("#related")
const relLinksEl = $("#rel-links")
const rootEl = document.documentElement as HTMLElement

const stop = (ev: Event): void => {
  const e = ev as Event & { preventDefault (): void; returnValue?: boolean }
  if (e.preventDefault) { e.preventDefault() }
  e.returnValue = false
}

/**
 * Decode HTML entities that authors sometimes put in title/subtitle fields by mistake.
 * Titles are set via textContent (not HTML), so raw "&amp;" would show literally.
 */
const plainText = (s: string): string => {
  if (!s) { return "" }
  return s.split("&amp;").join("&").split("&lt;").join("<").split("&gt;").join(">")
      .split("&quot;").join("\"").split("&#39;").join("'").split("&#x27;").join("'")
}

// ── Theme: follow gn (vomnibar dark) via vpUiDark, else Options autoDarkMode ──
// vpUiDark: 0|1 force from gn / toggleVomnibarStyle · autoDarkMode: 0 light, 1 dark, 2 system
type DarkMode = 0 | 1 | 2

const prefersDark = (): boolean => {
  try { return matchMedia("(prefers-color-scheme: dark)").matches } catch { return true }
}

const applyDark = (dark: boolean, scheme: "dark" | "light" | "light dark"): void => {
  const head = document.head
  const meta = head
      ? head.querySelector("meta[name=color-scheme]") as HTMLMetaElement | null
      : null
  const cls = rootEl.classList
  cls.toggle("vp-dark", dark)
  cls.toggle("dark", dark)
  cls.toggle("no-dark", !dark)
  cls.toggle("vp-light", !dark)
  if (meta) { meta.content = scheme }
}

const parseDarkMode = (raw: unknown): DarkMode => {
  if (raw === false || raw === 0 || raw === "0") { return 0 }
  if (raw === true || raw === 1 || raw === "1") { return 1 }
  return 2
}

const resolveTheme = (vpUiDark: unknown, autoDarkMode: unknown): void => {
  // gn / vomnibar dark wins when set
  if (vpUiDark === 1 || vpUiDark === true || vpUiDark === "1") {
    applyDark(true, "dark")
    return
  }
  if (vpUiDark === 0 || vpUiDark === false || vpUiDark === "0") {
    applyDark(false, "light")
    return
  }
  const mode = parseDarkMode(autoDarkMode)
  if (mode === 0) { applyDark(false, "light") }
  else if (mode === 1) { applyDark(true, "dark") }
  else { applyDark(prefersDark(), "light dark") }
}

const syncThemeFromStorage = (): void => {
  try {
    chrome.storage.local.get(["vpUiDark", "autoDarkMode"], (res: {
      vpUiDark?: unknown, autoDarkMode?: unknown
    }): void => {
      void chrome.runtime.lastError
      resolveTheme(res && res.vpUiDark, res && res.autoDarkMode)
    })
  } catch {
    applyDark(prefersDark(), "light dark")
  }
}

syncThemeFromStorage()

try {
  chrome.storage.onChanged.addListener((changes: { [k: string]: { newValue?: unknown } }, area: string): void => {
    if (area !== "local" && area !== "sync") { return }
    if (changes["vpUiDark"] || changes["autoDarkMode"]) {
      syncThemeFromStorage()
    }
  })
} catch { /* empty */ }

try {
  const mq = matchMedia("(prefers-color-scheme: dark)")
  const onSys = (): void => { syncThemeFromStorage() }
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onSys)
  } else if (typeof (mq as MediaQueryList & { addListener?: (cb: () => void) => void }).addListener === "function") {
    (mq as MediaQueryList & { addListener: (cb: () => void) => void }).addListener(onSys)
  }
} catch { /* empty */ }

const pageGroups = (): Array<{ label: string, pages: WikiPage[] }> => {
  const order: string[] = []
  const map = new Map<string, WikiPage[]>()
  for (const page of WIKI_PAGES) {
    const g = page.group || "Topics"
    if (!map.has(g)) {
      map.set(g, [])
      order.push(g)
    }
    map.get(g)!.push(page)
  }
  return order.map(label => ({ label, pages: map.get(label)! }))
}

const renderToc = (active: string): void => {
  tocEl.textContent = ""
  for (const group of pageGroups()) {
    const label = document.createElement("div")
    label.className = "group-label"
    label.textContent = plainText(group.label)
    tocEl.appendChild(label)
    for (const page of group.pages) {
      const a = document.createElement("a")
      a.href = "#" + page.id
      a.textContent = plainText(page.title)
      a.setAttribute("data-id", page.id)
      if (page.id === active) { a.className = "active" }
      a.onclick = (ev: Event): false => {
        stop(ev)
        location.hash = page.id
        showPage(page.id)
        return false
      }
      tocEl.appendChild(a)
    }
  }
}

const bindInternalLinks = (root: HTMLElement): void => {
  const anchors = root.querySelectorAll("a[href]")
  for (let i = 0; i < anchors.length; i++) {
    const a = anchors[i] as HTMLAnchorElement
    const href = a.getAttribute("href") || ""
    if (href[0] === "#") {
      a.onclick = (ev: Event): false => {
        const target = href.slice(1)
        if (!target) { return false }
        stop(ev)
        location.hash = target
        showPage(target)
        return false
      }
    }
  }
}

const showRelated = (page: WikiPage): void => {
  const ids = page.related || []
  if (!ids.length) {
    relatedEl.hidden = true
    relLinksEl.textContent = ""
    return
  }
  relLinksEl.textContent = ""
  let any = false
  for (const id of ids) {
    const p = WIKI_PAGES.find(x => x.id === id)
    if (!p) { continue }
    any = true
    const a = document.createElement("a")
    a.href = "#" + p.id
    a.textContent = plainText(p.title)
    a.onclick = (ev: Event): false => {
      stop(ev)
      location.hash = p.id
      showPage(p.id)
      return false
    }
    relLinksEl.appendChild(a)
  }
  relatedEl.hidden = !any
}

const pageHaystack = (p: WikiPage): string =>
    (plainText(p.title) + " " + plainText(p.subtitle || "") + " "
        + (p.html || "").replace(<RegExpG> /<[^>]+>/g, " ")).toLowerCase()

const visibleTocLinks = (): HTMLElement[] => {
  const links = tocEl.querySelectorAll("a[data-id]")
  const out: HTMLElement[] = []
  for (let i = 0; i < links.length; i++) {
    const a = links[i] as HTMLElement
    if ((a.getAttribute("class") || "").indexOf("hidden") < 0) { out.push(a) }
  }
  return out
}

const showPage = (id: string): void => {
  const raw = WIKI_PAGES.find(p => p.id === (id || "home"))
  if (!raw && id && id !== "home") {
    titleEl.textContent = "Not found"
    subtitleEl.textContent = ""
    bodyEl.innerHTML = "<p>No wiki page named <code></code>.</p><p><a href=\"#home\">Back home</a></p>"
    const code = bodyEl.querySelector("code")
    if (code) { code.textContent = id }
    document.title = "Not found · Vim+ Wiki"
    return
  }
  const page = raw || wikiPageById(id || "home")
  const title = plainText(page.title)
  const subtitle = plainText(page.subtitle || "")
  titleEl.textContent = title
  subtitleEl.textContent = subtitle
  bodyEl.innerHTML = page.html
  document.title = title + " · Vim+ Wiki"
  const links = tocEl.querySelectorAll("a[data-id]")
  for (let i = 0; i < links.length; i++) {
    const a = links[i] as HTMLElement
    const on = a.getAttribute("data-id") === page.id
    const cls = a.getAttribute("class") || ""
    const hide = cls.indexOf("hidden") >= 0
    a.setAttribute("class", (on ? "active" : "") + (hide ? " hidden" : ""))
  }
  bindInternalLinks(bodyEl)
  showRelated(page)
  window.scrollTo(0, 0)
  const active = tocEl.querySelector("a.active") as HTMLElement | null
  if (active && typeof active.scrollIntoView === "function") {
    try { active.scrollIntoView({ block: "nearest" } as ScrollIntoViewOptions) } catch { /* empty */ }
  }
}

const currentId = (): string => {
  const raw = location.hash || "#home"
  const h = raw[0] === "#" ? raw.slice(1) : raw
  return (h.split("?")[0] || "home")
}

filterEl.addEventListener("input", (): void => {
  const q = filterEl.value.trim().toLowerCase()
  const links = tocEl.querySelectorAll("a[data-id]")
  const groups = tocEl.querySelectorAll(".group-label")
  for (let i = 0; i < links.length; i++) {
    const a = links[i] as HTMLElement
    const id = a.getAttribute("data-id") || ""
    const page = WIKI_PAGES.find(p => p.id === id)
    const text = ((a.textContent || "") + " " + (page ? pageHaystack(page) : "")).toLowerCase()
    const hide = !!q && text.indexOf(q) < 0
    const on = a.getAttribute("data-id") === currentId()
    a.setAttribute("class", (on ? "active" : "") + (hide ? " hidden" : ""))
  }
  for (let g = 0; g < groups.length; g++) {
    const label = groups[g] as HTMLElement
    let next = label.nextElementSibling as HTMLElement | null
    let visible = false
    while (next && (next.getAttribute("class") || "").indexOf("group-label") < 0) {
      const ncls = next.getAttribute("class") || ""
      if (next.tagName === "A" && ncls.indexOf("hidden") < 0) { visible = true }
      next = next.nextElementSibling as HTMLElement | null
    }
    label.style.display = !q || visible ? "" : "none"
  }
})

window.addEventListener("hashchange", (): void => { showPage(currentId()) })

try {
  const man = chrome.runtime.getManifest()
  verEl.textContent = man.version || ""
} catch {
  verEl.textContent = ""
}

document.addEventListener("keydown", (ev: KeyboardEvent): void => {
  const active = document.activeElement
  const tagName = active && "tagName" in active ? String((active as HTMLElement).tagName) : ""
  const tag = tagName.toLowerCase()
  const inField = tag === "input" || tag === "textarea"
  if (ev.key === "/" && active !== filterEl && !inField) {
    stop(ev)
    filterEl.focus()
    filterEl.select()
  } else if (ev.key === "Escape" && active === filterEl) {
    filterEl.value = ""
    filterEl.dispatchEvent(new Event("input"))
    filterEl.blur()
  } else if (!inField && (ev.key === "j" || ev.key === "k" || ev.key === "Enter")) {
    const vis = visibleTocLinks()
    if (!vis.length) { return }
    let i = vis.findIndex(a => (a.getAttribute("class") || "").indexOf("active") >= 0)
    if (i < 0) { i = 0 }
    if (ev.key === "j") { i = (i + 1) % vis.length }
    else if (ev.key === "k") { i = (i - 1 + vis.length) % vis.length }
    const next = vis[i]
    if (next) {
      const nid = next.getAttribute("data-id") || ""
      if (nid) {
        stop(ev)
        location.hash = nid
        showPage(nid)
      }
    }
  } else if (!inField && (ev.key === "n" || ev.key === "p")) {
    const vis = visibleTocLinks()
    let i = vis.findIndex(a => (a.getAttribute("class") || "").indexOf("active") >= 0)
    if (i < 0) { i = 0 }
    i = ev.key === "n" ? (i + 1) % vis.length : (i - 1 + vis.length) % vis.length
    const next = vis[i]
    const nid = next && next.getAttribute("data-id")
    if (nid) {
      stop(ev)
      location.hash = nid
      showPage(nid)
    }
  }
})

renderToc(currentId())
showPage(currentId())
