# src/geometry/extract/AutoMovieMeshExtract.ts#AutoMovieMeshExtract.outline

## @evidence contracts/development/implementation.md#principled-implementation

Linear interpolation on each sign-changing edge gives the plane intersection. Counting a vertex on the plane as above assigns a consistent side at ties. Crossings chain through original mesh edges. The raw loops preserve open ends and the separate outer boundary flags each bridged gap.

## @evidence contracts/development/common.md#meaningful-documentation

States the millimetre frame, station axis, tolerance and bridge defaults, plane-vertex rule, extremes, loops and diagnostic flags.

## @evidence contracts/development/implementation.md#efficient-algorithms

The public function projects V vertices once in O(V) time and space and runs one station list through the shared query. Each station scans T triangles in their original order, then chains and encloses its crossings. A second pass checks jumps between neighbours. The heights and station scratch are released when the query returns. The caller retains only its cut records.

# src/geometry/extract/AutoMovieMeshExtract.ts#AutoMovieMeshExtract.prepareOutline

## @evidence contracts/development/common.md#meaningful-documentation

Documents the fixed mesh and frame, the axis and station units, the query defaults, and the station list that supplies jump neighbours.

## @evidence contracts/development/implementation.md#principled-implementation

Each stored height is the vertex's displacement from the fixed origin dotted with the station axis. The station query subtracts the station from this height and applies the same edge interpolation, plane-vertex rule and traversal as `outline`.

## @evidence contracts/development/implementation.md#efficient-algorithms

Projection takes O(V) time and retains one double per vertex while the query function is reachable. Reads borrow the mesh, frame and stored heights. Each read scans the triangles in their original order at each station to preserve the first crossing and traversal order. Queries retain no intermediate results after returning their cuts.

# src/geometry/extract/AutoMovieMeshExtract.ts#AutoMovieMeshExtract.reduce

## @evidence contracts/development/implementation.md#principled-implementation

Greedy knot removal ranked by the measured Hermite span deviation, with local least-squares slope refits; prominent features are found by topographic prominence of values and of bend runs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shares the removal engine with reduceLoop; only the feature pins and the scalar dimension differ.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tolerance is measured on every kept sample after each removal; no knot count is targeted.

## @evidence contracts/development/common.md#meaningful-documentation

States the removal order, the refit, the pins, the noise threshold and its reason.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N^2) for the best-candidate scans over N samples; each refit is linear in the samples of five neighbouring knots' spans.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Candidate costs are cached and recomputed only for the six positions around a removal.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

O(N) call-local arrays; only the knots are returned.

# src/geometry/extract/AutoMovieMeshExtract.ts#AutoMovieMeshExtract.reduceLoop

## @evidence contracts/development/implementation.md#principled-implementation

The same knot removal as reduce on a periodic chord-length parameter; x and y decouple in the least-squares refit because they share the Hermite basis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shares the removal engine with reduce; only the parameter, the period and the pins differ.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The distance is measured on every kept dense point after each removal; no knot count is targeted.

## @evidence contracts/development/common.md#meaningful-documentation

States the parameter, the pins, the held tangent components and the minimum.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N^2) best-candidate scans over N points with refits linear in five knots' spans.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Candidate costs are cached and recomputed only around a removal.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

O(N) call-local arrays; only the knots are returned.

# src/geometry/extract/AutoMovieMeshExtract.ts#AutoMovieMeshExtract.profileCurve

## @evidence contracts/development/implementation.md#principled-implementation

A tensor of a periodic cubic Hermite loop in the clock and a natural cubic spline in station; cardinal weights make the station and clock derivatives exact derivatives of the same function.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One adaptor from reduceLoop's output to the profile curve owner; no second representation is kept.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The correspondence across stations is the chord-length fraction from the +a extreme, stated here; where loops change shape sharply it may slide, which the viewer check shows, and nothing is resampled to hide it.

## @evidence contracts/development/common.md#meaningful-documentation

States the clock, the orientation, the origin, the station interpolation and the coordinates.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation solves S cardinal splines in O(S^2); each reading costs O(S (log S + log K)) for S stations of up to K knots.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The cardinal splines and normalised loops are prepared once and shared by every reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned curve retains the normalised loops and S cardinal splines for its owner's lifetime.

# src/geometry/extract/AutoMovieMeshExtract.ts#AutoMovieMeshExtract.hermite

## @evidence contracts/development/implementation.md#principled-implementation

The four cubic Hermite basis functions on the normalised parameter, slopes scaled by the span length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar evaluation; vector spans call it per coordinate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Equal stations are not admitted and give a non-finite result rather than a guess.

## @evidence contracts/development/common.md#meaningful-documentation

States the argument order and the outside-span behaviour.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single evaluation coordinates no work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar and retains nothing.
