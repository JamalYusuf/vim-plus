---
title: "Windows & tabs"
subtitle: "Docking, sessions, tab power"
weight: 90
---

## Tabs

Common capabilities (via keys, palette, or side panel):

- Pin, mute, duplicate  
- Discard (“sleep”) to free memory  
- Close others / close range  
- Tab groups (Chrome tab group APIs)  
- Restore closed tabs and sessions  

Side panel **Tabs** and **Closed** modes are the visual way to drive this.

## Window docking

Dock the browser window to display edges with progressive shrink, maximize, center, and cycle windows.

| Entry | Notes |
|-------|-------|
| `Alt`+arrows | If mapped and OS allows |
| `:win` family | Palette discoverable names |
| Quick actions | Background `quick_actions` handlers |

Docking uses Chrome `windows` APIs — not simulated CSS. Multi-monitor setups use the display of the current window.

## Moving across windows

- Move tab to next window  
- Mute other tabs  
- Window picker omnibar (`gA`)  

## Incognito

Commands can open an incognito window when the extension is allowed in incognito (`chrome://extensions` → details).

## Limitations

- OS window manager rules still apply  
- Some corporate policies restrict window bounds  
- On restricted pages, prefer side panel / global shortcuts over content-script keys
