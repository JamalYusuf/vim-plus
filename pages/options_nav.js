"use strict";

const SECTIONS = [ {
  id: "start",
  label: "Start",
  hint: "Excluded sites and permissions"
}, {
  id: "keys",
  label: "Keys",
  hint: "Mappings, hints, and keyboard layout"
}, {
  id: "search",
  label: "Search",
  hint: "Engines, hashbangs, and the omnibar"
}, {
  id: "look",
  label: "Look",
  hint: "Theme, colors, reading, and CSS"
}, {
  id: "advanced",
  label: "Advanced",
  hint: "Clip rewrite, sync, and other extensions"
} ];

/**
 * Option element id → tab. Keep in sync when adding a control.
 * Welcome has no field (data-sec="start"). The old "Advanced Options"
 * header is data-sec="hide".
 */ const FIELD_SEC = {
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
};

/** Built-in :view CSS (must match DEFAULT_VIEW_FX_CSS in background/quick_actions.ts). */ const BUILTIN_VIEW_FX = '# :view color profiles \u2014 one "name: css" line each\n# Known names: gray, blue, inv, sepia, blur, contrast, dim, focus\n# jumble scrambles text in JS and cannot be overridden here\n# Delete all and save to restore these built-ins\ngray: html{filter:grayscale(1)!important}\nblue: html{filter:sepia(.35) hue-rotate(180deg) saturate(1.4)!important}\ninv: html{filter:invert(1) hue-rotate(180deg)!important}\nsepia: html{filter:sepia(.85) contrast(1.05)!important}\nblur: html{filter:blur(1.2px)!important}\ncontrast: html{filter:contrast(1.45) saturate(1.1)!important}\ndim: html{filter:brightness(.72)!important}\nfocus: html{background:#111!important}body{max-width:42rem;margin:0 auto!important;padding:1rem 1.25rem!important;background:#111!important;color:#e8e8e8!important;box-shadow:0 0 0 100vmax rgba(0,0,0,.55)!important}\n';

/** Normalize a stored color so `<input type="color">` will accept it (#rrggbb). */ const toColorInputValue_ = (raw, fallback) => {
  const s = ((raw || "") + "").trim();
  const hex3 = /^#([0-9a-fA-F]{3})$/;
  const hex6 = /^#([0-9a-fA-F]{6})$/;
  const m3 = hex3.exec(s);
  if (m3) {
    const h = m3[1];
    return ("#" + h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2)).toLowerCase();
  }
  const m6 = hex6.exec(s);
  if (m6) {
    return ("#" + m6[1]).toLowerCase();
  }
  const fb = hex6.exec(fallback);
  return fb ? fallback.toLowerCase() : "#e11d48";
};

const bindColorFields_ = () => {
  const pickers = document.querySelectorAll("input[type='color'][data-color-for]");
  for (let i = 0; i < pickers.length; i++) {
    const pick = pickers[i];
    const id = pick.getAttribute("data-color-for") || "";
    const text = document.getElementById(id);
    if (!text) {
      continue;
    }
    const syncPick = () => {
      pick.value = toColorInputValue_(text.value, pick.getAttribute("value") || "#e11d48");
    };
    syncPick();
    pick.addEventListener("input", () => {
      text.value = pick.value;
      text.dispatchEvent(new Event("input", {
        bubbles: true
      }));
    });
    text.addEventListener("input", syncPick);
  }
};

const HL_SWATCH_DEFAULTS = [ "#fef08a", "#bbf7d0", "#fbcfe8", "#bfdbfe", "#fdba74" ];

const bindHighlighterSwatches_ = () => {
  const hidden = document.getElementById("highlighterColors");
  const box = document.getElementById("hl-swatches");
  if (!hidden || !box) {
    return;
  }
  const picks = box.querySelectorAll("input[type='color'][data-hl-i]");
  let writing = false;
  const writeHidden = () => {
    const parts = [];
    for (let i = 0; i < picks.length; i++) {
      parts.push(picks[i].value);
    }
    writing = true;
    hidden.value = parts.join(",");
    hidden.dispatchEvent(new Event("input", {
      bubbles: true
    }));
    writing = false;
  };
  const readHidden = () => {
    if (writing) {
      return;
    }
    const raw = (hidden.value || "").trim();
    const parts = raw ? raw.split(",") : [];
    for (let i = 0; i < picks.length; i++) {
      const p = picks[i];
      const fallback = HL_SWATCH_DEFAULTS[i] || "#fef08a";
      p.value = toColorInputValue_((parts[i] || "").trim(), fallback);
    }
  };
  for (let i = 0; i < picks.length; i++) {
    const p = picks[i];
    p.value = HL_SWATCH_DEFAULTS[i] || "#fef08a";
    p.addEventListener("input", writeHidden);
  }
  readHidden();
  hidden.addEventListener("input", readHidden);
  hidden.addEventListener("change", readHidden);
  // Option_ hydrates after this script — re-apply stored palette
    setTimeout(readHidden, 80);
  setTimeout(readHidden, 400);
};

