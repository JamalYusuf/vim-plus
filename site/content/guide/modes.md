---
title: "Modes"
subtitle: "What mode you’re in and what to press"
weight: 30
---

## Normal mode

Default on ordinary pages. Single keys and sequences run commands. HUD (heads-up display) may show multi-key progress.

**Leave:** stay here most of the time. Enter other modes with explicit keys (`i`, `/`, `v`, `f`, `o`, `:`).

## Insert mode

Typing goes to the page. Enter via `i`, focusing an input, or some site behaviors.

**Leave:** `Esc` (or your mapped exit). After leaving, scroll and hints work again.

## Find mode (`/`)

Search visible text. Typical flow:

1. `/` → type query  
2. Enter to commit / jump  
3. `n` / `N` next / previous match  
4. `Esc` exit  

Options control case sensitivity and related find behavior.

## Visual / visual-line

Select text with keyboard motions (similar spirit to Vim visual mode). Useful for copy workflows and clipboard commands (`:clip` family).

## Link hints (`f` / variants)

Every clickable (or configurable) target gets a short label. Type the label to activate. Variants open in new tab, copy URL, hover, download, queue, etc. — see default maps and Options → Hints.

## Omnibar & command palette

These are **UI modes**: focus is in the vomnibar or palette until you confirm or cancel (`Esc`). They do not leave the page’s content script in “insert”; they overlay the browser chrome area Vim+ owns.

## HUD feedback

When a multi-key chord is partial, the HUD shows what you’ve typed. Wrong prefix? `Esc` and restart.

## Mode troubleshooting

| Symptom | Try |
|---------|-----|
| Keys type into the page | `Esc`; check insert; check exclusions |
| Nothing happens | Not a chrome:// page? Focus in iframe? Site excluded? |
| Hints missing | Page still loading; shadow DOM; exclusion; try reload |
| Palette command failed | Side panel / global shortcut path; see DevTools for SW errors |
