---
title: "Contributing"
subtitle: "How to work on Vim+"
weight: 60
---

## Author

**Jamal Yusuf** — [jamal.dev](https://jamal.dev) · [github.com/JamalYusuf/vim-plus](https://github.com/JamalYusuf/vim-plus)

## Setup

```bash
git clone https://github.com/JamalYusuf/vim-plus.git
cd vim-plus
npm ci
npm run tsc
```

Load unpacked from the repo root. Use a separate Chrome profile for development if you already run a stable install.

## Workflow

1. Branch from `master`  
2. Make focused changes  
3. `npm run tsc` (and `npm run lint` if touching style-sensitive files)  
4. Manual test: hints, omnibar, palette, side panel, options save  
5. Update docs: `docs/` and/or `site/content/` and/or `pages/wiki-content.ts`  

## Documentation layers

| Layer | Audience |
|-------|----------|
| `pages/wiki-content.ts` | In-extension users |
| `docs/*.md` | GitHub / store reviewers |
| `site/` Hugo | Public website |

Keep product claims consistent across layers.

## Code style

- Match surrounding TypeScript style  
- Prefer static imports in the service worker for command execution paths  
- No drive-by refactors unrelated to the change  

## License

Contributions are under **Apache-2.0** (see `LICENSE.txt`).
