# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.projectMapPoint

## @evidence contracts/development/common.md#meaningful-documentation

The caller contract gives camera-frame depth and translation, left rotation in radians and a world-frame point Jacobian, together with projection refusal and arithmetic failure.

## @evidence contracts/development/implementation.md#principled-implementation

One common `R p + t` transform gives the camera point. Its pinhole gradient includes normalized coordinates and the negative depth derivative. Multiplying that gradient by minus the skew matrix of the rotated point yields the left-rotation derivative. Multiplying by the pose matrix gives world-point derivatives. The camera-frame translation derivative is the gradient itself.

## @evidence contracts/development/implementation.md#efficient-algorithms

The operation uses one matrix-vector product and a fixed-size pixel Jacobian. Both derivative orders share the calibrated base chart. A call owns its projection and does not retain the pose.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.stepMapPose

## @evidence contracts/development/common.md#meaningful-documentation

The method accepts an absolute map pose and six local step coordinates, separating radians from reconstruction-frame camera translation units.

## @evidence contracts/development/implementation.md#principled-implementation

The rotation-vector norm is converted to degrees for the Engine quaternion constructor, and the unit quaternion then rotates each row-major matrix column from the left. Translation uses the three independent additive camera coordinates. The six-coordinate shape is checked before use.

## @evidence contracts/development/implementation.md#efficient-algorithms

The update rotates three columns and emits a matrix and translation once, with fixed allocations and no pose retention.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.stepRelativePose

## @evidence contracts/development/common.md#meaningful-documentation

The method describes a left rotation in radians and two coefficients in the supplied translation tangent basis, returning a normalized direction and naming invalid-step and collapsed-direction outcomes.

## @evidence contracts/development/implementation.md#principled-implementation

The shared left rotation acts on camera axes. The tangent offsets are added to the original translation, then divided by the new positive norm. This preserves unit direction rather than the independent additive translation used by the absolute map pose. A zero translation after the step has no unit direction and throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

The step rotates the three matrix columns once and computes one tangent combination and norm. The returned pose owns its arrays.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.admitCameraMap

## @evidence contracts/development/common.md#meaningful-documentation

The admission contract names the ordered triad, the independent first-two seed pixel cap, the aggregate map pixel cap, and rejection before extraction.

## @evidence contracts/development/implementation.md#principled-implementation

The map validates both sets of controls and passes the fixed triad to shared resident view admission. The shared preflight checks three unique sources and applies the seed cap at the second view and the aggregate cap across all three. The singleton triad test preserves sparse evidence under exact low caps while malformed inputs refuse before callbacks.

## @evidence contracts/development/implementation.md#efficient-algorithms

The preflight visits view metadata once and constructs one calibration matrix and inverse per admitted view. Resection and joint fitting reuse the three charts.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.admitCameraPair

## @evidence contracts/development/common.md#meaningful-documentation

The pair operation names the two ordered views, supplied pinhole convention, admitted pixel count and the invalid data that can refuse before extraction.

## @evidence contracts/development/implementation.md#principled-implementation

The owner checks the exact pair count, schema and seed controls. Shared admission validates scene assertions, exact RGB8 populations and unique identities, and applies the pair pixel cap before constructing supplied charts. A malformed pair has no observation evidence; a geometrically refused pair can keep complete sparse evidence.

## @evidence contracts/development/implementation.md#efficient-algorithms

The preflight reads the two raster lengths without copying pixels and constructs both charts once. The estimator reuses them during consensus.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.admitCameraScene

## @evidence contracts/development/common.md#meaningful-documentation

The scene contract states its variable admitted view count, the source-order pinhole charts, and the separate seed and aggregate limits.

## @evidence contracts/development/implementation.md#principled-implementation

The scene checks its own count, seed controls, and inherited map and incremental budgets. The shared preflight admits every later view using the same metadata and raster rules as the seed views. The scene fixture checks malformed fourth views and retains three valid boundary views in input order.

## @evidence contracts/development/implementation.md#efficient-algorithms

The preflight bounds the view count before retaining chart records, checks pixels and identity in a single scan, and builds each chart once for later registration.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.createCameraChart

## @evidence contracts/development/common.md#meaningful-documentation

Construct row-major pinhole calibration and analytic inverse from admitted focal lengths, skew and principal point in pixels. Integer coordinates identify pixel centres. Nonpositive focal lengths or pixel increments lost in the binary64 round trip throw.

## @evidence contracts/development/implementation.md#principled-implementation

Solve the upper triangular pinhole model directly to obtain the inverse. Compare the origin, adjacent axes and far pixel locations under the forward/backward map. The dyadic camera chart test independently solves u=4x+2y+2 and v=8y−1, and a wide principal offset exposes the lost increment.

## @evidence contracts/development/implementation.md#efficient-algorithms

Build two fixed nine-value arrays and check five chart positions, independent of image pixel count. No image bytes are read.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.createCameraEstimate

## @evidence contracts/development/common.md#meaningful-documentation

Qualify the relative pose of two admitted calibrated views from their tentative correspondences. The accepted record contains measured consensus and a transform in the first camera's unit-baseline gauge. A refusal keeps its reasons and measured observations. Progress callback errors propagate.

## @evidence contracts/development/implementation.md#principled-implementation

