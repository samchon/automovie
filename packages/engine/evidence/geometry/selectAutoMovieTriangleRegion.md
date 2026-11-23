# src/geometry/selectAutoMovieTriangleRegion.ts#selectAutoMovieTriangleRegion

## @evidence contracts/development/implementation.md#principled-implementation

A breadth-first flood over the triangle adjacency graph with the boundary edges removed, seeded by the triangle that uses each boundary edge in the loop's own direction; on a consistently wound manifold that triangle lies on the loop's inner side, and the final check that every boundary edge has exactly one selected neighbour proves the loop separated the surface.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function builds the edge index, seeds, floods and checks separation, because each step reads the same edge map; the portrait host-face cut calls it rather than repeating an image-plane test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nonmanifold, inconsistently wound or degenerate input is refused before any selection, and a nonseparating loop or a leak to an outside free edge throws rather than returning a partial patch.

## @evidence contracts/development/common.md#meaningful-documentation

States the orientation convention, why selection is topological, the input requirements, each refusal, and that ordinals are original and sorted.

## @evidence contracts/development/implementation.md#efficient-algorithms

For T triangles and B boundary vertices, the edge index, flood and separation check are O(T + B) with one string key per edge, and the final sort is O(K log K) for K selected triangles; the flood visits each triangle once and each edge twice at most.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call answers one mesh and boundary; the portrait builder calls it once per loop, so there is no repeated work to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the edge map, per-triangle edge keys, barrier set and work queue are sized by T and released on return, and only the selected ordinal array is returned.
