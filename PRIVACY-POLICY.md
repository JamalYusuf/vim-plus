# How Vim+ respects your privacy

**Vim+** is a keyboard-first navigation extension for Google Chrome by **Jamal Yusuf** ([jamal.dev](https://jamal.dev)).

## Publication copy

The maintained privacy policy for store and website publication is:

→ **[docs/privacy.md](docs/privacy.md)**

Permission justifications for Chrome Web Store review:

→ **[docs/permissions.md](docs/permissions.md)**

In-extension wiki: `#privacy` and `#permissions`.

## Short summary

- No Vim+ analytics backend that receives browsing history or page content.
- History, bookmarks, tabs, and page tools run **locally** via Chrome APIs and content scripts.
- **Settings sync** with your browser account is **opt-in** (Options).
- Clear history / shred site data only on **explicit** user commands.
- Clipboard is used only for copy/paste commands you run.

## Settings sync

By default, Vim+ does not push settings to your browser account until you enable **Synchronize settings with your current account for this browser**. Browsing history is not included in Vim+ settings sync payloads.

## Find mode

Find-mode keywords may be stored locally and are not included in synced settings. Incognito find history is temporary and discarded when all Incognito windows are closed.

## Contact

https://jamal.dev
