# src/writeAutoMovieVerificationReceipt.ts#writeAutoMovieVerificationReceipt

## @evidence contracts/development/common.md#meaningful-documentation

Defines the latest receipt, complete contents and first failure ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Writes complete staged bytes before atomically replacing latest or exclusively linking a first-failure witness.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One publisher owns both the exclusive witness and latest replacement forms.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The first failure has independent bytes. Replacing or editing latest cannot remove or overwrite it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Writes one bounded receipt and adds only the first-failure publication attempt for a witnessed failure.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Exclusive linking retains the existing first-failure witness on retry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Deletes its staging path on failure and when the first-failure publication finishes. It keeps at most one latest and one first-failure receipt for the scope.
