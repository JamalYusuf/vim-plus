---
title: "Vim concepts"
subtitle: "What “vim-like” means in the browser"
weight: 20
---

Vim+ is **not** a full Vim editor inside Chrome. It borrows **modal control**, **counts**, and **composable keys** so browsing stays on the home row.

## Modes (mental model)

| Mode | What keys do |
|------|----------------|
| **Normal** | Keys are commands: scroll, hints, open omnibar |
| **Insert** | Keys type into the focused field (or the page) |
| **Find** | Type a search string; `n`/`N` jump matches |
| **Visual** | Select text with motions; copy/act on the selection |
| **Hints** | Type labels over clickable targets |
| **Omnibar / palette** | A focused UI owns the keyboard until Esc |

Press **`Esc`** often: leave insert-like focus, cancel multi-key sequences, close overlays.

## Counts

Many motions accept a count prefix: `5j` scrolls five lines, `3f` can queue multiple hint activations depending on the command. If a sequence feels stuck, `Esc` and try again.

## Maps vs commands

- A **key mapping** binds a key sequence to a **command name** (e.g. `map f LinkHints.activate`).
- The **command palette** (`:`) runs short names and full command ids without needing a key.
- The **side panel** lists both bound keys and the full catalog.

## Pass keys and exclusions

Some sites need their own shortcuts (Gmail, Google Docs, code editors). Vim+ supports:

1. **Pass keys** — let specific keys reach the page  
2. **Site-specific maps** — different bindings per URL pattern  
3. **Exclusions** — reduce or disable capture for a host  

Side panel → **Off for this site** is the fastest full exclusion for the current host.

## Frames

Pages may embed iframes. Focus can move between frames; Vim+ has frame-related commands so you can act on the main document or a nested frame. If keys “do nothing,” check whether focus is in an unexpected frame or a restricted page.

## Philosophy

- Prefer **discoverable** tools (palette, side panel, wiki) over memorizing every map on day one  
- Prefer **local** data (history for omnibar stays in Chrome storage / browser APIs you already granted)  
- Prefer **docs inside the product** so help never depends on a dead external URL  

Continue with [Modes](../modes/) and [Keyboard map](../keys/).
