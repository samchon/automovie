# src/geometry/measureAutoMovieMeshGap.ts#measureAutoMovieMeshGap

## @evidence contracts/development/implementation.md#principled-implementation

The distance between two non-crossing triangles is attained edge to edge or corner to face interior, so each pair takes its nine clamped segment distances (Ericson 2005, Real-Time Collision Detection, 5.1.9) and its six interior projections. A zero-length edge reads as its point and a zero-area face is answered by its edges. Box distances bound every descendant pair from below, so the simultaneous nearest-first walk of both hierarchies prunes without changing the least distance. Crossing surfaces are not detected here; the caller decides them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Preparation (`surface`, with the hierarchy from `buildAutoMovieMeshQueryHierarchy`) is separate from measurement, so a part measured against many others is prepared once. The dual walk and the two closed-form distances are private. The geometry barrel exposes the prepared query for model contacts and the Human figure's retained surface checks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance or sampling is used: zero tests are exact, the walk prunes only box pairs no nearer than the running least distance, and the result is not rounded.

## @evidence contracts/development/common.md#meaningful-documentation

States the method and its citation, why edges and interiors suffice, the crossing caveat, the preparation, the walk and why it changes no answer, the early stop and units.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation is O(n log n) per surface. The dual walk visits only node pairs nearer than the running least distance, near-logarithmic for separated parts; parts whose surfaces nearly touch over a wide area compare every triangle pair whose boxes come within that distance, O(n m) in the worst case. Measured over the archetype catalog's middles, preparing once per part and walking both trees cut the contact report from 45 s to 17 s.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call measures one pair of prepared surfaces; the preparation is what callers reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing between calls; each call holds only its running least distance and its recursion stack, bounded by the hierarchies' depths.
