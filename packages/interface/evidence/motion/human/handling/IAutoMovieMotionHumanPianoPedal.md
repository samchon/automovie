# src/motion/human/handling/IAutoMovieMotionHumanPianoPedal.ts#IAutoMovieMotionHumanPianoPedal

## @evidence contracts/development/common.md#meaningful-documentation

States the player, target and runtime admission owner.

## @evidence contracts/development/design.md#principled-representation

Uses ordered press intervals on one clock, independent of the fingers' note times.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries the target prop, authored press intervals and action duration.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reads pedal geometry and travel from the staged model at planning.

# src/motion/human/handling/IAutoMovieMotionHumanPianoPedal.ts#IAutoMovieMotionHumanPianoPedal.IPress

## @evidence contracts/development/common.md#meaningful-documentation

States the clock origin, boundary order and recovery.

## @evidence contracts/development/design.md#principled-representation

Four phase boundaries allow an independently authored dwell.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The interval carries only its times.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The law derives intermediate travel from the model and the timed boundaries.
