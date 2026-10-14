# AutoMovie

**Coding-agent-native deterministic filmmaking.**

A user directs a coding agent in natural language; the agent authors assets and their performance in TypeScript against AutoMovie's public engine, and AutoMovie validates and renders them deterministically. It is the cheap, controllable, reproducible alternative to asking a diffusion model to invent a video: the same source always produces the same motion, staging, timing, camera, and media.

The output is a prototype that a director judges and a diffusion lane may repaint. There is no internal LLM and no authoring server: whatever an agent cannot reach by reading its project and running its code does not exist.

See it at [samchon.github.io/AutoMovie](https://samchon.github.io/AutoMovie/), where productions kept under [`experimental`](./experimental) are rendered from their authored source in the browser.

## Start a production

```bash
npx automovie start <directory>
cd <directory>
npm install --package-lock=false
npm run lint
npm run evidence
```

## Packages

| Package | Purpose |
| --- | --- |
| [`@automovie/interface`](./packages/interface) | The pure-type authoring AST an LLM emits |
| [`@automovie/engine`](./packages/engine) | Deterministic validation and computation of everything a frame needs |
| [`@automovie/archetypes`](./packages/archetypes) | The registrable catalogue of primitive archetypes and gait tables |
| [`@automovie/human`](./packages/human) | A human figure generated from typed parameters by code (being rebuilt) |
| [`@automovie/ingest`](./packages/ingest) | Deterministic import of glTF, GLB, VRM, and WAVE inputs |
| [`@automovie/viewer`](./packages/viewer) | Three.js display, capture, and inspection |
| [`@automovie/render`](./packages/render) | Frame, sequence, and video render planning |
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
