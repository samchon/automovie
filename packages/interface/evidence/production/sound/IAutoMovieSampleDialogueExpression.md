# src/production/sound/IAutoMovieSampleDialogueExpression.ts#IAutoMovieSampleDialogueExpression.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States the blend, the retained authored expression, the refusals and that frames may be sampled in any order.

## @evidence contracts/development/design.md#principled-representation

A timeline, a possibly fractional frame and the film rate that converts the coarticulation time constant to frames.

## @evidence contracts/development/design.md#minimal-and-owned-surface

All four members are read by `sampleAutoMovieDialogueExpression`; the weight sampler reads three.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No cursor or history is kept, so seeking needs no state.
