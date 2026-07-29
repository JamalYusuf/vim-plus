/**
 * Options page section tabs — simplifies the long options list into Start / Keys / Search / Look / Advanced.
 */
type SecId = "start" | "keys" | "search" | "look" | "advanced"

const SECTIONS: Array<{ id: SecId, label: string, keys: string[] }> = [
  { id: "start", label: "Start", keys: ["welcome", "excluded", "exclusion", "name"] },
  { id: "keys", label: "Keys",
    keys: ["key mapping", "keyboard", "link hint", "find mode", "pass", "ignore", "keyup",
      "grab", "mouse", "wait for enter", "regex"] },
  { id: "search", label: "Search",
    keys: ["search engine", "hashbang", "new tab", "vomni", "omni", "prefer", "locale",
      "next pattern", "previous pattern", "block list", "title ignore"] },
  { id: "look", label: "Look",
    keys: ["dark", "hud", "css", "icon", "theme", "reading", "progress", "motion",
      "smooth scroll", "scroll step", "user-defined", "advanced command", "action icon",
      "context menu", "incognito"] },
  { id: "advanced", label: "Advanced", keys: [] }
]

const assignSection = (caption: string): SecId => {
  const c = caption.toLowerCase()
  for (const s of SECTIONS) {
    if (s.id === "advanced") { continue }
    for (const k of s.keys) {
      if (c.indexOf(k) >= 0) { return s.id }
    }
  }
  return "advanced"
}

let inited = false

const init = (): void => {
  if (inited) { return }
  const wrapper = document.getElementById("wrapper")
  if (!wrapper) { return }
  const tbody = wrapper.querySelector("tbody")
  if (!tbody) { return }
  const rows = Array.from(tbody.querySelectorAll(":scope > tr")) as HTMLTableRowElement[]
  if (!rows.length) { return }

  // Avoid duplicate tab bars if init runs twice (async options load)
  const existing = document.getElementById("opt-tabs")
  if (existing) {
    inited = true
    return
  }
  inited = true

  // Group consecutive empty-caption rows with previous caption
  let lastSec: SecId = "start"
  for (const tr of rows) {
    const cap = tr.querySelector("td.caption")
    const text = ((cap && cap.textContent) || "").trim()
    if (text) {
      lastSec = assignSection(text)
    }
    tr.setAttribute("data-sec", lastSec)
  }

  // Build sticky tab bar once
  const thead = wrapper.querySelector("thead tr td")
  const nav = document.createElement("nav")
  nav.id = "opt-tabs"
  nav.setAttribute("role", "tablist")
  nav.innerHTML = SECTIONS.map((s, i) =>
      `<button type="button" role="tab" data-sec="${s.id}" class="${i === 0 ? "active" : ""}">${s.label}</button>`
  ).join("")
  if (thead) {
    thead.appendChild(nav)
  } else if (document.body) {
    document.body.insertBefore(nav, document.body.firstChild)
  }

  const show = (sec: SecId): void => {
    for (const tr of rows) {
      const s = (tr.getAttribute("data-sec") || "advanced") as SecId
      tr.style.display = s === sec ? "" : "none"
    }
    const btns = nav.querySelectorAll("button")
    for (let i = 0; i < btns.length; i++) {
      const b = btns[i] as HTMLElement
      b.classList.toggle("active", b.getAttribute("data-sec") === sec)
    }
    try { sessionStorage.setItem("vp-opt-sec", sec) } catch { /* empty */ }
    window.scrollTo(0, 0)
  }

  nav.addEventListener("click", (ev: Event): void => {
    const t = ev.target as HTMLElement
    if (!t || t.tagName !== "BUTTON") { return }
    const sec = (t.getAttribute("data-sec") || "start") as SecId
    show(sec)
  })

  let initial: SecId = "start"
  try {
    const saved = sessionStorage.getItem("vp-opt-sec") as SecId | null
    if (saved && SECTIONS.some(s => s.id === saved)) { initial = saved }
  } catch { /* empty */ }
  show(initial)
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", (): void => { setTimeout(init, 50) })
} else {
  // Options table may still be hydrating — single delayed pass
  setTimeout(init, 80)
}
