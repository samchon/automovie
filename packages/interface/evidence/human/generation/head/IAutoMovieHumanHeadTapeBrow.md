# src/human/generation/head/IAutoMovieHumanHeadTapeBrow.ts#IAutoMovieHumanHeadTapeBrow.Mode

## @evidence contracts/development/common.md#meaningful-documentation

How the posterior anchor is searched.

## @evidence contracts/development/design.md#principled-representation

How the posterior anchor is searched. The closed alternatives are "complete", "continued".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHeadTape.solve, AutoMovieHumanHeadTapeBrow.maximum.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHeadTape.solve, AutoMovieHumanHeadTapeBrow.maximum for how the posterior anchor is searched.

# src/human/generation/head/IAutoMovieHumanHeadTapeBrow.ts#IAutoMovieHumanHeadTapeBrow.P2

## @evidence contracts/development/common.md#meaningful-documentation

Actual unchanged ear attachment in the sagittal calibration-mm chart.

## @evidence contracts/development/design.md#principled-representation

Actual unchanged ear attachment in the sagittal calibration-mm chart. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHeadTapeBrow.maximum.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHeadTapeBrow.maximum, AutoMovieHumanHeadTapeBrow.evaluate for actual unchanged ear attachment in the sagittal calibration-mm chart.

# src/human/generation/head/IAutoMovieHumanHeadTapeBrow.ts#IAutoMovieHumanHeadTapeBrow.MaximumSeed

## @evidence contracts/development/common.md#meaningful-documentation

Defines both coordinate slots, the posterior share's current-interval interpretation and the seed's lack of a maximum guarantee.

## @evidence contracts/development/design.md#principled-representation

A readonly two-number tuple accepts the coordinates of an existing course. AutoMovieHumanHeadTapeBrow.maximum validates the mapped posterior station; numeric finiteness and interval membership are not enforced by the tuple.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanHeadTape passes a previous course's coordinates into AutoMovieHumanHeadTapeBrow.maximum; retaining both slots preserves that result-to-input exchange.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The first coordinate is retained because callers pass the full course coordinates, while the fixed-brow search uses only the posterior coordinate. No convergence or residual claim is encoded in the tuple.
