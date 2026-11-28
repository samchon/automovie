# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.observeImages

## @evidence contracts/development/common.md#meaningful-documentation

The public contract describes one asserted fixed object, frame, calibrated resident RGB8 views, threshold interval, safe budgets, millimetre rows and cancellation/failure/refusal outcomes.

## @evidence contracts/development/implementation.md#principled-implementation

Foreground is the union of three per-channel threshold comparisons of exact RGB8 values. The occupied row limits take the outer pixel-cell boundaries through the supplied orthographic chart. The scan checks byte count before indexing, and qualifies the occupied rows as an unclipped eight-connected region. The half-pitch quantization belongs to the binary pixel chart and leaves physical rigidity and calibration conditional.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each view's budget, identity, byte count and chart are admitted before scanning. Three 256-entry lookup tables classify pixels in one scan, and each retained row is counted against the caller's budget. One prepared chart per view is reused for its rows. No camera pixel arrays are copied into the result, and incomplete scans transfer no rows.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.inspectFeatureChartTopology

## @evidence contracts/development/common.md#meaningful-documentation

The returned observer measures indexed feature-face topology in a common millimetre frame and uses the caller's diagnostic and stable edge key policy.

## @evidence contracts/development/implementation.md#principled-implementation

Shared measurement resolves three distinct safe-integer indices, then requires finite nonzero oriented area. Dividing the cross product by its finite norm yields unit directions. Oriented edge incidences, vertex links and complete boundary following qualify topology independently of face-component count.

## @evidence contracts/development/implementation.md#efficient-algorithms

One face traversal accumulates normals and incidence. Linear visits over edges, vertex links and components reuse those records. The caller owns the returned topology and the closure retains only the supplied edge-address and failure policies.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.prepareDiskChart

## @evidence contracts/development/common.md#meaningful-documentation

The contract gives finite millimetre positions, keys and complete supplied oriented boundary. It explains corner choice, orientation of sides, subdivision and diagnostic failures.

## @evidence contracts/development/implementation.md#principled-implementation

Safe vertex addresses and finite Engine cross products give local measured geometry. Shared oriented incidence identifies adjacent source faces. The disk owner additionally checks the supplied complete walk, connectedness and Euler characteristic one before selecting an anchor. Perimeter fractions establish the four quarter positions, and only their incident boundary faces are split.

## @evidence contracts/development/implementation.md#efficient-algorithms

One admitted face traversal supplies all oriented edge and link data. The disk walks those maps and its boundary rather than generating a mesh for the topology check. At most three interior quarter targets can introduce new boundary vertices. The returned arrays retain the chart and its ancestry.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.estimateCameraPair

## @evidence contracts/development/common.md#meaningful-documentation

The method documents fixed-scene RGB8 inputs, their borrowed lifetime, the supplied calibration, the conditional pose gauge and the outer partial outcome. Progress callbacks are cooperative checkpoints and terminal failures publish only diagnostics.

## @evidence contracts/development/implementation.md#principled-implementation

The operation admits two calibrated charts before matching. Fewer than eight tentative matches records a camera refusal without fitted consensus. Other observations pass through calibrated support, refinement, pose, error and degeneracy gates before the accepted branch can publish its pose. A completed observation can carry a nested camera refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

The operation extracts one feature population per view and matches them once under the descriptor pair limit. The consensus and refinement budgets bound later work. The output keeps matches and copied provenance without duplicating or retaining RGB8 buffers.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.computeReachableChartBox

## @evidence contracts/development/common.md#meaningful-documentation

The method distinguishes approximate distance and outward endpoints in millimetres from the exact single-row decision. It states how repeated IDs combine, when equality is admitted and what throws.

## @evidence contracts/development/implementation.md#principled-implementation

The calculator combines repeated weights in binary64 before interpreting the results as exact dyadic coefficients. Each combined weight's sign selects lower and upper contributions. Comparing the sum of squared gaps with squared tolerance gives the exact decision independently of rounded endpoints and distance.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the bounded raw list combines repeated controls. Exact arithmetic runs over the retained map and three axes. This returns a single row decision without constructing geometry or retaining the map.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.assembleChartBatch

## @evidence contracts/development/common.md#meaningful-documentation

The generator explains the borrowed source lifetime, independent boundary fallback, explicit local receipt states and separate fit and continuity qualifications.

## @evidence contracts/development/implementation.md#principled-implementation

One shared network registers the selected charts before any fit. If this fails, the owner repeats registration one chart at a time with shared qualification false. A registered chart attempts local chord refinement and fit. The result's type records the reached stage while the publisher transfers its original geometry, reasons and qualification fields.

## @evidence contracts/development/implementation.md#efficient-algorithms

Normal work uses one network for the entire selection and refines registered charts as the consumer advances the generator. Independent networks run after a shared failure, and refused network admissions never run a coefficient solve.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.extractImageFeatures

## @evidence contracts/development/common.md#meaningful-documentation

Detect multiscale Harris features in one admitted resident RGB8 chart. Positions use the original image's pixel-centre coordinates. Orientations are in radians and descriptors are owned normalized 128-bin arrays. Candidate overflow throws. The selected-feature limit is applied before descriptor support checks, so the returned population can be smaller.

## @evidence contracts/development/implementation.md#principled-implementation

The Harris response uses Gaussian derivative products and local maxima. A quadratic fit refines each admitted maximum, and its gradient orientation defines the local histogram frame. Adaptive suppression ranks candidates in original pixel coordinates before the descriptor filter. The 101-case test round exercised empty view populations and candidate overflow through estimateCameraPair.

## @evidence contracts/development/implementation.md#efficient-algorithms

The grayscale pyramid stops at its level cap or a raster dimension below 40. The valid-candidate cap bounds the pairwise suppression calculation. Only selected features build and retain descriptors.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.linkCameraTracks

