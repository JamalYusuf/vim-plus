# Landing page media

Place demo assets here. The homepage looks for:

| File | Purpose |
|------|---------|
| `demo.mp4` | Primary product demo video (recommended 20–40s, 1280×720 or 1920×1080) |
| `demo.gif` | Optional animated GIF alternative / social preview |
| `demo-poster.svg` | Poster & placeholder art (committed) |

## Suggested capture script

1. Fresh profile with Vim+ loaded  
2. Open a long article → scroll with `j`/`k` (show progress bar)  
3. `f` link hints → open a link  
4. `o` omnibar → type a history query  
5. `:` palette → run `:read` or `:prog`  
6. Side panel / window dock briefly  

Export MP4 (H.264) as `demo.mp4`, commit, push — the landing page will pick it up on the next Pages deploy.

Do **not** commit huge raw recordings; keep `demo.mp4` under ~15MB when possible.