Fewer than eight matches supply a recorded early refusal. Higher populations run fixed-budget epipolar consensus, refinement, cheirality, parallax, residual and homography gates. Consensus and match support remain observable across final refusals. The scene seed fixture checks an accepted record containing its gauge, pose and measured support.

## @evidence contracts/development/implementation.md#efficient-algorithms

Initialize each source, feature and match receipt once. Run later gate work only for available supports. Numeric search budgets cap proposals and the result owns its metadata without retaining source raster bytes.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.createCameraMap

## @evidence contracts/development/common.md#meaningful-documentation

Initialize a sparse map from three admitted charts and their observed feature pairs. Views zero and one provide the conditional unit-baseline seed. Resection uses only seed-supported landmarks. Returns accepted, seed-only or refused geometry with explicit reasons and fitting diagnostics.

## @evidence contracts/development/implementation.md#principled-implementation

Qualify seed pose, triangulate the approved seed tracks, then fit the third camera against these original landmarks. Joint fitting uses seed observations and admitted third-view resection inliers. The registered observations therefore cannot alter the seed points before resection qualifies that camera.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuse the extracted populations and match graph. Skip resection and joint fitting if the seed refuses. Fixed landmark, resident storage and proposal limits bound the accepted population.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.createCameraScene

## @evidence contracts/development/common.md#meaningful-documentation

Grow one sparse component from globally linked calibrated observations. Start with source views zero and one. Omit optional feasible settings to use the default joint fitting route. Each accepted pose, point and observation shares the unit seed-baseline gauge. Failed candidates retain the prior component and report why growth stopped.

## @evidence contracts/development/implementation.md#principled-implementation

Withhold conflicting transitive track components before seed fitting. A candidate resects against retained points, stages observation and landmark growth, and joins only after a complete fit passes. The five-view fixture demonstrates a registration chain whose later landmarks lacked seed visibility. The feasible routing test verifies the last committed component survives a later resident-cap refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuse one global track population and one committed state. A candidate fit stages only its transaction. Separate counters charge spent work and avoid publishing refused geometry.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.createImageDirectionSolver

## @evidence contracts/development/common.md#meaningful-documentation

Factor two finite direction columns and return their singular-value ratio and reusable least-squares solve. Supply the caller's admission ratio. A weak direction system throws. Each solve takes one value per direction in the original view order and returns two coordinate coefficients.

## @evidence contracts/development/implementation.md#principled-implementation

Reorthogonalized Gram–Schmidt forms the two-column QR design. The singular ratio derived from the scaled R entries measures rank without squaring the design. The right-hand-side routine applies the same orthogonal factors and substitutes through R. The image silhouette fit uses this to recover two section coordinates.

## @evidence contracts/development/implementation.md#efficient-algorithms

Keep two orthonormal columns and the three triangular coefficients. Each solve does one dot-product traversal over view order and a constant-size substitution.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.createPoseModel

## @evidence contracts/development/common.md#meaningful-documentation

Build the pixel epipolar matrix and five local derivatives from a near-unit two-view translation. Rotation acts on the left in radians. The returned tangent basis gives the two dimensionless translation increments. Unresolved or nonunit gauge throws.

## @evidence contracts/development/implementation.md#principled-implementation

Project the least-aligned coordinate axis onto the tangent plane and pair it with the cross product. Combine the essential matrix and its five variations with the inverse camera charts. The dyadic pose fixture checks all entries against independent matrix products and refuses a nonunit baseline.

## @evidence contracts/development/implementation.md#efficient-algorithms

Use a fixed three-axis basis search, then construct six fixed-size matrices. The returned arrays are independent of the borrowed camera charts.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.linearizePoseResiduals

## @evidence contracts/development/common.md#meaningful-documentation

Evaluate signed pixel Sampson residuals and their five-coordinate Jacobian for ordered paired image points. Each row differentiates both epipolar incidence and normal length. Mismatched pairs, an incompatible model or undefined epipolar lines throw.

## @evidence contracts/development/implementation.md#principled-implementation

Compute both lines and their joint norm, then apply the quotient derivative for each of the five model matrices. The analytic sideways-shift fixture gives −1/sqrt(2) pixels. A perturbation proportional to the fundamental matrix has zero derivative because its scale cancels.

## @evidence contracts/development/implementation.md#efficient-algorithms

Transpose the model and derivative matrices once. One pass through the pairs emits a residual and five derivatives per observation for the pose refiner.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.linearizeFeasibleMap

## @evidence contracts/development/common.md#meaningful-documentation

Linearize the robust camera-map objective and each retained pixel-error disk. Camera step coordinates precede three coordinates per landmark. The objective uses squared pixels; the inequality and its offset are dimensionless. A nonpositive point depth, unresolved seed tangent or an already infeasible pixel observation throws.

## @evidence contracts/development/implementation.md#principled-implementation

Project each registered observation in the gauge-fixed chart, derive the robust objective contribution and form the disk row from squared pixel distance divided by its squared limit. The first camera contributes no adjustable pose and the seed translation uses its tangent basis. The feasible map refiner consumes these original physical rows.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visit each retained landmark observation once. Store camera and affected point coefficients rather than a dense landmark-width row for every observation.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.refineCameraMap

## @evidence contracts/development/common.md#meaningful-documentation

