# @automovie/template

The scaffold every AutoMovie production starts from, together with the functions that render it and write it to disk. Most people reach it through the [`automovie` CLI](../../README.md#commands). Use this package directly when your own tool has to install or update a scaffold.

## Use

```bash
npm install @automovie/template
```

```ts
import { renderScaffold, writeFiles } from "@automovie/template";

const written: string[] = writeFiles("my-film", renderScaffold({ name: "my-film" }));
```

## Rendering a scaffold

A renderer returns a `{ path: content }` map and writes nothing. The map is the same for the same name and package version.

| Renderer | Produces |
| --- | --- |
| `renderScaffold` | A single production in its own repository |
| `renderWorkspaceScaffold` | A pnpm workspace root with shared instructions and dependency catalogs |
| `renderWorkspaceProductionScaffold` | One production for `movies/<shorts\|series>/<name>` inside such a workspace |
| `renderScaffoldInstructions` | Only the instruction files: `AGENTS.md`, `CLAUDE.md` and `.agents/skills` |

## Writing it to disk

`writeFiles(location, files, options)` writes a rendered map and returns the paths written, or throws `ScaffoldPublicationError`. `publishFiles` takes the same arguments and returns a receipt instead: every completed file and the first one that did not complete. Both refuse a non-empty directory unless `force` is set, and neither deletes or rolls back what was already written when a later file fails.

## Updating an installed project

An installed project changes only through sync, never through a package upgrade. `planScaffoldSync({ location, baseline? })` compares a project's instruction files with the current bundle, and `syncScaffold` applies that plan when it has no conflict; with `check: true` it only reports. Sync rewrites `AGENTS.md`, `CLAUDE.md` and the bundled skill files, never the contracts (the checklists a production answers), configuration, source or written content. A file edited locally is a conflict, and a conflict stops every write. The CLI exposes this as `automovie sync`.

## What the scaffold contains

The scaffold contains instructions for the coding agent (`AGENTS.md`, `CLAUDE.md` and the skills), an `evidence.config.ts` and `lint.config.ts`, a `PROJECT.md` for the choices a production adopts, a test runner with the tests of the bundled tooling, and Node tooling under `src/executable`. It ships no film content. The generated [README](./scaffold/production/README.md#make-a-motion-hint) is the user's guide to the workflow and commands.
