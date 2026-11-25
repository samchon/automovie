# src/motion/resolvePreparedChainLower.ts#resolvePreparedChainLower

## @evidence contracts/development/implementation.md#principled-implementation

Composes the captured root world rotation, root articulation, fixed root-to-mid transform and mid articulation in the same order as parent-first FK; rigid intermediate transforms are already captured by preparation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This two-joint FK prefix is shared by the candidate point reader and the final chain-frame reader, so neither owns another reconstruction rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads actual supplied clinical articulations through the same axes and rest frames as preparation; no ideal IK target or canonical limb transform substitutes for FK.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two clinical quaternion conversions and a fixed number of vector/quaternion compositions take constant work, without resolving unrelated bones or the effector's articulation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Prepared offsets/parent frames and optionally matching normalized bases are borrowed unchanged; callers reading point and rotation can pass the completed prefix to resolvePreparedChainEffector. Changed mappings need a new rig context.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh frame and retains no input or handle after the call.

## @evidence contracts/development/common.md#meaningful-documentation

States the two clinical inputs, unchanged-frame premise and model-space output through IAutoMovieChainBone.
