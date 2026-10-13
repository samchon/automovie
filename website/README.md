# @automovie/website

The public site at [samchon.github.io/AutoMovie](https://samchon.github.io/AutoMovie/). It shows four productions from [`experimental`](../experimental), an ancient temple, a medieval manor, a modern suburban house and a future citizen house, each as a live 3D tour rendered from the production's own source.

## Commands

```bash
pnpm --filter @automovie/website dev      # generate scenes, then Vite at http://127.0.0.1:5174/
pnpm --filter @automovie/website build    # generate scenes, type-check, then Vite into dist/
pnpm --filter @automovie/website preview  # serve dist/ at http://127.0.0.1:4174/
pnpm --filter @automovie/website deploy   # build, then publish dist/ to gh-pages
```

Every build first runs the productions' scene producers and writes gzip transports with their textures under the ignored `public/buildings/`; these are regenerated, never committed. `.github/workflows/website.yml` builds pull requests that touch the site and deploys `dist/` from `master`. Pages serves the site under a case-sensitive repository path, so `vite.config.ts` uses a relative `base`.

## Tours

`tour/?building=ancient|modern|future` and `manor/` share one spectator controller: click for mouse look, WASD or arrows to fly, Space and C to rise and descend, Shift to slow down, R to return to the exterior, and touch pads on mobile. `?view=<id>` opens one of the production's authored cameras. The manor merges its entries into one mesh per material in `src/bakeManor.ts` so it draws in a few hundred calls.
