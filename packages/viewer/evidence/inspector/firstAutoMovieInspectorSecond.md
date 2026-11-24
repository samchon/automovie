# src/inspector/firstAutoMovieInspectorSecond.ts#firstAutoMovieInspectorSecond

## @evidence contracts/development/common.md#meaningful-documentation

States both sampling kinds and which second each starts at.

## @evidence contracts/development/implementation.md#principled-implementation

The capture plan draws an `at` request at its listed seconds and a sampled one from `from`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conditional.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the request as written; nothing is defaulted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds nothing.