# src/handling/manipulateFacing.ts#manipulateFacing

## @evidence contracts/development/common.md#meaningful-documentation

States the two directions, the fallback and who reads the rotation.

## @evidence contracts/development/implementation.md#principled-implementation

The anatomical pair of fingers and palm turned by `HumanHand.rotation`, the fingers along the reach laid across the surface.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One site, one projection, one rotation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A reach along the normal itself, with no part across it, points the fingers forward rather than dividing by zero.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the sites with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per hand and plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
