---
title: "Getting started"
subtitle: "From install to comfortable daily use"
weight: 10
---

## Install from source

```bash
git clone https://github.com/JamalYusuf/vim-plus.git
cd vim-plus
npm ci
npm run tsc
```

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select the repository root (the folder that contains `manifest.json`)
4. Pin the toolbar icon
5. Under `chrome://extensions/shortcuts`, assign **Open side panel** (suggested: `Alt+Shift+V`)

Reload the extension after every `npm run tsc` when you change TypeScript sources.

## First keys (normal webpage)

| Key | Action |
|-----|--------|
| `j` / `k` | Scroll down / up |
| `h` / `l` | Scroll left / right |
| `d` / `u` | Half-page down / up |
| `gg` / `G` | Top / bottom |
| `f` / `F` | Link hints — current tab / new tab |
| `o` / `O` | Omnibar — current / new tab |
| `:` | Command palette |
| `/` | Find mode |
| `v` | Visual mode |
| `?` | Help overlay |
| `i` | Insert mode (type into the page) |
| `r` | Reload |
| `x` / `X` | Close tab / restore closed |
| `gS` | Side panel command center |
| `gA` | Window picker (omnibar) |
| `gn` | Toggle dark UI style (vomnibar + theme) |
| `Esc` | Cancel / leave insert |

Exact bindings depend on your key map. Side panel → **Keys** lists what is active for the current page.

## Daily loop

1. **Navigate pages** — scroll with `j`/`k`/`d`/`u`, jump with `gg`/`G`
2. **Follow links** — `f` then type the hint labels
3. **Jump history / URLs** — `o` omnibar; hashbangs like `!g cats` or `!grok summarize this`
4. **Power tools** — `:` command palette, or open the side panel
5. **Customize** — one mapping at a time in Options → Keys

## Where help lives

| Resource | How |
|----------|-----|
| Help overlay | `?` |
| In-extension Wiki | `:wiki` or side panel **Wiki** |
| This website | You are here |
| Repo docs | [docs/](https://github.com/JamalYusuf/vim-plus/tree/master/docs) on GitHub |

## chrome:// pages

Content scripts **cannot** run on most Chrome internal pages (`chrome://settings`, Web Store, New Tab in many setups). Use:

- Global shortcuts (`chrome://extensions/shortcuts`)
- Side panel command center
- Palette commands that open Chrome URLs via the extension background

Test new keys on a normal `https://` page first.

## Next steps

- [Vim concepts](../concepts/) — modal browsing in plain English  
- [Keyboard map](../keys/) — fuller default map  
- [Omnibar](../omnibar/) — history, engines, AI hashbangs  
- [Install & build](/docs/install/) — Node, scripts, packaging
