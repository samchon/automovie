# src/scene/inspection/listAutoMovieCameraSubjectMeshes.ts#listAutoMovieCameraSubjectMeshes

## @evidence contracts/development/common.md#meaningful-documentation

States the admitted vertex paths, the layer and visibility scope, and the undefined and empty outcomes.

## @evidence contracts/development/implementation.md#principled-implementation

Visibility, layers and the vertex program decide what the delivery draws; the stock rigid path is buffer positions under the world matrix, and the owned skin reproduces its shader blend on the CPU (AutoMovieSkinnedMesh), admitted only with the matching stock shader through readAutoMovieDisplayedBox.supportsStockMaterial.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One admission shared by subject bounds and the near-plane clip measurement, so framing and clipping judge the same geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Lines, points, sprites, instanced, batched and foreign skinned meshes, morphs, shader materials and displacement are refused rather than approximated.

## @evidence contracts/development/implementation.md#efficient-algorithms

One traversal of the target's visible descendants with constant work per object; no vertex is read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The list reflects the current visibility and material state and is not cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new array of borrowed meshes and retains nothing.
