# src/architecture/builtEnvironmentSpaceBoundaries.ts#builtEnvironmentSpaceBoundaries

## @evidence contracts/development/implementation.md#principled-implementation

A filter over the record's boundaries on exact membership of the space id in each boundary's `spaces`, which preserves record order and object identity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns the record objects whole instead of a projection, so `kind` and `elements` reach the caller without a second lookup, and refuses ids through the shared `requireBuiltSpace`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no space or boundary kind; a storey-owned slab is not reassigned to the rooms below it, and a boundary nothing builds is returned as declared.

## @evidence contracts/development/common.md#meaningful-documentation

States what the answer adds over adjacency, exact matching rather than containment, why boundaries come back whole, what an empty `elements` means, record order, that the objects are not copies, and the throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S + B + T) for the space lookup, B boundary records and T summed side entries, including empty side lists; no persistent index avoids the scan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Returns references into the caller's boundary list rather than a cached copy, so a later edit to the record is seen by the next call; no work is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates only the returned array, which references the record's own boundaries and is owned by the caller.