## @evidence contracts/development/common.md#meaningful-documentation

Link reciprocal appearance matches into tracks in source view order. Supply precomputed feature populations and paired view matches from the same admitted set. A component with two observations from one view is a conflict. The returned tracks keep original view and feature indices. Exceeding the linked-observation or track ceiling throws.

## @evidence contracts/development/implementation.md#principled-implementation

Per-view offsets turn the input ordinals into a common union-find address. A forward edge joins components only when the reverse table has the same feature pair. The scene conflict fixture adds one late reciprocal edge that merges two of 72 tracks; the linked population excludes both ambiguous identities before seed fitting.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reverse matches are indexed once per pair. Path compression reuses component roots, and grouped components are bounded before the retained track population transfers.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.observeCameraSet

## @evidence contracts/development/common.md#meaningful-documentation

The operation states that each admitted view is observed once, each pair keeps both direction records, and only comparisons actually needed by the directional searches consume the aggregate budget. Progress follows views and pairs.

## @evidence contracts/development/implementation.md#principled-implementation

The shared count uses the source count times the target count when the direction has at least two target descriptors. A smaller target cannot supply a second nearest feature and incurs zero comparisons. A one-by-two feature pair therefore compares two descriptors in one direction and none in the other.

## @evidence contracts/development/implementation.md#efficient-algorithms

The operation preflights the sum of all directional counts before the first matching search. It reuses each extracted feature population across all pairs and preserves even the zero-work pair entries.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.estimateCameraMap

## @evidence contracts/development/common.md#meaningful-documentation

Observe three fixed RGB8 views under supplied corrected pinhole calibration. Views zero and one form the seed for the third view. The completed observation returns `partial` with an accepted sparse map, a seed-only map or a refusal. Its coordinates use the first-view unit-baseline gauge. Keep resident bytes unchanged until return. Admission, callback failure and cooperative cancellation return diagnostics without a map.

## @evidence contracts/development/implementation.md#principled-implementation

Admit and snapshot camera metadata before callbacks. Triangulate only seed-supported tracks, resect the third camera against those points, and then jointly refine the accepted population. The scaffold's recoveryCameraMap command writes this returned evidence. The singleton-camera test proves that a completed `partial` can retain a nested camera refusal and detached source metadata.

## @evidence contracts/development/implementation.md#efficient-algorithms

The estimator shares each extracted feature population across the three view pairs. Explicit limits bound pixels, descriptor comparisons, proposals and fitting. The result carries sparse observations and copied provenance without retaining RGB8 buffers.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.estimateCameraScene

## @evidence contracts/development/common.md#meaningful-documentation

Observe one sparse component from an admitted set of fixed RGB8 views with supplied corrected pinhole charts. Views zero and one form the seed. A completed observation returns `partial`; inspect `registeredViews`, null poses and `stopReason` for its coverage. Coordinates use one unit seed baseline. Keep resident bytes unchanged until return. Cancellation is cooperative, and cancellation, admission refusal and callback failure publish diagnostics without a value.

## @evidence contracts/development/implementation.md#principled-implementation

The scene globally resolves track identity before fitting the seed. Each candidate joins against retained landmarks, then proposes new points and a complete common-gauge fit. Failure preserves the previous component while retaining attempt and work reports. The scaffold's recoveryCameraScene command consumes this state; the five-view fixture checks growth and rollback.

## @evidence contracts/development/implementation.md#efficient-algorithms

Extract each view once and use a declared global comparison ceiling. Fit, resident-storage and scene-work limits govern incremental candidates. Staged working geometry is discarded after a refused transaction.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.observeMesh

## @evidence contracts/development/common.md#meaningful-documentation

Observe a registered mesh as cubic sections, incidence and local diagnostics. Omitted curve format uses Bernstein coefficients. Request Hermite to retain the same physical span widths with endpoint derivatives. Supply evaluated geometry in the registered millimetre frame and keep source arrays unchanged until return. Local omissions produce `partial`. Observer failure or cooperative cancellation transfers diagnostics without coefficients.

## @evidence contracts/development/implementation.md#principled-implementation

The default overload transfers Bernstein data. The format-aware overload converts all declared cubic fields with their original span widths. The automatic section extractor retains open contours, isolated contacts and topology gaps. The production recovery command passes evaluated registered triangles, and the tetrahedron/triangle lineage test compares observer-enabled and baseline coefficients and exact source ordinals.

## @evidence contracts/development/implementation.md#efficient-algorithms

One scalar chart and prepared cutter serve the mesh's sections. A supplied section limit selects a sorted prefix. Source positions and triangles stay outside the returned geometry, and only requested lineage callbacks receive copied incidence.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.observeAtlas

## @evidence contracts/development/common.md#meaningful-documentation

Fit the selected registered source interval domain as private charts with shared physical boundaries. A scalar window selects complete intersecting intervals before the work prefix. Keep source geometry and selection records unchanged throughout the call. The returned coefficients retain source coverage, fitted-chart counts and local omissions. Invalid source admission throws, and chart diagnostics qualify continuity or fit separately.

## @evidence contracts/development/implementation.md#principled-implementation

The atlas source owner constructs the finite scalar frame and interval index. Chart families get their own disk, annular or cut-forest assumptions before binding declared physical subarcs. The common network assigns shared coefficients, then the publisher reconciles fits, unsupported cells and Engine realization. The scaffold observeRecoveryAtlas command uses this directly to emit its artifact.

## @evidence contracts/development/implementation.md#efficient-algorithms

The source and interval schedule are prepared once. Selected charts share one boundary pass, and area rows work within explicit fit budgets. Raw source meshes remain private while the result keeps retained coefficients and coverage.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.observePolyline

## @evidence contracts/development/common.md#meaningful-documentation

