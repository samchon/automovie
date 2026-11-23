# src/weapons/projectileFlight.ts#projectileFlight

## @evidence contracts/development/common.md#meaningful-documentation

States what is given, the radius's unit and role, and that an unread datum is left out.

## @evidence contracts/development/implementation.md#principled-implementation

The read coefficient against the cross-section its source states (a sphere's) or that is taken provisionally (an arrow's); the read depth for the outcome `stick`, the read soil restitution for `bounce` and `roll`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One table lookup per datum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unread datum is absent, never a placeholder: a bolt carries no drag and no depth.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
