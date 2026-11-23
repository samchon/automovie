# src/posture/HumanArmTrajectoryBridge.ts#HumanArmTrajectoryBridge

## @evidence contracts/development/common.md#meaningful-documentation

States the path, clocks, fixed endpoints, missing intervals and admission owner.

## @evidence contracts/development/implementation.md#principled-implementation

The hand follows the given minimum-jerk displacement when its bounded analytic solve returns a pose. Gaps join those poses through the same Hermite coordinates as playback.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Computes one arm at a time and interpolates only its missing frames.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps every requested frame and both endpoints. All limits and clearance checks stay in the whole-path model.

## @evidence contracts/development/implementation.md#efficient-algorithms

One two-bone solve per interior frame per arm. Only gaps require interpolation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The supplied arm solver and playback interpolant own their respective geometry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary knots and frames are local to one transport. Only the candidate coordinates escape.
