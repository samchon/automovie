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

`realizeAutoMovieConvexSupportLoft` generates an open lateral mesh and its construction from fixed oriented XZ support planes with cubic metre offsets. Feasible triple-plane events preserve changes of boundary incidence; normals derive from each face equation and shared physical vertices retain separate normal fans. Supply plane, event, strip and vertex budgets. `faceChordBoundMeters` covers interpolation inside the numerical partition; `eventQualification` and `maximumBoundaryDefectMeters` separately disclose uncertified event isolation and boundary roundoff. `evaluateAutoMovieSupportSection` queries an admitted bounded section without tessellating it. Neither operation observes images or identifies hidden concavity.

For repeated sections with the same directions, `createAutoMovieSupportSectionQuery` copies and prepares the fixed normal pairs once. Its returned CPU query accepts fresh offsets without sharing results; a weak pair refuses only when feasible for that offset field. Release the caller-owned closure when its fixed directions are no longer needed.
