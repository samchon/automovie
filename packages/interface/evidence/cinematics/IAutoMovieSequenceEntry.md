# src/cinematics/IAutoMovieSequenceEntry.ts#IAutoMovieSequenceEntry

## @evidence contracts/development/design.md#principled-representation `sequenceTimeline` takes its source offset from `trim.start` and divides the retained source duration by the rate. The incoming transition duration shifts the placement start on the output clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The playback rate retimes the source without copying the shot. The optional source end retains a symbolic trim's exact event boundary for source comparisons.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A transition on the first entry is refused by `cutSequence` and thrown by `sequenceTimeline` rather than silently dropped, and an unknown shot id is refused rather than skipped.

## @evidence contracts/development/common.md#meaningful-documentation

States how the source trim, playback rate and transition determine the played span and output start, and lists admission and default rules.
