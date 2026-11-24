# src/readAutoMovieErrorCode.ts#readAutoMovieErrorCode

## @evidence contracts/development/common.md#meaningful-documentation

States what it reads and when it returns undefined.

## @evidence contracts/development/implementation.md#principled-implementation

Reads Node's `code` property of a system error.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression shared by the reservation and the publish step.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-error values yield undefined rather than a guess.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It computes afresh from its arguments; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It holds no handle, task or state beyond its return value.
