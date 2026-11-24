# src/human/generation/conic/IAutoMovieHumanSkinCutLoop.ts#IAutoMovieHumanSkinCutLoop

## @evidence contracts/development/design.md#principled-representation

A host point and one signed quantity carry the same world-space constraint at each chart point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the input to the Human skin-cut loop.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Carries the declared source callback without an inferred correction.

## @evidence contracts/development/common.md#meaningful-documentation

The input distinguishes chart coordinates from figure millimetres.

# src/human/generation/conic/IAutoMovieHumanSkinCutLoop.ts#IAutoMovieHumanSkinCutLoop.IInput

## @evidence contracts/development/design.md#principled-representation

Each ray starts at one original host chart centre and advances along one direction determined by the elliptical scale and clock sense.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The cut needs the two callbacks, chart ellipse, count, direction and search range.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The cut reads the passed signed field and refuses a missing crossing. The input names no fallback.

## @evidence contracts/development/common.md#meaningful-documentation

Defines callback units, clock cadence and the crossing side.
