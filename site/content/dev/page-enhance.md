---
title: "Page enhance"
subtitle: "Progress, reader, FX, highlighter"
weight: 40
---

## Module

`content/page_enhance.ts` injects page-level UI that is not part of classic Vimium navigation:

- Reading progress track/fill  
- Reader View host  
- Highlighter overlays  
- Spotlight / lens / dim FX  
- Related DOM observers  

## Progress bar

- Early bind scroll / resize listeners  
- Fill via **CSS transform scale** / CSS variable (`--vp-read-p`) so layout width stays correct  
- Avoid `width: 0 !important` patterns that leave a gray-only track  

## Reader

Mozilla **Readability** (bundled) parses the document; Vim+ presents a simplified reading surface.

## Persistence

Highlighter state keys off URL. Clearing site data / extension storage removes marks.

## Performance

Observers and rAF-friendly updates should avoid forcing layout on every scroll tick. Prefer transform-only animations for the progress fill.
