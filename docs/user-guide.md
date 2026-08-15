# User guide

Vim+ is a keyboard-first Chrome extension. This guide covers daily use. For a deeper handbook, open the **in-extension Wiki** (`:wiki` or side panel → Wiki).

## Concepts

- **Normal mode** — keys are commands (scroll, hints, open omnibar).
- **Insert mode** — typing goes to the page (e.g. after focusing an input, or `i`).
- **Counts** — many motions accept a count (e.g. `5j`).
- **Maps** — customize keys under Options → Keys.

Press `Esc` to leave insert-like focus and cancel pending multi-key sequences.

## Essential keys

| Key | Action |
|-----|--------|
| `j` `k` `h` `l` | Scroll down / up / left / right |
| `d` / `u` | Page down / up |
| `gg` / `G` | Top / bottom |
| `f` / `F` | Link hints — current tab / new tab |
| `o` / `O` | Omnibar — current / new tab |
| `:` | Command palette |
| `/` | Find mode |
| `v` | Visual mode |
| `?` | Help |
| `i` | Insert mode |
| `r` | Reload |
| `x` / `X` | Close tab / restore |
| `t` / `T` | Tab-related / tab switcher (see maps) |
| `gS` | Side panel command center |
| `gA` | Window picker (omnibar) |
| `Alt`+arrows | Dock window |
| `gn` | Toggle dark style (vomnibar + UI theme) |

Exact bindings depend on your key map. Side panel → **Keys** lists what is active.

## Omnibar

1. Press `o` (or `O` for new tab).
2. Type to search history, domains, bookmarks (by mode).
3. Use hashbangs for engines and AI: `!g cats`, `!grok summarize this`.
4. Arrow keys move the selection; Enter opens; Esc closes.

## Command palette

1. Press `:` (from the page, often via omnibar flow depending on maps).
2. Browse categories: `:view` `:read` `:tab` `:win` `:nav` `:priv` …
3. Run short commands: `:prog` `:read` `:hl` `:zen` `:hints` `:wiki`.

## Command center (side panel)

Open via toolbar icon, context menu, `gS`, or the global shortcut you assigned.

Modes: **Keys** · **Cmds** · **Tabs** · **Closed** · **Later** (Reading List) · **Page**.

Header: Options, Wiki, Help, **Off for this site**.

## Options

Open from the side panel gear, `:opts`, or `chrome://extensions` → Vim+ → Extension options.

Tabs are conceptual, not a dump of every checkbox:

| Tab | Concept | Contents |
|-----|---------|----------|
| Start | Where it runs | Welcome, exclusions, permissions |
| Keys | What you press | Maps, layouts, hints, find |
| Search | How you look things up | Engines, hashbangs, omnibar |
| Look | How it looks | Dark mode, HUD, CSS, reading progress, **:view color profiles** |
| Advanced | Power-user edges | clipSub, sync, other-extension IDs |

`/` filters any option. The Notes column on the right is always visible.

**Save** writes dirty fields. **Reset to defaults** restores the author template (export a backup first).

### Colors

Options → Look → **Colors**. Native color pickers for accent (HUD / flash), link-hint pills, find highlight, reading-progress fill, and the `:hl` 1–5 palette. Defaults are the shipped rose theme.

### `:view` color profiles

Options → Look → `:view color profiles` (`viewFxCss`). Empty = built-in CSS for `:gray`, `:blue`, `:inv`, `:sepia`, `:blur`, `:hicon`, `:dim`, `:focus`. Format: `name: css` per line. Wiki: `#view-fx`.

## Reading progress

Enabled by default on web pages (gray track + red fill as you scroll). Configure under Options → Look:

- On/off for all pages
- Color and height
- Optional custom CSS for `#vp-read-progress-track` / `#vp-read-progress-fill`
- `:prog` toggles for the current tab

## Exclusions

If a site fights keyboard control:

1. Side panel → **Off for this site**, or  
2. Options → Excluded URLs with an empty passKeys rule for full disable.

## chrome:// pages

Content scripts cannot run on most Chrome internal pages. Use:

- Global shortcuts (`chrome://extensions/shortcuts`)
- Side panel
- Palette commands that open `chrome://` URLs via the extension

## Getting help

| Resource | How |
|----------|-----|
| Help overlay | `?` |
| Wiki | `:wiki` / side panel Wiki |
| Repo docs | [docs/](README.md) |
| Permissions | [permissions.md](permissions.md) or wiki `#permissions` |
