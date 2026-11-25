# src/validation/IAutoMovieValidateContinuity.ts#IAutoMovieValidateContinuity.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Compare every prior-end actor to the incoming opening for missing presence, Euclidean drift, facing angle and persistent mount changes. Member documentation states the supplied records, units and absence meanings used by validateContinuity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The two boundary states remain distinct and reuse one end-state shape; continuity compares presence, placement and mounts without fabricating missing actors.

## @evidence contracts/development/design.md#principled-representation

previous and opening are canonical beat boundary states; positionTolerance is world metres and facingToleranceDeg is degrees, defaulting to 0.05 and 5.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieValidateContinuity.IProps, used by validateContinuity. Its previous, opening, positionTolerance, facingToleranceDeg members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
