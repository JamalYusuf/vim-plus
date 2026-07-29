---
title: "Exclusions"
subtitle: "When not to capture keys"
weight: 50
---

## Why exclude

Editors, email, IDEs-in-browser, and design tools often need their own keyboard shortcuts. Vim+ should get out of the way.

## Fast path

Side panel → **Off for this site** — excludes the current host with a sensible rule.

## Rules

Options → excluded URL patterns:

- Match by URL pattern  
- **Pass keys** — allow listed keys through to the page  
- Empty passKeys on a full-disable rule — Vim+ does not capture on matches  

## Theory

Exclusions are evaluated before normal key handling. Prefer narrow host rules over broad `*` patterns so you do not disable the extension everywhere by accident.

## Re-enable

Edit or delete the rule in Options. Reload the tab if behavior seems cached.
