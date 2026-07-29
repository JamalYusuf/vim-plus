# Permissions (Chrome Web Store)

This document justifies every permission declared in `manifest.json` for Chrome Web Store review and privacy questionnaires.  
The same content is maintained in the in-extension wiki: **Permissions (Chrome Web Store)** (`wiki.html#permissions`).

## Store-facing summary

```
Vim+ is a keyboard navigation extension. It needs broad site access to inject content scripts
(link hints, scrolling, find, reading tools) on web pages. It uses tabs/history/bookmarks/sessions
for the omnibar and tab commands; storage for settings; sidePanel for the command center;
scripting for page tools; and related Chrome APIs (downloads, readingList, clipboard, etc.) only
to implement matching keyboard features. No browsing data is uploaded to Vim+ servers.
```

## Host access

| Declaration | Why | What we do not do |
|-------------|-----|-------------------|
| `host_permissions`: `<all_urls>` | Content scripts must run on arbitrary http(s) pages for navigation features | No remote exfiltration of page content; no third-party trackers injected |
| Content scripts `matches: <all_urls>` | Declarative injection so keys work without per-site enable | Users can exclude sites in Options / side panel |
| `web_accessible_resources` | Vomnibar, libs, content assets for extension frames | Limited to listed resource paths |

**Note:** Most `chrome://` pages still block content scripts. Global shortcuts and the side panel cover those surfaces.

## Required API permissions

| Permission | Feature | Justification |
|------------|---------|---------------|
| `tabs` | Tab open/close/reload/pin/mute/move/query | Core keyboard tab management |
| `tabGroups` | Tab group commands | Chrome isolates group APIs |
| `history` | Omnibar history; clear/pause history commands | Local history search; deletes only on explicit user action |
| `bookmarks` | Omnibar bookmarks; toggle bookmark | Keyboard bookmark search/create/remove |
| `sessions` | Restore closed tabs/windows | Chrome recently-closed sessions |
| `webNavigation` | Frame navigations, exclusions, re-inject | Correct enable/disable across SPA multi-frame loads |
| `storage` | Settings, maps, highlights, theme | Local (optional sync if user enables) |
| `scripting` | Reader View, FX, inject helpers | MV3 executeScript for user-triggered page tools |
| `sidePanel` | Command center | Required to open/control side panel |
| `contextMenus` | Right-click entry points | Discovery for new users |
| `clipboardRead` | Paste / open-copied-URL style commands | Only on user-run commands |
| `clipboardWrite` | Copy URL, title, markdown, article, tables | Only on user-run copy commands |
| `downloads` | Last download, downloads page, some hint modes | Query/open user downloads |
| `downloads.shelf` | Download shelf control | Companion to download workflows |
| `readingList` | Read later in side panel | Chrome Reading List API |
| `favicon` | Omnibar icons | Display only |
| `search` | Prefer browser default search engine | Hand query to Chrome search provider |
| `browsingData` | Shred site data / clear origin data | Explicit privacy palette commands |
| `notifications` | Upgrade / status notifications | Local OS notifications |
| `alarms` | Delayed features (e.g. history pause) | Wake service worker on schedule |
| `offscreen` | MV3 clipboard/DOM helpers | Chrome requirement for some operations without a tab |
| `system.display` | Multi-monitor window docking | Display geometry only (not screen capture) |

## Optional permissions

| Permission | When | Why |
|------------|------|-----|
| `cookies` | User enables related site-data tools | Fine-grained cookie clearing |
| `contentSettings` | User enables site media/JS toggles | Mirror Chrome site settings |

## Related manifest fields

| Field | Why |
|-------|-----|
| `commands` | Global shortcuts (e.g. side panel) on chrome:// |
| `omnibox` keyword `v` | Lightweight address-bar entry |
| `options_ui` | Options page registration |
| `side_panel.default_path` | Command center document |
| Extension page CSP | No remote scripts in options/wiki/side panel |

## Data principles

- Local-first Chrome APIs; **no Vim+ analytics backend**
- Sync is **opt-in**
- Destructive APIs (history delete, browsingData) only on explicit commands
- Clipboard only for copy/paste commands the user runs

## Intentionally not requested

Native messaging to arbitrary apps · debugger · proxy · webRequest blocking · OAuth identity for the extension · enterprise policy APIs

## Keeping this doc accurate

When changing `manifest.json` permissions:

1. Update this file and wiki `#permissions` in the same PR  
2. Prefer `optional_permissions` for rare features  
3. Document exclusion / revoke paths for users  