Refine registered cameras and landmarks in one gauge using their fixed pixel observations. The first pose must be identity. The seed translation keeps its near-unit radius, and later translations are unrestricted. Omit feasible options for robust local least squares. Explicit feasible options select the hard-pixel route. Invalid population, gauge or resident limits throw.

## @evidence contracts/development/implementation.md#principled-implementation

Use one objective for the original population across trials, applying the first-camera and seed constraints before solving. The optional feasible route is dispatched before baseline design work. The five-view fixture exercises the default fit, and its feasible routing counterpart exercises the explicit route under the same scene visibility and ceilings.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuse fixed observations and eliminate independent point blocks. Policy and budget cap iterations and retained entries. Return one retained fit state and diagnostics rather than every attempted geometry.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.refineCameraMapFeasible

## @evidence contracts/development/common.md#meaningful-documentation

Refine an admitted sparse map under hard pixel-error limits and the original robust objective. The first camera stays fixed and the seed translation keeps its current admitted radius. Report whether normal pixel KKT is qualified and whether another geometry gate blocked the fit. Request lagged Lagrangian curvature only with SQP acceleration. The caller decides whether to commit the result.

## @evidence contracts/development/implementation.md#principled-implementation

Use explicit unweighted pixel inequalities with the original robust weights applied to the objective. Every trial is checked against the actual pixel disks and nonpixel geometry gates. Preserve the current-radius chart, conditional curvature and diagnostic provenance. The feasible routing fixture retains the accepted parent after a candidate resident refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Charge bounded directional, row and resident work before allocation or fitting. Retractions and model factors retain compact camera and point blocks, and optional diagnostics project a fixed result instead of keeping a trial trace.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.solveMapDesign

## @evidence contracts/development/common.md#meaningful-documentation

Solve the caller's original least-squares rows for one camera-coordinate step. Supply minus residual as the right-hand side and a dimensionless minimum design ratio. Damping acts in column-normalized coordinates. Negative damping, unresolved original rank or a linear-budget overrun throws.

## @evidence contracts/development/implementation.md#principled-implementation

Measure undamped column scales and original design rank before adding diagonal damping rows. Undo the column scaling after QR substitution. The orthogonal-column fixture gives the original solution (3, 5) and a normalized damping-three solution one quarter as large.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuse one compact undamped factor. Append only diagonal rows when damping is positive, with the retained width and work admitted from the caller's explicit budget.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.solveMapJointStep

## @evidence contracts/development/common.md#meaningful-documentation

Compute a joint camera and landmark step from bounded original-design blocks. Supply fixed gauge camera columns and three point columns per landmark. Damping is nonnegative and cannot admit an unobservable original design. Request metric retention only when the caller has separately admitted its storage.

## @evidence contracts/development/implementation.md#principled-implementation

Point-local Givens QR eliminates each three-coordinate landmark block orthogonally. Camera rows then solve the coupled system before point back-substitution. Existing tests compare a 17-camera-coordinate solve at two damping values against an independently assembled dense design.

## @evidence contracts/development/implementation.md#efficient-algorithms

Eliminate each landmark once and solve only the reduced camera population. The optional retained metric exposes factor actions without storing a dense inverse over all landmarks.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.collectSceneSupport

## @evidence contracts/development/common.md#meaningful-documentation

Group current landmark support by target view for one accepted scene revision. Each retained landmark needs its original linked track. Return target pairs that refer back to the current landmark order; a missing track throws.

## @evidence contracts/development/implementation.md#principled-implementation

Look up each retained landmark by track ID and traverse that track's registered feature observations. Append the candidate view's paired landmark and feature evidence using the current point ordinal. Scene growth calls this after committing each accepted checkpoint.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visit each retained track's observations once per accepted revision. Build view support lists once for reuse across camera selection attempts.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.completeSceneCheckpoint

## @evidence contracts/development/common.md#meaningful-documentation

Complete a detached candidate scene seeded by active views zero and one. Grow admissible points and measurements, then fit the entire retained component in its fixed gauge. Progress and fit observers can abort by throwing. Only a qualified result supplies the caller with a commit candidate.

## @evidence contracts/development/implementation.md#principled-implementation

Each repetition follows strict population growth after a joint fit. Growth remains detached from the previous scene revision. The coordinator commits only an admitted checkpoint; the feasible routing fixture confirms an exhausted candidate preserves the accepted component while keeping its work charges.

## @evidence contracts/development/implementation.md#efficient-algorithms

Spend complete-fit and retained-linear work before running each phase. Strict finite population growth bounds repeated fits, and ordinary calls keep no per-fit observation trace.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.createSceneSeedReportObserver

## @evidence contracts/development/common.md#meaningful-documentation

Create the observer that transfers the latest completed seed fit into the refusal report target. Setup charges 32 linear visits; each before phase prepays a further 64. The matching after phase accepts one completed report by reference without another charge. A failed precharge leaves the prior report intact.

## @evidence contracts/development/implementation.md#principled-implementation

Track before and after phase internally because a later before phase can carry the preceding nonnull report. Only after phase transfers the supplied completed result. The exact-cap fixture prepays a pair, transfers a frozen report at the cap and verifies the following refusal retains it.

## @evidence contracts/development/implementation.md#efficient-algorithms

The closure holds the target, work ledger, budget and one phase bit. It transfers a report reference instead of duplicating large diagnostics.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.evaluateScenePoint

