# src/readAutoMovieErrorCode.ts#readAutoMovieErrorCode

## @evidence contracts/development/common.md#meaningful-documentation

States what it reads and when it returns undefined.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the `code` of Node's declared system error (`NodeJS.ErrnoException`) once the value is an `Error`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression shared by the reservation and the publish step.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-error values yield undefined; no `in` or shape check stands in for the declared error type.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It computes afresh from its arguments; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It holds no handle, task or state beyond its return value.
