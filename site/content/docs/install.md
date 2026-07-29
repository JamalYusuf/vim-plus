---
title: "Install & build"
subtitle: "From clone to load-unpacked and packages"
weight: 10
---

## Requirements

- **Google Chrome** 121+ (Manifest V3)
- **Node.js** ≥ 14 and **npm** ≥ 7
- macOS, Linux, or Windows with a POSIX-friendly shell recommended for scripts

This product build targets **Chrome only** for distribution (not Firefox/Edge store packages).

## Clone & compile

```bash
git clone https://github.com/JamalYusuf/vim-plus.git
cd vim-plus
npm ci
npm run tsc
```

`npm run tsc` typechecks and emits JavaScript next to TypeScript sources for `background/`, `content/`, `pages/`, and `front/`.

## Load unpacked

1. `chrome://extensions` → **Developer mode**  
2. **Load unpacked** → repository root (`manifest.json` present)  
3. Pin the action icon  
4. Set **Open side panel** under shortcuts  

After source edits: `npm run tsc` → click **Reload** on the extension card.

## npm scripts

| Command | Purpose |
|---------|---------|
| `npm run tsc` | Typecheck / emit JS |
| `npm run watch` / `npm run dev` | Incremental TypeScript watch |
| `npm run local` / `npm start` | Local gulp pipeline |
| `npm run build` | Gulp build |
| `npm run chrome` / `npm run dist` | Production Chrome package |
| `npm run lint` | ESLint |
| `npm test` | Gulp test target |

## Project layout

```
background/     Service worker: settings, completion, commands, quick_actions, side panel
content/        Page scripts: keys, hints, scroll, find, visual, page_enhance
front/          Vomnibar UI + help dialog assets
pages/          Options, wiki, sidepanel, action popup, theme
lib/            Shared utilities, Readability bundle
docs/           Markdown docs (GitHub / store)
site/           Hugo documentation website (this site’s source)
i18n/           Localized strings
icons/          Extension icons
manifest.json   MV3 manifest
```

## Troubleshooting build

| Issue | Fix |
|-------|-----|
| Missing `.js` next to `.ts` | Run `npm run tsc` |
| Service worker errors | Check `background/worker.js` module graph; reload extension |
| Options blank / CSP | No inline scripts; ensure `theme-boot.js` and page scripts load |
| Side panel empty | Confirm `side_panel` permission and `pages/sidepanel.html` |

## Documentation site (Hugo)

```bash
# requires Hugo extended
hugo server -s site
hugo -s site   # writes site/public
```

GitHub Pages deploys from `site/` via Actions (see `.github/workflows/pages.yml`).
