# @automovie/playground

Private browser pages for developing AutoMovie: Human face, body and person editors, the resident Human inspection application, and pages that exercise engine motion, film and physics. It is not published.

## Run

```bash
pnpm --filter @automovie/playground dev       # Vite at http://127.0.0.1:5173
pnpm --filter @automovie/playground build
pnpm --filter @automovie/playground preview   # dist/ at http://127.0.0.1:4173
pnpm --filter @automovie/playground human:viewer ensure   # Human inspection at http://127.0.0.1:5175/view
```

`dev` builds `@automovie/human` first; rebuild it after changing Human source. The repository holds no Human basis: the connected editors load the URL given as `faceSource`, or the `headSource` and `bodySource` pair, and refuse without one. The inspection application reads only its storage's `published` directory; `HUMAN_VIEWER_PORT` and `HUMAN_VIEWER_STORAGE_ROOT` select another instance, and every command addressing an instance must use the same pair.

## Pages

| Page | Exercises |
| --- | --- |
| `face.html`, `connected-face.html` | Face editor: simple and fine shape, expression, skin, eyes and hair, with undo, document save and GLB export |
| `connected-body.html` | Body editor: shape channels, macro and tape measurements, clinical joint angles, contact check and GLB export |
| `connected-person.html` | One-person editor, including facial hair |
| `index.html`, `drivers.html`, `stickman.html` | Procedural proportions, poses, IK, drivers and hand-authored clips |
| `gesture.html`, `showcase.html`, `film.html` | Engine gestures, actions and the script-to-cut film pipeline |
| `launch.html`, `impact.html`, `attach.html`, `trampoline.html` | Projectile, impact, attachment and jump actions |
| `spar.html` | Boxing scene |

Example Human documents and camera presets live in [`src/human/examples`](src/human/examples). A Human change is verified in the actual browser display, not by the success of an unrelated page.
