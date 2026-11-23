# src/tasks/rotationBetween.ts#rotationBetween

## @evidence contracts/development/common.md#meaningful-documentation

States the axis, the angle and the aligned case.

## @evidence contracts/development/implementation.md#principled-implementation

The cross product's length is the sine and the dot the cosine of the angle between them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One cross, one dot, one axis-angle.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Opposite directions turn about no defined axis and return the identity, which the callers' aims never ask.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by the extinguisher's and the hose's aims.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
