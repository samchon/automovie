# src/internal/validateAccessorRange.ts#validateAccessorRange

## @evidence contracts/development/implementation.md#principled-implementation

Count, zero-default byte offset and padded element size determine final extent; validated buffer views bound the resulting range.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Dense range arithmetic belongs here and shared element sizing supplies matrix-column padding without another table.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An accessor lacking both a buffer view and sparse payload is refused; no fallback data is synthesized.

## @evidence contracts/development/common.md#meaningful-documentation

Comments give the dense extent formula, sparse-only allowance and prevalidated metadata premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant-time arithmetic resolves one view and shape without visiting accessor elements.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Padded element sizing is shared with sparse validation and component readers; no computed payload values are cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The gate borrows metadata for the duration of one call and owns no reader or resident bytes.
