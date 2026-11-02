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
| `recovery.html` | Saved image-loft coefficients, independent dimension edits, matched surface/construction passes and an optional independent static mesh reference |
| `human.html` | Ordinary Human parameter editing, Apply, orbit controls and parameter JSON download |

## Human

Open `human.html`, choose a typed example, edit body controls in their public units and select Apply. The page uses `AutoMovieHuman.generate` and the generic `buildModel` renderer; it generates only after Apply. Download saves the edited parameter document.

Construction views, curve selection, mannequin motion, compiler diagnostics and Human PNG routes live in the unpublished [Human development app](../human/dev/README.md). Run `pnpm --filter @automovie/human dev` from the repository root to open that app on port 5196.
