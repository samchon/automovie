# src/architecture/createRopeStanchions.ts#createRopeStanchions

## @evidence contracts/development/implementation.md#principled-implementation

The measured dimensions set the foot clearance and positions of the three bar contacts. The rope stays straight as in the saved design.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the fixed measurements, then place the obstruction and its available contact frames.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The original measurements, fixed input checks and contact/part geometry are used by both APIs.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Builds a single fixture with a bounded number of parts and contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares recorded dimensions and part construction with the saved recipe.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The producer returns one completed model and retains no input references.

## @evidence contracts/development/common.md#meaningful-documentation

Describes the model, its inputs, frame and contacts.
