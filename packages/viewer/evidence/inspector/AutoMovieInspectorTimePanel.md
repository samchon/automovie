# src/inspector/AutoMovieInspectorTimePanel.tsx#AutoMovieInspectorTimePanel

## @evidence contracts/development/common.md#meaningful-documentation

States what each control changes, which of them edit the request, what the button reads and how it is labelled.

## @evidence contracts/development/implementation.md#principled-implementation

The speed changes no picture, so it stays with the playhead; a stop or seek fixes a picture, so the readout makes it the request's second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One toggle, the readout and a select.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The button subscribes to the playing flag alone, a boolean React compares by value, so moving seconds never re-render the panel.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant per render, one render per start or stop.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A view with handlers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

React holds one playhead subscription while the panel is mounted and removes it on unmount; the readout holds its own.
