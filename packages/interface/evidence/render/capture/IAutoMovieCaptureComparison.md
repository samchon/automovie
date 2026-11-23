# src/render/capture/IAutoMovieCaptureComparison.ts#IAutoMovieCaptureComparison

## @evidence contracts/development/design.md#principled-representation

The compared round, the matching rule, the tolerance in bytes and one entry per cell of either capture, each either a pair with its measured difference or an unmatched cell with its cause, so nothing is silently left out, and the finding diff with its outcome, kept apart from the pixel entries because a checker and a still answer different questions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the record and the reader; the measured numbers are those of `compareAutoMovieRasters`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A pair and an unmatched cell are union members keyed by `state`, and a side-by-side pair has no difference numbers rather than zeros.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the pairing rule and its source, when a pair is measured, and what the entries hold.