## @evidence contracts/development/common.md#meaningful-documentation

Qualify a proposed landmark in its retained camera gauge. Check positive depth and maximum reprojection error in pixels for every registered observation. Qualify the largest acute supporting ray angle in degrees against the configured parallax threshold. Return reasons for unsupported observations or deficient geometry.

## @evidence contracts/development/implementation.md#principled-implementation

Project against each retained pose and chart rather than inferring support from the seed pair. Rays connect the point to each registered camera centre. The largest acute angle identifies the qualifying pair. A landmark can qualify without either seed view if its observations support it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Project each observation once, then compare pairs of its retained rays. Return the required error and support summary without storing any source pixels.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.growSceneLandmarks

## @evidence contracts/development/common.md#meaningful-documentation

Propose new landmarks and observations from the supplied registered poses. Existing points receive only new positive-depth observations that meet the pixel threshold. A new point must satisfy all of its available registered observations. Duplicate accepted track IDs throw.

## @evidence contracts/development/implementation.md#principled-implementation

Index the accepted landmarks by track ID. Add individually qualified contributions to an existing track or triangulate a new candidate with at least two registered views, then apply full point qualification. The visibility-chain fixture observes newly committed landmarks that were absent from both seed images.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuse the track map to avoid repeated accepted-point searches. Only active candidates allocate new or extended records. Storage and linear work are charged through the scene ledger.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.factorMapMetric

## @evidence contracts/development/common.md#meaningful-documentation

Factor the original-design inverse metric for a gauge-fixed camera and point population. Supply nonnegative damping and the original rank floor. Return metric actions in the input's camera-first physical coordinate order. Unresolved original rank or insufficient capacity throws.

## @evidence contracts/development/implementation.md#principled-implementation

Find local point and reduced camera ranks before forming the damped metric. The factor applies the original column scales on its action boundaries. The coupled-block fixture compares physical inverse norms against its analytic block inverse at zero and positive damping.

## @evidence contracts/development/implementation.md#efficient-algorithms

Keep the small triangular and coupling blocks rather than computing an unconstrained step or dense inverse. The feasible solver reuses them across metric actions.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.mixFeasibleSqpStep

## @evidence contracts/development/common.md#meaningful-documentation

Try the nominal physical blend of the untilted and tilted steps. If it violates an original row, try a larger weight supported by all rows and return the resulting step or a refusal. Use the objective descent and each original constraint offset in the caller's chart.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluate the nominal mixture first, then intersect scalar bounds on the blend coefficient and apply a numerical margin where necessary. Verify the resulting full vector against the original rows. The two-coordinate fixture requires a weight just above one half to fit its first coordinate bound.

## @evidence contracts/development/implementation.md#efficient-algorithms

Use bounded row traversals to compute coefficient bounds and verify one revised mixture. The method retains no trajectory or geometric trial state.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.admitMapCurvature

## @evidence contracts/development/common.md#meaningful-documentation

Check whether requested curvature scratch and retained factors fit simultaneously in the declared resident-entry and linear-work bounds. Return the eligible population size or the fixed fallback and calculated work. Malformed dimensions or ceilings throw before requesting a curvature fit.

## @evidence contracts/development/implementation.md#principled-implementation

Calculate camera, point, observation and retained coefficient populations with explicit fixed and optional parts. The fixture with camera width six, two points and four observations gives 10,060 eligible slots, and a tighter cap retains 356 fixed slots.

## @evidence contracts/development/implementation.md#efficient-algorithms

Use closed-form scalar counts and one fixed 512-visit charge. No geometry or curvature array is allocated to decide eligibility.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.assembleMapCurvature

## @evidence contracts/development/common.md#meaningful-documentation

Assemble the lagged fixed-dual curvature blocks in the original-design scaled coordinates. Supply the retained point population and the qualified prior row multipliers. A nonrepresentable local second derivative returns `null`; mismatched diagnostics or row addresses throw.

## @evidence contracts/development/implementation.md#principled-implementation

Read each admitted pixel observation's first and second projections in its current pose chart, then combine robust and selected inequality curvature under the fixed previous multipliers. Accumulate camera, mixed and point blocks in original column scales. The constrained map refiner consumes the result only when its supporting measurement survives.

## @evidence contracts/development/implementation.md#efficient-algorithms

Stream one observation at a time into its local factors and the reduced camera block. No dense whole-scene Hessian or duplicate source population is retained.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.assertSceneLinearRetention

## @evidence contracts/development/common.md#meaningful-documentation

The operation identifies the scalar-slot unit and requires safe integer dimensions and capacity before design allocation. Equality meets the budget.

## @evidence contracts/development/implementation.md#principled-implementation

The check derives a camera width of six per active view less seven fixed gauge parameters, then counts observation, landmark, reduced-factor and transient scalar slots. Two cameras with no points or observations require 464 slots. Adding one point and one measurement needs 716, and ten transient slots raise it to 726. Unsafe dimensions or totals refuse with the same budget error before design allocation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Evaluate one explicit sizing expression from integer populations. The check needs no matrices or geometry and leaves the caller's ledger unchanged.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.createFeasibleDiagnostics

## @evidence contracts/development/common.md#meaningful-documentation

Copy the fixed diagnostic fields of a completed constrained fit into an owned JSON-safe report. Preserve unavailable fields as null. Represent each computed nonfinite value with its own string sentinel.

