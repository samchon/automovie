# src/geometry/measureAutoMovieFeatureEdges.ts#measureAutoMovieFeatureEdges

## @evidence contracts/development/common.md#meaningful-documentation

States the welding, the 30° feature rule, the sign rule, the per-triangle list rule with limit and tie-break, why lists cover more than a triangle's own sides, the cost and the throws.

## @evidence contracts/development/implementation.md#principled-implementation

The dihedral test on welded face normals is the standard sharp-edge criterion and does not change when a flat face is subdivided. The segment-to-triangle distance is exact: zero when the segment pierces the triangle, otherwise the minimum over endpoint-to-triangle and segment-to-side distances.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function measures; distances at a point are the separate `autoMovieFeatureEdgeDistance`, and point-segment and segment-segment distances reuse the engine's math owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 30° angle, the 16-entry limit and the strict non-manifold rule are the issue's; no mesh is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(T log T) welding and adjacency through maps and O(T × E) list building; the brute force is kept because it runs once per model build and E is small on generated meshes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Nothing is cached; the renderer calls it once per worn geometry and material pair.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond its result.
