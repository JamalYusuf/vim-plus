# Contributing

Thanks for your interest in Vim+.

## Development setup

```bash
npm ci
npm run tsc
# Load unpacked the repo root in chrome://extensions
npm run watch   # optional
```

See [install.md](install.md) and [developer.md](developer.md).

## Scope

This product is **Chrome MV3–focused**. Prefer changes that:

- Improve keyboard navigation UX
- Keep docs (wiki + `docs/`) in sync with behavior
- Avoid new remote network dependencies for core features
- Justify any new permission in `docs/permissions.md` and wiki `#permissions`

## Code practices

- Run `npm run tsc` before submitting
- Prefer static imports in the service worker over dynamic `import()` (AMD `require` is null in SW)
- No inline scripts in extension pages (CSP)
- For page tools, prefer self-contained injects or existing content globals
- User-facing options should link to wiki or `docs/` when non-obvious

## Documentation

| Kind | Where |
|------|--------|
| In-product | `pages/wiki-content.ts` |
| Publication | `docs/*.md` |
| README | `README.md` |

When you change behavior users will notice, update at least one of the above.

## Pull requests

1. Small, focused changes  
2. Describe *what* and *why*  
3. Note permission or privacy impact  
4. List manual test steps (pages and keys tried)  

## License

Contributions are under **Apache-2.0** by **Jamal Yusuf** — see [LICENSE.txt](../LICENSE.txt).

## Contact

Jamal Yusuf · [https://jamal.dev](https://jamal.dev)
