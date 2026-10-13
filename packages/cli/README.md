# automovie

`automovie` installs the AutoMovie scaffold into a new production repository.

```text
npx automovie start <directory> [--force]
```

`start` takes exactly one target directory and refuses a non-empty one unless `--force` is given. Help (`-h`, `--help`) and version (`-v`, `--version`) are standalone requests. Every other argument is refused before anything is written. Dependency versions come from the template package's resolved catalog, not from the invoking workspace.

Installation is one-way: the installed files belong to the project, and the CLI never upgrades them. The [scaffold README](../template/scaffold/README.md) lists the generated project's commands.

## API

The package exports `run`, the argument parser `readAutoMovieCommandArguments`, the project-name rule `deriveAutoMovieProjectName`, and the next-step text `renderAutoMovieScaffoldNextSteps`.

## Development checks

`pnpm run build` compiles with source correctness lint. `pnpm run evidence` checks the declarations' checklist answers with `@wrtnlabs/evidence`, then runs the native source evidence guards.
