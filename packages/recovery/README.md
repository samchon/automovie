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

## Add source topology to saved sections

`observeAutoMovieRecoverySlabs(input, options)` observes finite source slabs without loading, converting or fitting curve coefficients. Supply unchanged registered vertices and original-order triangles, the physical axis/reference and exact-alias policy, caller-verified source/selection identities, finite slab pairs and an `IAutoMovieRecoverySavedSection` for every endpoint. Each saved section carries its original normalized frame, artifact identity and complete `sourceLineage`, including failed and degenerate contours. Existing artifacts with broad incidence alone can obtain newly cut exact face provenance.

The caller verifies native source bytes, registration, selection, original face ordering and saved artifact hashes before the call. Opaque identity equality is not hashing. The observer compares frames and alias policy, recuts all supplied planes, then verifies raw contour ordinals, complete face sets and admitted closed/open/contact classification. Optional saved exact face sets must also agree. Missing, duplicated or stale contours refuse before any slab is delivered. The returned ports keep the caller's saved curve references with `bindingAuthority: "raw-cut-addresses-and-closure-only"` and `curveCoefficientsRead: false`; this establishes no named curve geometry, degree, rational weight, physical phase, direction, fit error or transverse jet.

All source components, unpublished boundaries, measured PL events and incidence issues remain present. Source arrays stay private; the result contains source addresses and measured event features. Existing curve bytes remain outside the API, including high-degree and rational coefficients. This operator does not retry failed fits, create caps or authorize a generated surface. Optional progress and slab callbacks are synchronous; an exception fails the operation and cooperative abort stops later work. Slab callbacks receive independent metadata copies that remain provisional until success.

## Resume failed contours

`resumeAutoMovieRecoveryContours(input, { curveFormat })` reuses the registered source and complete saved-section binding contract to fit explicitly failed raw contours. Supply distinct `{ coordinateMm, contourIndex }` targets and one `IAutoMovieRecoveryContourResumePolicy` per targeted artifact identity. The caller verifies that tolerance, corner threshold, orientation sign and original span budget are the actual values committed by that original artifact. The observer compares identities; it does not hash files or infer missing policy.

All saved cuts are verified before any target is fitted. Published curves, including curves with unresolved tolerance, and degenerate publications cannot be targeted. Only failed targets enter the existing adaptive fitter. A raw contour with E positive observation edges admits at most E adaptive spans; each split partitions its edge range. Exact source face count F also gives the conservative preplan bound 3F because a triangle emits at most three cutter edges. Both measured counts and bounds are returned, and E supplies the new budget without forcing one span per edge. Conditioning failures and unmet tolerance remain explicit.

The result keeps original publication addresses in `sections`, untargeted artifact references in `preservedOriginals`, original raw indices in `targets` and newly fitted coefficients in `fits`. A target's `patchCurveIndex` addresses only the new `fits` array. Commit this patch separately and resolve both artifact namespaces in an explicit acquisition ledger. Only new cubics undergo official basis conversion; normal coefficients, including high-degree and rational data, remain external byte references with their original actual widths, units and directions. `complete` means the requested patches met the original polyline tolerance, independently of unresolved untargeted publications. It establishes no surface error, continuation, material phase or transverse jets. Progress exceptions fail without a value; cooperative abort stops later work but cannot interrupt a synchronous numeric solve.

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
| `observeAutoMovieRecoveryPolyline` | Fit a caller-ordered physical polyline without inferring closure or correspondence |
| `observeAutoMovieRecoverySections` | Observe every contour at caller-defined physical planes |
| `AutoMovieRecoveryOrderedLineage` | Observe ordered source cuts and qualify new saved-cubic replay correspondence |
| `observeAutoMovieRecoverySlabs` | Add exact source slab topology to caller-bound saved section publications without fitting |
| `resumeAutoMovieRecoveryContours` | Fit only failed saved raw contours into a separate source-bound coefficient patch |
| `convertAutoMovieRecoveryCurves` | Change the saved cubic coefficient basis |
| `reconstructAutoMovieRecoveryModel` | Generate geometry, construction and a domain ledger |
| `observeAutoMovieRecoveryImages` | Measure row support from calibrated RGB images |
| `estimateAutoMovieRecoveryCameraPair` | Observe automatic correspondences and qualify a relative camera under supplied intrinsics |
| `estimateAutoMovieRecoveryCameraMap` | Register a calibrated three-camera sparse map from shared automatic tracks |
| `fitAutoMovieRecoveryImageLoft` / `compileAutoMovieRecoveryImageLoft` | Fit and realize an aligned elliptical section model |
| `fitAutoMovieRecoveryImageSupportLoft` / `compileAutoMovieRecoverySupportLoft` | Fit and realize finite-view convex section support |
| `publishAutoMovieRecoveryArtifact` from `/node` | Publish immutable JSON and its byte hash |
| `runAutoMovieRecoveryCommand` from `/node` | Dispatch installed CLI commands |

