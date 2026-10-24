# AutoMovie

**Deterministic motion and staging that a diffusion model repaints into video.**

A user directs a coding agent in natural language; the agent authors figures, props, motion, staging and camera in TypeScript against AutoMovie's public engine, and AutoMovie validates and renders them deterministically. The render is the hint a diffusion model repaints into the final video. It fixes who stands where, how they move, when, and from which camera, which a diffusion model left alone invents differently on every run. The same source always produces the same frames.

Figures range from stick figures to a human generated from measurements, all on one shared skeleton, so motion authored and reviewed on a stick figure carries over unchanged when the figure is upgraded. A realistic, detailed person leaves diffusion less room to distort faces and hands, and serves as the reference that judges the repainted frame. The engine's physics computes hits, impacts, recoil and projectile paths, so they follow from the motion instead of being drawn by hand.

There is no internal LLM and no authoring server: whatever an agent cannot reach by reading its project and running its code does not exist.

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
| [`@automovie/archetypes`](./packages/archetypes) | Typed producers of shipped model groups and the humanoid gait tables |
| [`@automovie/human`](./packages/human) | A human figure generated from typed parameters by code (being rebuilt) |
| [`@automovie/ingest`](./packages/ingest) | Deterministic import of glTF, GLB, VRM, and WAVE inputs |
| [`@automovie/recovery`](./packages/recovery) | Registered-mesh observation, saved-curve reconstruction, and immutable artifact hosts |
| [`@automovie/viewer`](./packages/viewer) | Three.js display, capture, and inspection |
| [`@automovie/render`](./packages/render) | Frame, sequence, and video render planning |
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
