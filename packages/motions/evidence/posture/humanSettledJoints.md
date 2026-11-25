# src/posture/humanSettledJoints.ts#humanSettledJoints

## @evidence contracts/development/common.md#meaningful-documentation

States which joints are listed, the idempotence that admits each kind and the writers that exclude the rest.

## @evidence contracts/development/implementation.md#principled-implementation

Read off the clamp's own expressions (`clampJointRom`: `clampAxis`, `nearestNeutral`, the cone's blend) and `swingConeBlend`'s exact 1 inside the cone; the constraints are the rig's own (`getConstraint`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the skeleton's bones, one test a bone.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A joint whose second clamp is not proven to return its record is not listed, and neither is a bone a writer sets outside the clamp.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B) once, when the body is made; a reader then tests a bone by one set lookup in place of its clamp.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A constant of the rig, held by the body as its projection is.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned set is the body's; nothing else is kept.
