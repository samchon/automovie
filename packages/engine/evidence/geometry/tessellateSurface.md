# src/geometry/tessellateSurface.ts#tessellateSurface

## @evidence contracts/development/implementation.md#principled-implementation

Exact convex decomposition of the footprint, Sutherland-Hodgman clipping of each lattice cell against each convex piece, and fan triangulation of each convex result, with heights from the one `surfaceHeightAt` rule and smooth normals from area-weighted face normals at shared plan vertices; the premise that each piece is convex and counter-clockwise in plan comes from `footprintConvexPieces`, and the remaining limitation is that cell interiors are planar facets of the bilinear patch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Region decomposition and heights are the space package's own `footprintConvexPieces` and `surfaceHeightAt`, so this function owns only clipping, triangulation and normals, and the viewer and render measurement both draw through it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The hull is never substituted for the region and no height is computed by a second rule; a footprint with no area returns `null` rather than a placeholder quad.

## @evidence contracts/development/common.md#meaningful-documentation

States why pieces rather than the hull, how each height rule is drawn, where the drawn surface departs from the bilinear rule, the frame, unit, winding and vertex sharing, and the `null` result.

## @evidence contracts/development/implementation.md#efficient-algorithms

For K convex pieces of at most M corners and a lattice of C columns and R rows, each piece clips only the cells inside its own plan bounds, so clipping costs O(M) per touched cell instead of O(K * C * R * M) over the whole footprint; vertex sharing is one map lookup per emitted corner, and normals are one pass over the triangles and one over the vertices.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one surface; the viewer and render measurement each tessellate a surface once per scene build.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the cuts, clipped cells and plan-key map are linear in the touched cells and released on return, and the position, normal and index arrays are transferred to the caller.
