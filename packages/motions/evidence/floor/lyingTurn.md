# src/floor/lyingTurn.ts#lyingTurn

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result's range.

## @evidence contracts/development/implementation.md#principled-implementation

The long axis gives the heading; the chest's normal against up and the supine left gives the turn.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two axes read, two atan2.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/floor/lyingTurn.ts#lyingTurn.tilt

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result.

## @evidence contracts/development/implementation.md#principled-implementation `Ry(yaw) Rx(-90) Ry(turn)` composed, then read through the heading inverse.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three rotations and one inverse.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