Operations carrying `complete` or `partial` return a value; `refused`, `failed` and `cancelled` return diagnostics. Cancellation and progress are cooperative synchronous checkpoints. Unknown or unsupported domains remain explicit. Coefficient conversion does not repair missing geometry or surface defects.

## Calibrated images

The image path requires supplied horizontal orthographic cameras, a fixed RGB background and one connected opaque foreground interval per occupied row. It measures pixel-cell edge support in millimetres. Camera estimation, perspective rectification and hidden geometry are outside that observation contract.

The elliptical fitter uses aligned section centres and radii; the finite-view support fitter uses cubic support offsets and bounded boundary-event generation. Their saved recipes generate new geometry and construction without reopening images. Dimension scales range from 0.25 to 4. Unobserved caps, interiors and hidden concavities remain unknown, so realized surfaces retain partial coverage. The `images observe|fit|realize` commands and `recovery.html` inspector expose these paths.

## Relative camera observations


`estimateAutoMovieRecoveryCameraPair` accepts two unchanged resident RGB8 images through `IAutoMovieRecoveryCameraPairInput`. Supply independently known corrected pinhole intrinsics for each original pixel chart, a static scene assertion, source provenance, explicit thresholds and finite work budgets. Integer `(column,row)` denotes the pixel centre, with X right, Y down and camera Z forward. This perspective convention differs from the section observer's pixel-edge chart.

The `harris-gradient-calibrated-eight-point` family observes multiscale corners and oriented gradient descriptors, proposes unique mutual appearance matches and fits calibrated relative geometry. Final qualification checks the completed sampling target, local numerical convergence, original-design rank, pixel residuals, four-pose depth/parallax and a competing homography. Repeated texture, occlusion, broad viewpoint changes, weak baseline or planar ambiguity can leave the camera unobservable. Supplied focal calibration, distortion correction and scene rigidity remain caller assertions.

