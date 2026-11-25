# {{name}}

An AutoMovie production for staging and rendering a screenplay as a 3D film or motion hint.

## First run

Use Node.js 22.23.2 or later and pnpm. If this production belongs to a workspace, run the install at the workspace root and return here to start the inspector.

```powershell
pnpm install
pnpm run dev
```

Open the printed URL. The `starter` subject is an empty film for checking that the inspector starts.

## Make a motion hint

Open this directory in your coding agent and record the scope in [`PROJECT.md`](PROJECT.md). Follow the [production workflow]({{skills}}/production/workflow.md) to write the screenplay, stage its scenes and assemble the film. Register each film in [`src/composition/films/index.ts`](src/composition/films/index.ts) so the inspector, capture and render share the same subjects.

Install the capture browser and recorder once, then capture a still from the starter.

```powershell
pnpm run review:setup
pnpm run capture --subject starter --at 2
```

Use your film's subject name when it is ready. Capture writes stills and `record.json` under `media/capture/<film>/`. Run `pnpm run render --subject <film>` to write `film.mp4` and `render-report.json` under `media/automovie/<film>/videos/`.

## Checks

| Command | Purpose |
| --- | --- |
| `pnpm run lint` | Check source and types |
| `pnpm test` | Run the exported tests |
| `pnpm run evidence` | Check the production's configured checklists |
| `pnpm run verify --subject <id>` | Read the current checks for an asset, motion case or film |

Consult the [CLI reference](https://samchon.github.io/automovie/reference/cli/) for capture options and the [delivery review]({{skills}}/review/delivery-review.md) for film acceptance. See the [source layout]({{skills}}/development/source-layout.md) for where to put entities, actions and scenes.
