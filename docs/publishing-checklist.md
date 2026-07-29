# Publishing checklist

Use before shipping a public release (GitHub tag and/or Chrome Web Store).

## Product

- [ ] Core keys work on a normal https page: `j` `k` `f` `o` `:` `?`
- [ ] Omnibar history + hashbang (`!g`, `!grok`) open correctly
- [ ] Command palette: dock, restore closed tab, link hints, find, visual
- [ ] Side panel opens (toolbar + shortcut), lists keys/tabs, no CSP console errors
- [ ] Reading progress shows track **and** fill while scrolling on a long page (no command required)
- [ ] Options Save / Reset defaults / import-export smoke test
- [ ] Wiki loads (`:wiki`), dark/light follows Options and `gn`
- [ ] Exclusions / “Off for this site” work and can be undone

## Privacy & compliance

- [ ] [permissions.md](permissions.md) matches `manifest.json`
- [ ] Wiki `#permissions` matches the same list
- [ ] Public privacy policy URL live and matches [privacy.md](privacy.md)
- [ ] No debug `console` noise that confuses reviewers (optional cleanup)
- [ ] Store single-purpose statement accurate

## Build & package

- [ ] `npm ci` clean on a fresh machine
- [ ] `npm run tsc` passes with no errors
- [ ] `npm run lint` (if required by your process)
- [ ] `npm run chrome` / `npm run dist` produces uploadable zip
- [ ] Version bumped in `package.json` **and** `manifest.json` (`version` / `version_name`)
- [ ] Icons present (`icons/icon128.png` etc.)
- [ ] Unpacked load of **dist** (not only source tree) verified

## Store assets

- [ ] Screenshots at required sizes
- [ ] Promo images / tile
- [ ] Listing copy from [chrome-web-store.md](chrome-web-store.md)
- [ ] Support contact and homepage set to jamal.dev
- [ ] Category and language selected

## GitHub / source publication

- [ ] README.md accurate (install, features, docs links)
- [ ] `docs/` folder complete and linked from README
- [ ] LICENSE.txt present
- [ ] No secrets, private keys, or local-only paths committed
- [ ] `.gitignore` excludes `node_modules`, build noise as appropriate
- [ ] Optional: RELEASE-NOTES.md updated for the version

## Post-publish

- [ ] Install store/public build on a clean Chrome profile
- [ ] Smoke-test again
- [ ] Tag git release matching version
- [ ] Update jamal.dev if it links to install instructions
