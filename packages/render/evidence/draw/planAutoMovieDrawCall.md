# src/draw/index.ts#planAutoMovieDrawCall

## @evidence contracts/development/common.md#meaningful-documentation

States what is taken from the cell, the subject and the plan, why the plan's seconds are the framing span, and what `@follow` changes.

## @evidence contracts/development/implementation.md#principled-implementation `.agents/skills/visual-debugging/capture.md`: a view that fits itself to its subject resolves to another camera when the subject changes, so one capture frames on all its seconds; the label scale is `scaleAutoMovieCaptureLabels`, the rule the capture run stamps by.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One literal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Values pass as planned; nothing is rounded or defaulted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the plan's seconds, which every call without `@follow` carries, plus one parse of the view text.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure mapping of one cell.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh call and keeps nothing.
