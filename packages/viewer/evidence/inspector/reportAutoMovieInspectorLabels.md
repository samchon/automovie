# src/inspector/reportAutoMovieInspectorLabels.ts#reportAutoMovieInspectorLabels

## @evidence contracts/development/common.md#meaningful-documentation

States what is reported while paused and while playing.

## @evidence contracts/development/implementation.md#principled-implementation

Labels are placed on a paused picture only, as the page shows them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per playhead state.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Labels are cleared once when playback starts, not left stale.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the labels placed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Placed afresh for each paused picture.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Writes only the mount's labelled flag.