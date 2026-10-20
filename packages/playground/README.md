# @automovie/playground

Private browser pages for developing AutoMovie: pages that exercise engine motion, film and physics. It is not published.

## Run

```bash
pnpm --filter @automovie/playground dev       # Vite at http://127.0.0.1:5173
pnpm --filter @automovie/playground build
pnpm --filter @automovie/playground preview   # dist/ at http://127.0.0.1:4173
```

## Pages

| Page | Exercises |
| --- | --- |
| `index.html`, `drivers.html`, `stickman.html` | Procedural proportions, poses, IK, drivers and hand-authored clips |
| `gesture.html`, `showcase.html`, `film.html` | Engine gestures, actions and the script-to-cut film pipeline |
| `launch.html`, `impact.html`, `attach.html`, `trampoline.html` | Projectile, impact, attachment and jump actions |
| `spar.html` | Boxing scene |

The Human figure page is unavailable while @automovie/human contains parameter declarations only.
