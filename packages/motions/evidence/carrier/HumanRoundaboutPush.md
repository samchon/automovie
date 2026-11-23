# src/carrier/HumanRoundaboutPush.ts#HumanRoundaboutPush

## @evidence contracts/development/common.md#meaningful-documentation

States the walk it wraps, the reach and the moving grip.

## @evidence contracts/development/implementation.md#principled-implementation

Each sample fits the arm to the bar where the scene's disc has it, so the hand moves with the disc.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Plan the walk, check the bar once, then fit the arm per sample.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The disc's turn is never authored here. The reach time is a named provisional staging value.

## @evidence contracts/development/implementation.md#efficient-algorithms

One bar read and one arm fit per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the walk and the rider's hand fit.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the walk plan for the action.
