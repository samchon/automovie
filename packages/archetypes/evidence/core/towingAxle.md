# src/core/towingAxle.ts#towingAxle

## @evidence contracts/development/common.md#meaningful-documentation

Names producer-owned wheel contacts, metre midpoint/clearance and transverse-axis refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Two wheel-rotation frames define one transverse axle; their shared Y/Z and midpoint X provide its source coordinate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit finite centres and spin axes, then copy the midpoint.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The producer supplies identities; no nearest wheel search, dimension surrogate, kind heuristic or altered frame creates support geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two frame/axis reads and constant scalar arithmetic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Cart and cannon geometry readers share this axle admission owner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains no input frame/contact and returns one independent point.
