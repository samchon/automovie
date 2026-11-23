# src/scene/inspection/readAutoMovieDrawnRanges.ts#readAutoMovieDrawnRanges

## @evidence contracts/development/common.md#meaningful-documentation

States which ranges Three draws for single- and multi-material meshes, the index-or-vertex unit of each range and the empty result.

## @evidence contracts/development/implementation.md#principled-implementation

Follows Three's draw rule: a single material draws the geometry's draw range when visible, and a material array draws only geometry groups, each intersected with the draw range and skipped for a missing or hidden material.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch for a single material and one loop over groups; the near-clip and frame-edge surface checks share it instead of keeping copies.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A hidden material or an empty intersection contributes no range, so an invisible group is never counted as drawn.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work for a single material and O(G) for G groups, allocating only the returned ranges.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the mesh's current draw range and groups, which are not cached.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns plain ranges that borrow the mesh's materials and keeps nothing.
