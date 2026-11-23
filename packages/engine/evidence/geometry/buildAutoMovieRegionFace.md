# src/geometry/buildAutoMovieRegionFace.ts#buildAutoMovieRegionFace

## @evidence contracts/development/implementation.md#principled-implementation

Uses `triangulateAutoMovieRegion`'s counter-clockwise triangles directly, so the right-hand rule makes every face's geometric normal +Z, matching the constant +Z vertex normal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Only lifts the 2D triangulation into the Z = 0 plane and copies XY into UVs; ring admission and triangulation stay with the triangulator.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No back face is emitted to fake two-sidedness, and invalid rings are refused by the triangulator rather than patched.

## @evidence contracts/development/common.md#meaningful-documentation

States how it differs from the extruder and why, how to get the other side, the coordinate, UV and normal conventions, the refusal source, and ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the region's point count after triangulation, whose cost is answered on `triangulateAutoMovieRegion`; one pass over the points appends each position, normal and UV.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds the mesh for one authored region; callers that place the same region twice can reuse the returned mesh.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns new position, normal and UV arrays sized by the point count and adopts the triangulation's index array; the triangulation's other arrays are released on return.
