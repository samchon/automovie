# src/inspector/inspectAutoMovieInspectorRequest.ts#inspectAutoMovieInspectorRequest

## @evidence contracts/development/common.md#meaningful-documentation

States what is applied, with which marks and kinds, and what a refusal leaves.

## @evidence contracts/development/implementation.md#principled-implementation

Applies the inspection through `applyAutoMovieInspection`, as the draw page does.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call with the subject's kinds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A refusal is thrown to the caller, not swallowed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Delegates to the inspection's own cost.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each request is applied fresh.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned handle is the caller's to restore.