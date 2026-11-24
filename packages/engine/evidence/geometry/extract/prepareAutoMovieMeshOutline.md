# src/geometry/extract/prepareAutoMovieMeshOutline.ts#prepareAutoMovieMeshOutline

## @evidence contracts/development/common.md#meaningful-documentation

Describes the geometry snapshot, vertex-index incidence, millimetre height bounds, and the plane sidedness rule.

## @evidence contracts/development/implementation.md#principled-implementation

An affine projection has its extremes at the box corners picked by the axis component signs. Sorting the surviving triangle ordinals preserves the one-shot order. The lower-open, upper-closed interval follows the extractor's convention for vertices on the plane. [An optimal algorithm for 3D triangle mesh slicing, §3.1](https://doi.org/10.1016/j.cad.2017.07.001)

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds the edge IDs and geometry snapshot, builds the box hierarchy, and returns a candidate function that owns both.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Box rejection uses the same floating-point operation order as exact classification. Infinite and indeterminate box projections keep the box in the search. Each leaf has at most four triangles, matching the mesh ray caster's leaf capacity and bounding the work once a box passes.

## @evidence contracts/development/implementation.md#efficient-algorithms

The build is O(T log² T + V) with T triangles and V vertices. The query costs O(B + C log C) for B box visits and C candidate triangle ordinals.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All query frames share the same triangle boxes and edge IDs because these depend only on the snapshotted mesh buffers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The mesh snapshot, IDs, hierarchy and triangle order occupy O(T + V) space. Temporary edge pairs and triangle bounds are scoped to construction. A query owns its own traversal and candidate list.
