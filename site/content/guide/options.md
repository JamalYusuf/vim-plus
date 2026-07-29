---
title: "Options"
subtitle: "How the Options UI is organized"
weight: 70
---

Open Options from:

- Side panel gear  
- `:opts` / wiki links  
- `chrome://extensions` → Vim+ → **Extension options**

## Tabs (simplified)

| Tab | Contents |
|-----|----------|
| **Start** | Welcome, exclusions entry points |
| **Keys** | Custom key mappings, layouts, hint/find options |
| **Search** | Default search, hashbangs, search engine rules |
| **Look** | Dark mode, HUD, CSS, **reading progress**, motion |
| **Advanced** | New tab URL, sync, permissions-related, power options |

## Save & reset

- **Save** writes dirty fields to Chrome storage  
- **Reset to defaults** restores the author template — **export a backup first**  
- Sync is **opt-in** (Advanced / synchronize settings)

## Reading progress (Look)

Enabled by default on web pages:

- Master on/off  
- Color and height  
- Optional custom CSS for `#vp-read-progress-track` / `#vp-read-progress-fill`  
- Per-tab toggle via `:prog`

## Theme

- **Auto dark mode** follows system / setting  
- **`gn`** toggles vomnibar dark and keeps wiki / options / side panel aligned (`vpUiDark` + `autoDarkMode`)

## Key mapping editor

Use the multiline map language:

```text
map <c-e> scrollDown
unmap j
mapKey <D-c> <c-c>
```

See [Key mappings](/docs/key-mappings/) for theory and safety.

## Exclusions

Patterns decide where Vim+ captures keys. Empty passKeys on a pattern typically means full disable for matching URLs. Prefer the side panel **Off for this site** for a single host.
