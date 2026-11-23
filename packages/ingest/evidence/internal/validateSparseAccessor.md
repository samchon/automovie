# src/internal/validateSparseAccessor.ts#validateSparseAccessor

## @evidence contracts/development/implementation.md#principled-implementation

Sparse count cannot exceed accessor count; unsigned index widths and padded matrix element sizes determine both payload ranges.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The sparse gate owns count, index format and subview range checks while shared element sizing owns matrix padding.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Sparse layout is checked structurally but skin/motion consumers explicitly refuse sparse reading rather than inventing dense values.

## @evidence contracts/development/common.md#meaningful-documentation

Prose explains admitted view indices, zero-default offsets, count bounds and consumer limitations.

## @evidence contracts/development/implementation.md#efficient-algorithms

One sparse accessor requires constant-size field checks and two range calculations independent of sparse element count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Subview metadata is read once per sparse payload; no byte decoding is performed or cached here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The range gate creates temporary metadata references only and retains no payload, reader or handle.
