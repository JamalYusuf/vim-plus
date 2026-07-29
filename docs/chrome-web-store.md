# Chrome Web Store preparation

Materials for listing **Vim+** on the Chrome Web Store.

## Listing copy (draft)

### Name

**Vim+**

### Short description (≤ 132 characters)

```
Keyboard-first Chrome navigation: link hints, omnibar, command palette, side panel, reading tools.
```

### Detailed description (draft)

```
Vim+ is keyboard-first navigation for Google Chrome by Jamal Yusuf (jamal.dev).

Browse without leaving the home row:
• Link hints, scrolling, find, and visual mode
• Omnibar for history, tabs, and search engines
• Hashbangs for web search and AI prompt send (!g, !grok, !gpt, …)
• Command palette (:) for tabs, privacy, reading, windows, and more
• Command center side panel — keys, commands, tabs, closed sessions
• Reading progress, Reader View, highlighter
• Window docking, tab groups, Reading List, downloads helpers

Documentation ships inside the extension (Wiki). Theme supports dark and light mode.

Privacy: local-first. No Vim+ analytics backend. Settings sync only if you enable it.
```

### Category

Productivity (or “Workflow & Planning” depending on store taxonomy).

### Language

English (primary). Additional UI locales may ship under `_locales/`.

## Single purpose

**Single purpose statement (store form):**

> Provide keyboard-driven navigation and tab/omnibar control for Google Chrome web pages.

## Permission justifications

Use [permissions.md](permissions.md) — paste the **Store-facing summary** and expand per-permission fields from the tables.

## Privacy policy URL

Host a public HTML/MD page of [privacy.md](privacy.md) (or [PRIVACY-POLICY.md](../PRIVACY-POLICY.md) after cleanup) on:

- `https://jamal.dev/...` (recommended)

Store requires a reachable HTTPS privacy policy URL for extensions that handle user data / broad host access.

## Screenshots (suggested set)

Capture at store-required sizes (see current Chrome Web Store asset guidelines):

1. Link hints on a content page  
2. Omnibar with history + engine suggestions  
3. Command palette (`:`) categories  
4. Side panel command center  
5. Options (Keys or Search tab)  
6. Reading progress / Reader View  
7. Wiki permissions or getting-started page  

Use real UI (dark or light consistent brand red accent). Avoid misleading mockups.

## Promo tile / icon

- Use `icons/icon128.png` and store promotional images per current pixel requirements  
- Brand: dark background, red accent, “Vim+” wordmark  

## Support & homepage

| Field | Value |
|-------|--------|
| Homepage | https://jamal.dev |
| Support | Email / form on jamal.dev |
| Author | Jamal Yusuf |

## Review notes (optional message to reviewers)

```
Vim+ is a keyboard navigation extension. Broad host access is required for content scripts
(link hints, scrolling, find, reading tools) on arbitrary websites. Tabs/history/bookmarks/
sessions power the omnibar and tab commands. Side panel is the command center.
No remote analytics. Permission details: see package docs/permissions.md and in-extension wiki.
```

## Version & package

1. Bump `version` / `version_name` in `manifest.json` and `package.json` together  
2. `npm run chrome` (or your signed packaging pipeline)  
3. Upload zip from dist output  
4. Fill store form fields from this doc  

See [publishing-checklist.md](publishing-checklist.md).