Fit one named, ordered millimetre polyline using its declared corners and closure. Choose Bernstein or Hermite in the required options. Returns `partial` with an admitted fit when sampled tolerance remains unresolved. An empty name refuses; invalid fit inputs and callback exceptions fail. Cancellation is checked before fitting and publication.

## @evidence contracts/development/implementation.md#principled-implementation

The cubic fitter derives tangent-constrained spans over the supplied order. The wrapper converts the admitted fit to the requested basis and determines status from its `toleranceMet` field. The polyline admission test supplies malformed spans, corners and nonfinite points through the shared fitter used here.

## @evidence contracts/development/implementation.md#efficient-algorithms

The fitter runs once per operation. The wrapper converts the completed fit once, retains owned coefficients and withholds all output after cancellation.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.observeSections

## @evidence contracts/development/common.md#meaningful-documentation

Cut the requested distinct physical planes through registered millimetre triangles. Results retain requested plane order, the normalized physical frame and curves in the requested basis. Explicit terminal observations can append probe cuts. Optional lineage and slab callbacks receive source evidence. Open contacts, local failures and unsupported terminal or slab evidence produce `partial`. Admission, execution and cancellation failures publish diagnostics without sections.

## @evidence contracts/development/implementation.md#principled-implementation

One scalar projection drives both cut predicates and physical plane positions. Fixed planes use the shared section extractor, and optional seed paths add bounded source-terminal observations. The fixed-section fixture checks two translated tetrahedra, reversed normals, exact face lineage, a distal tip and an open tube.

## @evidence contracts/development/implementation.md#efficient-algorithms

Build mesh incidence, the scalar interval index and reusable cutter once. Query only candidate faces per plane. Keep original source arrays outside the coefficient publication and collect additional provenance when requested.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.observeSlabs

## @evidence contracts/development/common.md#meaningful-documentation

Observe explicitly requested slabs between saved sections of one registered millimetre source. Supply source and selection identities, a matching physical frame and original section addresses. Saved publication associations bind by exact raw cut ordinal and closure. Unqualified coverage returns `partial`; invalid requests, observer failure or cancellation publish diagnostics without slab results.

## @evidence contracts/development/implementation.md#principled-implementation

The operation recuts each saved plane, binds raw contours to the declared saved publications and observes each pair's connected source components. The two-peak fixture verifies one-to-two branches and confirms a face that touches a cut endpoint cannot supply exact port support.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepare incidence and the scalar index once. Re-cut each saved plane once and reuse its bound ports across requested slabs. Optional observer records are copied before delivery.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.prepareInput

## @evidence contracts/development/common.md#meaningful-documentation

Borrow an already evaluated triangle mesh with its declared applied registration and observation policy. The complete result refers to the supplied input and geometry arrays. Load, transform and verify the asset before calling.

## @evidence contracts/development/implementation.md#principled-implementation

The implementation destructures the supplied registration for its diagnostic and returns the input by identity. The generated recovery host extracts evaluated geometry before this call. The registered triangle fixture checks the original arrays and coordinates stay identical.

## @evidence contracts/development/implementation.md#efficient-algorithms

No geometry arrays, registration transforms or file bytes are copied or processed. This is a fixed-cost handoff to the observation owner.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.resumeContours

## @evidence contracts/development/common.md#meaningful-documentation

Refit selected failed raw contours against their saved section addresses, using the original registered millimetre source and explicitly selected patch budgets. Choose the output basis for the new fits. The result preserves external original-artifact references and gives new patch indices only for successful targets. Check `partial` for failed targets or unqualified patch tolerance. Invalid bindings, observer errors and cancellation publish diagnostics without a patch.

## @evidence contracts/development/implementation.md#principled-implementation

Recut each referenced plane and bind raw ordinals and closure to declared publications before accepting the selected failed targets. Pass their original tolerance and corner policy to the same section owner with the explicit patch span cap. Both preserved originals and admitted patches keep their addresses in different namespaces.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuse one source incidence and scalar index. Recut each saved plane once into a lookup, then fit only selected targets. Existing fitted coefficients remain external references and are never read.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.transportChart

## @evidence contracts/development/common.md#meaningful-documentation

Transport the phase of a closed observed contour through at least three uniquely ordered persistent anchors. Supply finite millimetre points, unitless periodic phase and the `ordinary-ordered` relation. Omitted incoming phase uses normalized observed arclength. A conflict or unresolved seam returns diagnostics and leaves the caller's course intact. Malformed chart structure throws.

## @evidence contracts/development/implementation.md#principled-implementation

Build unique identity maps, preserve incoming anchor phases, and check the same cyclic order in either orientation. Interpolate unanchored phases by measured piecewise-linear length. If the wrapped seam lies inside a source edge its explicit interpolated point carries that edge's ancestry. The implementation compares identities rather than matching positions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Index each chart's anchors once and accumulate one current arclength table. The returned map carries observed points and at most one new seam point instead of resampling the contour.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.prepareAtlasObservationSource

## @evidence contracts/development/common.md#meaningful-documentation

Prepare the scalar frame and interval index for an immutable registered millimetre mesh. Omit interval order to use source order. A supplied scalar window selects intersecting saved intervals. Invalid levels, sweep axis or observation and realization budgets throw before chart work.

## @evidence contracts/development/implementation.md#principled-implementation

Normalize the sweep axis, optionally link exactly coincident source vertices, and produce the common source region with its ordered interval selection. observeRecoveryAtlas reuses these returned heights and addresses when it visits candidate slabs.

## @evidence contracts/development/implementation.md#efficient-algorithms

Project each registered vertex once and build one reusable face-height index. Selected interval processing queries it instead of scanning the full source for every level.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.observeAtlasCreases

## @evidence contracts/development/common.md#meaningful-documentation

