# Vim+ release notes

**Author:** Jamal Yusuf · [jamal.dev](https://jamal.dev)  
**Docs:** [README.md](README.md) · [docs/](docs/README.md)

---

## v1.1.0

Trust, keyboard completeness, and quieter chrome for the 1.0 product layer.

### Safety
- Destructive palette commands (`:hall`, `:sh`, `:sc`, `:xo`, `:xr`, `:hlc`) require a second Enter
- History pause (`:ph`) survives service-worker sleep
- Site power toggle matches the real host, not a substring
- `:stop` actually stops the load; `:f` is no longer aliased to hints

### Command center & palette
- `j`/`k` move when the filter is empty; `Ctrl-n`/`p` always; `1–6` switch modes
- Tabs: recency sort, favicons, `x` close / `p` pin / `m` mute
- Cmds lists palette actions (`:read`, `:hl`) instead of internal API names
- Empty `:` shows recent commands first
- Reading List add is a toggle; `x` removes a saved item

### Look
- System fonts only (no missing Inter / JetBrains Mono)
- Side panel chrome is shorter; power control reads “This site: On/Off”
- Help `?` strip teaches `:`, `:read`, `:hl`, `:zen`
- Reader View: `q`/`Esc` exit, `=`/`-` size, dark/sepia remembered

### Options
- Tabs actually hide other sections (all table bodies, not just the first)
- Each option is assigned by field id — Start / Keys / Search / Look / Advanced now mean something
- Filter (`/`) and collapsible Notes replace the always-on help column and wiki-chip pile
- New setting `viewFxCss` — edit `:view` color profiles (Look tab). Empty = built-ins
- Color fields use the native picker: accent, hint pills, find highlight, progress, `:hl` 1–5
- New Look settings: `spotlightRadius`, `readerFontSize`, `readerWidth`
- Help dialog: `showAdvancedCommands` is now a checkbox (default on)
- Dropped unused optional `cookies` permission (cookie wipe is `browsingData`)

### Docs / i18n
- Spanish locale is `es` (Chrome never loaded `sp`)
- Options hash `#keys` / `#installed` opens the Keys tab; `#view` / `#fx` open Look
- Unassigned side-panel shortcut is called out on Options → Start
- Wiki `#view-fx` documents the new setting

---

## v1.0.0

First public Vim+ line for **Google Chrome (Manifest V3)**.

### Product

- Keyboard navigation: link hints, scroll, find, visual mode, custom maps
- Omnibar with history/domains/bookmarks and **hashbangs** (web + AI prompt send)
- **Command palette** (`:`) — privacy, history, view, read, tab, window, nav, clip, Chrome, Vim+
- **Command center** side panel — keys, commands, tabs, closed sessions, reading list
- Reading progress (default on), Reader View, highlighter with persistence
- Window docking, tab groups, Reading List, downloads helpers
- In-extension **Wiki** (options deep dives, architecture, permissions for Web Store)
- Dark / light UI aligned with Options and `gn`

### Platform

- Chrome-only MV3 packaging focus (`minimum_chrome_version` 121)
- Local-first privacy; settings sync opt-in
- Publication docs under `docs/` for GitHub and Chrome Web Store

### Install from source

```bash
npm ci && npm run tsc
# chrome://extensions → Load unpacked → repository root
```

See [docs/install.md](docs/install.md) and [docs/publishing-checklist.md](docs/publishing-checklist.md).
