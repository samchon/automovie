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

# src/scene/inspection/readAutoMovieDrawnRanges.ts#readAutoMovieDrawnRanges.IRange

## @evidence contracts/development/common.md#meaningful-documentation

States that start is inclusive, end exclusive, and the material is the one Three binds.

## @evidence contracts/development/design.md#principled-representation

A half-open index range and its material are what a triangle walk needs to read positions and judge opacity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, produced by readAutoMovieDrawnRanges and read by the camera surface checks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A range carries the drawn material, never a guessed default.
