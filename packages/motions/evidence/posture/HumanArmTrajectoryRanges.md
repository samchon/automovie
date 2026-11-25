# src/posture/HumanArmTrajectoryRanges.ts#HumanArmTrajectoryRanges

## @evidence contracts/development/common.md#meaningful-documentation

States inputs and the two returned domains.

## @evidence contracts/development/implementation.md#principled-implementation

The norm gradient linearises the shoulder disc and each box subtracts the current coordinate from its two bounds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One optional disc row followed by one row per bounded free coordinate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the existing formulas; the rows carry the subproblem's own penalty weight, no other, and the domain stays exact on every trial (`stepped` projects onto it).

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the arm's free coordinates.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses HumanArmTrajectoryInvalid.swing for the chart radius and the convex owner's variable mapping.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns rows and retains no state.
