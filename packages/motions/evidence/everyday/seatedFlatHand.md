# src/everyday/seatedFlatHand.ts#seatedFlatHand

## @evidence contracts/development/common.md#meaningful-documentation

States what is written, why the thumb turns and what is solved once.

## @evidence contracts/development/implementation.md#principled-implementation

The flat hand's thumb projects past the palm; the metacarpal twist that clears it is `bendFloorHand`'s, the floor hand's same cause.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One cached writer per body and side, written at the share.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing beyond the hand's own shape and range.

## @evidence contracts/development/implementation.md#efficient-algorithms

The thumb's twist is searched once per body and side, never per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `bendFloorHand`, the one flat hand with a clear thumb.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The cache is keyed weakly by the body and released with it.
