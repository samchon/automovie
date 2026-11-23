# src/geometry/intersectAutoMovieConvexPolygons.ts#intersectAutoMovieConvexPolygons

## @evidence contracts/development/implementation.md#principled-implementation

Uses Sutherland-Hodgman half-plane clipping with the boundary's signed orientation and strict crossing tests; finite convex well-scaled coordinates are caller premises and zero-area boundary has explicit empty meaning.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One coordinate-unit-independent operation serves actual texture footprints and the existing architecture pattern clipper.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The on-edge rule prevents duplicate intersections without naming a region, consumer, expected point or tolerance compensation.

## @evidence contracts/development/common.md#meaningful-documentation

States winding, convexity, units, zero-area/contact semantics and the unresolved floating-point premises.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N subject vertices and M boundary edges, conservative O(M(N+M)) time and O(N+M) live polygon storage account for intermediate convex polygon growth; exits when empty.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This pure intersection coordinates no work across calls or requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Working polygons are call-local and the returned vertices transfer to the caller; no resource or cache survives the call.
