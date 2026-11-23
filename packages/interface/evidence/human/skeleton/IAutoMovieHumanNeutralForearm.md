# src/human/skeleton/IAutoMovieHumanNeutralForearm.ts#IAutoMovieHumanNeutralForearm.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

One forearm's neutral.

## @evidence contracts/development/design.md#principled-representation `lower`: The forearm bone's world turn, which carries its share of the twist. `hand`: The hand's world turn, which carries the rest. `pronation`: The achieved pronation from thumbs forward, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanNeutralForearm.derive. Also types AutoMovieHumanNeutral.forearm.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `lower`, `hand`, `pronation`; callers supply the complete record.
