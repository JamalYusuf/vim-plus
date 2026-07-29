---
title: "Hashbangs & AI"
subtitle: "Omnibar shortcuts for search and prompt send"
weight: 30
---

Hashbangs are **`!token`** prefixes in the omnibar. They expand to search URLs or AI chat URLs with your query encoded.

## Web search (examples)

| Token | Engine |
|-------|--------|
| `!g` | Google |
| `!w` | Wikipedia |
| `!gh` | GitHub |
| `!yt` | YouTube (if configured) |
| `!so` | Stack Overflow (if configured) |

Defaults favor **Google-centric** engines in this product build (no Baidu/Gitee-oriented defaults).

## AI prompt send

These open the provider’s web UI with your text as a prompt (URL templates — **no API keys leave your machine**; you use the site as a logged-in user):

| Token | Typical destination |
|-------|---------------------|
| `!grok` | xAI Grok |
| `!gpt` | ChatGPT |
| `!claude` | Claude |
| `!pplx` | Perplexity |
| others | See Options → Search / hashbang list |

Example: `!grok summarize the CSS cascade for a junior engineer` then Enter.

## Custom hashbangs

Add or edit rules under Options → Search. Format merges with classic search-engine rules. Keep tokens short and unique.

## Command palette vs hashbangs

| Tool | Use when |
|------|----------|
| Hashbang | You want a **URL destination** (search or AI web UI) |
| `:` palette | You want an **extension command** (dock, shred, reader…) |

## Privacy

Queries you type into AI hashbangs are sent to **that website** when the tab opens — same as typing in their search box. Vim+ does not proxy AI traffic through a custom backend.
