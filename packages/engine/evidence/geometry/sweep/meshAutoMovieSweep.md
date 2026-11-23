# src/geometry/sweep/meshAutoMovieSweep.ts#meshAutoMovieSweep

## @evidence contracts/development/implementation.md#principled-implementation

A ruled loft between corresponding rings of the sweep's own interpolated sections, with canonical region layout so walls face out of the solid, ear-clipped planar caps, and a metric developed atlas; corners are kept by sampling polygons at their corners. Limitation: self-intersection on tight bends is not detected.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Section interpolation, frames and holes come from `compileAutoMovieSweep`, region validation and triangulation from `canonicalRegion` and `trianglesOf`, flat triangles from `pushFlatTriangle` and smooth normals from `meshOf`; this function only lays out rings, walls and caps.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid rings and winding flips are refused instead of being repaired, and the walls are not smoothed beyond the requested shading.

## @evidence contracts/development/common.md#meaningful-documentation

States ring placement, loop sampling, layout and orientation, caps, both shadings, the atlas, the seam, the self-intersection premise and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

For R rings of P points: O(R P) evaluations and wall triangles, one region validation per ring and two cap triangulations; flat shading emits 6 (R - 1) P wall vertices, smooth (R (P + L)) for L loops.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one mesh whose buffers the caller owns.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the compiled sweep and ring layouts are released on return and the buffers transferred to the mesh.
