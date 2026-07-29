---
title: "Key mappings"
subtitle: "map / unmap / mapKey theory and practice"
weight: 40
---

## Language

Options → **Custom key mappings** accepts a line-oriented language:

```text
# comment
map j scrollDown
map <c-d> scrollPageDown
unmap x
mapKey <D-c> <c-c>
```

| Directive | Meaning |
|-----------|---------|
| `map <keys> <command>` | Bind keys to a command id |
| `unmap <keys>` | Remove a binding |
| `mapKey <from> <to>` | Translate a physical key to another before matching |

## Safe customization

1. Change one binding at a time  
2. Prefer `unmap` then `map` so intent is clear  
3. Test on a normal HTTPS page  
4. Keep a backup export of Options  

## Site-specific maps

Patterns can scope maps to hosts (see wiki **Site-specific mappings**). Use when a site’s own shortcuts conflict globally.

## Layouts

Non-US keyboard layouts may need `mapKey` so physical positions still feel Vim-like. Wiki **Keyboard layouts** covers the theory.

## Commands vs keys

Every mapped action is a **command**. The palette and side panel can run commands that have no key. Keys are convenience; commands are the stable API surface.

## Debugging

- Side panel → **Keys** — live list  
- Partial chord stuck → `Esc`  
- Conflict with site → exclusion or site map  
- Nothing fires → restricted URL or focus in iframe
