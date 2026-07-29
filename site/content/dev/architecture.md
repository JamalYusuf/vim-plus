---
title: "Architecture"
subtitle: "MV3 processes, modules, and design theory"
weight: 10
---

## Process model

| Process | Role |
|---------|------|
| **Service worker** (`background/worker.js`) | Settings, commands, completion, tabs/windows APIs, ports, quick actions, side panel wiring |
| **Content scripts** (`content/*`) | Keys, hints, scroll, find, visual, page_enhance on ordinary pages |
| **Extension pages** (`pages/*`, `front/*`) | Options, wiki, sidepanel, vomnibar, help — privileged UI |

MV3 workers can sleep; long-lived work uses ports, alarms, and event-driven handlers rather than forever-running background pages.

## Module style

Background code historically used a custom AMD-like `define`/`require` pattern compiled for the worker. **Important:** in the service worker, dynamic `require` is not always available the way Node expects — critical paths (e.g. quick actions running Vim commands) use **static imports** such as `executeExternalCmd`.

Content and pages compile to classic scripts or modules per `tsconfig` project references.

## Major subsystems

| Area | Location (approx.) |
|------|---------------------|
| Settings / defaults | `background/settings.ts`, `settings-template.json` |
| Key maps | `background/key_mappings.ts`, content `key_handler.ts` |
| Completion / omnibar data | `background/completion*.ts` |
| Run commands | `background/run_commands.ts`, `all_commands.ts` |
| Quick actions / palette | `background/quick_actions.ts` |
| Side panel | `background/side_panel.ts`, `pages/sidepanel.*` |
| Page FX / progress | `content/page_enhance.ts` |
| Wiki | `pages/wiki*.ts`, `wiki-content.ts` |
| UI CSS / theme | `background/ui_css.ts`, `pages/vim-plus-theme.css` |

## Design principles

1. **Local-first** — no custom analytics backend  
2. **Keyboard discoverability** — palette + side panel + wiki  
3. **Chrome APIs over hacks** — windows, tabs, history, sidePanel  
4. **Docs in-product** — `wiki-content.ts` ships with the extension  

## Build graph

```
TypeScript sources → npm run tsc → sibling .js files
manifest.json points at emitted JS / HTML assets
gulp pipelines optional for dist packaging
```

## Related

[Message flow](../message-flow/) · [Settings](../settings/) · [Page enhance](../page-enhance/)
