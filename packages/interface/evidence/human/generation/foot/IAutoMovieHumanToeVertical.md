# src/human/generation/foot/IAutoMovieHumanToeVertical.ts#IAutoMovieHumanToeVertical

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanToeVertical exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups ISource. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanToeVertical; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the ISource contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/foot/IAutoMovieHumanToeVertical.ts#IAutoMovieHumanToeVertical.ISource

## @evidence contracts/development/common.md#meaningful-documentation

Full original vertical curves plus their actual parent contact authority.

## @evidence contracts/development/design.md#principled-representation `height`: Original world-height axis curve, mm. `upper`: Positive dorsal and negative plantar radial source curves, mm. `lower`: Negative radial source; height+lower equals plantar under the same clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanToeVertical.create. Also types AutoMovieHumanFootToeSources.vertical.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `height`, `upper`, `lower`, `plantar`, `root`, `hidden`, `at`; callers supply the complete record.
