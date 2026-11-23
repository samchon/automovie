# src/physics/stabilizePhysicalJointReturn.ts#stabilizePhysicalJointReturn

## @evidence contracts/development/implementation.md#principled-implementation

Post-stabilization projects a drifted state onto the constraint manifold after the step; for box limits on independent coordinates the projection clamps each coordinate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One frame change into the joint, the engine's projection, and back.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the rotation is projected; a state within its limits passes unchanged with angle zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per segment.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh state; retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the drift removed, the projection, what is kept and the returned angle.
