# @automovie/recovery

Observe registered triangle meshes as saved cubic curves and explicit continuation relationships, then reconstruct new geometry from those saved documents. Reconstruction reads coefficients and declared relationships without opening the original mesh or copying its normals or faces.

This package preserves the reconstruction baseline's algorithms and limitations. Packaging does not repair facial bands, missing regions, raised junction sheets or inconsistent joins. Processing completion does not establish visual quality, watertightness, embedding or source fidelity.

## Public boundaries

Use Node.js 22.23.2 or newer. The root entrypoint owns resident operations; `@automovie/recovery/node` owns filesystem publication and commands. Recovery-specific observation, fitting, policy and reconstruction remain inside this package. `@automovie/interface/recovery` contains registration and observation input contracts, existing shared mathematics stays in `@automovie/engine`, and display stays in the viewer.

| Export | Responsibility |
| --- | --- |
| `prepareAutoMovieRecoveryInput` | Admit already registered indexed triangles and explicit registration metadata |
| `observeAutoMovieRecovery` | Observe resident registered triangles and fit saved cubic curves |
| `reconstructAutoMovieRecoveryModel` | Reconstruct a model and domain ledger from a saved curve bundle |
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

The domain ledger preserves declared addresses and actual emitted ranges. Unknown attempted or admitted stages remain `null`; unattributed ranges remain visible. A memory result has not been written or loaded merely because geometry exists.

Cancellation is checked at documented synchronous checkpoints. A signal cannot interrupt an arithmetic block while JavaScript owns the thread. Progress callbacks may throw; public operation wrappers return a failed outcome. Limits apply to the selected operation and do not establish a universal asset size bound.

The Node writer stages in the destination directory, closes the staging file and publishes without overwriting an existing target. It reports the exact JSON byte hash. Failure cleans its own pending file; an interrupted process can leave a staging file. Artifact byte identity includes metadata and differs from geometry identity. Reuse and resume require explicit input, version and policy identities rather than the existence of a directory.

## Commands and saved documents

The installed executable is `automovie-recovery`. Its `--help` lists the `recovery`, `recoveryOpen`, `recoveryLocal`, `recoveryAtlas` and `recoveryContourPath` command families. Commands require an explicit `--source-epoch` generating commit hash. Exit code 0 means processing ended, 2 means command admission failed, and 1 means execution failed; inspect operation and coverage diagnostics before treating an artifact as complete.

The primary command accepts the saved curve schema `automovie-recovery-curves-v1` and publishes `automovie-recovery-model-v1`. Continuation and atlas documents retain their own versioned schemas. Historical local/open model discriminators remain readable baseline compatibility fields and do not select a Human generator. Repository command shims under `tools/recovery` retain the old `RUN_SOURCE_EPOCH` environment handoff; installed consumers use the explicit option.

Ordinary closed groups, supported closed events and selected ordinary open continuations have distinct contracts. Open split/merge/cavity changes, mixed open/closed events, closed/ruled seam coupling and general physical C1/G1 joins remain unsupported. Approximation bounds do not establish injectivity, appearance or missing-region coverage.

Input meshes, saved subject assets, private observations and benchmark captures are not distributed. The package contains general algorithms, declarations and hosts.
