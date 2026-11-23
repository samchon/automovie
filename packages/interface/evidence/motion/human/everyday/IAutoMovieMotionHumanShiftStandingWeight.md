# src/motion/human/everyday/IAutoMovieMotionHumanShiftStandingWeight.ts#IAutoMovieMotionHumanShiftStandingWeight

## @evidence contracts/development/common.md#meaningful-documentation

Documents distance, frame and phase durations.

## @evidence contracts/development/design.md#principled-representation

A signed lateral distance with separate shift, hold and optional return times.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This contract is the input to shiftStandingWeight, which admits the request against the entry stance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The distance specifies pelvis displacement. No force or center-of-pressure target is inferred.
