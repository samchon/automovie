# @automovie/website

The public site at [samchon.github.io/automovie](https://samchon.github.io/automovie/), built with [Nextra](https://nextra.site). It shows what composing the packages makes: whole scenes of people and objects, each replayed with other seeds, bodies and skill, and the pieces they are composed from.

| Route | Holds |
| --- | --- |
| `/` | The landing page: the featured scenes playing, then how a film is made and how to start |
| `/scenes/`, `/scenes/<id>/` | The scene gallery, and each scene with its takes side by side, the chain behind it and a link to customise it |
| `/motions/`, `/motions/<family>/` | The motion reference: the actions, the lexicon's rows by family with their parameters, and the scenes that use each |
| `/objects/` | Every archetype of `@automovie/archetypes`, and one archetype's page with its specs and controls |
| `/human/` | The site's bodies as the polygon man, their measures, and the inspector of `@automovie/viewer` |
| `/playground/` | A composition with every parameter, performed in the page |
| `/docs/` | Getting started and composing motion |
| `/gallery/` | The old address of the objects, which forwards with its query |

The package is private and is never published.

## Start

The site is a member of the pnpm workspace and depends on the packages as `workspace:^`. Their `exports` point at TypeScript source, which Next compiles with the site (`transpilePackages` in `next.config.ts`), so no package has to be built first.

```bash
pnpm install                              # at the repository root
pnpm --filter @automovie/website dev      # Next at http://localhost:3000/automovie/
pnpm --filter @automovie/website build    # checks, then the static export into out/
pnpm --filter @automovie/website test     # the site's tests
pnpm --filter @automovie/website typecheck
pnpm --filter @automovie/website run deploy   # build, then publish out/ to gh-pages by hand
```

Next loads the compiler API from the `typescript` package, which the native TypeScript 7 package does not export, so `typescript` is 5.9 in this package alone and `ttsc` finds the native compiler under the alias `typescript-native`. `typecheck` and `test` run on the native compiler like the rest of the workspace.

`build` first runs `check`: `build/imports.ts` refuses an import that reaches inside a package past its public entry, and `build/contrast.ts` refuses a colour token below its contrast bound. After the export, `build/bundles.ts` refuses a scene, object or landing page whose own chunks carry `@automovie/motions` or `@automovie/human`.

## Scenes

A scene is a record in `src/scenes/data/`: its cast, the archetypes it places, the composition each person performs, its takes and the issues it waits on. Add a scene by adding a record; no page changes. Whether it plays is read from the installed packages (`src/scenes/package/SceneStatus.ts`), so a scene written for pieces a release has not shipped plays on the release that ships them.

The browser computes every take. A view asks `src/takes/TakeClient.ts` for its take when it scrolls into the window, and the client runs `src/takes/package/TakeCompute.ts` in a pool of Web Workers that import the packages, so the page stays responsive while a take is planned and posed. The take comes back as each figure's bone placements and each prop's frame at 12 frames a second, the view poses the polygon man from them on the page's one WebGL renderer (`src/stage/SharedStage.ts`), and the page keeps the take until it is closed. The playground computes its composition through the same client.

A scene whose record sets `refusedUntil` to the issue that fixes it shows the packages' refusal in place of each refused take. A refusal of any other scene shows as an error in its view.

Three scripts look at a build through a headless Chromium, which `pnpm --filter @automovie/website exec playwright-core install chromium-headless-shell` downloads once:

```bash
pnpm --filter @automovie/website smoke                  # open each page of out/ and check that it runs
pnpm --filter @automovie/website run serve              # out/ at http://127.0.0.1:4173/automovie/
pnpm --filter @automovie/website run shots name=url ... # screenshots into the ignored .shots/
```

## Where things are

| Path | Holds |
| --- | --- |
| `src/content/` | The MDX pages and `_meta.ts`, which lists the navigation bar. Add a documentation page under `docs/`. |
| `src/app/` | The Next routes, the root layout, `tokens.css`, `global.css`, `scenes.css` (the scene pages and the player) and `pages.css` (the motion reference, the objects and the landing page). |
| `src/movies/` | One component per page. |
| `src/components/` | The pages' parts. They import no `@automovie/*` package. |
| `src/scenes/` | The scene records, their status, the track format and the player that draws a take. |
| `src/takes/` | The take worker and its client, the one path by which the scenes and the playground compute. |
| `src/motions/`, `src/human/`, `src/landing/`, `src/docs/` | The motion reference, the Human page's inspector, the landing page's data and the docs' grammar table. |
| `src/playground/`, `src/gallery/` | The playground's and the object pages' data types, addresses and adapters. |
| `src/stage/` | The shared renderer. |
| `test/features/` | The tests. |
| `build/` | The checks, the bundle check, the smoke test, the screenshot tools and the manual deploy (`deploy.ts`). |

Only the `package/` folders and the body parameters in `src/playground/data/` import the packages. The scene, object and landing pages run the motion code only in the take worker, never on their main thread.

[DESIGN.md](./DESIGN.md) states the layout, the visual system and the reasons for them.

## Deploy

`.github/workflows/website.yml` runs one job on pull requests that touch the site or a package it bundles, and on `master`: the type check, the tests, the build and the smoke test, then on `master` the deploy of `out/`. The `gh-pages` branch holds one commit that every deploy overwrites: `single-commit: true` in the workflow and `history: false` in `build/deploy.ts`, the manual route that `pnpm run deploy` takes from the current checkout.

GitHub Pages serves the site under `/automovie/`, which `basePath` in `next.config.ts` sets.
