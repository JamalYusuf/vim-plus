---
title: "Settings pipeline"
subtitle: "Defaults → storage → caches → live hooks"
weight: 30
---

## Flow

```
settings-template.json / code defaults
  → chrome.storage (local / sync if enabled)
  → background caches
  → broadcast / port update to frames & pages
```

## Defaults

Author defaults live in the settings template and `background/settings.ts` (search engines, hashbangs, feature flags). Product defaults are **Google-centric** for search.

## Update hooks

Changing Options triggers:

1. Persist to storage  
2. Recompute derived structures (maps, exclusion regexes, engines)  
3. Notify open content scripts and UI pages  

## Sync

Opt-in. Not all keys may sync; large blobs can hit quotas. Always keep an export before experimental resets.

## Reset

**Reset to defaults** reloads the author template. Irreversible without a backup.
