# src/film/foldRoot.ts#foldRoot

## @evidence contracts/development/implementation.md#principled-implementation

The parent-child TRS composition `T_b + R_b(S_b · t_r)` for the position and `R_b ∘ R_r` for the orientation, in closed form with quaternions; the premise that root scale is identity is the rig convention the viewer's `applyPose` enforces, and the uniform-scale premise holds for every staged actor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fold shared by beat snapshots, camera clearance, review reads, keypoint sidecars and grammar diagnostics, so each reads an actor's world root the same way; the position reuses `placeTransformedPoint`, the placement nodes' subject boxes use.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no actor; dropping root scale follows the shared rig convention rather than compensating for a caller, and the sheared non-uniform case is stated rather than hidden.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame of the root, the order of the composition, why root scale is dropped, the null-root result, and when the rotation is exact.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time, one point placement and one quaternion product, with no matrix composed or decomposed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of two transforms that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the result shares `base`'s scale object, or is `base` itself for a null root, so a caller must copy before mutating.
