# src/architecture/createPayStation.ts#createPayStation

## @evidence contracts/development/implementation.md#principled-implementation

The measured StradaPAL cabinet, spacer and head preserve the installation's dimensions. The measured contact set covers its exterior faces.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the cabinet, then record its fixture-specific parts and the common exterior faces.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The original measurements, fixed input checks and contact/part geometry are used by both APIs.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Builds a single fixture with a bounded number of parts and contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the shared rectangle for the standing cabinet and the same geometry through both entry points.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The producer returns one completed model and retains no input references.

## @evidence contracts/development/common.md#meaningful-documentation

Describes the model, its inputs, frame and contacts.
