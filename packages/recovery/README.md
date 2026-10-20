# @automovie/recovery

Recover curves from registered triangle meshes, save their coefficients and relationships, then generate new geometry from those saved artifacts. Reconstruction uses no original mesh positions, faces or normals. The generated surface and construction share the recovered representation.

## Install

Use Node.js 22.23.2 or newer.

```sh
pnpm add @automovie/recovery
```

## Reconstruct saved curves

This CommonJS example reads an existing curve artifact, converts its cubic curves to Hermite form and publishes the reconstructed model. Save it as `reconstruct.cjs` beside `curves.json`; the output path must be new.

```js
const fs = require("node:fs");
const {
  convertAutoMovieRecoveryCurves,
  reconstructAutoMovieRecoveryModel,
} = require("@automovie/recovery");
const { publishAutoMovieRecoveryArtifact } = require("@automovie/recovery/node");

const curves = JSON.parse(fs.readFileSync("curves.json", "utf8"));
const hermite = convertAutoMovieRecoveryCurves(curves, "hermite");
const result = reconstructAutoMovieRecoveryModel(hermite);
if (!("value" in result)) throw new Error(result.diagnostics.join("; "));
const publication = publishAutoMovieRecoveryArtifact("model.json", result.value);
if (!("value" in publication))
  throw new Error(publication.diagnostics.join("; "));
console.log(result.status, result.diagnostics, publication.value.sha256);
```

Run `node reconstruct.cjs`. A `partial` result carries usable geometry and unresolved domains; inspect its diagnostics and membership ledger. `complete` describes processing scope, not likeness, smoothness, watertightness or full source coverage.

## Observe and select a curve basis

`prepareAutoMovieRecoveryInput` admits evaluated, registered indexed triangles in millimetres. The caller supplies the coordinate frame, pose, component selection and already applied source transform. Observation does not decode a scene or apply that transform again. Reconstruction models and construction lines use metres.

`observeAutoMovieRecovery(input, { curveFormat: "hermite" })` saves cubic endpoint positions and derivatives. Omit `curveFormat` or select `"bezier"` to retain Bernstein controls. The observation returns an operation result whose value contains the saved curves.

`convertAutoMovieRecoveryCurves(artifact, format)` accepts `"hermite"` or `"bezier"` and returns a converted artifact directly and leaves its input unchanged. It converts nested cubic curves, including open arcs and overrides, while preserving names, directions, frame metadata and each original positive `phaseIntervals` width. Derivatives use millimetres per declared `phaseUnit`; inverse handles use the same width. Higher-degree, rational and analytic oval curves cannot be reduced to cubic Hermite by this operation. Surface coefficient nets retain their representation, and binary64 arithmetic does not promise bitwise round trips. Invalid inputs throw.

`reconstructAutoMovieRecoveryModel` accepts saved Hermite bundles directly. Conversion does not update an existing continuation's byte-hash binding: observe continuation against the selected saved publication.

## CLI

```sh
automovie-recovery recovery --source-epoch <source-sha> extract input.json curves.json --curve-format hermite
automovie-recovery recovery --source-epoch <source-sha> reconstruct curves.json model.json
```

The extraction specification contains `units: "mm"`, `frame`, `pose`, `meshes` with file paths and SHA-256 hashes, and an observation `policy`. Each mesh file contains `vertices` and oriented `triangles`. Paths resolve from the specification's directory. `extract-prefix` adds a section count after the output path and explicitly saves incomplete coverage. Both extraction commands accept `--curve-format bezier|hermite`; reconstruction reads the saved basis.

`--source-epoch` requires the generating source's 40-to-64-digit hexadecimal identity. Outputs do not overwrite existing files. Exit 0 means command execution ended; inspect the saved outcome and diagnostics. `automovie-recovery --help` lists open-contour, local, atlas, contour-path and image commands.

## Public API

The root entrypoint exports observation, fitting, reconstruction, compilation and curve conversion functions, together with named data contracts and closed type unions. Filesystem publication and command dispatch belong to `@automovie/recovery/node`; registration input contracts belong to `@automovie/interface/recovery`.

| Function | Purpose |
| --- | --- |
| `prepareAutoMovieRecoveryInput` | Admit registered triangles and their observation policy |
| `observeAutoMovieRecovery` | Extract and fit saved cubic curves |
| `convertAutoMovieRecoveryCurves` | Change the saved cubic coefficient basis |
| `reconstructAutoMovieRecoveryModel` | Generate geometry, construction and a domain ledger |
| `observeAutoMovieRecoveryImages` | Measure row support from calibrated RGB images |
| `fitAutoMovieRecoveryImageLoft` / `compileAutoMovieRecoveryImageLoft` | Fit and realize an aligned elliptical section model |
| `fitAutoMovieRecoveryImageSupportLoft` / `compileAutoMovieRecoverySupportLoft` | Fit and realize finite-view convex section support |
| `publishAutoMovieRecoveryArtifact` from `/node` | Publish immutable JSON and its byte hash |
| `runAutoMovieRecoveryCommand` from `/node` | Dispatch installed CLI commands |

Operations carrying `complete` or `partial` return a value; `refused`, `failed` and `cancelled` return diagnostics. Cancellation and progress are cooperative synchronous checkpoints. Unknown or unsupported domains remain explicit. Coefficient conversion does not repair missing geometry or surface defects.

## Calibrated images

The image path requires supplied horizontal orthographic cameras, a fixed RGB background and one connected opaque foreground interval per occupied row. It measures pixel-cell edge support in millimetres. Camera estimation, perspective rectification and hidden geometry are outside that observation contract.

The elliptical fitter uses aligned section centres and radii; the finite-view support fitter uses cubic support offsets and bounded boundary-event generation. Their saved recipes generate new geometry and construction without reopening images. Dimension scales range from 0.25 to 4. Unobserved caps, interiors and hidden concavities remain unknown, so realized surfaces retain partial coverage. The `images observe|fit|realize` commands and `recovery.html` inspector expose these paths.