Measure original source-edge dihedrals for one admitted observed component. Supply the original oriented face normals and a threshold in degrees. Return each qualifying physical edge with its two original face IDs and angle. The component diagnostic receives unresolved normal arithmetic.

## @evidence contracts/development/implementation.md#principled-implementation

Group occurrences by source edge inside the selected component. Dot products and both normal lengths determine their angle in degrees. The atlas feature stage consumes the source edge and face lineage for cut preparation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Traverse the recorded edge occurrences once and reuse supplied oriented normals. The result stores only qualifying edge evidence and associated original face addresses.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.observeAtlasFeatures

## @evidence contracts/development/common.md#meaningful-documentation

Register crease-prepared chart pieces against an observed component. Inventory-only mode records candidate counts and leaves fitting pending. Otherwise append each supported piece to the pending chart batch. Preserve the source faces and reasons for unsupported pieces.

## @evidence contracts/development/implementation.md#principled-implementation

Pass measured feature edges and triangle-to-source indices into feature preparation, then retain each piece's source-face ancestry. Unsupported pieces update the component outcome. observeRecoveryAtlas distinguishes this inventory and preparation from the later common-network fit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepare the feature decomposition once for the selected component and append one record per output piece. Inventory-only mode skips coefficient fitting.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.observeAtlasChart

## @evidence contracts/development/common.md#meaningful-documentation

Prepare the selected ordinary annulus, four-sided source chart or general disk for a later common boundary-network pass. Keep registered millimetre positions, observed boundary identities and triangle lineage available to the batch. An invalid component fails preparation or records its reason for publication.

## @evidence contracts/development/implementation.md#principled-implementation

Select the chart's existing topology path. An annulus needs one admitted cut-plane boundary on each side before seam duplication. A disk retains natural sides or chooses physical-arclength quarters after its topology checks. The atlas publisher fits only chart records admitted by this stage.

## @evidence contracts/development/implementation.md#efficient-algorithms

The preparation is local to the selected component. It stages side paths and source correspondence once, leaving all coefficient solves to the shared batch.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.publishAtlasObservation

## @evidence contracts/development/common.md#meaningful-documentation

Finish fitting a prepared selected atlas and publish owned coefficient geometry together with coverage and local diagnostics. Pass the atlas computation's pending chart owners and append destinations. The routine transfers fitted charts and records unsupported components before requesting realization.

## @evidence contracts/development/implementation.md#principled-implementation

Resolve batch receipts by chart name. Keep data from fitted receipts even when shared continuity or the fit is unqualified, and retain original refusal reasons for other receipts. Convert millimetre control coordinates to metres for Engine geometry. The template atlas command receives this publication as the observed artifact.

## @evidence contracts/development/implementation.md#efficient-algorithms

Use a pending-chart lookup and one streamed batch over the selection. Fit only admitted charts, accumulate controls with patch offsets once, and reuse assembled fields during realization and coverage reporting.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.reconcileChartBoundaryNetwork

## @evidence contracts/development/common.md#meaningful-documentation

Reconcile chart sides over declared physical keys and base-edge cut fractions. Return copied chart observations with fitted maximal-arc authority and measured displacement in millimetres. Ambiguous ancestry, collapsed incidence and unrepresentable phase throw. Missing banks remain diagnostic.

## @evidence contracts/development/implementation.md#principled-implementation

Register original cut ancestry, propagate each split to the declared containing edge and bind each maximal arc across its registered chart uses, including reversed banks. Whole closed or junction-return chains receive stable existing anchors. The chart batch retries individual charts when this shared run fails.

## @evidence contracts/development/implementation.md#efficient-algorithms

Register keys and edge cuts once per selected network. Resolve and fit each canonical maximal arc once through the boundary owner, then reuse its coefficients on the oriented banks.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.prepareAnnularChart

## @evidence contracts/development/common.md#meaningful-documentation

Cut one admitted genus-zero annular mesh into a private four-sided disk along existing source edges. Supply two disjoint oriented boundary cycles and their endpoint identities in the millimetre chart. Return the resulting bottom and top cycles and duplicated left and right seam. Invalid incidence, collapsed edges or an intervening boundary contact throw.

## @evidence contracts/development/implementation.md#principled-implementation

Use positive physical edge lengths to find an admitted seam between the declared endpoints. Separate cut-side vertex occurrences while retaining original physical keys. The atlas uses this path for ordinary two-boundary components with one cut on each plane.

## @evidence contracts/development/implementation.md#efficient-algorithms

Build edge incidence once and use a heap for the finite seam search. Copy the mesh for the explicit seam cut and duplicate only the required boundary occurrences.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.analyzeMultiBoundaryChart

## @evidence contracts/development/common.md#meaningful-documentation

Prepare a private disk from an orientable genus-zero component with multiple boundaries by choosing cuts between its observed cycles. Positions and measured cut lengths are in millimetres. Preserve source keys across duplicated cut banks. An invalid topology or incomplete safe cut throws through the supplied diagnostic policy.

## @evidence contracts/development/implementation.md#principled-implementation

The multi-boundary owner derives the chart from the same oriented incidence and cycle measurements used before selecting its cut forest. Duplication changes the chart's connectivity while retaining its observed physical vertices. observeRecoveryAtlas routes a coherent multiple-boundary component here when a single ordinary annulus rule does not apply.

## @evidence contracts/development/implementation.md#efficient-algorithms

Build component and boundary incidence once for the cut choice. Retain copies of the selected chart and its mapped keys, while the source mesh and its original arrays stay with the caller.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.prepareChartCollar

## @evidence contracts/development/common.md#meaningful-documentation

Partition the unit UV square into a rectangular boundary collar and local leaves. Supply side knots in bottom, right, top and left order, increasing along chart u or v. Optional splits address an existing leaf with a global UV position. Invalid coverage, collapsed bounds or exhausted leaf budget throw.

