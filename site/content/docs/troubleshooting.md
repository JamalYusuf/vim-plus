---
title: "Troubleshooting"
subtitle: "Common issues and fixes"
weight: 80
---

## Keys do nothing

1. Is the URL `chrome://`, Web Store, or PDF viewer? Use side panel / shortcuts.  
2. Is the site excluded? Side panel site power / Options exclusions.  
3. Is focus in an iframe or input? `Esc`, then try again.  
4. Reload the extension after upgrading.

## Omnibar empty or weak results

- History permission and browser history must exist  
- Try a broader query substring  
- Check search engine / hashbang config  

## Command palette error

Some commands need a normal tab; others run in the service worker. If a tool fails only from the page, try the side panel. Check service worker DevTools for errors (`chrome://extensions` → service worker link).

## Reading progress gray only

Scroll the page; confirm Options → Look progress is on; toggle `:prog`. Custom CSS must not force `width: 0` without using the supported fill variable / scale approach.

## Side panel blank

- Confirm MV3 `sidePanel` permission  
- No inline scripts (CSP) — pages load external JS only  
- Rebuild pages with `npm run tsc`  

## Options won’t save

- Required fields validation  
- Storage quota  
- Incognito without “allow in incognito”  

## Theme mismatch

Toggle `gn` or Options auto dark mode; wiki / options / side panel share `vpUiDark` + `autoDarkMode`.
