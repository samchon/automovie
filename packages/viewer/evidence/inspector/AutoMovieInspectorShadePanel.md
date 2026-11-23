# src/inspector/AutoMovieInspectorShadePanel.tsx#AutoMovieInspectorShadePanel

## @evidence contracts/development/common.md#meaningful-documentation

States what the panel edits and how several passes become one.

## @evidence contracts/development/implementation.md#principled-implementation

The shade list is a record keyed by the request's shade union, so a shade render adds fails compilation here until it is offered.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One select and one checkbox, each dispatching one edit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The panel shows the request's values and keeps no copy of them.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant per render.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A view with handlers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds nothing.
