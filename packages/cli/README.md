# automovie

`automovie` installs the AutoMovie scaffold into a new production repository.

```text
npx automovie start <directory> [--force]
npx automovie sync <directory> [--check] [--baseline <directory>]
```

`start` takes exactly one target directory and refuses a non-empty one unless `--force` is given. Help (`-h`, `--help`) and version (`-v`, `--version`) are standalone requests. Every other argument is refused before anything is written. Dependency versions come from the template package's resolved catalog, not from the invoking workspace.

Package upgrades leave installed files untouched. Explicit `sync` updates only `AGENTS.md`, `CLAUDE.md`, bundled non-contract skill resources and their retained license. Contracts, custom skills absent from the bundle, `PROJECT.md`, README, configuration, source, creative bodies and proof remain project-owned. `--check` writes nothing and exits 1 when changes or conflicts remain. New projects store their generated instruction digests in `.automovie/scaffold-state.json`; differing existing files without that state require a verified previous adopted instruction root through `--baseline`. Local changes conflict before any write. Retired generated paths are reported and retained for explicit retirement, never silently deleted. Publication retains completed or partial effects on failure and advances state only after the instruction writes succeed. The [scaffold README](../template/scaffold/README.md) lists the generated project's commands.

## API

The package exports `run`, the argument parser `readAutoMovieCommandArguments`, the project-name rule `deriveAutoMovieProjectName`, and the next-step text `renderAutoMovieScaffoldNextSteps`.

## Development checks

`pnpm run build` compiles with source correctness lint and the shared evidence declaration guards. `pnpm run evidence` checks the declarations' checklist answers with `@wrtnlabs/evidence`.
