# @automovie/playground

Browser pages for developing AutoMovie. Each page exercises one part of the engine and viewer with its own example content. The package is private.

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
| `spar.html` | A boxing scene |
| `recovery.html` | Saved image-loft coefficients, dimension edits, matched surface and construction passes, and an optional static mesh reference |
| `human.html` | Human parameter editing |

On `human.html`, choose an example, edit the body controls in the parameters' units and select Apply; the figure is generated only then. Download saves the edited parameters as JSON.

Construction views, curve selection and PNG frames served over HTTP are in the [debug viewer](../human/debug/README.md) of `@automovie/human`.
