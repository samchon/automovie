# src/validation/IAutoMovieFreeFallResult.ts#IAutoMovieFreeFallResult

## @evidence contracts/development/design.md#principled-representation

The canonical detector keeps validation separate from generated time-zero fall advice; invalid duration/margin produces an error with no suggested arc, and supported/attached/falling bodies produce no fall suggestion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One outcome joins physical advice and the corresponding interaction event without turning a warning into a failed authored model.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A trajectory is proposed only when the detector expects unsupported free fall; the record does not claim a host applied it or a collider-free path was proved.

## @evidence contracts/development/common.md#meaningful-documentation

Names the producer, warning/error distinction, shot-clock events and nullable suggested clip; generated trajectory failures may still propagate from the detector.
