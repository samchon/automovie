# @automovie/recovery

Observe registered triangle meshes as saved cubic curves and explicit continuation relationships, then reconstruct new geometry from those saved documents. Reconstruction reads coefficients and declared relationships without opening the original mesh or copying its normals or faces.

This package preserves the reconstruction baseline's algorithms and limitations. Packaging does not repair facial bands, missing regions, raised junction sheets or inconsistent joins. Processing completion does not establish visual quality, watertightness, embedding or source fidelity.

## Installation and saved-curve reconstruction

Use matching `@automovie/recovery`, `@automovie/engine`, `@automovie/interface` and `@automovie/ingest` distributions with Node.js 22.23.2 or newer. The initial mesh package was checked by installing its three local tarballs outside this repository, with install scripts disabled and exact file dependencies and overrides. That earlier check does not cover the added image host or constitute a registry release.

The following CommonJS consumer reads an existing `automovie-recovery-curves-v1` document and publishes a new immutable JSON artifact. It uses the same installed API calls exercised by the external package consumer. Save it as `reconstruct.cjs` beside `curves.json`; `model.json` must not exist.

```js
const fs = require("node:fs");
const { reconstructAutoMovieRecoveryModel } = require("@automovie/recovery");
const { publishAutoMovieRecoveryArtifact } = require("@automovie/recovery/node");

const input = JSON.parse(fs.readFileSync("curves.json", "utf8"));
const result = reconstructAutoMovieRecoveryModel(input);
if (!("value" in result)) throw new Error(result.diagnostics.join("; "));
const publication = publishAutoMovieRecoveryArtifact("model.json", result.value);
if (!("value" in publication))
  throw new Error(publication.diagnostics.join("; "));
console.log(result.status, publication.value.sha256);
```

Run `node reconstruct.cjs` and inspect `result.status`, `result.diagnostics` and the returned domain ledger. Partial geometry is preserved. This API example publishes the returned model record directly; the installed `recovery reconstruct` command additionally wraps it in the versioned model document and attaches input and generating-source provenance.

## Public boundaries

Use Node.js 22.23.2 or newer. The root entrypoint owns resident operations; `@automovie/recovery/node` owns filesystem publication and commands. Recovery-specific observation, fitting, policy and reconstruction remain inside this package. `@automovie/interface/recovery` contains registration and observation input contracts, existing shared mathematics stays in `@automovie/engine`, and display stays in the viewer.

| Export | Responsibility |
| --- | --- |
| `prepareAutoMovieRecoveryInput` | Admit already registered indexed triangles and explicit registration metadata |
| `observeAutoMovieRecovery` | Observe resident registered triangles and fit saved cubic curves |
| `reconstructAutoMovieRecoveryModel` | Reconstruct a model and domain ledger from a saved curve bundle |
| `observeAutoMovieRecoveryImages` | Extract physical row support from bounded resident RGB8 images and supplied metric cameras |
| `fitAutoMovieRecoveryImageLoft` | Fit compact cubic centre/radius profiles under an explicit aligned-ellipse hypothesis |
| `compileAutoMovieRecoveryImageLoft` | Generate an ordinary bicubic model and its construction from a saved image-loft recipe alone |
| `fitAutoMovieRecoveryImageSupportLoft` | Fit cubic finite-view support profiles and qualify their continuous boundary events without an ellipse prior |
| `compileAutoMovieRecoverySupportLoft` | Generate new mesh geometry, analytic normal fans and construction from a saved support recipe alone |
| `IAutoMovieRecoveryOperation` | Versioned terminal outcomes, progress and cooperative cancellation |
| `IAutoMovieRecoveryDomainLedger` | Declared domains, emitted ranges and explicitly unknown processing stages |
| `publishAutoMovieRecoveryArtifact` from `/node` | Publish an immutable JSON artifact with an exact byte hash |
| `runAutoMovieRecoveryCommand` from `/node` | Run the installed command dispatcher |

The root also exports the baseline's event, atlas, field-complex and analytic publication operations. Their declarations state the admitted inputs and limitations. Low-level exports do not make every experimental producer chain available or certify complete source coverage.

## Inputs and units

Observation accepts ordinary indexed triangles in millimetres. Registration records an already applied source-to-registered matrix, coordinate frame, evaluated pose, component policy and uncertainty. The caller supplies evaluated triangles; this package does not decode a scene, apply that matrix again or infer hidden components. An ingest inspection result is not an evaluated triangle mesh.

Saved curves retain cubic Bernstein coefficients, span widths and their declared parameter units. Span parameters are not automatically physical arc length or a Hermite tangent convention. Reconstruction models and construction lines use metres. Original observed arrays are borrowed for a synchronous operation; keep them stable until it returns.

## Outcomes and resource lifetime

Operations return `automovie-recovery-operation-v1`. `complete` and `partial` carry a value; `refused`, `failed` and `cancelled` carry diagnostics without one. `complete` describes the declared processing scope. Unsupported domains, incomplete prefixes and unconsumed courses remain explicit rather than becoming successful coverage.

