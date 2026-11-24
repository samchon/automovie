# src/posture/HumanArmTrajectoryStep.ts#HumanArmTrajectoryStep

## @evidence contracts/development/common.md#meaningful-documentation

States the step, the kept waypoints and the projection.

## @evidence contracts/development/implementation.md#principled-implementation

A projected step (Bertsekas 1976): the subproblem's step moves the free coordinates, then the hard ranges' projection (`HumanArmTrajectoryModel.ranged`) restores what the linearised subproblem meets only approximately.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map over arms and waypoints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Fixed waypoints keep their coordinates exactly.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the coordinates.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the model's `inner` and `ranged`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh iterate.
