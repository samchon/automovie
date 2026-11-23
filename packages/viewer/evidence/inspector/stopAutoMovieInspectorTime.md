# src/inspector/stopAutoMovieInspectorTime.ts#stopAutoMovieInspectorTime

## @evidence contracts/development/common.md#meaningful-documentation

States when an edit is implied and which second it names.

## @evidence contracts/development/implementation.md#principled-implementation

The request names the picture left on screen, which is the playhead's second when it stops.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Playing frames and changes that stop nothing imply no edit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds nothing.
