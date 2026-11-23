# src/lexicon/closeRideHandGrips.ts#closeRideHandGrips

## @evidence contracts/development/common.md#meaningful-documentation

States what is closed, on which shapes, when the grip is read from the model frame, and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The grasp closure on the support's colliders at rest under its frame; a rigid handle's grip is that handle's own model frame under the same frame, so the hand and the shapes describe one rigid grasp.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Kept apart from the ride's hands so that owner stays within its size; one refusal check and one closure per hand.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Fingers with nothing to close on are refused rather than left open.

## @evidence contracts/development/implementation.md#efficient-algorithms

One closure solve per holding hand per plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The closures are solved once and blended to at every instant.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
