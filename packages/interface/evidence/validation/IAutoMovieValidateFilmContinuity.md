# src/validation/IAutoMovieValidateFilmContinuity.ts#IAutoMovieValidateFilmContinuity.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Resolve end/opening states in playback order and compare adjacent beat boundaries for advisory discontinuity. Member documentation states the supplied records, units and absence meanings used by validateFilmContinuity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The input reuses beat resolution contracts rather than another boundary schema; continuity is advisory and follows authored playback order.

## @evidence contracts/development/design.md#principled-representation

beats retains playback order and shared world-metre/degree tolerances control adjacent resolved boundary comparisons.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieValidateFilmContinuity.IProps, used by validateFilmContinuity. Its beats, positionTolerance, facingToleranceDeg members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
