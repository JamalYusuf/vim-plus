---
title: "Reading tools"
subtitle: "Progress, Reader View, highlighter, focus FX"
weight: 80
---

## Reading progress

A thin track at the top (or configured edge) fills as you scroll. **On by default.**

| Control | Where |
|---------|--------|
| Global on/off, color, height | Options → Look |
| Custom CSS | Look → progress CSS fields |
| Per-tab toggle | `:prog` |

Implementation uses a CSS variable / `scaleX` fill so the bar is not a static gray slab — if you only see an empty track, scroll the page or confirm the feature is enabled.

## Reader View (`:read`)

Uses **Mozilla Readability** to extract article content into a cleaner reading surface. Ideal for long posts with heavy chrome.

## Highlighter (`:hl`)

Highlight ranges and attach comments. Persistence is **per URL** in extension storage so revisits restore your marks.

## Focus & view FX (palette / view commands)

| Idea | Typical commands |
|------|------------------|
| Zen / focus | `:zen`, spotlight, lens |
| Reduce chrome | grayscale, dim, invert, hide images |
| Device frames | iPhone / Pixel / iPad style viewports |

Exact short names appear in the command palette under **View** / **Read**.

## Clipboard helpers

Copy URL, title, markdown link, article markdown, headings, tables — **Clip** category in the palette. Useful with Reader View for research workflows.
