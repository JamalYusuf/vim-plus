# Install & build

## Requirements

- Google Chrome **121+**
- Node.js **≥ 14**, npm **≥ 7** (for building from this repository)

## End users (unpacked / local build)

Until a Chrome Web Store listing is live, install from source:

```bash
git clone <repository-url> vim-plus
cd vim-plus
npm ci
npm run tsc
# optional fuller local pipeline:
# npm run local
```

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Select the project root (directory containing `manifest.json`)
5. Pin **Vim+** on the toolbar

### Recommended first setup

1. Open `chrome://extensions/shortcuts`
2. Assign **Open side panel** to `Alt+Shift+V` (or another free chord)
3. Open the side panel → **Wiki** → Getting started
4. On a normal website (not `chrome://`), try `j` / `k` / `f` / `o` / `:`

## Chrome Web Store package (recommended)

Zipping the **entire repo** (or an archive of the project tree) is the usual reason Chrome reports:

> Invalid package… make sure … **manifest.json is at the root directory of the zip package**.

Build a clean extension-only package from the repo root:

```bash
npm ci
npm run package
```

| Output | Use |
|--------|-----|
| `build/extension/` | Unpacked extension only — **Load unpacked** this folder |
| `build/vim-plus-<version>-chrome.zip` | **Upload this file** to the Chrome Web Store |

The zip has `manifest.json` at the **archive root** (not nested under a subfolder). It includes only runtime assets (compiled JS, HTML/CSS, icons, locales, etc.) — not `site/`, `docs/`, `tests/`, TypeScript sources, or `node_modules/`.

```bash
npm run package -- --skip-tsc   # skip recompile if JS is already up to date
npm run package -- --keep-key   # keep manifest.key for a fixed local extension id
```

### Legacy production package

```bash
npm run chrome
# alias: npm run dist
```

Runs the older gulp dist pipeline + `scripts/make.sh`. Prefer `npm run package` for Web Store uploads.

Other useful commands:

| Command | Use |
|---------|-----|
| `npm run tsc` | TypeScript emit only (fast reload cycle) |
| `npm run package` | Store-ready `build/extension` + zip |
| `npm run watch` | Watch mode |
| `npm run build` | Gulp build |
| `npm run lint` | ESLint |
| `npm run clean` | Clean build artifacts |

## Reload after changes

1. `npm run tsc` (or wait for watch)
2. `chrome://extensions` → Vim+ → **Reload**
3. Hard-refresh open web pages (content scripts) and reopen options/wiki/side panel if needed

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Keys do nothing on a page | Confirm it is not `chrome://` / Web Store; check exclusions; try side panel |
| Side panel blank / CSP errors | Ensure no inline scripts; reload extension; see `pages/theme-boot.js` |
| Build fails on Node version | Use Node 14+ / npm 7+ |
| Icons missing | `npm run prepare` runs `icons-to-blob` |

## Platform support

This publication build targets **Chrome only** (Manifest V3). Firefox/Edge are not the distribution focus of this package.
