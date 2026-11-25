# src/geometry/extract/AutoMovieMeshExtract.ts#AutoMovieMeshExtract.outline

## @evidence contracts/development/implementation.md#principled-implementation

Linear interpolation on each sign-changing edge is the exact intersection of a flat triangle with a plane; the symbolic perturbation (a vertex on the plane counts as above) removes the degenerate cases, so every cut is a set of chains through edges.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one-shot entry point shares the outline assembler with the prepared reader. The assembler walks each station's eligible triangles, chains the segments, and then reads the jump flags across neighbouring stations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Dangling crossings and jumps are flagged and never smoothed; the raw loops stay unbridged, and every gap the outer boundaries bridge is flagged with its length for the viewer check.

## @evidence contracts/development/common.md#meaningful-documentation

States the perturbation, the chaining, the extreme set and both flags.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S T) for S stations over T triangles, plus O(S P) for P crossings per station; heights along the axis are computed once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Vertex heights are shared across all stations.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Per-station maps are released after the station; only the returned sections remain.

# src/geometry/extract/AutoMovieMeshExtract.ts#AutoMovieMeshExtract.prepareOutline

## @evidence contracts/development/common.md#meaningful-documentation

Names the snapshot, varying query frames, defaults, and the link to the one-shot cut's perturbation and diagnostic conventions.

## @evidence contracts/development/implementation.md#principled-implementation

For a unit station axis and frame origin in millimetres, a box's projected extreme corners bound the vertex heights. A box straddles the exact cut only when its lower height is below and its upper height is on or above the station. This is the triangle interval condition in Minetto et al. extended conservatively to boxes. [An optimal algorithm for 3D triangle mesh slicing, §3.1](https://doi.org/10.1016/j.cad.2017.07.001)

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Preparation owns immutable triangle geometry, edge IDs and candidate selection. Both the direct and prepared entry points share interpolation, chaining, extremes, envelopes and flags.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The narrow phase classifies each candidate with the same arithmetic and original triangle order as the direct cut. The index neither changes the above convention nor admits a near-planar edge.

## @evidence contracts/development/implementation.md#efficient-algorithms

For T triangles and V vertices, preparation copies O(T + V) data and builds the median-split hierarchy in O(T log² T) time. A query visits B boxes, sorts C candidate triangles in O(C log C), and computes crossings only within those candidates. If the plane straddles all boxes, B and C are O(T).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The single mesh snapshot, spatial order and edge IDs are shared by all queries on one preparation. Each query recomputes its own intersections in the supplied frame.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned function owns O(T + V) data until its caller releases it. Query candidates, section maps and traversal are call-local. The result owns only its requested cuts.

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
