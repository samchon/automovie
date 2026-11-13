# @automovie/website

The public site at [samchon.github.io/automovie](https://samchon.github.io/automovie/), built with [Nextra](https://nextra.site). It has two application pages that run the workspace packages in the browser:

- `/playground`: compose actions of `@automovie/motions`, perform them on the polygon man, and read refusals, the timeline and the verdicts.
- `/gallery`: the polygon man and every archetype of `@automovie/archetypes`, with dimensions, affordances and articulations.

The package is private and is never published.

## Start

The site is a member of the pnpm workspace and depends on the packages as `workspace:^`. Their `exports` point at TypeScript source, which Next compiles with the site (`transpilePackages` in `next.config.ts`), so no package has to be built first.

```bash
pnpm install                              # at the repository root
pnpm --filter @automovie/website dev      # Next at http://localhost:3000/automovie/
pnpm --filter @automovie/website build    # checks, then the static export into out/
pnpm --filter @automovie/website test     # the site's tests
pnpm --filter @automovie/website typecheck
pnpm --filter @automovie/website run deploy   # build, then publish out/ to gh-pages
```

Next loads the compiler API from the `typescript` package, which the native TypeScript 7 package does not export, so `typescript` is 5.9 in this package alone and `ttsc` finds the native compiler under the alias `typescript-native`. `typecheck` and `test` run on the native compiler like the rest of the workspace.

`build` first runs `check`: `build/imports.ts` refuses an import that reaches inside a package past its public entry, and `build/contrast.ts` refuses a colour token below its contrast bound.

Three scripts look at a build through a headless Chromium, which `pnpm --filter @automovie/website exec playwright-core install chromium-headless-shell` downloads once:

```bash
pnpm --filter @automovie/website smoke                  # open each page of out/ and check that it runs
pnpm --filter @automovie/website run serve              # out/ at http://127.0.0.1:4173/automovie/
pnpm --filter @automovie/website run shots name=url ... # screenshots into the ignored .shots/
```

## Where things are

| Path | Holds |
| --- | --- |
| `src/content/` | The MDX pages and `_meta.ts`, which lists the pages of the navigation bar. Add a documentation page here. |
| `src/app/` | The Next routes, the root layout, `tokens.css` and `global.css`. |
| `src/movies/` | One component per application page. |
| `src/components/` | The pages' parts. They import no `@automovie/*` package. |
| `src/playground/`, `src/gallery/` | Each page's data types, its address format and its adapter. Only the `package/` folder inside each and the body parameters in `data/` import the packages. |
| `src/playground/data/` | The bodies and the presets. |
| `test/features/` | The tests. |
| `build/` | The checks, the smoke test, the screenshot tools and the manual deploy. |

[DESIGN.md](./DESIGN.md) states the layout, the visual system and the reasons for them.

## Deploy

`.github/workflows/website.yml` builds the site on pull requests that touch it or a package it bundles, and deploys `out/` from `master`. The `gh-pages` branch holds one commit that every deploy overwrites: `single-commit: true` in the workflow and `history: false` in `build/deploy.ts`.

GitHub Pages serves the site under `/automovie/`, which `basePath` in `next.config.ts` sets.
