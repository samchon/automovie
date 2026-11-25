# src/posture/HumanArmTrajectoryLiftTurn.ts#HumanArmTrajectoryLiftTurn

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, the surface, the extent, the share and when the turn starts at once.

## @evidence contracts/development/implementation.md#principled-implementation

The tracked point clears the surface by the hand's extent at the share that rise takes on the straight path, so no digit below it can reach the surface as the hand turns: one geometry, the hand's own colliders and the frame's shapes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Find the lowest probe's nearest shape, read its normal, the extent along it and the path's rise.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No distance or share is picked: both come from the hand's probes and the path.

## @evidence contracts/development/implementation.md#efficient-algorithms

Read once per transport at plan time: the hand's probes against the shapes their bounding spheres reach, then one normal.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number and retains nothing.
