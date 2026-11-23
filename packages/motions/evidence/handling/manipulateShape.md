# src/handling/manipulateShape.ts#manipulateShape

## @evidence contracts/development/common.md#meaningful-documentation

States the two parts of the shape, why each, and who reads it.

## @evidence contracts/development/implementation.md#principled-implementation

The hand's own documented shapes (`HumanHand.shape`): the fist's curl for the idle digits and the flat hand's straight digit for the pressing one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two shapes merged, the pressing digit's segments last.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No angle is written here: both come from the hand's shapes.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

At most three candidate shapes per inactive digit.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
