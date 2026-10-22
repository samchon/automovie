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
| `human.html` | Human interface; generation and rendering are not implemented or qualified |

## Human

`IAutoMovieHumanParameters` defines the typed input. `AutoMovieHuman.generate(params): IAutoMovieHumanGenerated` is an unimplemented contract that throws `Not implemented.`; its declared output contains `parameters` and an `IAutoMovieModel` in `model`.

The existing Human page and image routes are not qualified against this contract. They do not establish working geometry generation, appearance, editor admission, save/load or screenshots. Parameter sources under `src/human-parameters/` likewise require consumer and HTTP verification before use.

Honor explicit server shutdowns; do not start or restore a deliberately stopped service. See [Human screenshot guidance](../../.agents/skills/human/screenshot.md) for access conventions and verification limits, not a guarantee of a running renderer.
