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
pnpm --filter @automovie/website bake     # compute the scenes' takes into public/baked/
pnpm --filter @automovie/website dev      # Next at http://localhost:3000/automovie/
pnpm --filter @automovie/website build    # checks, the bake, then the static export into out/
pnpm --filter @automovie/website test     # the site's tests
pnpm --filter @automovie/website typecheck
```

Next loads the compiler API from the `typescript` package, which the native TypeScript 7 package does not export, so `typescript` is 5.9 in this package alone and `ttsc` finds the native compiler under the alias `typescript-native`. `typecheck` and `test` run on the native compiler like the rest of the workspace.

`build` first runs `check`: `build/imports.ts` refuses an import that reaches inside a package past its public entry, and `build/contrast.ts` refuses a colour token below its contrast bound.

## Scenes and the bake

A scene is a record in `src/scenes/data/`: its cast, the archetypes it places, the composition each person performs, its takes and the issues it waits on. Add a scene by adding a record; no page changes. Whether it plays is read from the installed packages (`src/scenes/package/SceneStatus.ts`), so a scene written for pieces a release has not shipped plays on the release that ships them.

A pose costs tens of milliseconds and a take's plan seconds, so the pages do not compute motion. `build/bake.ts` computes every take of every scene that plays with the packages, as the playground does, and writes each figure's bone placements and each prop's frame at 12 frames a second into the ignored `public/baked/`. The pages pose the polygon man from those numbers on one shared WebGL renderer (`src/stage/SharedStage.ts`).

```bash
pnpm --filter @automovie/website bake --check            # plan each scene once and list every refusal
pnpm --filter @automovie/website bake --only meeting     # bake one scene
pnpm --filter @automovie/website bake --jobs 4           # in four processes
```

A take whose inputs have not changed keeps its file. A take the packages refuse stops the bake with the scene and the refusal, after every share has reported.

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
| `src/app/` | The Next routes, the root layout, `tokens.css`, `global.css` and `scenes.css`. |
| `src/movies/` | One component per page. |
| `src/components/` | The pages' parts. They import no `@automovie/*` package. |
| `src/scenes/` | The scene records, their status, the baked format and its player. |
| `src/motions/`, `src/human/`, `src/landing/` | The motion reference, the Human page's inspector and the landing page's data. |
| `src/playground/`, `src/gallery/` | The playground's and the object pages' data types, addresses and adapters. |
| `src/stage/` | The shared renderer. |
| `test/features/` | The tests. |
| `build/` | The bake, the checks, the smoke test and the screenshot tools. |

Only the `package/` folders and the body parameters in `src/playground/data/` import the packages, and pages load them only where they compute, so the scene, object and landing pages carry no motion code.

[DESIGN.md](./DESIGN.md) states the layout, the visual system and the reasons for them.

## Deploy

`.github/workflows/website.yml` bakes the scenes in six shares on six runners, each share kept in a cache keyed by everything a take is computed from, then joins them, builds the site on pull requests that touch it or a package it bundles, and deploys `out/` from `master`. The `gh-pages` branch holds one commit that every deploy overwrites (`single-commit: true`).

GitHub Pages serves the site under `/automovie/`, which `basePath` in `next.config.ts` sets.
