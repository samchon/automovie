# automovie

The command that starts an AutoMovie production. It installs the scaffold a coding agent works in: instructions, configuration and package dependencies, with no film content.

```text
npx automovie create <directory> [--workspace] [--name <name>] [--force]
pnpm automovie add <shorts|series>/<name> [--name <name>] [--force]
npx automovie sync <directory> [--check] [--baseline <directory>]
```

The smallest use is `npx automovie create my-film`.

A generated production needs Node.js 22.23.2 or later, and a workspace also needs pnpm. The commands of the generated production are in its [README](../template/scaffold/production/README.md).

## `create`

`create` takes one target directory and installs a single production there. With `--workspace` it installs a pnpm workspace root instead: one shared `AGENTS.md`, `CLAUDE.md` and `.agents/skills`, and a `pnpm-workspace.yaml` whose members are `movies/shorts/*`, `movies/series/*` and `packages/*` and whose catalogs pin every production dependency.

The package name is `--name` when given and otherwise comes from the directory name. For the current directory (`create .`) the command asks for a name and offers `automovie-examples`, which it uses without asking when no terminal is attached.

## `add`

Run `add` from a workspace root, the directory that holds `pnpm-workspace.yaml`. It does not search parent directories. `add shorts/<name>` writes a production into `movies/shorts/<name>`, and `add series/<name>` into `movies/series/<name>`. A short is written as a brief and then the screenplay; a series is written in four layers: settings, treatments, scripts and screenplay. The new production takes its dependencies from the root's catalogs and its skills from the root's `.agents/skills`, so it gets no instruction copy of its own. `--name` sets the package name as in `create`.

## `sync`

Upgrading `automovie` never changes an installed project. `sync` is the explicit update, run on a single production or a workspace root. It rewrites `AGENTS.md`, `CLAUDE.md` and the bundled skill files, except the contracts, the checklists a production's code and writing answer. Contracts, your own skills, `PROJECT.md`, the README, configuration, source and written content stay as they are.

- `--check` writes nothing and exits 1 when updates or conflicts remain.
- `--baseline <directory>` names the instruction files the project was installed from. It is required when files differ and the project has no `.automovie/scaffold-state.json`, and it takes precedence over that state for the files it holds.

An instruction file you edited locally is reported as a conflict, and nothing is written until it is resolved. Resolve it by restoring the file and keeping your edit in a skill of your own, then run `sync` again. Instruction files that the new scaffold no longer ships are reported and kept.

## Other options

`create` and `add` refuse a non-empty target unless `--force` is given. With `--force`, files at the same paths are replaced.

`-h`, `--help`, `-v` and `--version` must each be the only argument. Any unknown command or option is refused before anything is written.