This is a limited experimental operating point. Its octave-spaced Harris detector does not select continuous scale extrema. In the [frozen TempleSparseRing confirmation](https://github.com/samchon/automovie/issues/2874#issuecomment-6284424010), two of four reserved pairs were accepted, failing the registered three-pair coverage target. Their rotation errors were 0.724 and 3.530 degrees and signed translation-direction errors 0.674 and 5.306 degrees. The other pairs were refused for insufficient appearance matches or weak depth/parallax. These exposed confirmation images establish neither arbitrary-photo reliability nor a reconstructed surface; they are not a fresh holdout for later changes.

A completed observation returns a `partial` operation containing `automovie-recovery-camera-pair-estimate-v1`. Its own `status` is `accepted-relative-pose` or `refused`, with measured populations and every observed refusal. Only an accepted pose exposes row-major R and unit t in `X2 = R X1 + t`; the first camera is identity and physical scale is unknown. Match support and image hull fractions describe image evidence, not object coverage or verified correspondence truth. Independent camera accuracy, covariance, global multiview registration and photographic surface reconstruction remain separate work.

The `IAutoMovieRecoveryCameraFiles` contract is exported from both public entrypoints. The Node `cameras` host accepts `estimate input.json new-output.json maxInputBytes` after its explicit source-epoch option. Its `automovie-recovery-camera-files-v1` manifest supplies exactly two hashed P6 sRGB sources and the resident policy/calibration records. Acquisition verifies source bytes and preserves the decoded chart without crop, rotation, resize or rectification. The host publishes one new `automovie-recovery-camera-artifact-v1` containing input/source identities and the operation result. A completed camera refusal still has exit 0 and retained evidence; invalid, cancelled or failed work without a value publishes nothing.

`estimateAutoMovieRecoveryCameraMap` consumes `IAutoMovieRecoveryCameraMapInput` with exactly three unique calibrated RGB views. The first two are the explicitly ordered seed. Shared `seedPolicy` and `seedBudget` retain the pair operation's feature and epipolar meanings, while map `policy` and `budget` separately declare pointwise acute parallax, Euclidean pixel reprojection, nonplanar resection, linked populations and joint work limits. The public resection minimum is six distinct landmarks for its nonminimal DLT initializer; an experiment can require a larger fixed support, such as sixteen, without redefining that API boundary. Planar DLT initialization is unsupported, although planar PnP is not generally impossible. A camera rotating against an already constrained 3D map does not require a new translational baseline.

Each image is observed once. Bidirectional appearance-index intersections form tentative tracks; duplicate-view components are counted and withheld. Only accepted direct seed pairs create finite, positive-depth, pointwise qualified landmarks. The third image is registered against these existing points before its inlier measurements enter joint fitting. This version leaves tracks without direct seed support untriangulated. The first pose stays fixed and the seed translation norm is one; the third translation retains its own three coordinates, preserving its baseline ratio. Joint fitting keeps the same observation population, removes point coordinates by orthogonal QR and checks undamped point/camera rank before damping. Its report distinguishes robust cost, unweighted error, retained coverage and local convergence.

Joint map updates preserve the current admitted seed radius with `r*normalize(t+Bz)`, where `r=norm(t)` stays fixed in that local chart. Original geometry is not rescaled at zero. Ordinary and internal feasible models use its actual differential `P_t B`, and optional lagged curvature uses the same first/second chart. Represented arithmetic still passes the original near-unit gauge and actual geometric gates. Scene retention separately admits64 fixed chart slots; models prepay512 additional visits and actual seed updates256 under the original ceilings. Calibrated pair refinement retains its distinct scale-invariant Sampson chart.

The operation still returns `partial` computation evidence. Its value separately says `accepted-sparse-map`, `seed-only` or `refused`. Seed-only evidence exposes no final third pose, and a failed joint qualification does not expose its candidate as an accepted map. Sparse points have unknown physical scale and supply fitting evidence only; the artifact contains no editable surface, hidden geometry, estimated calibration, covariance or material-truth certificate. Arbitrary-length image registration is outside this first three-view contract.

The Node consumer accepts `cameras map input.json new-output.json maxInputBytes`. `IAutoMovieRecoveryCameraMapFiles` declares `automovie-recovery-camera-map-files-v1`, three fixed hashed P6 sRGB files and the resident metadata without `views`. The host decrements the aggregate pixel ceiling before each decode, calls the same resident operation and atomically publishes one new `automovie-recovery-camera-map-artifact-v1` with source epoch and manifest hash. Completion can publish a geometric refusal; a no-value failed operation and an attempted overwrite publish no replacement artifact.

`estimateAutoMovieRecoveryCameraScene` takes the separate `IAutoMovieRecoveryCameraSceneInput` schema for at least three fixed calibrated views under an explicit `maxViews` limit. It preserves the exact-three-view map API. The first two images are the seed; all other images are candidates, ordered by distinct existing-map support and stable ID. The operation observes each source once, matches each pair in both directions and withholds global duplicate-view components before estimating the seed. It reconstructs and jointly requalifies the seed component under that global policy instead of deleting points from a previously fitted local map.

Each extension registers a camera against existing 3D landmarks before that camera can create new points. Registered observations then triangulate new tracks and extend existing point measurements. Full common-gauge joint refinement checks undamped point/camera rank and every retained depth, pixel residual and actual supporting ray pair. New points need not appear in either seed image. Strictly added observations or points require another joint fit; a failed or exhausted transaction rolls back all proposed poses, points and observations while retaining its consumed work. Original rows are compressed by orthogonal QR before the reduced-camera SVD; variable camera width remains bounded and is not advertised as a large-scale sparse solver.

Scene `policy` reuses the map's geometric units. Its budget adds aggregate camera attempts, resection proposals, triangulations, joint fits and charged dimension-sweep work. `maxResidentLinearEntries` bounds conservative logical scalar slots, not JavaScript overhead, bytes, process RSS or elapsed time. The result separately records an `accepted-sparse-component`, `seed-only` or `refused` value, source-order nullable poses, per-source support/refusal status, accepted revisions and `all-registered`, `no-qualified-growth`, `budget-exhausted` or `seed-refused` termination. Accepted component geometry is still partial with unknown physical scale; it is not a surface, material-truth certificate or promise to register every requested image.

The scene's `joint` remains the last accepted checkpoint report. If initial seed qualification refuses after a fit has completed, `refusedSeedJoint` preserves the last completed seed-fit report separately, including its own population and termination. It may precede a later closure capacity or budget refusal and does not expose failed geometry. It is absent before a report is available, after seed acceptance and in older artifacts. Seed reporting prepays32 setup visits and64 per fit from the original aggregate linear-work budget; it adds no numerical fit or convergence allowance.

Completed internal feasible fits additionally expose an optional `feasible` block on their own joint report. It preserves physical normal inputs, actual tolerance and the terminal objective multiplier, the baseline QP certificate, the latest optional SQP report and whole-fit path/outcome marginals. Computed nonfinite numbers use `"NaN"`, `"+Infinity"` or `"-Infinity"`; unavailable values remain null. The SQP report and latest rejected-trial reason may predate the terminal model. Marginals do not identify individual selected paths or reconstruct a trajectory, independent dual certificate or general convergence guarantee. Ordinary fits and older artifacts omit this block; public method selection and closed input schemas remain unchanged.

The internal reporting scope prepays256 setup visits after relative-seed acceptance, 2048 per fit for fixed projection/possible trace transfer, and 32 per checked generic model. These metadata costs consume the original aggregate work budget. A scene reserves512*(maxCameraAttempts+2) logical reporting slots beneath its unchanged resident ceiling; direct checkpoint/map scopes reserve512. A direct checkpoint owns its nested method snapshot with that scope before growth callbacks and reuses it through closure. Numerical growth, resection and joint admission share the remaining capacity, so tight work or resident limits can refuse earlier. The last accepted geometry and original normal/pixel/trial rules remain unchanged. Artifact serialization still costs its full output traversal, including repeated aliases; the reporting reservation is not a byte, RSS or external observer-history guarantee.

The matching Node command is `cameras scene input.json new-output.json maxInputBytes`. `IAutoMovieRecoveryCameraSceneFiles` supplies `automovie-recovery-camera-scene-files-v1`, fixed hashed P6 sRGB images, `maxHeaderBytes` and the resident capture metadata without `views`. The shared reader enforces complete-file hashes, source count and remaining aggregate pixels before allocation, and the host calls the same public resident operation before publishing one immutable `automovie-recovery-camera-scene-artifact-v1`. No private observation file or reference pose is a product input.
