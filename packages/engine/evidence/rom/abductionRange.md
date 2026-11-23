# src/rom/abductionRange.ts#abductionRange

## @evidence contracts/development/common.md#meaningful-documentation

States the linear rise, its ends and the null and non-finite readings.

## @evidence contracts/development/implementation.md#principled-implementation

One closed-form interpolation of the ceiling on the flexion share, the floor unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One share and one interval.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the ceiling moves, and only by the declared coupling.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work; the constraint's own interval is returned unchanged where nothing moves.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The clamp, the scan and the validator read the one interval from here.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
