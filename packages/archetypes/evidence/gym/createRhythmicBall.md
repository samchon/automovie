# src/gym/createRhythmicBall.ts#createRhythmicBall

## @evidence contracts/development/implementation.md#principled-implementation

One sphere places both contacts at its physical centre and lower pole.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, record the sphere and place both contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The contact for a palm on the surface has no artificial grasp handle or area. The ball is rigid in the hints.

## @evidence contracts/development/implementation.md#efficient-algorithms

One sphere and two contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each constructor call builds an independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Construction retains no external resources.

## @evidence contracts/development/common.md#meaningful-documentation

States the model's floor, centre and palm references and their use.
