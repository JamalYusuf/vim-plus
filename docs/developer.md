# Developer guide

## Architecture overview

Vim+ is a **Manifest V3** Chrome extension:

| Layer | Role |
|-------|------|
| **Service worker** (`background/`) | Tabs, windows, history, bookmarks, settings, omnibar completion, quick actions, ports |
| **Content scripts** (`content/`) | Key FSM, hints, scroll, find, visual, HUD, page enhance |
| **Omnibar** (`front/vomnibar.*`) | Privileged UI iframe for suggestions + palette |
| **Extension pages** (`pages/`) | Options, wiki, side panel, action popup |
| **Lib** (`lib/`) | Shared utils, Readability bundle |

Keyboard navigation is a **mode machine** + **command registry**. Content owns DOM and keys; background owns Chrome APIs; they communicate over long-lived ports.

### Why MV3 matters

Service workers can sleep. Persist important state in `chrome.storage` and rehydrate on wake. Prefer explicit Settings save paths and re-inject page tools after navigation when needed.

### Security model

- Content scripts run in an isolated world
- Page JS cannot call Vim+ internals directly
- `chrome://` is largely off-limits to content scripts
- Host and optional permissions gate privileged APIs

## Repository map

```
background/
  worker.js           entry (imports modules)
  settings.ts         defaults, hooks, storage
  completion.ts       omnibar ranking
  quick_actions.ts    : palette / vimium://qa/*
  key_mappings.ts     command registry + default maps
  run_commands.ts     executeCommand / executeExternalCmd
  tab_commands.ts     dock, bookmark, downloads helpers
  page_handlers.ts    side panel / options page RPC
  ports.ts            content port bookkeeping
content/
  key_handler.ts      key FSM
  link_hints.ts       hints
  page_enhance.ts     progress, FX, highlighter restore
  frontend.ts         lifecycle
front/
  vomnibar.ts         omnibar UI
pages/
  options*.ts         options UI
  wiki-content.ts     in-extension docs
  sidepanel.ts        command center
lib/
  vp_readability.js   Reader View engine (bundled)
```

## Build loop

```bash
npm ci
npm run tsc          # primary day-to-day
npm run watch        # optional
# chrome://extensions → Reload Vim+
```

Production:

```bash
npm run chrome       # or npm run dist
```

## Debugging

| Surface | How |
|---------|-----|
| Service worker | `chrome://extensions` → Vim+ → “service worker” |
| Content script | Page DevTools → Sources → Content scripts |
| Omnibar | Inspect vomnibar iframe document |
| Storage | Application → Extension storage, or SW console `chrome.storage.local.get(null)` |
| Theme | `autoDarkMode` 0/1/2 · `vpUiDark` 0/1 from `gn` |

## Important implementation notes

### Running palette commands that need content

Prefer **static imports** of `executeExternalCmd` from `run_commands` inside background modules. Dynamic `import()` compiles to AMD `require()`, which is `null` in the service worker and throws `require is not a function`.

### Reading progress

- Default on; fill via `transform: scaleX` + CSS variable `--vp-read-p`
- Never freeze fill with `width: 0 !important` alone
- Listen for scroll early; re-attach after SPA body replacement

### Extension page CSP

No inline scripts. Use external files (e.g. `pages/theme-boot.js`).

### Adding wiki pages

Edit `pages/wiki-content.ts` → `WIKI_PAGES`, then `npm run tsc` and reload.

### Adding a setting

1. Default in `background/settings.ts`  
2. Type + JSDoc in `background/index.d.ts` (storage key, format, read path)  
3. Options control (`id` matches the key, `data-model`)  
4. Add the field id to `FIELD_SEC` in `pages/options_nav.ts` (tab assignment)  
5. Update hook / content listener if live  
6. Wiki page or note when user-facing  

Example: `viewFxCss` — empty default, Look tab textarea, parsed in `quick_actions.parseViewFxCss_`, documented at wiki `#view-fx`.

Color settings (`accentColor`, `hintBg`, `hintFg`, `findHighlightColor`, `readingProgressColor`, `highlighterColors`) use a native `<input type="color">` plus a hex text field. Injected CSS colors must be sanitized (reject `;` / `{`).

Example: `lookOverrideCSS_` in `background/ui_css.ts` applies accent / hint / find after Save.

### Adding a permission

1. `manifest.json`  
2. [permissions.md](permissions.md) + wiki `#permissions`  
3. Prefer optional when rare  

## Design constraints

- MV3 workers sleep — persist and rehydrate  
- OS shortcuts ≠ in-page maps  
- Ship docs in the package (wiki)  
- Avoid dead third-party Web Store companion dependencies  

## Further reading

In-extension wiki:

- Architecture · Message flow · Settings pipeline · Page enhance · Developer handbook · Extending this wiki
