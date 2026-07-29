# Privacy policy (Vim+)

**Product:** Vim+ — keyboard-first navigation for Google Chrome  
**Author:** Jamal Yusuf · [https://jamal.dev](https://jamal.dev)  
**Effective for:** version 1.0.x publication materials

This document describes how Vim+ handles data. For permission-level detail, see [permissions.md](permissions.md).

## Summary

- Vim+ does **not** operate a product analytics backend that receives your browsing history, keystrokes, or page content.
- Features that read history, bookmarks, tabs, downloads, or page DOM run **locally** through Chrome extension APIs and content scripts.
- **Settings sync** with your browser account is **off by default** and only occurs if you enable it in Options.
- Destructive actions (clear history, shred site data) run **only when you invoke them**.

## Data Vim+ uses locally

| Data | Purpose |
|------|---------|
| Settings, key maps, search engines, hashbangs | Configuration |
| Page titles / URLs from tabs, history, bookmarks | Omnibar suggestions and tab UI |
| Session IDs for closed tabs | Restore closed tab/window |
| Find-mode queries | Local find history (not synced) |
| Highlighter marks / comments | Per-URL local storage |
| Clipboard contents | Only when a copy/paste command runs |
| Display geometry | Window docking (`system.display`) |

## What is not collected by Vim+

- No remote telemetry of URLs visited  
- No sale of personal data  
- No advertising identifiers  
- No automatic upload of page HTML or passwords  

If you open third-party sites (e.g. search engines or AI hashbang destinations), those sites’ own policies apply.

## Sync

If you enable **Synchronize settings with your current account for this browser**:

- Settings items may sync via Chrome’s extension storage sync facilities
- Browsing history is **not** included as a sync payload of Vim+

If sync is disabled (default after install when no prior sync data applies), settings remain on the local profile.

## Incognito

- “Allow in Incognito” is controlled by the user in `chrome://extensions`
- Find-mode keywords in Incognito are held temporarily and discarded when all Incognito windows close

## Third parties

- Mozilla Readability is bundled for Reader View and runs locally
- Hashbang / search URLs open destinations you choose (Google, Grok, ChatGPT, etc.); those services are outside Vim+’s control

## Contact

Questions about this policy: via [jamal.dev](https://jamal.dev).

## Related files

- In-repo legacy/companion text: [../PRIVACY-POLICY.md](../PRIVACY-POLICY.md)
- In-extension wiki: `#privacy` and `#permissions`
