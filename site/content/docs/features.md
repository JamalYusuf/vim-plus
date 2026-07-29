---
title: "Features"
subtitle: "Full product inventory"
weight: 20
---

Vim+ **1.0** feature inventory for users, reviewers, and listing copy.

## Core navigation

- Link hints (open, new tab, copy, hover, download, queue, and related modes)
- Keyboard scrolling (line, page, top/bottom, smooth scroll option)
- Find mode and visual / visual-line selection
- Marks, focus input, pass keys / insert mode
- Frame navigation (next / main frame)
- Pagination patterns (next / previous page heuristics)

## Omnibar (Vomnibar)

- Omni search: history, domains, bookmarks, open tabs
- Window switcher mode
- Search engines + **hashbangs** (web + AI prompt URLs)
- Command palette entry via `:`
- Favicons, mono-URL style, dark style toggle (`gn`)
- Configurable match count, debounce, geometry

## Command palette (`:`)

| Category | Examples |
|----------|----------|
| Privacy | Shred domain, clear site cookies/cache |
| History | Clear last 15m / 1h / 24h / 7d, pause history |
| View | Grayscale, dim, invert, spotlight, lens, zen, device frames, hide images |
| Read | Progress, Reader View, highlighter |
| Tab | Pin, mute, duplicate, sleep, close others, restore closed |
| Window | Dock edges, maximize, center, cycle windows |
| Nav | Back/forward, top/bottom, zoom, stop, hints, find, visual |
| Clip | URL, title, markdown, article MD, headings, tables |
| Chrome | Downloads, history page, extensions, flags, settings… |
| Vim+ | Side panel, options, wiki, help |

## Side panel (command center)

- Keys / commands / tabs / closed sessions / reading list / page actions
- Site power toggle (exclude current host)
- Works when content scripts cannot (with a user gesture)

## Reading & focus

- Reading progress bar (default on)
- Reader View (Mozilla Readability)
- Highlighter + comments, per-URL persistence
- Spotlight / focus lens
- Zen app window (no URL bar)
- Device viewport frames (iPhone, Pixel, iPad, …)

## Tabs & windows

- Pin, mute, discard (sleep), duplicate, close ranges
- Tab groups
- Restore closed tabs/sessions
- Dock window to display edges with progressive shrink
- Maximize / center / cycle browser windows
- Move tab to next window, mute other tabs

## Chrome integration

- Downloads (page + last download)
- Reading List
- Picture-in-Picture command
- Bookmarks toggle
- Incognito window
- Omnibox keyword `v`
- Global commands (side panel shortcut, etc.)

## Customization

- Full key map language (`map` / `unmap` / `mapKey`)
- Site-specific maps and exclusion rules
- User-defined CSS for HUD / hints / vomnibar
- Hashbangs and search engines
- New tab URL for extension-created tabs
- Theme: dark / light / system + `gn` vomnibar dark

## Documentation product

- In-extension wiki (options deep dives, architecture, permissions)
- Options with section tabs and reset-to-defaults
- Help dialog with working wiki links
- This Hugo site for public docs

## Privacy tools (user-initiated)

- Shred domain history + site data
- Pause history for a time window
- Clear cookies / cache for current origin (where permitted)

---

Implementation notes: [Architecture](/dev/architecture/) · [Page enhance](/dev/page-enhance/).
