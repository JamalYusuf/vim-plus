---
title: "Omnibar"
subtitle: "History, domains, tabs, windows, engines — one keyboard UI"
weight: 50
---

The **omnibar** (Vomnibar) is Vim+’s address-bar replacement: search history, domains, bookmarks, open tabs, windows, and run engines / AI hashbangs without touching the mouse.

## Open

| Key | Typical behavior |
|-----|------------------|
| `o` | Omnibar → open in current tab |
| `O` | Omnibar → open in new tab |
| `b` / others | Mode-specific (bookmarks, etc.) |
| `gA` | Window switcher flavor |

## How to use

1. Open the omnibar  
2. Type a query — results rank history, domains, bookmarks, tabs  
3. Use arrow keys or `Ctrl-n` / `Ctrl-p` style motion if mapped  
4. **Enter** opens the selection  
5. **Esc** closes  

## Hashbangs

Prefix with `!` for engines and AI prompt send:

| Example | Meaning |
|---------|---------|
| `!g cats` | Google search |
| `!w Vim` | Wikipedia |
| `!gh vim-plus` | GitHub search |
| `!grok explain CSS` | Open Grok with the prompt |
| `!gpt …` | ChatGPT prompt URL |
| `!claude …` | Claude |
| `!pplx …` | Perplexity |

Full tables: [Hashbangs & AI](/docs/hashbangs/).

## Command palette via `:`

From the page, `:` opens the **command palette** (discoverable short commands). Categories include Privacy, History, View, Read, Tab, Window, Nav, Clip, Chrome, Vim+.

Examples: `:prog` · `:read` · `:hl` · `:zen` · `:hints` · `:wiki` · `:opts` · `:sh` shred

## Look & feel

- **Dark style** — `gn` toggles vomnibar dark and aligns Options / wiki / side panel via theme flags  
- **JSON options** — `maxMatches`, debounce, sizes (Options advanced / vomnibar JSON)  
- Favicons and mono-URL styling where enabled  

## Tips

- Prefer short unique substrings from the URL or title  
- Use window mode when you have many Chrome windows  
- If results feel stale, history APIs depend on permission + browser history state
