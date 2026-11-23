# src/geometry/limitSubdivisionLevel.ts#limitSubdivisionLevel

## @evidence contracts/development/implementation.md#principled-implementation

The limit point of a vertex is invariant under refinement, so evaluating it on the child's ring is exact and lets the quad-only limit masks serve any polygon; refining the ring until semi-sharp sharpness is spent follows DeRose, Kass and Truong's rule sequence to the point where only the published smooth, crease and corner limits remain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Ring gathering and normal numbering live here, ring refinement and the masks in their own functions, so the level loop stays a gather, iterate and write.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Semi-sharp creases are not treated as infinitely sharp in the limit; the ring is refined until their sharpness is gone.

## @evidence contracts/development/common.md#meaningful-documentation

States why the child ring is used, the semi-sharp iteration and its bound, and how normals and corners are numbered.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the level: one point refinement, then per vertex a ring gather, at most ten ring steps linear in its valence, and the masks; a dart or three-face crease side adds `subdivisionRingEigenbasis`'s fixed iteration, quadratic in its ring size, which bounds it per vertex.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one point refinement is shared by every vertex's ring instead of each vertex computing its own edge and face points.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The refined points, about four times the level's positions, are released on return; the result holds three numbers per vertex, three per normal and one per corner.
