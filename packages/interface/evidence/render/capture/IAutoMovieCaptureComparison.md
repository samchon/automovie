# src/render/capture/IAutoMovieCaptureComparison.ts#IAutoMovieCaptureComparison

## @evidence contracts/development/design.md#principled-representation

The Render producer reports the matching rule, tolerance in bytes and each cell as part of a paired or unmatched entry. Cell mode uses second, selection, view and pass. Time mode uses second, pass and selection and pairs unique equal views when a key repeats. Both modes report an unmatched entry when the cells report different resolved cameras. A draw camera's settings identify it even when the chosen view text differs. The finding diff records the checker outcome independently of the picture entries.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the record and the reader; the measured numbers are those of `compareAutoMovieRasters`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A pair and an unmatched cell are union members keyed by `state`, and a side-by-side pair has no difference numbers rather than zeros.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the pairing rule and its source, when a pair is measured, and what the entries hold.
