# Vim+

**Keyboard-first navigation for Google Chrome**

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE.txt)
[![Chrome](https://img.shields.io/badge/Chrome-MV3-green.svg)](docs/install.md)
[![Version](https://img.shields.io/badge/version-1.0.0-e11d48.svg)](package.json)

Vim+ lets you browse the web without leaving the keyboard: link hints, scrolling, find, visual mode, a Chrome-like omnibar, a **command palette** (`:`), window docking, privacy tools, reading progress, Reader View, and a persistent **command center** side panel.

**Author:** [Jamal Yusuf](https://jamal.dev)  
**Homepage:** [https://jamal.dev](https://jamal.dev)  
**Docs:** [https://jamalyusuf.github.io/vim-plus/](https://jamalyusuf.github.io/vim-plus/)  
**License:** Apache-2.0 — see [LICENSE.txt](LICENSE.txt)

---

## Why Vim+

Mouse-driven browsing is precise but slow for the loop most people live in: open tabs, scan pages, jump links, switch windows, search history, copy a URL, dock a window, then do it again. Vim+ keeps that loop on the home row.

| You want… | Vim+ gives you… |
|-----------|-----------------|
| Click links without the mouse | Link hints (`f` / `F`) |
| Chrome-like address bar from the keyboard | Omnibar (`o` / `O`) + hashbangs / AI prompt send |
| Power commands in one place | `:` command palette + side panel |
| Docs that never rot | In-extension **Wiki** (`:wiki`) |

Full motivation and product philosophy: in-extension wiki **About**, and [docs/](docs/).

---

## Quick start

### Load unpacked (development)

```bash
npm ci
npm run tsc          # or: npm run local
```

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this repository root (the folder that contains `manifest.json`)
4. Pin the toolbar icon · optionally set **Open side panel** to `Alt+Shift+V` under `chrome://extensions/shortcuts`

### First keys (on a normal webpage)

| Key | Action |
|-----|--------|
| `j` / `k` | Scroll down / up |
| `f` | Link hints — type the labels that appear |
| `o` | Omnibar (history, URLs, engines) |
| `:` | Command palette |
| `?` | Help overlay |
| `gS` | Command center (side panel) |
| `Esc` | Leave insert / cancel mode |

**Documentation:** Options gear · side panel **Wiki** · omnibar `:wiki` · or the [docs/](docs/) folder in this repo.

---

## Features

### Navigation & modes

- **Normal / Insert / Visual / Find** — modal keyboard control inspired by Vim, tuned for the browser
- **Link hints** — open, new tab, copy URL, hover, download variants
- **Scrolling** with smooth option, marks, and page-up/down
- **Custom key maps** — `map` / `unmap` / `mapKey`, site-specific maps, layout helpers

### Omnibar & search

- Mixed history, domains, bookmarks, tabs, windows
- **Hashbangs** — `!g`, `!w`, `!gh`, … plus AI prompt send (`!grok`, `!gpt`, `!claude`, `!pplx`, …)
- Search engines (classic rule format) merged with hashbangs
- Chrome-like ranking and scrollable result lists

### Command palette (`:`)

Categories include Privacy, History, View, Read, Tab, Window, Nav, Clip, Chrome, Vim+.

Examples: `:prog` · `:read` · `:hl` · `:zen` · `:spot` · `:dlft` · `:hints` · `:wiki` · `:sh` shred domain

### Command center (side panel)

- Filter and run bound keys / full command catalog
- Tabs, closed sessions, Reading List, page actions
- **Off for this site**, Options, Help, Wiki from the header

### Reading & view tools

- **Reading progress** bar on pages by default (toggle in Options → Look)
- **Reader View** (Mozilla Readability)
- Highlighter with comments (persisted per URL)
- Page FX: grayscale, dim, spotlight, focus lens, hide images, device frames
- **Zen** — app-style popup window without browser chrome

### Chrome power features

- Tab groups, Reading List, downloads, PiP
- Window dock (edge snap + progressive shrink), maximize, cycle windows
- Restore closed tabs, mute/pin/sleep, incognito window
- Global shortcuts via `chrome://extensions/shortcuts`

See [docs/features.md](docs/features.md) for a fuller inventory.

---

## Documentation

| Audience | Location |
|----------|----------|
| **Website (public docs)** | [jamalyusuf.github.io/vim-plus](https://jamalyusuf.github.io/vim-plus/) |
| **In-product (best for users)** | Options · Side panel Wiki · `:wiki` |
| **Repository docs (publication)** | [docs/](docs/README.md) |
| Install & build | [docs/install.md](docs/install.md) · [site guide](https://jamalyusuf.github.io/vim-plus/docs/install/) |
| User guide | [docs/user-guide.md](docs/user-guide.md) · [site guide](https://jamalyusuf.github.io/vim-plus/guide/) |
| Features | [docs/features.md](docs/features.md) |
| Permissions (Web Store) | [docs/permissions.md](docs/permissions.md) · [site](https://jamalyusuf.github.io/vim-plus/legal/permissions/) |
| Privacy | [docs/privacy.md](docs/privacy.md) · [PRIVACY-POLICY.md](PRIVACY-POLICY.md) · [site](https://jamalyusuf.github.io/vim-plus/legal/privacy/) |
| Developer / architecture | [docs/developer.md](docs/developer.md) · [site/dev](https://jamalyusuf.github.io/vim-plus/dev/) |
| Chrome Web Store prep | [docs/chrome-web-store.md](docs/chrome-web-store.md) |
| Publishing checklist | [docs/publishing-checklist.md](docs/publishing-checklist.md) |
| Contributing | [docs/contributing.md](docs/contributing.md) |

Hugo site source: [`site/`](site/README.md). In-extension wiki: `pages/wiki-content.ts`.

---

## Requirements

- **Google Chrome** 121+ (Manifest V3)
- Node.js **≥ 14** and npm **≥ 7** for building from source
- Chrome-only product focus in this build (not Firefox/Edge targets for distribution)

---

## Project layout

```
background/     Service worker: settings, completion, commands, quick_actions, side panel
content/        Page scripts: keys, hints, scroll, find, visual, page_enhance
front/          Vomnibar UI + help dialog assets
pages/          Options, wiki, sidepanel, action popup, theme
lib/            Shared utilities, Readability bundle
docs/           Publication documentation (this folder’s companion)
site/           Hugo documentation website (GitHub Pages)
i18n/           Localized strings for options / help / action
icons/          Extension icons
manifest.json   MV3 extension manifest
```

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run tsc` | Typecheck / emit JS for background, content, pages, front |
| `npm run watch` / `npm run dev` | Incremental TypeScript watch |
| `npm run local` / `npm start` | Local build pipeline (gulp) |
| `npm run build` | Gulp build |
| `npm run extension` | Lean unpacked folder only → **`build/extension/`** (load this, not the repo root) |
| `npm run package` / `npm run store` | Store zip + `build/extension/` |
| `npm run chrome` / `npm run dist` | Legacy gulp dist + make.sh package |
| `npm run lint` | ESLint |
| `npm test` | Gulp test target |

After code changes: `npm run extension` → reload **`build/extension`** in `chrome://extensions`. Do not load the repo root (`node_modules` makes it ~125MB).

### Chrome Web Store zip

Do **not** zip the whole repository (that causes “manifest.json must be at the root of the zip”).

```bash
npm run package
# upload:  build/vim-plus-<version>-chrome.zip
# or load: build/extension
```

---

## Configuration & privacy

- Settings live in Chrome storage; **sync is opt-in** (Options → synchronize settings).
- Browsing data used for omnibar/history stays **local** unless the user explicitly runs purge/clear commands.
- Full permission justifications for store review: [docs/permissions.md](docs/permissions.md).
- Privacy policy: [docs/privacy.md](docs/privacy.md) and [PRIVACY-POLICY.md](PRIVACY-POLICY.md).

---

## Theme

- Dark-first UI with light mode
- Options **Auto dark mode** and **`gn`** (toggle vomnibar dark) keep wiki / options / side panel aligned via `vpUiDark` + `autoDarkMode`

---

## Versioning

Current version: **1.0.0** (`package.json` / `manifest.json`).

Release notes: [RELEASE-NOTES.md](RELEASE-NOTES.md) when present.

---

## Author & license

**Author:** Jamal Yusuf ([jamal.dev](https://jamal.dev))

**License:** Apache-2.0 only — [LICENSE.txt](LICENSE.txt)

In-product help, options, and the wiki are the primary user documentation. The [docs/](docs/) folder is maintained for GitHub, Chrome Web Store, and external publication (**English only**).
