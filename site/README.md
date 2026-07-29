# Vim+ documentation site

Hugo source for **https://jamalyusuf.github.io/vim-plus/**

## Local development

```bash
# from repository root — requires Hugo Extended
hugo server -s site
```

Open the printed local URL (usually `http://localhost:1313/vim-plus/`).

## Production build

```bash
hugo --minify -s site
# output: site/public/
```

## Deploy

GitHub Actions workflow [`.github/workflows/pages.yml`](../.github/workflows/pages.yml) builds on push to `master`/`main` when `site/**` changes.

Repository settings → Pages → Source: **GitHub Actions**.

## Content map

| Section | Path |
|---------|------|
| User guide | `content/guide/` |
| Reference | `content/docs/` |
| Developers | `content/dev/` |
| Legal | `content/legal/` |
| Theme | `themes/vim-plus/` |

In-extension wiki source of truth remains `pages/wiki-content.ts` — keep product claims aligned.