## @evidence contracts/development/implementation.md#principled-implementation

Form a positive inner frame from admitted side intervals. Keep each outer leaf edge inside its boundary knot interval and admit splits strictly inside their selected leaf. Chart fitting reads those physical correspondence charts through the resulting unit-domain leaf bounds.

## @evidence contracts/development/implementation.md#efficient-algorithms

The initial leaf population is bounded by the total side span count plus five. Store leaves by stable key and replace one leaf per split. The result contains only UV partitions, without fitting coefficients.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.collectChartAreaObservations

## @evidence contracts/development/common.md#meaningful-documentation

Integrate physical-area weighted positions from affine source triangles over a bounded, nonoverlapping unit-chart partition. Supply millimetre positions, UV triangles and tensor knots or explicit leaves. Optional physical-gradient observations carry the supplied exchange length in millimetres. Invalid coverage or unresolved observation limits throw.

## @evidence contracts/development/implementation.md#principled-implementation

Clip each positive oriented UV triangle at the leaf boundaries. A seven-by-seven Gauss rule after the Duffy transform integrates the squared bicubic-minus-affine residual to its required degree in real arithmetic. For derivative rows the source physical chart and leaf scales define local operator directions. The chart leaf fit consumes those weighted rows.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuse the physical-gradient frame for all quadrature nodes of one clipped triangle and leaf. A row limit bounds emitted observations and no source triangle array is published.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.streamChartFitRows

## @evidence contracts/development/common.md#meaningful-documentation

Yield one finite chart position row and, when supplied, two physical-gradient rows. Invalid UV or physical position throws before the first row. Invalid operators, targets or unrepresentable derivative coefficients or mass throw at the affected row. Rows already delivered retain their values.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluate tensor Bernstein position weights at the sample. Parameter derivative weights carry their signed physical operator terms and the supplied exchange length. The fit keeps the derivative target distinct from the position box and reports row mass for origin translation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Produce one position row and at most two derivative rows. No full normal matrix or other sample population is retained by the generator.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.assembleRecoveryChart

## @evidence contracts/development/common.md#meaningful-documentation

Assemble fitted chart coefficients through the declared shared boundary registry. A common oriented boundary interval reuses its coefficient IDs, including reversed uses. Records list unmatched spans when neighboring partitions differ. Conflicting values at one declared address throw.

## @evidence contracts/development/implementation.md#principled-implementation

Map oriented piece knots to their stored canonical positions, using a single owner for corner evaluation and coefficients. Intrinsic chart fitting and physical transverse joins remain separate from matching those IDs. The atlas publisher uses this assembly to hand owned geometry to Engine realization.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuse registry maps for shared controls and declared endpoint evaluations. Sibling patches refer to owned control indices instead of copying every boundary row.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.createChartBoundary

## @evidence contracts/development/common.md#meaningful-documentation

Create a boundary owner for one fit policy in millimetres. For each declared physical path, return a fitted cubic and its normalized phase registration. Reversed paths share the canonical fit. A conflicting measurement for an existing path throws. Keep the owner alive across all chart requests in the selected network.

## @evidence contracts/development/implementation.md#principled-implementation

Register corners by physical key, canonicalize the path orientation and fit its ordered observations once. Reversing the path reverses its oriented coefficients and parameters while preserving the canonical authority. The common boundary network passes one complete maximal arc per request.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cache fitted boundaries and corners under their physical identities only. Reuse a stored fit when the same path or its reversal is observed.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.augmentChartBoundaryNetwork

## @evidence contracts/development/common.md#meaningful-documentation

Insert registered base-edge cuts into the copied chart banks. Use registry state from the same boundary selection. Preserve original triangle order where faces are split and return the maximum measured point displacement in millimetres. Invalid ancestry, reversed incidence or a collapsed refined triangle throws.

## @evidence contracts/development/implementation.md#principled-implementation

Update the prepared chart's incidence as a cut reaches each declared base edge, preserving split orientation and original physical keys. The next boundary binding stage consumes those copied triangles and side paths.

## @evidence contracts/development/implementation.md#efficient-algorithms

Track cut and edge memberships by key. Retract and insert only incident faces where a registered cut applies instead of rebuilding untouched face groups.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.bindChartBoundaryNetwork

## @evidence contracts/development/common.md#meaningful-documentation

Bind the augmented chart sides to fitted maximal physical arcs. Supply the same registered selection used for augmentation. Return each oriented side with piece authority and normalized phase. Ambiguous or collapsed graph segments throw.

## @evidence contracts/development/implementation.md#principled-implementation

Break physical edges at original quarter boundaries, degree changes and changes in incident chart sets. Add stable anchors on closed or returning chains so each arc has endpoints. Request one canonical fit per arc and map all oriented side uses to the retained coefficients.

## @evidence contracts/development/implementation.md#efficient-algorithms

Build one physical edge graph and visit each admitted arc once. Reuse fitted coefficients and their phase on every bank rather than fitting each side independently.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.createChartBoundaryNetworkRegistry

## @evidence contracts/development/common.md#meaningful-documentation

Create the registry for one selected boundary network. Borrow its millimetre inputs and copy chart banks for later augmentation. Canonicalize insertion fractions under ordered base-edge identities. Conflicting keys, invalid insertion provenance or ambiguous chart identity throw.

## @evidence contracts/development/implementation.md#principled-implementation

Index declared cuts by undirected base edge and canonical fraction, associating aliases under their declared identity. Store the copied chart observations and physical endpoints used by augmentation and binding.

## @evidence contracts/development/implementation.md#efficient-algorithms

Collect provenance and chart addresses in keyed maps once. Later cut and side stages share the resulting registry instead of searching the original chart selection again.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.solveChartBox

## @evidence contracts/development/common.md#meaningful-documentation

