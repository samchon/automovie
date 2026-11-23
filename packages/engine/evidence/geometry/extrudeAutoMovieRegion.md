# src/geometry/extrudeAutoMovieRegion.ts#extrudeAutoMovieRegion

## @evidence contracts/development/implementation.md#principled-implementation

Caps reuse the canonical counter-clockwise triangulation, reversed for the bottom so both face outward, and each ring edge becomes one outward quad whose normal is the edge direction rotated by -90 degrees in the plane, which is outward for a counter-clockwise outer ring and a clockwise hole alike.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Ring validation, winding and triangles come from `triangulateRegion`; this function owns only the lift to 3D, the face normals and the metric atlas, appending to an `emptyMeshTarget`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Vertices are deliberately not shared between caps and sides so creases stay sharp instead of being averaged, and invalid regions are refused rather than repaired.

## @evidence contracts/development/common.md#meaningful-documentation

States what this accepts that the convex extruder refuses, the crease rule, the cap and side atlas with the seam condition, why the frame is developed, the closure and volume, ownership, and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

After triangulation, whose cost is answered on the triangulator, emission is linear in the point count n: two caps of n vertices and one four-vertex quad per ring edge.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One mesh per authored region and depth; a caller that places the same solid repeatedly can keep the returned mesh.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the target's four arrays, holding 6n vertices for n region points, as the mesh's own buffers; the triangulation is released on return.
