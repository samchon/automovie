# src/validation/toValidation.ts#toValidation

## @evidence contracts/development/implementation.md#principled-implementation

Search for error severity, returning the entire borrowed input array as violations on failure or warnings on nonempty advisory-only success.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This canonical conversion is shared by raw artifact gates and ViolationCollector.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Warnings remain visible rather than becoming errors or silently disappearing.

## @evidence contracts/development/common.md#meaningful-documentation

The result aliases the supplied mutable array; error results preserve warning rows alongside errors instead of partitioning them.

## @evidence contracts/development/implementation.md#efficient-algorithms

V rows require O(V) worst-case early-stoppable severity search and one result wrapper, with O(1) auxiliary storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The original array/rows are reused without copying, while the error decision is recomputed for each current list.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The input owner controls the aliased array/row lifetime; the helper retains no validation session.
