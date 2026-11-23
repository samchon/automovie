# src/scene/applyPoseMode.ts#applyPoseMode

## @evidence contracts/development/implementation.md#principled-implementation

Updates world matrices and joins each actual child Bone to its immediate Bone parent in world metres, hiding source meshes; root bones and nonbone parents create no segment, and anonymous instanced populations have no scene-bone representation to draw.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the existing pose graph rather than constructing a second skeleton or inferred anatomical connectivity; one shared line material and a named temporary group own this guide projection, and one placement routine serves application and every update.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses actual world positions and parent identities without authored fixture joints or replacement matrix methods; missing bone graph is a reported representation gap, not filled by a guessed pose.

## @evidence contracts/development/common.md#meaningful-documentation

States mesh hiding, parent-child world-space segment interpretation, what an update follows and what it does not, instanced-member omission and exact visibility/resource restore ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Collects M meshes, traverses O scene nodes and allocates B two-point line geometries plus one material for B parent-child bone links; CPU/storage are O(M+O+B) and no mesh vertex buffers are copied. An update is one world-matrix pass plus B segment writes, with no allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses current scene world transforms, one line material and the B geometries built at application; an update rewrites their two points in place instead of rebuilding the overlay.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns the temporary group/line geometries/material until memoized restore; independent cleanup removes/disposes them and restores borrowed visibility/background. Partial construction failure before returning the handle has no outer rollback here.
