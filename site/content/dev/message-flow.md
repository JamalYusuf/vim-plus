---
title: "Message flow"
subtitle: "How keys become actions across processes"
weight: 20
---

## High level

```
Key event (content)
  → key_handler / mode state
  → port message to service worker
  → command resolution (maps, counts)
  → Chrome API or response to content / UI
```

Omnibar and Options pages use extension messaging similarly, with **ports** for streaming completion results.

## Ports

Long-lived connections carry:

- Frame registration  
- Completion queries / results  
- Status and HUD updates  
- Injector / protocol handshakes  

Port names and mark keys use **VimiumPlus** protocol tokens (not legacy third-party names). See [Protocol tokens](../protocol/).

## Command execution

1. User chord completes or palette fires a short name  
2. Background resolves to a typed command  
3. Handlers in `tab_commands`, `frame_commands`, `tools`, `quick_actions`, etc. run  
4. Failures surface via HUD or UI toast when possible  

## Restricted pages

When content scripts are absent, the **side panel** and **global commands** still reach the service worker with a user gesture.

## Debugging

1. Content DevTools → console on the page  
2. Service worker DevTools from `chrome://extensions`  
3. Options / sidepanel page DevTools for UI bugs
