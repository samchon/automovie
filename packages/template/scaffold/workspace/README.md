# {{name}}

An AutoMovie workspace for productions that share instructions, package versions and code.

## Add a production

Use Node.js 22.23.2 or later and pnpm. Run these commands from the workspace root.

```powershell
pnpm install
pnpm automovie add shorts/my-film
pnpm install
```

Use `series/<name>` for a long production. The add command creates `movies/shorts/my-film` and fills missing catalog entries in `pnpm-workspace.yaml`, keeping existing pins. Open the new directory and follow its README. Its own commands run from the directory with `PROJECT.md`.

## Share code

Put libraries several productions use under `packages/` and declare them in each consumer with a `workspace:^` dependency. Keep shared agent instructions at this root in [`AGENTS.md`](AGENTS.md) and `.agents/skills/`.

From the root, run `pnpm lint` or `pnpm test` to check all workspace members. Use `pnpm --filter <name> <script>` for one member.
