# src/validation/admitShotEditorialMarkers.ts#admitShotEditorialMarkers

## @evidence contracts/development/common.md#meaningful-documentation

Omitted input stays absent; invalid input contributes shot-local violations and a clean list yields owned canonical records.

## @evidence contracts/development/implementation.md#principled-implementation

Validate against the authored shot duration and copy the four declared fields only after the validation adds no violations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This authoring boundary reuses the stored-shot validator and prepares the build artifact's marker records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No marker or endpoint is added, removed or rewritten after admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear validation and one copy of each admitted marker.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The shot builder holds the admitted copies while the shared validator continues to serve artifact readers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only fresh marker records escape, and no resource or state is retained.
