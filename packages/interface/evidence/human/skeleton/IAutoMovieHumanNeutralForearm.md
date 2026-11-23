# src/human/skeleton/IAutoMovieHumanNeutralForearm.ts#IAutoMovieHumanNeutralForearm

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanNeutralForearm exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IOutput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanNeutralForearm; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IOutput contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/skeleton/IAutoMovieHumanNeutralForearm.ts#IAutoMovieHumanNeutralForearm.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

One forearm's neutral.

## @evidence contracts/development/design.md#principled-representation `lower`: The forearm bone's world turn, which carries its share of the twist. `hand`: The hand's world turn, which carries the rest. `pronation`: The achieved pronation from thumbs forward, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanNeutralForearm.derive. Also types AutoMovieHumanNeutral.forearm.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `lower`, `hand`, `pronation`; callers supply the complete record.
