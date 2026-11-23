# src/scene/surfaceGraphic/clipAutoMovieSurfaceGraphicGeometry.ts#clipAutoMovieSurfaceGraphicGeometry

## @evidence contracts/development/common.md#meaningful-documentation

States the plane, the outline triangulation, the clipping method and its source, how attributes are carried and that winding is kept, the unindexed result and the disposal of the input.

## @evidence contracts/development/implementation.md#principled-implementation

A simple polygon is the union of the triangles `THREE.ShapeUtils.triangulateShape` cuts it into, and a triangle clipped against a convex triangle by Sutherland–Hodgman (Sutherland and Hodgman 1974) is the convex polygon of their intersection, so the pieces cover exactly the part of the graphic inside the outline, concave outlines included. The attributes of a flat triangle are affine in the plane, so linear interpolation along a clipped edge is exact, and a piece keeps the vertex order of the triangle it came from, so its winding and facing are kept.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One clip owned by the surface graphic path; the key builder calls it once per mesh, and triangulation is three's own.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No alpha test or material patch: the clip lives in the geometry, so every pass that swaps a material, the mask and the graphics holdout among them, still draws only inside the outline.

## @evidence contracts/development/implementation.md#efficient-algorithms

T graphic triangles against C outline triangles cost O(T·C) clip steps, each bounded by a handful of vertices; a face's quads are two triangles and an outline a few dozen at most, while glyph triangles scale with the text.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each key's meshes are clipped once when the graphics are prepared; nothing is clipped per frame.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The input geometry is disposed and the new one returned for the caller to own; no buffer is kept.