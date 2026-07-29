---
title: "Protocol tokens"
subtitle: "VimiumPlus naming in ports, marks, injector"
weight: 50
---

## Why rename

Internal protocol strings identify ports, storage marks, and injector handshakes. Vim+ uses **`VimiumPlus`** tokens so the fork does not collide with unrelated extensions or legacy names.

## Where they appear

- Content ↔ background port naming  
- Marks / local storage keys for extension-owned state  
- Injector helpers in `lib/injector.ts`  
- Typings under `typings/` and `lib/base*.d.ts`  

## Contributor rule

Do **not** reintroduce third-party GitHub identities or old protocol prefixes in new code. Search for `VimiumPlus` when adding cross-context messaging.

## User impact

Users do not type these tokens. A clean install avoids mixed-key confusion; if you upgraded from experimental forks, reset settings if ports misbehave.