## @evidence contracts/development/implementation.md#principled-implementation

Project the fit's counters, termination reasons and measured diagnostics through the diagnostic encoder. The fixed fixture checks known finite values and distinct JSON representations for NaN, signed overflow and unavailable values.

## @evidence contracts/development/implementation.md#efficient-algorithms

Traverse the fixed report structure rather than copying geometry, trial state or raw model arrays. The returned diagnostic footprint is bounded by the record shape.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.createFeasibleSqpArc

## @evidence contracts/development/common.md#meaningful-documentation

Try an affine-QP direction and at most one same-base curvature correction using an admitted feasible model. Positive baseline weights nominate the working set. Every original row and the physical stationarity checks still qualify the result. When auxiliary resources, covector actions or a gate are unresolved, the receipt names the limiting reason.

## @evidence contracts/development/implementation.md#principled-implementation

Use the original rows to select constraints and qualify the untilted step. The accepted mixed direction remains a candidate for the nonlinear trial, whose actual retraction and cost are checked separately. The existing SQP gate fixtures compare same-base baseline, mixed and correction paths under their exact trial limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preflight auxiliary entries and work before folding selected rows. Reuse the fixed model factor and stage only one correction rather than constructing successive trial populations.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.createMapMetric

## @evidence contracts/development/common.md#meaningful-documentation

Retain the scaled upper arrowhead factor of a point-first bundle QR. Supply the independent point blocks, reduced camera block and original column scales in the current chart. Returned actions take camera coordinates first, then three coordinates per point.

## @evidence contracts/development/implementation.md#principled-implementation

Extract upper point triangles and camera couplings from the factor order, attach the matching original column scales, and construct the triangular metric. The joint map step requests this only when its retained metric is needed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Copy the needed upper blocks to one owned factor. Actions reuse point/camera couplings instead of forming an inverse over the complete design.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.createMapTriangularMetric

## @evidence contracts/development/common.md#meaningful-documentation

Bind a point-first upper factor and original positive column scales to physical metric and whitening actions. Vectors put camera coordinates first. Sparse rows carry ordered original column addresses. Invalid factors, width mismatches or a requested unresolved action throw. The optional whitening path can decline an unresolved pivot.

## @evidence contracts/development/implementation.md#principled-implementation

Apply original scales and the point-first triangular factor on every action, then map to the physical order. The explicit coupled test checks transpose action, offset-preserving whitening and backward substitution against independently supplied coefficients.

## @evidence contracts/development/implementation.md#efficient-algorithms

Use local triangular substitutions and sparse point blocks. A row expansion touches its camera portion and only the affected point coordinates.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.describeSceneRegistration

## @evidence contracts/development/common.md#meaningful-documentation

Describe every requested view in input order using the final accepted scene revision and its remaining support lists. Report registered views, insufficient support, a refusal in the current revision, or a view that was never attempted against that revision. Copy recorded refusal reasons.

## @evidence contracts/development/implementation.md#principled-implementation

Index the last attempt for each view. A current pose wins over prior failure. An absent seed causes a not-attempted status; otherwise compare support and confirm the last refusal refers to this revision. The scene publisher attaches these statuses to the final component.

## @evidence contracts/development/implementation.md#efficient-algorithms

Index attempts in one pass and emit one result per view. Use support counts directly instead of revisiting the matching or resection work.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.differentiateMapProjection

## @evidence contracts/development/common.md#meaningful-documentation

Return pixel coordinates, a Jacobian and two Hessians for the current pinhole map. Use `null` tangent for six ordinary camera coordinates, an empty tangent for a fixed camera, or two directions for the seed sphere chart. Rotations use radians, and point coordinates use the map gauge. An unsupported depth or arithmetic returns `null`.

## @evidence contracts/development/implementation.md#principled-implementation

Use the same world-to-camera transform and pixel gradient as first-order projection. Include the derivative of the seed's current-radius normalization when a two-direction tangent is supplied. Require a representable inverse-depth square before constructing curvature. The feasible curvature stage consumes these derivatives only under that admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

Compute the common pixel chart once. Allocate fixed-size derivative rows for the selected local coordinates and the three point axes, independent of scene size.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.factorMapCurvature

## @evidence contracts/development/common.md#meaningful-documentation

Factor a scaled camera/point arrowhead and check whether its fixed physical rows can be whitened. The result reports an admitted metric and rows, or the unresolved point pivot, camera pivot or row action. Malformed shapes and capacities throw.

## @evidence contracts/development/implementation.md#principled-implementation

Eliminate independent point blocks and use their coupling to reduce the camera matrix. Positive resolved pivots and the complete row preflight gate the optional metric. The camera map's lagged curvature route uses the eligible factor without changing its original rows.

## @evidence contracts/development/implementation.md#efficient-algorithms

Retain one compact factored arrowhead. Transform each supplied row once to verify optional whitening rather than materializing a dense whole-scene factor.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.factorMapDesign

## @evidence contracts/development/common.md#meaningful-documentation

Measure independent local observability in a rectangular undamped least-squares design. Supply finite rows and the paired right-hand side, a minimum singular ratio and linear limits. Return owned column scales and the reduced orthogonal factors. Zero or dependent directions and exceeded budgets throw.

## @evidence contracts/development/implementation.md#principled-implementation

