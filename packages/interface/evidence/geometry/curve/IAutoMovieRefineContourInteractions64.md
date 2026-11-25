# src/geometry/curve/IAutoMovieRefineContourInteractions64.ts#IAutoMovieRefineContourInteractions64.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Refinement qualification, ordered trace, split/predicate counts and nullable millisecond timing remain separate measurements. Nonempty diagnostics do not imply failure, and null elapsedMs means timing was not requested rather than zero work.

## @evidence contracts/development/design.md#principled-representation

Refinement qualification, ordered trace, split/predicate counts and nullable millisecond timing remain separate measurements.

## @evidence contracts/development/design.md#minimal-and-owned-surface

refineAutoMovieContourInteractions64 returns owned observations to boundary preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nonempty diagnostics do not imply failure, and null elapsedMs means timing was not requested rather than zero work.
