# @automovie/website

The public site at [samchon.github.io/automovie](https://samchon.github.io/automovie/): an architectural collection showing the ancient civic temple, medieval baron manor, modern suburban house, and future citizen house. Clicking any building opens its actual interactive 3D tour directly.

The collection uses actual production captures as previews. Its static articles own the copy, images, and destination links. Secondary **View captures** links open a native modal gallery; without JavaScript or native dialog support they open the original image. See [capture provenance](public/shots/README.md) for the source of each image.

The temple, suburban house and citizen house use `tour/?building=ancient|modern|future`. Every dev or build command first calls their original production scene producers, including their current engine lowering, and generates gzip-compressed transports and required texture files under the ignored `public/buildings/` directory. These are website distribution assets, regenerated from source rather than authored production inputs. Each transport embeds the SHA-256 of its native payload and external texture bytes. The `.bin` extension keeps static servers from transparently decoding gzip before the browser's explicit `DecompressionStream`. The tours share room/view search, authored camera selection, the same spectator flight as the manor, keyboard controls, and touch movement. A `view` query retains the selected native camera. Unknown building addresses fail visibly and link back to the collection.

All tours use the existing AutoMovie viewer mount, also used by the playground. `tourScene.ts` calls the productions' original mesh uploaders and daylight routines. The modern inspector and website share `experimental/modern-suburban-house/src/viewer/scene.mjs`, including native glass, mirrors and physical lights. Loading waits for images and a real rendered frame. Geometry, authored models, household states and unfinished individual objects remain owned by their productions.

The manor page runs the production's authored source in the browser. It decodes the seven albedo textures, derives the shared prototype inventory the production's instance consumer reads, builds the scene, and then folds every entry into one mesh per material (`src/bakeManor.ts`) so the house draws in a few hundred calls instead of ten thousand. Views and the `?view=<id>` deep link address the production's own authored observation points. All four buildings use the shared spectator controller: click for unlimited mouse look, WASD or arrows to fly, Space / C to rise / descend, and Escape to release the mouse. Movement is 8 m/s by default; holding either Shift key reduces it to 2 m/s. R restores the exterior. Wheel zoom changes the lens without moving an orbit pivot. If mouse capture is refused, focus the canvas for keyboard flight and drag to look. Touch users can hold direction, height and Slow buttons while dragging the scene. Flight passes through walls; blur, view selection and capture loss clear held movement.

## Commands

```bash
pnpm --filter @automovie/website dev      # generate scenes, then Vite at http://127.0.0.1:5174/
pnpm --filter @automovie/website build    # generate scenes, type-check, then Vite into dist/
pnpm --filter @automovie/website preview  # serve dist/ at http://127.0.0.1:4174/
pnpm --filter @automovie/website deploy   # build, then publish dist/ to the gh-pages branch
```

`.github/workflows/website.yml` builds the site on every pull request that touches it and deploys `dist/` to `gh-pages` on every push to `master`. GitHub Pages serves the build under the repository's own name, and that path is case-sensitive, so `vite.config.ts` uses a relative `base` and the build works at whatever path it is mounted on.

## Layout

| Path | Role |
| --- | --- |
| `index.html`, `src/collection.css` | Responsive four-building collection. Static markup owns the catalog and captured views. |
| `src/collection.ts`, `src/gallery.ts`, `src/gallery.css` | Modal enhancement, view/building navigation, failure recovery, and page lifecycle. The private package's `./gallery` and `./collection` exports let repository unit tests use its typed workspace boundary. |
| `public/shots/` | Original production captures and their provenance. |
| `tour/index.html`, `src/tour.css`, `src/tour.ts` | Shared live 3D tour page, loading/error recovery, GPU and page lifecycle. |
| `src/tourData.ts`, `src/tourExport.ts`, `build/exportScenes.cts` | Build-time native transport and authored-camera handoff. |
| `src/tourScene.ts`, `src/modernScene.ts`, `src/productionScenes.d.ts` | Original native scene upload, typed modern boundary, texture URLs and resource ownership. |
| `src/tourCamera.ts`, `src/tourUi.ts`, `src/tourFrame.ts` | Authored camera poses, disposable accessible view search/navigation and redraw policy on the existing viewer mount. Private package exports expose these typed logic boundaries to repository unit tests. |
| `src/spectatorCamera.ts`, `src/spectatorControls.ts`, `src/spectator.css` | Shared flight math, disposable pointer/keyboard/touch input and mobile pads. Both hosts use their existing viewer clock and renderer. |
| `manor/index.html`, `src/manor.ts` | The manor viewer: loading card, featured views, the production's searchable view navigator, first-person flight. |
| `src/bakeManor.ts` | Entry-level mesh merge that keeps every view's visibility, pose, and clipping semantics. |
| `src/medieval-baron-manor.d.ts` | The typed boundary onto the production's JavaScript scene module. |
| `build/deploy.cjs` | Manual `gh-pages` publish, the same branch the workflow writes. |
