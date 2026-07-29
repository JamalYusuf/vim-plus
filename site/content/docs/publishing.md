---
title: "Publishing"
subtitle: "Chrome Web Store checklist and listing copy"
weight: 60
---

## Product identity

| Field | Value |
|-------|--------|
| Name | Vim+ |
| Author | Jamal Yusuf |
| License | Apache-2.0 |
| Source | https://github.com/JamalYusuf/vim-plus |
| Docs site | https://jamalyusuf.github.io/vim-plus/ |
| Privacy | This site → Privacy · repo `PRIVACY-POLICY.md` |

## Store listing essentials

- **Single purpose:** keyboard-first navigation and productivity for Chrome  
- **Permission justifications:** [Permissions](/legal/permissions/)  
- **Privacy policy URL:** must be a **public HTTPS** URL (GitHub Pages privacy page or raw policy)  
- Screenshots: omnibar, hints, side panel, options, reader/progress  
- Category: Productivity  

## Technical checklist

- [ ] `npm run tsc` clean  
- [ ] Load unpacked smoke test: hints, omnibar, `:`, side panel, options save  
- [ ] Privacy URL live  
- [ ] No stale third-party branding in UI strings  
- [ ] Manifest version / package version aligned  
- [ ] Icons 16/32/48/128  

## Package

```bash
npm run dist   # or npm run chrome — see package.json
```

Upload the zip produced by the dist pipeline. Do not include `node_modules` or `.git`.

## Post-publish

- Tag release on GitHub  
- Update [RELEASE-NOTES.md](https://github.com/JamalYusuf/vim-plus/blob/master/RELEASE-NOTES.md)  
- Point README badges at the store listing when available  

Longer checklist: `docs/publishing-checklist.md` and `docs/chrome-web-store.md` in the repository.
