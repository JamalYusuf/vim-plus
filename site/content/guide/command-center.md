---
title: "Command center"
subtitle: "Side panel power-user UI"
weight: 60
---

The **command center** is Vim+’s side panel: a persistent surface for keys, commands, tabs, sessions, Reading List, and page actions — including when content scripts cannot run.

## Open

- Toolbar icon (default action opens the side panel)
- Context menu
- `gS` (if mapped)
- Global command **Open side panel** (`chrome://extensions/shortcuts`, suggested `Alt+Shift+V`)
- Palette / wiki links that call into the panel

## Modes

| Mode | Purpose |
|------|---------|
| **Keys** | Bound keys for the current context |
| **Cmds** | Full command catalog / quick actions |
| **Tabs** | Open tabs — jump, close, organize |
| **Closed** | Recently closed / session restore |
| **Later** | Chrome Reading List |
| **Page** | Page-local actions |

Header actions typically include **Options**, **Wiki**, **Help**, and **Off for this site**.

## Why it exists

1. **chrome:// and restricted pages** — content scripts are blocked; the side panel still works with a user gesture  
2. **Discoverability** — browse commands without memorizing maps  
3. **Session power** — tabs / closed / reading list without leaving the keyboard workflow  

## Site power toggle

**Off for this site** adds an exclusion for the current host so page keys pass through. Re-enable from Options → exclusions or by reversing the rule.

## Relationship to palette

| Surface | Best for |
|---------|----------|
| `:` palette | Fast named commands while reading a page |
| Side panel | Browse, multi-step, restricted URLs, tab/session work |
| Omnibar | URLs, history, engines, AI |

## Permissions note

Side panel APIs require the `sidePanel` permission declared in the manifest. Opening the panel is always a user-driven action.
