---
title: "Privacy"
subtitle: "Local-first data handling"
weight: 20
---

**Effective for Vim+ 1.0 · Author: Jamal Yusuf**

This page summarizes how Vim+ handles data. The repository also ships `PRIVACY-POLICY.md` and `docs/privacy.md`.

## Summary

- Vim+ does **not** operate a custom analytics or telemetry backend for this product.  
- Settings and feature data live in **Chrome storage** on your profile.  
- Browsing history used for the omnibar is read through **Chrome APIs** you authorize; it is not uploaded to the author.  
- AI **hashbangs** open third-party websites with your query in the URL — that is communication with **those sites**, not with a Vim+ server.

## Data Vim+ stores locally

| Kind | Examples |
|------|----------|
| Settings | Key maps, exclusions, theme, progress options |
| Feature state | Highlighter marks (per URL), UI prefs |
| Optional sync | If you enable Chrome sync for extension settings |

## Data Vim+ does not collect

- No author-operated account system  
- No forced cloud backup of your history  
- No sale of browsing data  

## Third parties

When you navigate to Google, Grok, ChatGPT, etc., those sites’ policies apply. Vim+ only constructs URLs or uses Chrome APIs you triggered.

## Permissions & deletion

Revoke permissions or remove the extension in `chrome://extensions` to stop injection and clear extension storage (subject to Chrome’s uninstall behavior). History clear commands only run when you invoke them.

## Contact

Author: **Jamal Yusuf** — [jamal.dev](https://jamal.dev) · repository issues on [GitHub](https://github.com/JamalYusuf/vim-plus).

## Changes

Policy updates ship in the repository and on this documentation site. Material changes should bump the visible version notes.
