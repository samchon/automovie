# AutoMovie

AutoMovie helps a coding agent turn a screenplay into TypeScript staging, motion and cameras that render repeatable 3D frames. Use it to render a 3D film or produce a motion hint for video diffusion. You bring the coding agent and any diffusion model you use.

## Start a production

Install Node.js 22.23.2 or later and pnpm. Run these commands from a directory where you keep projects.

```powershell
npx --yes automovie create my-film
Set-Location my-film
pnpm install
pnpm run dev
```

Open the printed inspector URL to see the starter. Open the production directory in your coding agent and describe the film and the decisions you want to keep. The agent reads `AGENTS.md`, records the scope in `PROJECT.md` and uses the installed skills to write and stage the film.

## Start a workspace

Use a workspace when productions share code, dependencies or instructions.

```powershell
npx --yes automovie create my-studio --workspace
Set-Location my-studio
pnpm install
pnpm automovie add shorts/my-film
pnpm install
```

Use `series/<name>` for a long production. Continue in the new production directory.

## Commands

Run production scripts from the directory with `PROJECT.md`.

| Script | Result |
| --- | --- |
| `pnpm run dev` | Play and seek a film in the inspector |
| `pnpm run capture` | Save stills and their capture record |
| `pnpm run render` | Export a film and its render report |

See the [production README](https://github.com/samchon/automovie/blob/master/packages/template/scaffold/production/README.md), [CLI reference](https://samchon.github.io/automovie/reference/cli/) and [example productions](https://github.com/samchon/automovie-examples).

## Packages

Use the CLI for a production or install the libraries you need in your own application.

| Package | Use |
| --- | --- |
| [`@automovie/interface`](https://github.com/samchon/automovie/tree/master/packages/interface) | Type models, motions and films |
| [`@automovie/engine`](https://github.com/samchon/automovie/tree/master/packages/engine) | Validate and evaluate scenes |
| [`@automovie/human`](https://github.com/samchon/automovie/tree/master/packages/human) | Build a person's rig and contact profile |
| [`@automovie/motions`](https://github.com/samchon/automovie/tree/master/packages/motions) | Compose and sample human actions |
| [`@automovie/archetypes`](https://github.com/samchon/automovie/tree/master/packages/archetypes) | Place props, supports and moving objects |
| [`@automovie/ingest`](https://github.com/samchon/automovie/tree/master/packages/ingest) | Decode external media |
| [`@automovie/recovery`](https://github.com/samchon/automovie/tree/master/packages/recovery) | Recover editable curves from a mesh |
| [`@automovie/render`](https://github.com/samchon/automovie/tree/master/packages/render) | Draw, capture and plan video export |
| [`@automovie/viewer`](https://github.com/samchon/automovie/tree/master/packages/viewer) | Play and inspect a film in a browser |
| [`@automovie/template`](https://github.com/samchon/automovie/tree/master/packages/template) | Generate project files from your own tool |
| [`@automovie/evidence`](https://github.com/samchon/automovie/tree/master/packages/evidence) | Configure production checklist checks |

Browse the [guide](https://samchon.github.io/automovie/docs/) and [API reference](https://samchon.github.io/automovie/api/).

## License

[MIT](https://github.com/samchon/automovie/blob/master/LICENSE).
