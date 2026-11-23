# src/readAutoMoviePageTimeout.ts#readAutoMoviePageTimeout

## @evidence contracts/development/common.md#meaningful-documentation

States the covered draw-session stages, per-call scope, milliseconds, unchanged default, integer range and timer-overflow refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Converts command text or a host's numeric budget once and admits integers from 1 through 2147483647, the positive delay range of the timer bounding each page call.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One default, one numeric conversion and one range check serve both command readers and direct host callers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid values throw rather than disabling the bound or silently using the default; no subject selects a special budget.

## @evidence contracts/development/implementation.md#efficient-algorithms

Parses the supplied scalar text once in O(N) time and space for N input characters; numeric inputs need constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure scalar reader coordinates no retained or in-flight work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The reader retains no input or handle and returns one number.
