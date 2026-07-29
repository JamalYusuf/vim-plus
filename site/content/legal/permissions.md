---
title: "Permissions"
subtitle: "Chrome Web Store justifications"
weight: 10
---

Vim+ requests only permissions required for keyboard navigation, omnibar completion, tab/window control, and optional privacy tools. Below is a reviewer-oriented summary; keep the live `manifest.json` as the source of truth.

## Typical capabilities

| Permission / host | Why |
|-------------------|-----|
| **Storage** | Save settings, maps, highlighter data, exclusions |
| **Tabs / windows** | Switch, mute, pin, dock, session restore, command targets |
| **History** | Omnibar ranking and user-initiated history clear / shred |
| **Bookmarks** | Omnibar bookmark mode / toggle commands |
| **Sessions** | Restore closed tabs/windows |
| **Search** / omnibox | Optional default-search integration; omnibox keyword `v` |
| **Clipboard** | Copy URL/title/markdown/article commands |
| **Scripting / content scripts** | Inject keyboard UI on ordinary web pages |
| **Side panel** | Command center UI |
| **Downloads** | Open downloads UI / last download helpers |
| **Reading list** | Later mode in side panel |
| **Favicon** | Omnibar icons where available |
| **Host access** | Content scripts and completion on https/http pages the user visits |

Exact optional vs required split is defined in the manifest and Options permission UI.

## User-initiated sensitive actions

Clearing history, cookies, or cache for a site runs **only** when the user invokes a command (palette / UI). Vim+ does not schedule silent wipes.

## Incognito

Requires the user to enable “Allow in incognito” on the extension details page.

## Side panel

Opened by user gesture (icon, shortcut, command). Not used for background ads or unrelated UX.

## Content scripts

Run on normal web pages to provide hints, scroll, find, and page enhance. They do not run on most `chrome://` URLs by browser policy.

## Store single purpose

Keyboard-first browser navigation and productivity. Features like Reader View and window dock support that purpose; they are not unrelated product bundles.

For the long form used in store submission, see `docs/permissions.md` in the repository.
