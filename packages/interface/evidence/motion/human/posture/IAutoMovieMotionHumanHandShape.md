# src/motion/human/posture/IAutoMovieMotionHumanHandShape.ts#IAutoMovieMotionHumanHandShape.Emblem

## @evidence contracts/development/common.md#meaningful-documentation

Names each shape by what the fingers do and states the counting convention.

## @evidence contracts/development/design.md#principled-representation

A closed union of emblem shapes, each a set of finger joint angles in `emblem`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shapes the emblem rows read; the working shapes stay `IAutoMovieMotionHumanHand.Shape`'s.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A separate union, so no caller of the working shapes changes.
