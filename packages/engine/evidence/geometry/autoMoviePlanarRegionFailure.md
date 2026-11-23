# src/geometry/autoMoviePlanarRegionFailure.ts#autoMoviePlanarRegionFailure

## @evidence contracts/development/implementation.md#principled-implementation

Ring hygiene by shoelace area, orientation determinants and pairwise closed-segment contact, then hole placement by the even-odd rule on one hole vertex, which decides the whole hole because rings were already proven not to touch; the area check precedes the turn and crossing checks so an area-free ring keeps its established diagnostic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One validator returning a message shared by `canonicalRegion`, polygon triangulation, footprint convex pieces and portrait skin reservation, so they agree on admission while each decides whether to throw or skip; segment contact, ring containment, area and orientation come from the geometry kernel's shared helpers rather than private copies.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is repaired, reordered or dropped to make a ring pass, and no caller or label changes a check; the order of checks only decides which of several failures is reported first.

## @evidence contracts/development/common.md#meaningful-documentation

States the return contract and why it is a message, every check in order with its tolerance and unit, the ring naming in messages, and each parameter's default.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N points over all rings, per-ring checks are linear, self-crossing is quadratic in each ring and ring contact quadratic across ring pairs, so the worst case is O(N^2) with no allocation inside the pair loops; inputs are authored profiles, footprints and skin loops of tens to hundreds of points, where a sweep-line intersection test would cost more than it saves, and the early return stops at the first failure.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure validation of the rings passed in; callers validate each region once, and portrait skin reservation calls it per candidate loop because each loop differs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates one array of ring labels and one of rings per call and releases both on return; the caller's rings are only read.