Minimize a supplied sparse Gram quadratic on three original-coordinate control bounds. Supply finite ordered endpoints, an exactly symmetric finite Gram matrix with nonnegative diagonal, three finite right-hand-side axes per control, a positive safe attempt cap and a finite nonnegative gradient tolerance. Omitted initial values start at projected zero. Supplied warm values must be finite and feasible. The result reports the best retained iterate and its projected gradient even after cap exhaustion. Malformed input or an unrepresentable Gram row norm throws.

## @evidence contracts/development/implementation.md#principled-implementation

Apply diagonal congruence scaling for the projected FISTA steps, using objective-based restart where needed. Check reciprocal sparse entries and exact zero rows before optimization. Termination evaluates the original-coordinate projected gradient; an exhausted budget remains visible as incomplete.

## @evidence contracts/development/implementation.md#efficient-algorithms

Use sparse row maps, diagonal scaling and bounded projected proposals. Retain the best finite iterate and current momentum state without forming a dense Gram matrix.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.relateChartControls

## @evidence contracts/development/common.md#meaningful-documentation

Flatten acyclic relations over valid original control IDs. Supply finite fixed positions and signed weights, a positive safe term cap and a nonnegative safe depth cap. Return millimetre constants and surviving independent coefficients after duplicate combination and exact zero cancellation. Cycles, conflicts, exhausted work and nonfinite composition throw.

## @evidence contracts/development/implementation.md#principled-implementation

Resolve dependencies in topological order, multiplying each source expression by its declared coefficient. Preserve provenance before folding fixed terms into constants. A declared dependency participates in cycle validation even when its coefficient later cancels. Chart leaf controls rely on this substitution before sparse fitting.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuse each resolved expression. The depth and term limits bound intermediate flattening, and the result retains independent source IDs without a second compact registry.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.prepareChartFit

## @evidence contracts/development/common.md#meaningful-documentation

Admit one chart enclosure, control registry and weighted observations before building a sparse fit. Positions and enclosure use millimetres. The returned preparation carries the origin and scale that normalize the fit. An unrepresentable box, bad identities or invalid weights throw.

## @evidence contracts/development/implementation.md#principled-implementation

Derive a common origin and scale from the physical box, and verify each patch's sixteen control identities. Normalize supplied constraints for the same chart used by assembly and solving. The chart fitter passes this receipt to both system construction and publication.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepare the geometry scale, control mappings and observation mass once. Later rows and diagnostics reuse those values without rebuilding the enclosure.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.createChartFitReport

## @evidence contracts/development/common.md#meaningful-documentation

Measure a solved chart's original weighted errors in millimetres. Report the first strict worst witness, numerical optimality, and the solver's work. Keep the separate physical-gradient contribution visible when present.

## @evidence contracts/development/implementation.md#principled-implementation

Reevaluate physical sample rows against the solved registry. Record the maximum only on a strict increase so tied worst values keep their first witness. The leaf fitter uses the resulting original-area position values when deciding whether refinement improved.

## @evidence contracts/development/implementation.md#efficient-algorithms

Traverse the stored observation rows once for metrics and witness. Return a report instead of retaining fitted residuals per sample.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.createFeatureChartCuts

## @evidence contracts/development/common.md#meaningful-documentation

Split an oriented private source mesh along declared feature edges. Use original occurrence IDs for topology and physical keys for equal positions in millimetres. Report cut banks, input face lineage and any measured midpoint displacement bounds. Malformed incidence, topology or collapsed refinement throws.

## @evidence contracts/development/implementation.md#principled-implementation

Split incident face fans along validated feature edges. Where both banks would share their endpoint ordinals, insert the same conforming midpoint before fan duplication. Verify oriented links and extract maximal seams with both true bank incidences. Feature preparation consumes these charts for subsequent disk admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

Build the private incidence and keyed cuts once per selection. Subdivide only collisions, and retain one midpoint per declared edge. The output carries observed charts without generating a fitted mesh.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.solveChartFit

## @evidence contracts/development/common.md#meaningful-documentation

Solve the prepared chart's sparse bounded control problem and reconstruct its original millimetre coefficient registry. A warm start, when supplied, must be finite and inside the original enclosure. A nonrepresentable or unqualified reconstruction throws.

## @evidence contracts/development/implementation.md#principled-implementation

Solve in the normalized chart box, recover independent controls at the original origin and scale, and evaluate each declared affine dependency. Reuse the previous enclosure for accepted refinement. The fit reporter evaluates those recovered physical coordinates.

## @evidence contracts/development/implementation.md#efficient-algorithms

Use one sparse solve and one pass over the registered controls to expand affine entries. Fixed controls and supplied prolongation avoid redundant scalar unknowns.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.createChartFitSystem

## @evidence contracts/development/common.md#meaningful-documentation

Assemble weighted sparse normal equations from admitted chart correspondence rows. Include optional signed physical-gradient observations in the same declared units. Keep rank results and unsupported information separate from the numerical system. Malformed chart-local rows throw.

## @evidence contracts/development/implementation.md#principled-implementation

Accumulate coefficient pairs after substituting the declared affine control expressions and contributions of fixed controls. Translate position observations using row mass while preserving derivative targets under their operator. Apply the bounded rank calculation to the original reduced design.

## @evidence contracts/development/implementation.md#efficient-algorithms

Stream each position or derivative row into sparse Gram storage. Retain the row information needed for later physical reporting and bound the independent rank-diagnostic population.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.assembleChartLeaf

## @evidence contracts/development/common.md#meaningful-documentation

Publish a fitted rectangular leaf atlas using declared canonical boundary intervals. Outer edges carry the original fitted boundary span and orientation. Internal master edges keep their fitted coefficient owners. Incompatible declarations or restrictions throw.

## @evidence contracts/development/implementation.md#principled-implementation

