# src/inspector/AutoMovieInspectorViewPanel.tsx#AutoMovieInspectorViewPanel

## @evidence contracts/development/common.md#meaningful-documentation

States the forms offered, which view is shown, how a change is written and when typed fields are dispatched.

## @evidence contracts/development/implementation.md#principled-implementation

The shown view is parsed by render's view grammar and the dispatched text written by its inverse, so every switch is one the grammar reads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One select for the form, then the controls that form takes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A view the grammar refuses is refused by the reducer with the key named; the panel validates nothing itself.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant per render beyond the view names listed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A view with handlers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds only the text being typed.
