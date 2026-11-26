# src/geometry/inspectAutoMovieMeshTopology.ts#inspectAutoMovieMeshTopology

## @evidence contracts/development/implementation.md#principled-implementation

Count undirected edge incidence over physical ids or rounded-position keys: one use is boundary and more than two is nonmanifold. The nonempty two-use census supplies watertight, not a full vertex-manifold, winding, nondegeneracy or finiteness proof; volume sums signed tetrahedra against the origin, subject to binary64 overflow and cancellation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Measurement only; the pass/fail verdict lives in `validateMeshTopology`, and the weld, with its index admission and physical identity, in `weldAutoMovieMeshCorners`, which `measureAutoMovieMeshPieces` shares so the two reports cannot disagree.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The weld grid is the shared `MESH_WELD_GRID` constant rather than a local tolerance, degenerate triangles are reported instead of dropped silently, and an empty mesh is not watertight because having no edges is not having no holes.

## @evidence contracts/development/common.md#meaningful-documentation

States identity modes, coordinate-weld degeneracy, attribute finiteness, edge-census limits, units and signed volume, the separate validator and named index/physical-source refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in vertices and triangles: one finiteness pass per attribute without concatenating them, and one hashed edge count per triangle edge keyed by the welded identity pair.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call measures the mesh it is given and keeps nothing, so a caller that needs the report twice keeps the first one.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Call-local storage includes one welded identity per corner, at most three edge keys per triangle, a generated index run for nonindexed input and the optional physical-vertex correspondence. Only the returned degenerate ordinal list and scalar report survive; no mesh or topology cache is retained.
