# Vim+ release notes

**Author:** Jamal Yusuf · [jamal.dev](https://jamal.dev)  
**Docs:** [README.md](README.md) · [docs/](docs/README.md)

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
