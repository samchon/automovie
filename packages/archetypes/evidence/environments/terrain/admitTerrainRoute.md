# src/environments/terrain/admitTerrainRoute.ts#admitTerrainRoute

## @evidence contracts/development/implementation.md#principled-implementation

Check fixed positions against canonical support. Each segment sweeps a full-width rectangle and each interior waypoint sweeps a turn disk. Admit rectangles by convex parcel containment and positive-area clipping against decomposed exclusions, and disks by boundary distance. Bilinear height along each straight segment inside a lattice cell is quadratic, so its largest absolute slope occurs at a cell endpoint.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This gate owns admission against the baked result. Plan preparation and blending remain independent of the lattice and route publication.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The strip stops at the stated terminal cross-section so a contiguous landing may own the next surface. Contact along a rim admits and positive overlap beyond binary64 area roundoff refuses. No route or exclusion identity selects a fallback.

## @evidence contracts/development/common.md#meaningful-documentation

States world units, the closed support region, full width, fixed elevations and refusal reasons.

## @evidence contracts/development/implementation.md#efficient-algorithms

Decompose exclusions once per path, then each segment tests its four corners and clips each convex piece in the segment frame. Each bend scans the ring edges for clearance. A constrained segment visits its touched grid cuts and takes constant work per interval after sorting.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The admitted route, footprint and height rule are passed in once. The gate holds no reusable verdict across authored inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Per-segment crossing buffers die after the check, and no state escapes.
