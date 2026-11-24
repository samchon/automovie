# src/inspector/releaseAutoMovieInspectorSteps.ts#releaseAutoMovieInspectorSteps

## @evidence contracts/development/common.md#meaningful-documentation

States the order, the error thrown for one and for several failures.

## @evidence contracts/development/implementation.md#principled-implementation

Every step runs, so one failure keeps no later resource alive.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop and one throw.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No failure is dropped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the steps.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A one-shot release.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds nothing after it returns.