# @automovie/website

The public site at [samchon.github.io/automovie](https://samchon.github.io/automovie/), built with [Nextra](https://nextra.site). It says what AutoMovie does, documents how a production is written and checked, and catalogues what a performance is composed from.

| Route | Holds |
| --- | --- |
| `/` | The landing page: one scene followed from its brief to its frames |
| `/docs/` | The guide, for the person who makes a film: setup, the screenplay and its evidence graph, motion as code and delivery |
| `/reference/` | The reference, for a developer or a coding agent: the packages, the CLI, the evidence configuration and the motion API |
| `/api/` | The API reference of every library package (the `automovie` CLI is a program and is left out), which `pnpm run typedoc` generates with TypeDoc into `public/api/` before each build |
| `/scenes/`, `/scenes/<id>/` | The scene studies, and each study with its player, code, timeline and takes |
| `/motions/`, `/motions/<name>/` | The motion catalogue by category and family, and each motion with its take, the code that writes it and its API entry |
| `/archetypes/` | Every archetype of `@automovie/archetypes`, and one archetype's page with its specs and controls |
| `/playground/` | A composition with every parameter, performed in the page |
| `/objects/`, `/gallery/` | The archetypes' former addresses, which forward with their query |
| `/human/` | A former address, which forwards to the landing page |

The package is private and is never published.

## Start

The site is a member of the pnpm workspace and depends on the packages as `workspace:^`. Their `exports` point at TypeScript source, which Next compiles with the site (`transpilePackages` in `next.config.ts`), so no package has to be built first.

```bash
pnpm install                                  # at the repository root
pnpm --filter @automovie/website dev          # Next at http://localhost:3000/automovie/
pnpm --filter @automovie/website bake         # optional: the takes and stills, into public/baked/
pnpm --filter @automovie/website typedoc      # optional: the API reference, into public/api/
pnpm --filter @automovie/website build        # checks, TypeDoc, bake, then the static export into out/
pnpm --filter @automovie/website typecheck
pnpm --filter @automovie/website run deploy   # build, then publish out/ to gh-pages by hand
```

Next loads the compiler API from the `typescript` package, which the native TypeScript 7 package does not export, so `typescript` is 5.9 in this package alone, which TypeDoc also reads, and `ttsc` finds the native compiler under the alias `typescript-native`. `typecheck` runs on the native compiler like the rest of the workspace.

`build` first runs `check`: `build/imports.ts` refuses an import that reaches inside a package past its public entry, and `build/contrast.ts` refuses a colour token below its contrast bound. It then runs `typedoc`, which writes the API reference through a queue of open files so a reference this large does not exhaust them, and `bake`. After the export, `build/bundles.ts` refuses a page whose own chunks carry `@automovie/motions` or `@automovie/human`, and `pagefind` indexes the export for the search.

## Baked takes

`bake` computes the first take of every listed scene that plays and every motion that can be tried alone, as the take worker would, and writes each gzipped take and its still into `public/baked/`, with `manifest.json` listing them. A page plays a baked take at once and shows its still on a card; a take that was not baked is computed in the page's take worker instead, and a card shows a blank still. `dev` needs neither `bake` nor `typedoc`: run `bake` to see the baked takes, and run it again after changing a scene, since a bake left from before the change still plays the old take.

A take depends only on its composition and the packages' sources, so each is kept in `.bake-cache/` under a hash of both and computed again only when one changes. Missing takes are computed in parallel child processes, one per CPU less one unless `--jobs <n>` is given. The run exits 1 when the packages refuse a scene that plays. CI keeps `.bake-cache/` between runs.

## Scenes

A scene is a record in `src/scenes/data/`: its cast, the archetypes it places, the composition each person performs, its takes and the issues it waits on. Add a scene by adding a record; no page changes. Whether it plays is read from the installed packages (`src/scenes/package/SceneStatus.ts`), so a scene written for pieces a release has not shipped plays on the release that ships them. A scene whose record sets `refusedUntil` to the issue that fixes it shows the packages' refusal on its page and stays out of the gallery's grid.

The browser draws a take on the page's one WebGL renderer (`src/stage/SharedStage.ts`). Takes other than a scene's first, and the playground's compositions, are computed by `src/takes/TakeClient.ts` in a pool of Web Workers that import the packages, so the page stays responsive while a take is planned and posed.

Shared compositions preserve authored impulses as well as actions and objects, so opening a link applies the same force in the take worker and shows it in the scene's code. Links with impulses use format version 3; existing version 1 and 2 links remain readable.

## Looking at a build

Four scripts look at the site through a headless Chromium, which `pnpm --filter @automovie/website exec playwright-core install chromium-headless-shell` downloads once:

```bash
pnpm --filter @automovie/website smoke                  # open each case of out/ and check that it runs
pnpm --filter @automovie/website run serve              # out/ at http://127.0.0.1:4173/automovie/
pnpm --filter @automovie/website run shots name=url ... # screenshots into the ignored .shots/
pnpm --filter @automovie/website run posters            # the baked stills on one contact sheet
```

`shots` takes `--width`, `--height`, `--dark`, `--reduced`, `--full` and `--scroll`, which scrolls a page to its end first so what it reveals on scrolling is drawn.

`pnpm --filter @automovie/website scenes` needs no browser and no build. It plays every take of the everyday, work and passenger scenes in Node the way the take worker does, then checks their displayed contacts, props and refusals (`build/scenes.ts`). CI runs it after the smoke test.

## Where things are

| Path | Holds |
| --- | --- |
| `src/content/` | The MDX pages and `_meta.ts`, which lists the navigation bar: the guide under `docs/` and the reference under `reference/`. |
| `src/app/` | The Next routes, the root layout and the stylesheets over `tokens.css`, one per part of the site, as [DESIGN.md](./DESIGN.md) lists them. |
| `src/landing/` | The landing page and the scene, documents and rail it shows. |
| `src/baked/` | The baked take's format, the stills, the manifest reader, the jobs and the page's client. |
| `src/movies/` | One component per page. |
| `src/components/` | The pages' parts. They import no `@automovie/*` package. |
| `src/scenes/`, `src/takes/` | The scene records, their status and player, and the take worker with its client. |
| `src/motions/`, `src/gallery/`, `src/playground/` | The motion catalogue's data, the archetypes' data and the playground's addresses and adapters. |
| `src/stage/` | The shared renderer. |
| `build/` | The checks, the bake, the bundle check, the smoke test, the screenshot tools and the manual deploy. |

Only the `package/` folders, the body parameters in `src/playground/data/` and `src/baked/PropShapes.ts` load the packages at runtime; composition types may refer to their public types with erased imports. The scene, motion, archetype and landing pages run the motion code only in the take worker, never on their main thread.

[DESIGN.md](./DESIGN.md) states the layout, the visual system and the reasons for them, and the [website skill](../.agents/skills/website/SKILL.md) what the site says and how a change is verified.

## Deploy

`.github/workflows/website.yml` runs one job on pull requests that touch the site or a package it bundles, and on `master`: the type check, the build and the smoke test, then on `master` the deploy of `out/`. The `gh-pages` branch holds one commit that every deploy overwrites: `single-commit: true` in the workflow and `history: false` in `build/deploy.ts`, the manual route that `pnpm run deploy` takes from the current checkout.

GitHub Pages serves the site under `/automovie/`, which `basePath` in `next.config.ts` sets.