Use the leaf layout's original control registry for positional masters and bind fine intervals to their enclosing canonical edge. Keep each chart's analytic normal fan separate. The chart assembler chooses this route for a leaf-layout result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cache owned shared endpoint and edge coordinates by canonical identities. Each emitted patch references the registered controls and interval associations.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.createChartLeafControls

## @evidence contracts/development/common.md#meaningful-documentation

Define bicubic control relations for a complete axis-aligned unit-square leaf partition. Shared UV endpoints identify common controls. Fine subdivisions of one master boundary use its restriction. Invalid coverage, nonnested overlaps, inconsistent equations or exceeded control counts throw.

## @evidence contracts/development/implementation.md#principled-implementation

Inspect atomic intervals for one exterior or two opposed interior incidences. Use de Casteljau restriction for fine spans and one expression for each common endpoint. Disjoint spans retain their own cubic handles. The leaf fitter uses these relations for C0 positional coupling.

## @evidence contracts/development/implementation.md#efficient-algorithms

Build one registry of master intervals and vertices. A fine interval stores sparse relations to a master, and each leaf keeps only four independent interior controls.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.fitChartLeaf

## @evidence contracts/development/common.md#meaningful-documentation

Fit a boundary collar and its bicubic leaf fields to observed piecewise-linear source positions. Supply a chart enclosure and fit, row and refinement budgets. An optional millimetre exchange length adds physical-gradient rows. Attempted refinements retain the previous candidate unless the objective improves without increasing original position RMS.

## @evidence contracts/development/implementation.md#principled-implementation

Start from admitted boundary knots, couple hanging controls and solve the physical-area objective on each chart partition. Adaptive splits use the observed worst witnesses and close opposite interfaces. Reuse the original enclosure and preserve a previous solution after infeasible or exhausted refinement.

## @evidence contracts/development/implementation.md#efficient-algorithms

Stream weighted area observations and optional derivatives into the bounded sparse fit. Retain at most the preceding and candidate fields needed to decide refinement, rather than a history of rejected candidates.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.createChartPhysicalJet

## @evidence contracts/development/common.md#meaningful-documentation

Build two physical tangent observation directions for one affine source triangle and a leaf. Supply millimetre vertices, positive-oriented UV coordinates and a positive leaf. The exchange length converts the derivative targets to millimetres. Unresolved geometry or arithmetic throws.

## @evidence contracts/development/implementation.md#principled-implementation

Thin QR of the physical edges supplies the orthonormal frame and triangular change of basis. Apply its inverse to UV edges and the leaf scales to obtain derivative weights. The area observation generator reuses this frame for quadrature nodes inside the clipped triangle.

## @evidence contracts/development/implementation.md#efficient-algorithms

Factor two physical edge columns and form two fixed derivative directions. Reuse one output for all nodes associated with that source-triangle and leaf pair.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.closeChartRefinement

## @evidence contracts/development/common.md#meaningful-documentation

Split a unit-square rectangular leaf and propagate opposite interface endpoints until every shared interval is nested or disjoint. Use global UV split positions and stable leaf IDs. Invalid coverage, colliding child IDs or an exceeded leaf budget throw without changing the input.

## @evidence contracts/development/implementation.md#principled-implementation

An endpoint sweep establishes one complete covering partition. Each proposed split carries an existing interior endpoint into an opposing leaf only where partial overlap requires it. Keep bounds and child ancestry exact in the interval chart.

## @evidence contracts/development/implementation.md#efficient-algorithms

Index endpoints and order leaves deterministically. Split only touched leaves, checking the requested budget before adding their children.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.createEventRegion

## @evidence contracts/development/common.md#meaningful-documentation

Prepare private scalar-clipped source-cell observations. Keep the supplied source incidence and heights unchanged across queries. Each query supplies the complete original face population intersecting its closed interval in ascending order. Results report unclassified connectivity, boundary and contact evidence.

## @evidence contracts/development/implementation.md#principled-implementation

Use the closed interval to clip original face barycentric domains. Original edges follow declared raw or canonical incidence, while cut edges use face occurrences. The atlas source pass reuses the region owner before topology and later chart qualification.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepare immutable source ranks and edge incidence once. Each query builds fresh private cells only for its candidate population and leaves original triangles outside the result.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.createEventRegionCells

## @evidence contracts/development/common.md#meaningful-documentation

Clip the supplied ordered original faces against finite closed scalar bounds in one prepared event-region source. Return temporary private cells and their original face and edge associations. Invalid bounds, candidate addresses or lost source-edge support throw.

## @evidence contracts/development/implementation.md#principled-implementation

Intersect each face's barycentric domain with both scalar limits. Preserve original vertices and interpolation addresses on the producing source edge. Do not weld independent cut-face incidences. Topology consumes these associations before creating ports.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visit each candidate once and clip its bounded face polygon. Key intersection witnesses in the query-local registry so later stages reuse their addresses.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.createEventRegionPorts

## @evidence contracts/development/common.md#meaningful-documentation

Attach observed boundary ports and contacts to a classified private connectivity query. Use the same source, cell and topology records. Return original support and qualification reasons; port metadata alone carries no fitted chart.

## @evidence contracts/development/implementation.md#principled-implementation

Read higher-dimensional ownership and the cut-plane strata established by the query. Attach only observed source occurrences to ranked components, retain unresolved contacts and preserve source ancestry for the atlas chart selection.

## @evidence contracts/development/implementation.md#efficient-algorithms

Use the completed component maps and cell incidence. Build the supporting port and contact records from indexed observations without repeating source clipping.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.createEventRegionSource

## @evidence contracts/development/common.md#meaningful-documentation

Prepare source incidence, exact duplicate/collapse evidence and scalar ranks for reusable event-region queries. Supply ordered source geometry and aligned finite millimetre heights. Malformed source addresses or inconsistent scalar data throw.

