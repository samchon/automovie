# src/scene/invalidateAutoMovieSkinnedPose.ts#invalidateAutoMovieSkinnedPose

## @evidence contracts/development/implementation.md#principled-implementation

Calls AutoMovieSkinnedMesh.invalidatePose, or clears a foreign SkinnedMesh's boundingBox and boundingSphere, which Three's frustum, raycast and Box3 paths recompute when null.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One revision step shared by applyPose, applyExpression, the Human rig pose and display geometry swaps.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Recomputes nothing eagerly and never disables culling.

## @evidence contracts/development/common.md#meaningful-documentation

States who calls it and the foreign-mesh behaviour.

## @evidence contracts/development/implementation.md#efficient-algorithms

One traversal of the subtree with constant work per object.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Meshes keep their allocated caches for the next evaluation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; only bound objects are released.
