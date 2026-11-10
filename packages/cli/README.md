# automovie

`automovie` installs the AutoMovie scaffold as a single production repository or a pnpm workspace of productions.

```text
npx automovie create <directory> [--workspace] [--name <name>] [--force]
pnpm automovie add <shorts|series>/<name> [--name <name>] [--force]
npx automovie sync <directory> [--check] [--baseline <directory>]
```

`create` takes exactly one target directory. It installs a single production, or with `--workspace` a pnpm workspace root: shared `AGENTS.md`, `CLAUDE.md` and `.agents/skills`, a `pnpm-workspace.yaml` whose members are `movies/shorts/*`, `movies/series/*` and `packages/*` and whose named `catalogs` (`automovie`, `samchon`, `three`, `media` and the rest, with one anchor per release group) pin every production dependency, and a root `package.json` with `automovie` as a development dependency. The package name is `--name`, else derived from the target's directory name; for the current directory itself, such as `.`, an interactive terminal is asked and offers `automovie-examples`, which is used without asking when no terminal is attached.

`add` runs at a workspace root, the working directory, which must hold `pnpm-workspace.yaml`; it never searches for one. `add shorts/<name>` or `add series/<name>` writes a production into `movies/shorts/<name>` or `movies/series/<name>` with `catalog:<name>` dependencies, evidence and links reaching the root's shared skills, and no instruction copy. Its package name is `--name`, else derived from `<name>` as `create` derives one, lowercase and npm-safe. Shorts run settings → screenplay and series the whole long route.

`create` and `add` refuse a non-empty target unless `--force` is given, which also replaces same-path ordinary files. Help (`-h`, `--help`) and version (`-v`, `--version`) are standalone requests. Every other argument is refused before anything is written.

Package upgrades leave installed files untouched. Explicit `sync`, run on a single production or a workspace root, updates only `AGENTS.md`, `CLAUDE.md`, bundled non-contract skill resources and their retained license. Contracts, custom skills absent from the bundle, `PROJECT.md`, README, configuration, source, creative bodies and proof remain project-owned. `--check` writes nothing and exits 1 when changes or conflicts remain. New projects store their generated instruction digests in `.automovie/scaffold-state.json`; differing existing files without that state require a verified previous adopted instruction root through `--baseline`. An explicit `--baseline` governs over the stored digests for every file it supplies, so it also resolves files that are verbatim older editions the stored state never recorded. Local changes conflict before any write. Retired generated paths are reported and retained for explicit retirement, never silently deleted. Publication retains completed or partial effects on failure and advances state only after the instruction writes succeed. The [scaffold README](../template/scaffold/production/README.md) lists the generated project's commands.

## API

The package exports `run`, the argument parser `readAutoMovieCommandArguments` with its per-command grammars, the name rules `deriveAutoMovieProjectName` and `selectAutoMovieProjectName` with `AUTOMOVIE_DEFAULT_PROJECT_NAME` and the terminal prompt, and the next-step text `renderAutoMovieScaffoldNextSteps`.

## Development checks

`pnpm run build` compiles with source correctness lint and the shared evidence declaration guards. `pnpm run evidence` checks the declarations' checklist answers with `@wrtnlabs/evidence`.
