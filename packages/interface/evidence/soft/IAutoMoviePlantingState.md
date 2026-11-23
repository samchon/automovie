# src/soft/IAutoMoviePlantingState.ts#IAutoMoviePlantingState

## @evidence contracts/development/design.md#principled-representation

growPlanting derives path-seeded depth-first branches and leaves at one growth stage; branch endpoints remain recipe-local so cluster TRS can instance the same structure.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One result separates structure derivation from cluster arrangement and includes its recipe identity and stage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Bounds include maximum-end-radius stem support and all four transformed XY leaf-card corners, matching emitted geometry rather than guessing foliage width; this CPU envelope does not certify GPU rounding or continuous inclusion in a non-convex room union.

## @evidence contracts/development/common.md#meaningful-documentation

The recipe frame, stable branch/leaf order, nullable empty result and complete emitted stem/card envelope are stated for installation consumers composing member scale, rotation and translation.
