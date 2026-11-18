# @automovie/template

The scaffold every AutoMovie production starts from. Most people reach it through the [`automovie` CLI](../../README.md#commands). Use this package directly when your own tool has to create a production.

## Use

```bash
pnpm add @automovie/template
```

```ts
import { createAutoMovieScaffold } from "@automovie/template";

const files: Record<string, string> = createAutoMovieScaffold({
  kind: "production",
  name: "my-film",
});
```

`createAutoMovieScaffold` returns a `{ path: content }` map and writes nothing; the caller writes it. `kind` selects what it creates:

| Kind | Creates |
| --- | --- |
| `production` | A single production in its own pnpm repository |
| `workspace` | A pnpm workspace root for `movies/shorts/*`, `movies/series/*` and `packages/*`, with the shared instructions |
| `workspace-production` | One production for `movies/<shorts\|series>/<name>` inside such a workspace |

Every dependency is a `catalog:` reference resolved by the generated `pnpm-workspace.yaml`: the AutoMovie packages at this package's own version, and the rest at the ranges this repository builds with.

When adding a production to an existing workspace, pass its directory and current YAML to `renderAutoMovieWorkspace({ directory, source })`. It returns the completed `pnpm-workspace.yaml`, preserving existing pins and overrides. A missing SDK package can resolve beside a linked package in a local SDK checkout.

## What the scaffold contains

The scaffold contains instructions for the coding agent (`AGENTS.md`, `CLAUDE.md` and the skills), an `evidence.config.ts` and `lint.config.ts`, a `PROJECT.md` for the choices a production adopts, a test runner with the tests of the bundled tooling, and Node tooling under `src/executable`. It ships no film content. The generated [README](./scaffold/production/README.md#make-a-motion-hint) is the user's guide to the workflow and commands.
