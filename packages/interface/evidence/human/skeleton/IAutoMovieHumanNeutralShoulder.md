# src/human/skeleton/IAutoMovieHumanNeutralShoulder.ts#IAutoMovieHumanNeutralShoulder.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

One shoulder's neutral.

## @evidence contracts/development/design.md#principled-representation `turn`: The upper arm's world turn from the bind. `down`: The arm's unit direction at neutral, from the shoulder down. `resting`: The resting abduction from the plumb line, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanNeutralShoulder.derive. Also types AutoMovieHumanNeutral.shoulder.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `turn`, `down`, `resting`; callers supply the complete record.