Scale original columns to unit norm and factor the design before requiring its minimum singular ratio. The orthogonal-column fixture has original norms sqrt(8) and sqrt(32) and reduced unit directions. The collinear fixture refuses before damping can be considered.

## @evidence contracts/development/implementation.md#efficient-algorithms

Compress the original rows before forming the reusable solve input. Keep the small factor and original scales rather than synthesizing a step or resizing the observation population.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.isMapIdentityGauge

## @evidence contracts/development/common.md#meaningful-documentation

Test the exact fixed first-camera gauge. Rotation must contain the row-major identity and translation must contain three zeros.

## @evidence contracts/development/implementation.md#principled-implementation

Compare exact indexed coefficients and shapes. The fixture checks the exact identity, one changed diagonal and nonzero translation. Scene and map admission use this predicate before fixed-gauge model allocation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Read nine rotation and three translation coordinates once. No conversion or normalization is needed.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.measureFeasibleArithmetic

## @evidence contracts/development/common.md#meaningful-documentation

Bound how much stored binary64 dual weights can change the reconstructed physical step and row prices. Supply validated sparse rows, their actual stored weights and the returned direction. The result gives the outward aggregate, minimum price and gap. A nonpositive exact simplex mass throws.

## @evidence contracts/development/implementation.md#principled-implementation

Combine a sequential multiplication/addition error bound and an absolute subnormal allowance before dividing by the exact stored mass. Compare these bounds with the observed returned-row errors rather than treating the reconstructed dual and actual row action as interchangeable.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scan stored weights and their sparse row coefficients without re-solving a direction. Keep fixed bound summaries instead of duplicating the model or its trial state.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.predictMapDecrease

## @evidence contracts/development/common.md#meaningful-documentation

Predict decrease for an actual increment in the current undamped robust model. Coordinates list camera step first and three values per landmark. Return the negative model change in squared pixel objective units, or null for unrepresentable arithmetic. Wrong widths or original-design row shape throw.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluate the original weighted gradient against the increment and apply the original design separately to each camera/point observation. The fixture's linear term three and original row action two give predicted change −5; a silent row contributes zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Accumulate each original row action once and skip construction of the normal matrix. The agreement model reads only this one scalar prediction.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.prepareCheckpointReportCapacity

## @evidence contracts/development/common.md#meaningful-documentation

Reserve reporting capacity for a direct feasible checkpoint. Charge 256 linear visits against the scene ledger and require an exact identity first pose. Return owned direction options and the reporting cap for the checkpoint population.

## @evidence contracts/development/implementation.md#principled-implementation

The direct checkpoint route supplies its admitted active seed before this call. Copy the requested direction bounds and route the scene and fit resident ceilings to the common report partition. The resulting fit budget leaves space for a diagnostic book even if the fit later refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

Copy only the fixed options record and compute capacity from scalar ceilings. No fit or report array is allocated during admission.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.prepareFeasibleMapReporting

## @evidence contracts/development/common.md#meaningful-documentation

Admit a fixed feasible map's work and reserve its complete diagnostic transfer. Omit report capacity to derive it from the fit's resident cap. Charges apply through the supplied ledger callback. A malformed reporting scope or insufficient retained capacity throws before solving.

## @evidence contracts/development/implementation.md#principled-implementation

First check the full gauge-fixed map population through its work owner. Derive or validate the reporting reserve, compare required retention with the reduced fit allowance and prepay 1,984 reporting visits. The feasible map refiner uses the owned result as its fit preflight.

## @evidence contracts/development/implementation.md#efficient-algorithms

Determine fixed-population capacities before allocation, then retain only a scalar budget receipt. A supplied reporting scope is reused rather than recomputing it.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.prepareFeasibleMapWork

## @evidence contracts/development/common.md#meaningful-documentation

Size numerical storage and work for a fixed map with at least two cameras, six tracked points and a fixed identity first pose. Return original chart and observation counts plus the declared work estimates. Valid population pressure can refuse resident capacity, direction entries or direction work separately.

## @evidence contracts/development/implementation.md#principled-implementation

Count original observations and derive camera width by removing the seven gauge coordinates. Bound model, evaluation and optional agreement storage from the same population. Reject malformed metadata before classifying a valid population as a resource refusal. The feasible scene routing test distinguishes the resident capacity exception from ordinary callback errors.

## @evidence contracts/development/implementation.md#efficient-algorithms

Walk landmark observation counts before admitting any model arrays. Form small sizing records and charge only the corresponding preflight visits.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.prepareFeasibleReportCapacity

## @evidence contracts/development/common.md#meaningful-documentation

Partition a scene and fit resident budget before retaining diagnostic reports. Each persisted report consumes 512 scalar entries, and one more report is reserved for the active report. Return the reduced scene and fit capacity. Malformed limits or an exhausted reserve throw.

## @evidence contracts/development/implementation.md#principled-implementation

Reserve the report capacity from the scene, then limit fitting by both the scene remainder and its own 512-entry reduction. Tests independently check a tight fit budget, a tight scene budget and a 2,048-entry reserve that consumes the whole scene.

## @evidence contracts/development/implementation.md#efficient-algorithms

Compute capacity from two ceilings and a report count. The sizing call allocates no reports, matrices or geometry.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.prepareMapJointBlocks

## @evidence contracts/development/common.md#meaningful-documentation

