# src/index.ts#listAutoMovieInspectionPaths

## @evidence contracts/development/common.md#meaningful-documentation

States which objects are listed, that visibility does not filter them, where the other objects' names go and the order.

## @evidence contracts/development/implementation.md#principled-implementation

The listed kinds are the ones a renderer draws, so the listing is the population a selection pattern can show or hide.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One traversal that keeps the drawn kinds and asks the path owner for each path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No object is skipped by name or by visibility, and objects sharing a path are all returned.

## @evidence contracts/development/implementation.md#efficient-algorithms

One traversal, plus one walk of each drawn object's depth for its path.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Paths come from `autoMovieInspectionPathOf`, the same function a single object's path is read with.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns borrowed object references and their paths; the scene is read and nothing is retained.
