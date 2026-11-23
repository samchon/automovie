# src/gym/createJumpRopeHandle.ts#createJumpRopeHandle

## @evidence contracts/development/common.md#meaningful-documentation

States the local origin, barrel axis, socket frame, dimension and mounting use.

## @evidence contracts/development/implementation.md#principled-implementation

One cylinder uses the whole rope's measured handle family and grip band. Both end faces come from the same length as the centre grip and positive tip socket.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Record the measured dimensions, then build one barrel and its two contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The measured family supplies length and the same grip band applies to both producers. Standalone mass is provisional and allocates half the midpoint of the whole-rope estimate, including its cord.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed-size family lookup and one primitive with two contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The rigid rope and standalone handle read the same measured tables. Each call builds its own model and identity.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each call returns one model and retains no state beyond it.