Prepare bounded original point blocks and the gauge-fixed reduced camera design. Supply finite observation rows, positive local rank limits and declared linear capacity. Return original scales and the factored camera/point inputs. Unresolved original directions or row mismatch throw.

## @evidence contracts/development/implementation.md#principled-implementation

Measure original camera/point column scales and qualify each independent point factor before camera reduction. Local QR preserves the original rank requirement used by joint step and metric preparation. The variable-width test refuses a missing camera direction before damping.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reduce point blocks independently and retain their compact factors. Preflight row, camera and landmark sizes before proceeding to the reduced solve.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.prepareSceneFeasibleRouting

## @evidence contracts/development/common.md#meaningful-documentation

Copy one explicit feasible scene request before user checkpoints. Keep declared budgets for the report and derive an execution budget reserving 64 resident entries. Charge 256 linear visits. Direction bounds must fit declared scene ceilings, and lagged curvature requires acceleration.

## @evidence contracts/development/implementation.md#principled-implementation

Snapshot all scene limits and nested direction options before callbacks can alter them. Clamp the owned fit residency to the reduced execution ceiling. The feasible routing test mutates caller options during progress and verifies its independent request and original reported ceiling.

## @evidence contracts/development/implementation.md#efficient-algorithms

Copy the fixed budget records once at the scene boundary. Reuse the same snapshot for both seed and candidate fits.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.prepareSceneReportCapacity

## @evidence contracts/development/common.md#meaningful-documentation

Reserve fit-report retention inside an admitted scene seed transaction. Charge 256 linear visits, then update the supplied routing record with reporting capacity and a reduced execution budget. A refused reserve leaves the previous routing assignment untouched.

## @evidence contracts/development/implementation.md#principled-implementation

Use the feasible map report partition for one seed plus the maximum number of candidate attempts. Apply the scene reserve before its seed allocation. The coordinator consumes the resulting `routing.reporting` throughout the scene transaction.

## @evidence contracts/development/implementation.md#efficient-algorithms

Compute one fixed reserve from the attempt ceiling. The reservation retains counts only and happens before any report needs storage.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.stepMapSeedPose

## @evidence contracts/development/common.md#meaningful-documentation

Apply a left rotation in radians and two translation coefficients in the supplied seed tangent basis. Normalize the changed translation to the current radius and return an owned pose. A collapsed direction or unresolved seed chart throws.

## @evidence contracts/development/implementation.md#principled-implementation

The left angular part uses the same rotation as ordinary map steps. Translation applies the raw tangent increment then multiplies its unit direction by the original current radius. The z-axis fixture expects a quarter rotation and normalized direction (3,4,1)/sqrt(26).

## @evidence contracts/development/implementation.md#efficient-algorithms

Use one fixed-size pose update and normalization. Original points and other cameras remain with the caller.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.updateRegularization

## @evidence contracts/development/common.md#meaningful-documentation

Update damping after one selected step using its actual-to-predicted decrease ratio. A missing usable agreement keeps the previous damping. The returned receipt records the update and the ratio. Nonpositive current damping throws.

## @evidence contracts/development/implementation.md#principled-implementation

The accepted-radius multiplier is one third at ratio one or higher and otherwise the larger of one third and 1−(2ρ−1)^3. The scalar test checks resulting damping values one, three and 27/8 after full, half and quarter agreement.

## @evidence contracts/development/implementation.md#efficient-algorithms

Evaluate a constant-size scalar rule. The refiner supplies existing objective decreases without recomputing the trial.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.chooseSqpTightening

## @evidence contracts/development/common.md#meaningful-documentation

Choose strict inward margin for selected affine constraints against the mixed step's physical objective descent. Return the capped value, row price and nominal power ceiling. The supplied SQP norm must lie strictly between zero and one.

## @evidence contracts/development/implementation.md#principled-implementation

Compute the smallest bound from the mixed norm power and the price-weighted objective cap. A zero multiplier leaves the power ceiling active. The scalar fixture has descent one half and price six, yielding 1/24.

## @evidence contracts/development/implementation.md#efficient-algorithms

Read the selected rows and multipliers once and return the scalar receipt. Constraint support remains at the original rows.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.copyUntiltedEstimate

## @evidence contracts/development/common.md#meaningful-documentation

Copy a selected original affine dual estimate into fit-owned storage. A null estimate returns null. The copy requires the original width, ordered selected row addresses and nonnegative multipliers. Work is charged before retaining it.

## @evidence contracts/development/implementation.md#principled-implementation

Charge 64 fixed visits plus 64 per selected row, validate its row metadata, then copy rows and multipliers. Two rows yield 192 visits in the independently authored fixture, with original arrays preserved.

## @evidence contracts/development/implementation.md#efficient-algorithms

Retain only the selected dual data and its dimensions. No duplicate model or observation rows accompany it.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.createMapTangent

## @evidence contracts/development/common.md#meaningful-documentation

Create two coordinate directions tangent to a near-unit seed translation. The first is the projection of the least-aligned axis, and the second completes its orientation. A translation outside the admitted near-unit gauge throws.

## @evidence contracts/development/implementation.md#principled-implementation

The least-aligned coordinate maximizes the stability of its projection onto the sphere tangent plane. The projection and cross product form the two directions. The axis fixture at positive z produces the x and y directions and a tilted input yields orthogonal unit directions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Search three axes and allocate two three-component rows. No projection history is retained.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.differentiateMapTangent

