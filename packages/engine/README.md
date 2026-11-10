# @automovie/engine

The deterministic core of AutoMovie. It takes the authoring AST a coding agent writes with `@automovie/interface`, validates it, and computes what each frame contains: poses within range of motion, sampled motion, staging and cuts, physics, buildings, light and sound. The same input produces the same frames; [Physical performance](#physical-performance) states the one limit that has not been measured.

Drawing belongs to `@automovie/viewer`, and the host, the program that calls the engine, loads the assets and hands them over.

## Use

```bash
npm install @automovie/engine @automovie/interface
```

```ts
import { validateModel } from "@automovie/engine";
import type { IAutoMovieModel, IAutoMovieValidation } from "@automovie/interface";

declare const model: IAutoMovieModel;

const result: IAutoMovieValidation = validateModel({ model });
if (result.success === false)
  for (const violation of result.violations) console.error(violation);
```

Functions named `validate*` return a result that lists every violation with its field, which is what a coding agent needs to correct its own output. Compute and playback functions throw on malformed input instead.

## Where to look

Import from the package root. Units, limits and non-guarantees are in each function's JSDoc. The source is grouped by subject:

| Folder | Subject |
| --- | --- |
| `math`, `geometry`, `kinematics`, `skinning`, `rom`, `motion` | Vectors and quaternions, tessellation and lofted surfaces, skeletal kinematics, skinned vertices, range of motion, motion sampling |
| `perform`, `film`, `scene`, `resolve`, `composition` | Performance synthesis, staging with shots and edits, scene fog, resolving a scene's nodes and channels at an instant, and composing actions on one schedule |
| `physics`, `soft`, `fluid` | Rigid-body performance, soft bodies and bounded fluid solves |
| `architecture`, `space`, `service`, `drawing`, `analysis` | Buildings, spaces, service networks, drawings and environmental analyses |
| `render`, `effectRuntime`, `populationRuntime`, `sound`, `text` | Render facts and budgets, runtime effects and populations, sound and text |
| `validation`, `constants` | Input validation and shared constants |

Staging a film starts at `stageScene`, `performShot` and `cutSequence` in `film`.

## Physical performance

`AutoMoviePhysicalSimulation.compute` precomputes a physical performance, motion simulated by a rigid-body solver, through Rapier WASM, and `AutoMoviePhysicalPlayback` encodes the result into an archive that can be decoded and sampled later without loading WASM. Run the simulation in a build process or a Worker, not on a page's main thread. `npm run physics` in a generated production runs it under Node.

An archive is reproducible for the same inputs on the tested build and platform family; equality across machines has not been measured. The [measurement report](../../docs/campaigns/physical-performance.md) records the solver settings, measurements and known limits.
