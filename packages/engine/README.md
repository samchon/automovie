# @automovie/engine

The deterministic core of AutoMovie. It validates what an authoring agent declares and computes everything a frame needs from it: kinematics and range of motion, motion sampling and performance, staging and film grammar, physics, soft bodies and fluids, buildings and drawings, light and sound, and the analyses productions run over them. The same inputs always produce the same frames.

The engine owns computation and admission, not appearance: it imports no renderer, and `interface` owns the types it reads and writes.

## Use

```bash
npm install @automovie/engine
```

```ts
import { stageScene, performShot, cutSequence } from "@automovie/engine";
```

Every public function takes typed records and returns either a result or a violation list naming the field, the rule, and the correction; nothing is read from disk or the network.

## Domains

| Folder | Owns |
| --- | --- |
| `math`, `geometry`, `kinematics`, `skinning`, `rom`, `motion` | Vectors and quaternions, tessellation and subdivision surfaces, skeletal kinematics, skinned and morphed vertices, range of motion, motion sampling |
| `perform`, `film`, `scene`, `resolve` | Performance synthesis, staging, blocking, shots, edits, and film grammar |
| `physics`, `soft`, `fluid` | Rigid impacts, soft bodies, and bounded fluid solves |
| `architecture`, `space`, `service`, `drawing`, `analysis` | Built environments, spaces, service networks, drawings, and environmental analyses |
| `render`, `effectRuntime`, `populationRuntime`, `sound`, `text` | Render facts, runtime effects and populations, sound and text |
| `validation`, `constants` | Shared admission and constants |

`createAutoMovieEllipticLoftAtlas` in `geometry` converts ordered cubic centre/radius profiles into an open shared bicubic atlas in metres. Four tangent-matching cubic quarter arcs approximate each ellipse, with a separate radial deviation bound of `0.000273 * maximumRadius`; atlas tessellation has its own tolerance and budgets. Adjacent spans share exact endpoint coefficients and retain independent normal limits at C0 creases. The producer performs no image fitting and adds no end caps.
