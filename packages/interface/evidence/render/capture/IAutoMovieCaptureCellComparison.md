# src/render/capture/IAutoMovieCaptureCellComparison.ts#IAutoMovieCaptureCellComparison

## @evidence contracts/development/design.md#principled-representation

The state and mode discriminants require paired names and distinguish numerical differences from unmatched causes, including absence, ambiguity and an undrawn counterpart. Numeric ranges, ordered pixel bounds and at least one nonnull unmatched name are producer invariants.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The round comparator publishes each cell's comparison independently; command reporting consumes the same paired or unmatched outcome.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unmatched cell is never counted as unchanged.

## @evidence contracts/development/common.md#meaningful-documentation

States what each member holds and its unit.