const HASH_SEC = {
  start: "start",
  welcome: "start",
  home: "start",
  exclusions: "start",
  exclusion: "start",
  keys: "keys",
  commands: "keys",
  installed: "keys",
  mapping: "keys",
  keyboard: "keys",
  search: "search",
  engines: "search",
  hashbang: "search",
  hashbangs: "search",
  omni: "search",
  look: "look",
  theme: "look",
  css: "look",
  reading: "look",
  view: "look",
  fx: "look",
  viewfx: "look",
  views: "look",
  colors: "look",
  hints: "look",
  advanced: "advanced",
  power: "advanced",
  clip: "advanced"
};

let inited = false;

let currentSec = "start";

let filterQ = "";

const assignRow = (tr, lastSec) => {
  const explicit = ((tr.getAttribute("data-sec") || "") + "").toLowerCase();
  if (explicit === "hide" || explicit === "start" || explicit === "keys" || explicit === "search" || explicit === "look" || explicit === "advanced") {
    return explicit;
  }
  const nodes = tr.querySelectorAll("[id]");
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].id;
    const sec = FIELD_SEC[id];
    if (sec) {
      return sec;
    }
  }
  return lastSec;
};

const rowText = tr => {
  const bits = [];
  const cap = tr.querySelector("td.caption");
  cap && bits.push((cap.textContent || "") + "");
  const labels = tr.querySelectorAll("label, .checkboxHint, .info, [data-model]");
  for (let i = 0; i < labels.length; i++) {
    const el = labels[i];
    bits.push((el.textContent || "") + "");
    el.id && bits.push(el.id);
  }
  bits.push((tr.getAttribute("data-sec") || "") + "");
  return bits.join(" ").toLowerCase();
};

