# src/reaction/staggerCapture.ts#staggerCapture

## @evidence contracts/development/common.md#meaningful-documentation

States the formula, its source and premises, its permissive bounds and that it only screens.

## @evidence contracts/development/implementation.md#principled-implementation

Koolen's N-step capture region of the linear inverted pendulum, its geometric series summed in closed form, with the first step's own reaction time.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The bounds, the series, then the push's distance and the fewest steps.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every bound is the most permissive of the measured ones, so the screen never refuses what the steps would catch; it decides nothing else.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: one sole scan per foot and a few exponentials.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the pendulum's own frequency, feet and push state.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns scalars and a closure over them.
