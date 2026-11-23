# src/geometry/triangulateAutoMovieRegion.ts#triangulateAutoMovieRegion

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to `triangulateRegion`, which validates and canonically winds the rings in `canonicalRegion` and then bridges holes and ear-clips in `trianglesOf`; ear clipping a bridged simple ring covers exactly its interior with its own vertices, and the only premise left to rounding is that the bridge and ear searches succeed, which they refuse rather than assume.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The public entry for authors and the portrait oral and skin builders, fixing the diagnostic label to `polygon` and defaulting holes, while `triangulateRegion` stays the labelled internal form extrusion uses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid rings are refused with their own diagnostic and never hulled, merged or reordered beyond a winding reversal.

## @evidence contracts/development/common.md#meaningful-documentation

States why it exists beside the convex builders, the unit and plane, every refusal, the winding rule and its reason, the face direction and what `sourceIndices` preserves.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds constant work to `triangulateRegion`, whose O(N^2) validation and O(N^3) worst-case ear clipping over N points are answered on `autoMoviePlanarRegionFailure` and `trianglesOf`.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the rings passed in; each caller triangulates one region per call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned record owns copies of every point and arrays linear in the point count.
