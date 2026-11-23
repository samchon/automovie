# src/geometry/curve/computeAutoMovieContourNormals64.ts#computeAutoMovieContourNormals64

## @evidence contracts/development/implementation.md#principled-implementation

Original triangle cross products accumulate in original face and corner order before one dimensionless normalization per vertex.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This owner computes normals only; contour correspondence, face admission and metre position publication remain with the loft generator.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No source normal, positional weld, winding repair or fallback direction replaces the generated face incidence.

## @evidence contracts/development/common.md#meaningful-documentation

States physical input units, area weighting, original reduction order and zero-vector behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

For V generated vertices and T retained triangles, one face pass and one vertex pass use O(V+T) time and O(V) accumulator storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each face cross product supplies all three corner accumulators without recomputation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Inputs remain caller-owned; local area vectors expire on return and the flat normals array transfers to the generated mesh.
