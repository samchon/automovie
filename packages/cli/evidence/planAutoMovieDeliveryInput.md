# src/planAutoMovieDeliveryInput.ts#planAutoMovieDeliveryInput

## @evidence contracts/development/common.md#meaningful-documentation

States each fixed option's purpose, where the input options go and the returned order.

## @evidence contracts/development/implementation.md#principled-implementation `-copyts` keeps decoded presentation timestamps on the input clock, and `-xerror` turns a decoding error into a failed process instead of a partial log.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fixed prefix shared by the video and audio delivery plans.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The path is passed as a separate argument, never through a shell.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Building a short argument array chooses no algorithm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each plan builds its own array once, cheaper than sharing it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new array and holds nothing.
