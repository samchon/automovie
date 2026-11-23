# src/inspector/changesAutoMovieObservedScene.ts#changesAutoMovieObservedScene

## @evidence contracts/development/common.md#meaningful-documentation

Names every request member that changes scene state and what each changes, and why the rest do not matter to an observer.

## @evidence contracts/development/implementation.md#principled-implementation

Mirrors the documented steps of `applyAutoMovieInspection`: isolation, shade, colours, marks and section.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One boolean expression over the request members.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Any member that can change layers, materials, overlay meshes or clipping counts; labels, views and stroke do not touch the scene.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure predicate.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds nothing.
