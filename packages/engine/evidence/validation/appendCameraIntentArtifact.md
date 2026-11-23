# src/validation/appendCameraIntentArtifact.ts#appendCameraIntentArtifact

## @evidence contracts/development/implementation.md#principled-implementation

Shared array/object admission precedes shot-bounded start, canonical framing/move membership, nullable finite focus and strictly positive focal-length checks. An optional focus pull additionally requires a source point, ordered marks within the shot up to the next row's start and a finite destination.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shot and coverage intent share one extracted owner and the film's canonical framing/move sets rather than separately copied camera vocabulary.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No camera path or focal default repairs an invalid span, and indexed traversal refuses a missing declared slot; this validates supplied metadata, not span sorting, coverage completeness or applied camera movement.

## @evidence contracts/development/common.md#meaningful-documentation

Documents start seconds, nullable focus/focal fields, strictly positive millimetre focal length and f-number and the exact canonical vocabulary used.

## @evidence contracts/development/implementation.md#efficient-algorithms

I intent rows require O(I) fixed-field checks plus string/message work, allocating only refused findings and temporary paths.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same sets and field predicates serve primary and coverage intent; changed mutable metadata is inspected afresh without persistent reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only appended findings retain offending fields in the caller's array; borrowed intent rows and module vocabulary sets acquire no camera, animation or renderer task.