## @evidence contracts/development/common.md#meaningful-documentation

Differentiate the seed update r·normalize(t+Bz) at its current translation, holding the base radius fixed. The two supplied B columns are raw three-component directions. Return two physical derivatives or null when the chart shape or arithmetic is unresolved.

## @evidence contracts/development/implementation.md#principled-implementation

The differential removes the component of each direction parallel to the base axis while retaining the current-radius convention. The test checks identity on an orthogonal input, the coupled case and a malformed one-column basis.

## @evidence contracts/development/implementation.md#efficient-algorithms

Compute one base norm and two fixed-size derivatives. The current pose and basis are borrowed.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.isCameraNumericalRefusal

## @evidence contracts/development/common.md#meaningful-documentation

Classify an error as a declared numerical refusal when it is a plain Error with a recognized solver message prefix. Use the result in the numerical proposal's catch boundary. Progress callbacks keep their own failure behavior.

## @evidence contracts/development/implementation.md#principled-implementation

The implementation matches the error constructor and the declared prefixes. The fixture checks camera-pose, singular-matrix and matrix3 errors and independently refuses a matching RangeError and unrelated Error.

## @evidence contracts/development/implementation.md#efficient-algorithms

Inspect one exception and a fixed prefix set, without changing or wrapping the original error.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.solveFeasibleDirection

## @evidence contracts/development/common.md#meaningful-documentation

Solve the tilted direction model in a common metric chart. The first sparse row is the objective gradient with zero offset. Each other row supplies an inequality gradient and its original feasible slack. Return the step and multipliers within the stated simplex entry, iteration and work limits.

## @evidence contracts/development/implementation.md#principled-implementation

The simplex dual combines original gradients with nonnegative weights, and the physical metric recovers the negative combined gradient. The analytic scalar fixture gives objective weight three quarters and step one half. A nonzero objective-row offset refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

Keep original row sparsity and work in the shared simplex solver. Explicit budgets bound retained data, iterations and model work.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.spendSceneWork

## @evidence contracts/development/common.md#meaningful-documentation

The operation adds a nonnegative safe integer charge to one ledger category. It explains the effective joint iteration ceiling and preserves the previous ledger on refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The joint iteration limit is the smaller of the product of two safe nonnegative caps and the largest safe integer. The fixture spends exactly twelve under a three-by-four cap and verifies that a larger valid product can advance to the largest safe counter. An additional unit refuses in both cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Update a single keyed counter after checking its limit. Geometry and scene revisions remain outside the ledger.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.validateMapMetricScales

## @evidence contracts/development/common.md#meaningful-documentation

Validate the original finite positive column scales for a physical map metric. Supply at least one camera scale and three point scales per point. Missing slots, invalid widths and scales outside the finite positive range throw.

## @evidence contracts/development/implementation.md#principled-implementation

Check camera slots and each point triple by index, including sparse slots. The scale fixture exercises zero, negative, absent, mis-sized and infinite entries.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scan each provided scale once before metric action allocation. The function keeps no copies.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.validateMapMetricRow

## @evidence contracts/development/common.md#meaningful-documentation

Validate a sparse physical row over a positive safe integer width. Supply strictly increasing in-range integer column indices, one finite value per index and a finite offset. Malformed widths, coefficients and indices throw.

## @evidence contracts/development/implementation.md#principled-implementation

Read the actual indexed coordinates and coefficient slots. The fixture accepts indices zero and two at width three and refuses fractional, nonfinite, sparse and unordered entries before any metric action.

## @evidence contracts/development/implementation.md#efficient-algorithms

Use a single row scan and the previous index. The metric can reuse the original sparse row directly after admission.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.refineFeasibleState

## @evidence contracts/development/common.md#meaningful-documentation

Refine a caller-defined feasible state under bounded full and half trials, model work and its original gates. Use the caller's evaluation, model, retraction and commit callbacks. Optional SQP and adaptive reporting use explicit requests. Termination reports qualified convergence, exhaustion or refusal, with selected diagnostics.

## @evidence contracts/development/implementation.md#principled-implementation

Keep trial evaluation separate from state commit and only transfer a qualified selected step. Preserve the hard constraint checks and actual robust objective ordering during mixing and correction. The nonlinear fixtures have known scalar, planar and disk-constrained optima and compare both baseline and accelerated routes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Bound model and trial work by the declared counters. Retain the current qualified state and fixed diagnostics instead of storing a complete trajectory.

# src/observation/AutoMovieRecoveryCameraMap.ts#AutoMovieRecoveryCameraMap.selectFeasibleTrial

## @evidence contracts/development/common.md#meaningful-documentation

Select a qualified trial from one unchanged optimization base. Try the permitted baseline, mixed, corrected and half candidates under the remaining trial limit. Return the actual chosen increment and gate report. A selected trial alone carries no convergence claim.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluate each candidate under its own original constraints, objective and Armijo threshold. Prefer the lower actual admitted cost and keep deterministic priority on ties. The quadratic fixture independently derives corrected-half as 0.5p+0.25δ and checks eligible trial prefixes and original callback failures.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuse the base model and retain only the best qualified candidate and work count. Prediction and lower-cost selection do not rebuild the base within the selection pass.