The domain ledger preserves declared addresses and actual emitted ranges. Unknown attempted or admitted stages remain `null`; unattributed ranges remain visible. Named owners bind only when the declared and reported identities are both unique. Missing or ambiguous names, ports and inventories remain diagnostics, and the original operator reports and retained geometry stay available. Such unresolved membership remains partial. A memory result has not been written or loaded merely because geometry exists.

Cancellation is checked at documented synchronous checkpoints. A signal cannot interrupt an arithmetic block while JavaScript owns the thread. Progress callbacks may throw; public operation wrappers return a failed outcome. Limits apply to the selected operation and do not establish a universal asset size bound.

The Node writer stages in the destination directory, closes the staging file and publishes without overwriting an existing target. It reports the exact JSON byte hash. Failure cleans its own pending file; an interrupted process can leave a staging file. Artifact byte identity includes metadata and differs from geometry identity. Reuse and resume require explicit input, version and policy identities rather than the existence of a directory.

## Commands and saved documents

The installed executable is `automovie-recovery`. Its `--help` lists the `recovery`, `recoveryOpen`, `recoveryLocal`, `recoveryAtlas`, `recoveryContourPath` and `images` command families. Commands require an explicit `--source-epoch` generating commit hash. Exit code 0 means processing ended, 2 rejects an unknown command family or malformed source-epoch option, and 1 reports a delegated command or input failure; inspect operation and coverage diagnostics before treating an artifact as complete.

The primary command accepts the saved curve schema `automovie-recovery-curves-v1` and publishes `automovie-recovery-model-v1`. Continuation and atlas documents retain their own versioned schemas. Historical local/open model discriminators remain readable baseline compatibility fields and do not select a Human generator. Repository command shims under `tools/recovery` retain the old `RUN_SOURCE_EPOCH` environment handoff; installed consumers use the explicit option.

Ordinary closed groups, supported closed events and selected ordinary open continuations have distinct contracts. Open split/merge/cavity changes, mixed open/closed events, closed/ruled seam coupling and general physical C1/G1 joins remain unsupported. Approximation bounds do not establish injectivity, appearance or missing-region coverage.

Input meshes, saved subject assets, private observations and benchmark captures are not distributed. The package contains general algorithms, declarations and hosts.

## Calibrated image section experiment

Use the image path for an opaque rigid object against a declared fixed RGB background, with supplied horizontal orthographic cameras. Each occupied row must contain one contiguous foreground interval and remain inside the image; adjacent occupied rows must form one eight-connected foreground component. The observer records pixel-cell edge support in millimetres, not corresponding material points across silhouettes. Pixel centres are `(column + 0.5, row + 0.5)`; image U is `cos(a) X + sin(a) Z`, image V is `-Y`, and the principal point uses pixel-edge coordinates. Camera estimation, perspective rectification and rigidity verification are separate acquisition work.

The fitter currently tests aligned elliptical XZ sections with cubic axial centre and radius profiles. At least three separated squared-support directions test this prior; contradictory or nonellipse support, weak direction geometry, invalid measured rows and exhausted residual/span budgets refuse. Different row charts are linearly interpolated only within their common measured interval. Residuals are conditional on the segmentation and supplied cameras, and do not certify unseen shape.

`IAutoMovieRecoveryImageFiles` from `/node` describes a versioned fixed P6 sRGB manifest with per-image SHA-256, charts and aggregate observation budgets. The `images` host takes `observe|fit|realize input.json new-output.json maxInputBytes` after its source-epoch option. Observation reads that manifest; fitting reads `{observation, policy}`; realization reads `{recipe, budget}` and consults no image path. Each command publishes a new immutable artifact with input hash, source epoch, terminal operation and value.

The `automovie-recovery-image-loft-v1` recipe contains only generating coefficients, frame/identity, three dimension scales and coverage labels. Coefficients use metres; width/depth scale X/Z about the frame origin and height scales Y about the first saved station. Scale values lie in `[0.25, 4]`. Generated lateral surfaces remain inferred, with open unobserved ends and interior, so fit and compilation return `partial`. Hidden concavities, branches, general topology and photographic performance remain outside this qualified experiment.

The `finite-view-convex-support` policy fits both oriented support limits of every supplied view with a common cubic spline space. It checks the implied intersection's support as well as each fitted offset. Its `generation` budget contains `tolerance`, `maxPlanes`, `maxEvents`, `maxCells`, `maxVertices` and `minimumDirectionSine`; the engine uses feasible cubic boundary events rather than assuming a fixed polygon along height. Invalid rows, weak directions, inconsistent supports and exhausted budgets refuse.

The resulting `automovie-recovery-support-loft-v1` recipe saves support planes and cubic offsets, independently of source rows or mesh data. The same `[0.25,4]` coordinate edits use inverse-transformed support planes and newly derived normals. Its explicit coverage retains unknown caps, interior and hidden concavities, supplied cameras and an uncertified enclosure; a convex section hull does not establish physical convexity. Face interpolation error, numerical event isolation, boundary roundoff and source fit are separate qualifications.

`AutoMovieRecoveryImageRecipe` is the closed union of these two saved forms. The file host's `images fit` dispatches the explicit policy family and `images realize` dispatches the saved schema. The ordinary `recovery.html` inspector accepts either form, with the same dimension controls, reference comparison and generating construction.