## @evidence contracts/development/implementation.md#principled-implementation

Index declared raw or canonical edge incidence and classify source rank using stored binary64 coordinates. Preserve each face's original address for queries. The event-region creation stage retains this immutable preparation across cell passes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Process the vertex and face populations once and retain keyed edge and address tables. No per-interval cell geometry is allocated during source preparation.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.createEventRegionTopology

## @evidence contracts/development/common.md#meaningful-documentation

Describe components and boundary incidence in one clipped cell query. Report orientability, vertex links, cycles and local unsupported conditions from the supplied private incidence. Keep topology and later chart qualification separate.

## @evidence contracts/development/implementation.md#principled-implementation

Traverse shared observed edges and links to assign components and orientation parity. Check local degeneracies and follow supported boundary incidences. The next port stage consumes this topology to attach original support.

## @evidence contracts/development/implementation.md#efficient-algorithms

Follow each recorded incidence and component link in the current query. Reuse cell and source address maps instead of reclipping the source.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.computeAtlasObservationNormals

## @evidence contracts/development/common.md#meaningful-documentation

Compute one unnormalized oriented face cross product in original triangle order. Supply indexed source positions in millimetres. Each output vector has square-millimetre components and magnitude twice the face area.

## @evidence contracts/development/implementation.md#principled-implementation

Subtract the two sides from the first source vertex and take their cross product in the original winding. The atlas crease observer uses these products and their norms to measure source dihedral angles.

## @evidence contracts/development/implementation.md#efficient-algorithms

Read each face once and return one three-component vector. No face connectivity or unit-normal population is built.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.extractFeatureChartSeams

## @evidence contracts/development/common.md#meaningful-documentation

Describe maximal declared feature paths and both coherent cut banks. Supply the prepared original edge, face and occurrence associations. Return source lineage along each path so its reverse bank retains the same physical identity.

## @evidence contracts/development/implementation.md#principled-implementation

Follow degree-two feature runs until a real boundary, a junction or the closure of a loop. Follow each bank's preserved incidence and require coherent opposed boundary direction. Feature preparation later reuses these bank identities in its shared network.

## @evidence contracts/development/implementation.md#efficient-algorithms

Walk feature graph edges by keyed incidence. Each maximal route is recorded once with its two source banks.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.subdivideFeatureChartCuts

## @evidence contracts/development/common.md#meaningful-documentation

Insert conforming midpoint observations along colliding declared feature edges. Positions and displacement bounds use millimetres. Keep source face and physical key lineage across the split. A rounded midpoint that collapses to an endpoint fails through the supplied handler.

## @evidence contracts/development/implementation.md#principled-implementation

Represent each binary64 endpoint coordinate in integer subnormal units and compute the exact half-sum. Round midpoint coordinates to nearest-even and bound displacement upward. Subdivide both incident copies at the same registered midpoint.

## @evidence contracts/development/implementation.md#efficient-algorithms

Order collisions deterministically and reuse one midpoint record per feature edge. Split affected face occurrences and keep the original mesh with the caller.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.prepareFeatureChart

## @evidence contracts/development/common.md#meaningful-documentation

Prepare private four-sided charts from the declared feature-cut source. Keep original face and physical key ancestry in millimetres. Closed or unqualified components and exhausted chart capacity remain explicit unsupported records.

## @evidence contracts/development/implementation.md#principled-implementation

Split the declared feature banks, use a cut forest for components with multiple boundaries and prepare the resulting disk's four sides. Map duplicated occurrences back to original physical keys, keeping each piece pending for the chart batch.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepare features once and stop admitting charts at the supplied count. Preserve earlier finite siblings and report each outside the prepared prefix.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.createObservationPolicy

## @evidence contracts/development/common.md#meaningful-documentation

Project an input onto the declared saved observation policy. Retain explicit values and vector references. An omitted optional critical policy stays absent. Source geometry and extra runtime properties stay with the caller.

## @evidence contracts/development/implementation.md#principled-implementation

Build an explicit field list instead of spreading the source record. The test supplies otherwise identical inputs with and without critical policy and compares the exact persisted policy shape.

## @evidence contracts/development/implementation.md#efficient-algorithms

Create one fixed-size policy object without copying geometry or converting coordinates.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.encodeDiagnosticNumber

## @evidence contracts/development/common.md#meaningful-documentation

Encode computed `NaN`, positive infinity and negative infinity as distinct JSON strings. Preserve finite measurements in their original units and signed zero in memory.

## @evidence contracts/development/implementation.md#principled-implementation

Select the `NaN`, `+Infinity` or `-Infinity` sentinel before JSON serialization, where a raw nonfinite number would become null. A feasible report uses this mapping and keeps unavailable observations as actual null.

## @evidence contracts/development/implementation.md#efficient-algorithms

The conversion is constant-size and does not recalculate the source measurement.

# src/observation/AutoMovieRecoveryObservation.ts#AutoMovieRecoveryObservation.filterImageGaussian

## @evidence contracts/development/common.md#meaningful-documentation

Filter a borrowed finite row-major grayscale raster with sigma in pixels. Omit derivative to smooth; select `x` or `y` for a first derivative along that pixel axis. Return a new raster of the same dimensions. Supply positive dimensions, matching storage and positive sigma.

## @evidence contracts/development/implementation.md#principled-implementation

Sample the normalized Gaussian to round(4 sigma), apply half-sample reflection and perform vertical then horizontal passes. A derivative mode substitutes the corresponding analytic sampled derivative on one axis. The impulse test checks g(0)^2 at the centre and −g(0)g(1) one pixel to the right.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuse one-dimensional kernels across both passes, with one intermediate raster and one owned result. The separable calculation avoids a two-dimensional kernel traversal at every pixel.
