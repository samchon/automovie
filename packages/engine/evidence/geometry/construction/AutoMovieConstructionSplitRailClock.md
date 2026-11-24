# src/geometry/construction/AutoMovieConstructionSplitRailClock.ts#AutoMovieConstructionSplitRailClock.regularize

## @evidence contracts/development/common.md#meaningful-documentation

Names the proposed phases, fixed fork marks, start and end ribbon readers and diagnostic callbacks. Returns admitted phases in the same winding or refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Checks positive endpoint tangent projections along each actual chord. Where a stretch fails, a directed dynamic program searches strictly ordered candidate phases and minimizes summed squared movement from the original world rail points.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The first read tests each original pairing. Equal admission for all columns returns a fresh copy. A failed stretch samples candidate ends, computes predecessor links, and traces back the least-cost chain.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The original fork marks stay fixed. Only candidates with positive directed projections are eligible, and a missing feasible chain returns a named refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

For each failing stretch, reads each unique candidate once, sorts the phase choices, then uses a prefix-minimum pass per interior column over those choices.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All columns in one stretch use the same candidate rail reads. The observed original starts and ends supply the displacement objective and refusal witnesses.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Candidate points, projected costs and links release on return. Only the resulting phase array or refusal survives.

# src/geometry/construction/AutoMovieConstructionSplitRailClock.ts#AutoMovieConstructionSplitRailClock.switches

## @evidence contracts/development/common.md#meaningful-documentation

Names the divider planes, periodic rail and optional exact tangent and sample readers. Returns the sampled sites and the active directed crossings.

## @evidence contracts/development/implementation.md#principled-implementation

Labels each rail site by the plane with least signed distance. A change between samples brackets equality of two fields. Bisection on the actual rail finds the switch and subtraction of the two normals and offsets gives its physical difference plane.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One site pass establishes the active labels. Each label transition owns its root refinement and plane construction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The uniform samples must expose a label transition. A zero difference normal, tangency or reversed crossing is refused when the corresponding check is available.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses eight sites per requested column, reads each against the plane set, and refines only the observed brackets to the representable endpoint.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All downstream marks reuse the returned sites and native crossings. An optional sample reader supplies already owned site coordinates.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The result contains sites and physical crossing records. The plane-distance scratch belongs to the call.

# src/geometry/construction/AutoMovieConstructionSplitRailClock.ts#AutoMovieConstructionSplitRailClock.sameOrder

## @evidence contracts/development/common.md#meaningful-documentation

Names the two complete cycles of directed territorial changes and the equivalence under rotation of their starting phase.

## @evidence contracts/development/implementation.md#principled-implementation

Requires equal length and tries each cyclic starting position in the second sequence while comparing both labels of every directed edge.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One length guard, an empty-cycle case and a direct cyclic comparison express the invariant.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses exact directed label equality and keeps the winding of the sequence.

## @evidence contracts/development/implementation.md#efficient-algorithms

Worst-case quadratic in the number of crossings, with early exits for mismatches.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A synchronous scalar operation over its supplied inputs prepares no shared work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the scalar result leaves this synchronous operation.

# src/geometry/construction/AutoMovieConstructionSplitRailClock.ts#AutoMovieConstructionSplitRailClock.marks

## @evidence contracts/development/common.md#meaningful-documentation

Names the physical rail, directed source stretches, winding, optional prior crossing order and returned column marks.

## @evidence contracts/development/implementation.md#principled-implementation

Uses native crossings for matching directed feature boundaries. For unmatched features it compares actual rail sites to the parent fork translated with the planes. A cyclic ordered dynamic program minimizes squared displacement. [Feature-based contour matching](https://doi.org/10.1016/S0010-4485(98)00040-2) · [Monotone feature matching](https://doi.org/10.1145/142920.134001)

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The switch reader provides the actual sites and crossings. The matcher builds feasible costs and restores one minimum-cost cyclic assignment before publishing marks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains the given winding and any required prior switch order. A matching native crossing restricts the feasible sites. A missing complete assignment returns a refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

For P stretches and N candidate sites the cyclic assignment performs O(P N²) work across all possible initial sites. Each interior layer uses a prefix minimum.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Adds each observed crossing to the shared candidate site list once. All matching rows and cyclic starting positions use that same site geometry and costs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The result contains a mark at each planned column boundary and the observed points and crossings. The cost table and traceback storage are local.
