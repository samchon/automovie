# src/architecture/builtBoundaryWallCut.ts#builtBoundaryWallCut

## @evidence contracts/development/implementation.md#principled-implementation

Bounds the face outline in its planar frame and rotates the box midpoint into world space. Each void bounds `outlineHull`'s straight arc-envelope ring under its arc/winding and finite-intermediate premises; this is a rectangular cut proxy, not an exact curved cut or an outward-rounded binary64 enclosure certificate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns only the translation from boundary and openings to the kernel's panel-and-voids record; arc bounding stays in `outlineHull` and cutting in `buildAutoMovieWall`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no boundary or opening; overlapping void rectangles are passed to the kernel, which refuses them by name, instead of being merged or nudged here.

## @evidence contracts/development/common.md#meaningful-documentation

States why voids carry opening ids, the rectangular approximation for arches and concave faces and its overlap consequence, the void frame, units and order, the profile-less case, and both throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the boundary count to find the boundary, the face outline length for its bounds, and the opening count plus each profile's hull for the voids.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure translation of one boundary per call that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the panel record, whose rotation is the face's own object, and its voids, bounded by the boundary's opening count.
