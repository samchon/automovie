# AutoMovie

**LLM-authored screenplays and reproducible motion hints for video diffusion.**

A user directs an LLM in natural language. The agent writes the film's screenplay, then authors the staging, motion and camera needed to convey it. AutoMovie's deterministic engine makes those choices reproducible and inspectable. The production can deliver the whole motion-video hint or use its chosen diffusion workflow for finished imagery.

Stick figures and coarse meshes can carry the hint. Their performance, contacts, trajectories, reactions and timing must express the intended action accurately; surface detail follows the shot's needs and budget. Human is an optional way to express character information. Important objects may need only an approximate frame, while objects unnecessary to the conditioning can stay in the screenplay's description.

Productions can combine code-authored geometry, fixed images and imported or generated meshes. Use an existing asset directly when it has the needed controls. When deformation or code control requires an editable construction, Recovery provides supported paths toward saved curves and reconstructed geometry. Fixed images can supply appearance references or supported control inputs; multiview generation and image-to-3D services are optional routes for detail a shot actually needs. Package documentation defines their supported inputs and limits.

The scaffold's skills guide the agent through settings → treatments → scripts → final audiovisual screenplay for long work, including expression revision, evidence and independent review. A short video can start directly at final screenplay. A film-generation hint programs motion and staging for the main scenes and assembles the whole video; stills and isolated clips support that work without replacing it. A screenplay-only request can end at text. A requested finished video can use direct 3D rendering or the chosen diffusion workflow. Start with low-cost instances and verified motion, then upgrade selected objects through code options within the production budget. When a generator is selected, verify its actual input compatibility; a good hint does not guarantee the generated film's quality.

Record adopted production choices in the generated project-root `PROJECT.md`; keep creative writing instructions under `docs/instructions`. Production choices include output route, representation, providers or local tools, and authorized setup. Keep run instructions in the production README, required environment names in `.env.example`, and secrets in a Git-ignored `.env`. Use the selected tool's existing interface; add integration source only where the production needs it.

There is no internal LLM or authoring server. Use your chosen coding agent, media providers and production host; generation produces fixed inputs with provenance outside deterministic replay.

Explore the architectural examples at [samchon.github.io/AutoMovie](https://samchon.github.io/AutoMovie/), rendered from their authored production source under [`experimental`](./experimental). These examples demonstrate assets and their inspection; they do not establish an end-to-end film delivery.

## Start a production

Use Node.js 22.23.2 or later.

```bash
npx automovie start <directory>
cd <directory>
npm install --package-lock=false
npm run lint
npm run evidence
npm test
```

Open the generated directory in your coding agent and give it the intended production request. `AGENTS.md` routes eight skills; `PROJECT.md` records the adopted scope and choices. Follow the [production workflow](./packages/template/scaffold/README.md#make-a-motion-hint) from screenplay through programmed staging, any required companion controls, the actual host and whole edit, and delivery review. The blank scaffold supplies instructions, configuration and package dependencies; it contains no film, viewer host or media provider. Its initial checks validate that empty harness and produce no movie. As the production is authored, its README records the actual execution and delivery commands.

## Packages

| Package | Purpose |
| --- | --- |
| [`@automovie/interface`](./packages/interface) | The pure-type authoring AST an LLM emits |
| [`@automovie/engine`](./packages/engine) | Deterministic validation and computation of everything a frame needs |
| [`@automovie/archetypes`](./packages/archetypes) | Typed producers of shipped model groups and the humanoid gait tables |
| [`@automovie/human`](./packages/human) | A human figure generated from typed parameters by code (being rebuilt) |
| [`@automovie/ingest`](./packages/ingest) | Deterministic import of glTF, GLB, VRM, and WAVE inputs |
| [`@automovie/recovery`](./packages/recovery) | Registered-mesh observation, saved-curve reconstruction, and immutable artifact hosts |
| [`@automovie/viewer`](./packages/viewer) | Three.js display, capture, and inspection |
| [`@automovie/render`](./packages/render) | Frame/edit planning and orchestration through host-supplied capture and encoding adapters |
| [`@automovie/evidence`](./packages/evidence) | Engineering evidence defaults and optional narrative lifecycle checking |
| [`@automovie/template`](./packages/template) | The scaffold every production starts from |
| [`automovie`](./packages/cli) | The CLI that installs the scaffold |
| [`@automovie/playground`](./packages/playground) | Browser demonstrations of engine motion, film, and physics |

## Repository development

Node.js 22.23.2 or newer and pnpm 10.

```bash
pnpm install
pnpm run build
pnpm run evidence
pnpm run test
```

`pnpm --filter @automovie/playground dev` runs the playground, and `pnpm --filter @automovie/website dev` runs the website that `.github/workflows/website.yml` publishes to GitHub Pages from `master`.

## License

[MIT](./LICENSE)
