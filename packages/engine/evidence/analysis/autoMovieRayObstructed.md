# src/analysis/autoMovieRayObstructed.ts#autoMovieRayObstructed

## @evidence contracts/development/implementation.md#principled-implementation

Reduces occlusion by a union of convex solids to `Array.prototype.some` over per-solid slab tests, which is exact because a ray is stopped by the union exactly when one member stops it, and `some` stops at the first blocker.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the union over solids so every daylight light component asks one question; the per-solid geometry stays in `autoMovieSolidBlocks`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Context masses and authored shades arrive as one `IAutoMovieAnalysisSolid[]` and are tested identically, with no branch on a solid's id or origin list.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the order and short circuit, the empty-list answer, the start-inside and on-face outcomes, and each property's unit, including that `maxDistance` is metres only for a unit direction.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N·P) per ray for N solids of P planes with a short circuit at the first blocker; no bounding volume or spatial index prunes solids, so the daylight study pays the full solid count on every one of its cells × (sky directions + luminaires + 1) unobstructed rays.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call answers one ray; rays differ in origin or direction, so no answer is equivalent to another's.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the only allocation is one short-lived props object per solid tested, released when the test returns.
