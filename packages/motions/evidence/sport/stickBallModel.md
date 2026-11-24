# src/sport/stickBallModel.ts#stickBallModel.world

## @evidence contracts/development/common.md#meaningful-documentation

States the transform it applies.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid transform: the local point rotated by the frame's rotation and moved by its position.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility: a model point in the world, beside the model axes it is read with.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

An exact rigid transform; nothing is tuned.

## @evidence contracts/development/implementation.md#efficient-algorithms

One quaternion rotation and one addition.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; there is no equivalent work to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector; it retains nothing.
