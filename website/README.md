# @automovie/website

The public site at [samchon.github.io/AutoMovie](https://samchon.github.io/AutoMovie/): an architectural collection showing the ancient civic temple, medieval baron manor, modern suburban house, and future citizen house. All four have exterior and interior galleries. The manor also has an interactive 3D tour.

The collection uses actual production captures. Its static articles own the copy, images, and links; the gallery enhances the image links with a native modal, view buttons, arrow-key navigation, and previous/next building controls. Escape or a backdrop click closes it and restores focus. Without JavaScript or native dialog support, each image link still opens its capture. See [capture provenance](public/shots/README.md) for the source of each image.

The manor page runs the production's authored source in the browser. It decodes the seven albedo textures, derives the shared prototype inventory the production's instance consumer reads, builds the scene, and then folds every entry into one mesh per material (`src/bakeManor.ts`) so the house draws in a few hundred calls instead of ten thousand. Views, flight, and the `?view=<id>` deep link all address the production's own authored observation points.

## Commands

```bash
pnpm --filter @automovie/website dev      # Vite dev server at http://127.0.0.1:5174/
pnpm --filter @automovie/website build    # ttsc --noEmit, then vite build into dist/
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
| `manor/index.html`, `src/manor.ts` | The manor viewer: loading card, featured views, the production's searchable view navigator, first-person flight. |
| `src/bakeManor.ts` | Entry-level mesh merge that keeps every view's visibility, pose, and clipping semantics. |
| `src/medieval-baron-manor.d.ts` | The typed boundary onto the production's JavaScript scene module. |
| `build/deploy.cjs` | Manual `gh-pages` publish, the same branch the workflow writes. |
