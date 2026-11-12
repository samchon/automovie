# {{name}}

An AutoMovie workspace: several productions share one set of skills and contracts, one AutoMovie release and the workspace's own packages. Each production turns an LLM-authored screenplay into a reproducible motion hint, as its own README describes.

## Layout

| Path | Owner |
| --- | --- |
| `AGENTS.md`, `CLAUDE.md`, `.agents/skills` | Skills and bundled contracts every production follows |
| `movies/shorts/<name>` | A short production, written brief → screenplay |
| `movies/series/<name>` | A long production, written settings → treatments → scripts → screenplay |
| `packages/<name>` | The workspace's own libraries that several productions import |
| `pnpm-workspace.yaml` | Workspace members and the named `catalogs` of versions every production uses through `catalog:<name>` |

A production is the directory holding its `PROJECT.md`, `README.md`, `src`, `test`, `docs` and configuration; its commands run there. A production's own work and language contracts live in its `docs/contracts`.

## First run

Use Node.js 22.23.2 or later with pnpm.

```bash
pnpm install
pnpm automovie add shorts/<name>
pnpm install
```

`pnpm automovie add shorts/<name>` or `pnpm automovie add series/<name>` creates `movies/shorts/<name>` or `movies/series/<name>` from the installed AutoMovie scaffold, naming its package after `<name>`, lowercased and npm-safe, unless `--name <package>` is given; run it here, at the workspace root. The second `pnpm install` links the new production. Then follow that production's README.

## Packages

Put code that several productions share in `packages/<name>` as an ordinary pnpm package with its own `package.json`, and depend on it from a production with `"<package>": "workspace:^"`. Code serving one production stays in that production.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm lint` | Every member's `lint` |
| `pnpm evidence` | Every member's `evidence` |
| `pnpm test` | Every member's `test` |
| `pnpm --filter <name> <script>` | One member's script, such as `pnpm --filter <name> dev` |
