# @automovie/engine

The deterministic core of AutoMovie. It takes the typed declarations a coding agent writes with `@automovie/interface`, validates them, and computes what each frame contains: poses within range of motion, sampled motion, staging and cuts, physics, buildings, light and sound. The same input produces the same frames; [Physical performance](#physical-performance) states the one limit that has not been measured.

The engine draws nothing and reads no files. `@automovie/viewer` displays its output, and loading assets is the host's job.

## Use

```bash
npm install @automovie/engine
```

```ts
import { validateModel } from "@automovie/engine";
import type { IAutoMovieModel, IAutoMovieValidation } from "@automovie/interface";

declare const model: IAutoMovieModel;

const result: IAutoMovieValidation = validateModel({ model });
if (result.success === false)
  for (const violation of result.violations) console.error(violation);
```

Functions named `validate*` return a result that lists every violation with its field, which is what an agent needs to correct its own output. Compute and playback functions throw on malformed input instead.

## Finding things

Import from the package root. Each function's JSDoc states its units, limits and what it does not guarantee, and the source folders show where a subject lives:

| Folder | Owns |
| --- | --- |
| `math`, `geometry`, `kinematics`, `skinning`, `rom`, `motion` | Vectors and quaternions, tessellation and lofted surfaces, skeletal kinematics, skinned vertices, range of motion, motion sampling |
| `perform`, `film`, `scene`, `resolve`, `composition` | Performance synthesis, staging, shots and edits, and composing actions on one schedule |
| `physics`, `soft`, `fluid` | Rigid-body performance, soft bodies and bounded fluid solves |
| `architecture`, `space`, `service`, `drawing`, `analysis` | Buildings, spaces, service networks, drawings and environmental analyses |
| `render`, `effectRuntime`, `populationRuntime`, `sound`, `text` | Render facts and budgets, runtime effects and populations, sound and text |
| `validation`, `constants` | Input validation and shared constants |

Staging a film starts at `stageScene`, `performShot` and `cutSequence` in `film`.

## Physical performance

`AutoMoviePhysicalSimulation.compute` precomputes a physical performance through Rapier 0.21.0 WASM, and `AutoMoviePhysicalPlayback` encodes the result into an archive that can be decoded and sampled later without loading WASM. Run the simulation in a build process or a Worker, not on a page's main thread. The generated production's `physics` command is the Node entry point for it.

A cached result is reproducible for the same inputs on the tested build and platform family; equality across machines has not been measured. The [campaign report](../../docs/campaigns/physical-performance.md) records the solver settings, measurements and known limits.
