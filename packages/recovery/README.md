# @automovie/recovery

Recovers curves from a reference triangle mesh, saves them as a curve artifact, and generates new geometry from that artifact alone. Use it when an imported or generated mesh has to become something code can deform or drive by parameters. A mesh that is usable as supplied does not need it.

Reconstruction reads no original mesh positions, faces or normals: the generated surface and its construction lines both come from the recovered curves.

## Use

The package needs Node.js 22.23.2 or later.

```bash
npm install @automovie/recovery
```

The package touches no files and starts no processes. Writing files and the command-line entry are Node tooling that a generated production carries under `src/executable/recovery`.

## Reconstruct from saved curves

```ts
import {
  convertAutoMovieRecoveryCurves,
  reconstructAutoMovieRecoveryModel,
} from "@automovie/recovery";
import fs from "node:fs";

const curves = JSON.parse(fs.readFileSync("curves.json", "utf8"));
const hermite = convertAutoMovieRecoveryCurves(curves, "hermite");
const result = reconstructAutoMovieRecoveryModel(hermite);
if (!("value" in result)) throw new Error(result.diagnostics.join("; "));
console.log(result.status, result.diagnostics);
```

`curves.json` holds a curve artifact that `observeAutoMovieRecovery` returned. Reconstruction accepts an artifact in either basis, Bezier or Hermite, so the conversion here only shows the call. A `partial` result still carries usable geometry together with the domains, the pieces of the surface the artifact declares, that it could not resolve, so read its diagnostics before using it.

## Workflow

1. `prepareAutoMovieRecoveryInput` accepts indexed triangles in millimetres that are already registered to your coordinate frame. You supply that frame, the pose, the component selection and the source transform already applied.
2. `observeAutoMovieRecovery` cuts the mesh and fits cubic curves. `{ curveFormat: "hermite" }` saves endpoint positions and derivatives; the default `"bezier"` saves Bernstein controls. `convertAutoMovieRecoveryCurves` changes the basis of a curve artifact later.
3. `reconstructAutoMovieRecoveryModel` generates the model, its construction lines and a per-domain record, in metres.

Other entry points:

| Need | Entry point |
| --- | --- |
| Sections at planes you choose, or a polyline you ordered yourself | `observeAutoMovieRecoverySections`, `observeAutoMovieRecoveryPolyline` |
| Source topology between already saved sections, without refitting | `observeAutoMovieRecoverySlabs` |
| Another fit of only the contours that failed | `resumeAutoMovieRecoveryContours` |
| A loft from calibrated orthographic images instead of a mesh | `observeAutoMovieRecoveryImages`, then `fitAutoMovieRecoveryImageLoft` and `compileAutoMovieRecoveryImageLoft` for elliptical sections, or `fitAutoMovieRecoveryImageSupportLoft` and `compileAutoMovieRecoverySupportLoft` for convex ones |
| Relative cameras from two, three or more calibrated photographs | `estimateAutoMovieRecoveryCameraPair`, `estimateAutoMovieRecoveryCameraMap`, `estimateAutoMovieRecoveryCameraScene` |

The inputs, limits and guarantees of each one are in its JSDoc. Registration input types are in `@automovie/interface`.

## Reading a result

Every operation returns a status. `complete` and `partial` carry a `value` as well as diagnostics; `refused`, `failed` and `cancelled` carry diagnostics alone. `complete` describes the scope that was processed. It says nothing about likeness, smoothness, watertightness or how much of the source was covered. Unknown and unsupported domains stay explicit in the result instead of being filled in.

## Limits

- The image path needs horizontal orthographic cameras you supply, a fixed background colour, and one connected foreground interval per row. Caps, interiors and hidden concavities stay unknown.
- Camera estimation is experimental. It needs known pinhole intrinsics and a static scene, returns poses of unknown physical scale, and can refuse on repeated texture, occlusion, a weak baseline or a planar scene. It produces sparse points, not a surface.
- Curve conversion handles cubic curves. It does not repair missing geometry.