const init = () => {
  if (inited) {
    return;
  }
  const wrapper = document.getElementById("wrapper");
  if (!wrapper) {
    return;
  }
  const rows = Array.from(wrapper.querySelectorAll("tbody > tr"));
  if (!rows.length) {
    return;
  }
  if (document.getElementById("opt-tabs")) {
    inited = true;
    return;
  }
  inited = true;
  let lastSec = "start";
  let lastTbody = null;
  for (const tr of rows) {
    if (tr.parentElement !== lastTbody) {
      lastTbody = tr.parentElement;
      const tSec = lastTbody && lastTbody.getAttribute("data-sec");
      tSec !== "keys" && tSec !== "start" && tSec !== "search" && tSec !== "look" && tSec !== "advanced" || (lastSec = tSec);
    }
    const sec = assignRow(tr, lastSec);
    tr.setAttribute("data-sec", sec);
    sec !== "hide" && (lastSec = sec);
  }
  const thead = wrapper.querySelector("thead tr td");
  const nav = document.createElement("nav");
  nav.id = "opt-tabs";
  nav.setAttribute("role", "tablist");
  nav.setAttribute("aria-label", "Options sections");
  const tabRow = document.createElement("div");
  tabRow.className = "opt-tabs-row";
  tabRow.innerHTML = SECTIONS.map((s, i) => `<button type="button" role="tab" data-sec="${s.id}" aria-selected="${i === 0 ? "true" : "false"}"${i === 0 ? ' class="active"' : ""}>${s.label}</button>`).join("") + [ '<div class="opt-tools">', '<label class="opt-filter-label" for="opt-filter">Find</label>', '<input id="opt-filter" type="search" enterkeyhint="search" autocomplete="off"', ' placeholder="any option" aria-label="Find any option on this page" />', '<span id="opt-filter-count" class="opt-filter-count" hidden></span>', "</div>" ].join("");
  const desc = document.createElement("p");
  desc.id = "opt-sec-desc";
  desc.className = "opt-sec-desc";
  nav.append(tabRow);
  nav.append(desc);
  thead ? thead.append(nav) : document.body && document.body.insertBefore(nav, document.body.firstChild);
  const descEl = document.getElementById("opt-sec-desc");
  const filterEl = document.getElementById("opt-filter");
  const countEl = document.getElementById("opt-filter-count");
  const rootEl = document.documentElement;
  rootEl.classList.remove("vp-help-off", "vp-help-on");
  const show = (sec, persist) => {
    currentSec = sec;
    const q = filterQ;
    let shown = 0;
    for (const tr of rows) {
      const s = tr.getAttribute("data-sec") || "advanced";
      if (s === "hide") {
        tr.style.display = "none";
        continue;
      }
      const tabOk = !q && s === sec;
      const filterOk = !!q && rowText(tr).indexOf(q) >= 0;
      const vis = q ? filterOk : tabOk;
      tr.style.display = vis ? "" : "none";
      vis && shown++;
    }
    const btns = tabRow.querySelectorAll("button");
    for (let i = 0; i < btns.length; i++) {
      const b = btns[i];
      const on = !q && b.getAttribute("data-sec") === sec;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    }
    if (descEl) {
      const def = SECTIONS.filter(s => s.id === sec)[0];
      descEl.textContent = q ? shown ? shown + " matching option" + (shown === 1 ? "" : "s") : "No matches" : def ? def.hint : "";
    }
    if (countEl) {
      countEl.hidden = !q;
      countEl.textContent = q ? shown + "" : "";
    }
    if (persist !== false && !q) {
      try {
        sessionStorage.setItem("vp-opt-sec", sec);
      } catch (_a) {}
    }
    persist !== false && window.scrollTo(0, 0);
  };
  tabRow.addEventListener("click", ev => {
    const t = ev.target;
    if (!t || t.tagName !== "BUTTON") {
      return;
    }
    const sec = t.getAttribute("data-sec") || "start";
    if (filterEl && filterQ) {
      filterEl.value = "";
      filterQ = "";
    }
    show(sec);
  });
  if (filterEl) {
    filterEl.addEventListener("input", () => {
      filterQ = ((filterEl.value || "") + "").trim().toLowerCase();
      show(currentSec, false);
    });
    filterEl.addEventListener("keydown", ev => {
      if ((ev.key || "") === "Escape") {
        if (filterEl.value) {
          filterEl.value = "";
          filterQ = "";
          show(currentSec, false);
          ev.preventDefault();
        } else {
          filterEl.blur();
        }
      }
    });
  }
  document.addEventListener("keydown", ev => {
    if (ev.altKey || ev.metaKey || ev.ctrlKey) {
      return;
    }
    const t = ev.target;
    const tag = (t && t.tagName || "") + "";
    const inField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    const key = (ev.key || "") + "";
    // Only `/` is reserved here. Digit keys stay Vim counts — binding 1–5
    // to tabs made the page jump/shrink while typing commands.
        if (!inField && key === "/" && filterEl) {
      ev.preventDefault();
      filterEl.focus();
      filterEl.select();
    }
  });
  let initial = "start";
  try {
    const hash = ((location.hash || "") + "").replace(/^#/, "").toLowerCase();
    if (hash && HASH_SEC[hash]) {
      initial = HASH_SEC[hash];
    } else {
      const saved = sessionStorage.getItem("vp-opt-sec");
      saved && SECTIONS.some(s => s.id === saved) && (initial = saved);
    }
  } catch (_a) {}
  show(initial);
  bindColorFields_();
  bindHighlighterSwatches_();
  const fill = document.getElementById("viewFxFillDefaults");
  const ta = document.getElementById("viewFxCss");
  fill && ta && fill.addEventListener("click", ev => {
    ev.preventDefault();
    if (ta.value.trim() && !confirm("Replace the current :view CSS with the built-in profiles?")) {
      return;
    }
    ta.value = BUILTIN_VIEW_FX;
    ta.dispatchEvent(new Event("input", {
      bubbles: true
    }));
    ta.focus();
  });
  const hint = document.getElementById("vp-shortcut-hint");
  const link = document.getElementById("vp-open-shortcuts");
  link && link.addEventListener("click", ev => {
    ev.preventDefault();
    try {
      chrome.tabs.create({
        url: "chrome://extensions/shortcuts"
      });
    } catch (_a) {}
  });
  try {
    chrome.commands.getAll(cmds => {
      const sp = cmds && cmds.filter(c => c.name === "openSidePanel")[0];
      !hint || sp && sp.shortcut || (hint.hidden = false);
    });
  } catch (_b) {}
};

document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
  setTimeout(init, 50);
}) : setTimeout(init, 80);