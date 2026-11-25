# src/handling/HumanGraspRoll.ts#HumanGraspRoll

## @evidence contracts/development/common.md#meaningful-documentation

States the grasp family, the rigid roll and why its angle is the closed form given.

## @evidence contracts/development/implementation.md#principled-implementation

The distance from the shoulder to a point turned about a line is least when its across component faces the shoulder's; the angle between the two across components is that roll.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split both offsets across the line, take their signed angle, turn the grasp.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A wrist on the line itself has no across offset and is left as given.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: two projections, one angle, one rotation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
