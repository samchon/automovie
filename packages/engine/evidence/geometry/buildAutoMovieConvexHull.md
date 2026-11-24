# src/geometry/buildAutoMovieConvexHull.ts#buildAutoMovieConvexHull

## @evidence contracts/development/implementation.md#principled-implementation

The hull's supporting planes and outward loops come from `physicalHullFaces` (quickhull with an extent-relative coplanarity tolerance), and each convex loop is fanned by `buildAutoMoviePolyhedron`, so the mesh is closed and outward wound by construction. Points that span no volume leave no face and are refused.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Exactly the composition archetype convex cells used, lifted into the engine so the form expectation check and the Human probe hull can build the same mesh; hull search and face emission stay with their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance of its own and no repair: an empty face list is refused rather than turned into a placeholder mesh.

## @evidence contracts/development/common.md#meaningful-documentation

States the two owners it composes, the face and winding contract, the coplanarity merge, the memo's no-mutation premise, units and the refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Dominated by `physicalHullFaces`: O(V^2) for its extent and expected O(V log V) for quickhull in V points, then linear face emission. Callers bound V; the Human probe hull reads the families' stored points rather than a realized skin for that reason.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuse: `physicalHullFaces` remembers the hull per points array, so an archetype cell that also integrates its mass searches once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new mesh the caller owns; the hull memo is the weak map `physicalHullFaces` owns, released with the points array.
