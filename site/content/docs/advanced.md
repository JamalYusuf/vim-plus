---
title: "Advanced customization"
subtitle: "CSS, clipSub, new tab URL, inject list"
weight: 70
---

## User-defined CSS

Style HUD, hints, and vomnibar within supported scopes. Prefer small overrides; large CSS can fight dark mode. Options → Look / CSS fields; wiki **User-defined CSS**.

## Clipboard substitution (`clipSub`)

Sed-like rewrite rules for copy/paste text (research and ticket workflows). Misconfigured rules can mangle passwords — keep rules narrow.

## New tab URL

Controls what opens when **Vim+** creates tabs. Chrome still owns Ctrl/Cmd+T for the browser new tab page unless the user changes Chrome settings separately.

## Inject into other extensions

Optional allow list of extension IDs plus `web_accessible_resources` patterns. Only enable if you understand the security tradeoff.

## Vomnibar JSON

Advanced geometry and matching: `maxMatches`, `queryInterval`, sizes, styles. Invalid JSON may fall back to defaults — check Options validation messages.

## Sync

Chrome sync for settings is **opt-in**. Large CSS or map blobs may hit sync quotas; keep a local export.
