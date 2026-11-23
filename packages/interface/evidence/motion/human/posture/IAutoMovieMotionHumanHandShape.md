# src/motion/human/posture/IAutoMovieMotionHumanHandShape.ts#IAutoMovieMotionHumanHandShape

## @evidence contracts/development/common.md#meaningful-documentation

The finger joints of a named hand shape: the angles `IAutoMovieMotionHumanHand.Shape` stands for on every finger and thumb segment of one hand.

## @evidence contracts/development/design.md#principled-representation

Closed choices "thumbUp", "ok", "victory", "crossed", "count1", "count2", "count3", "count4", "count5", "snap", "quotes" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanHandShape.ts (HumanHandShape.emblem, form); posture/HumanHandShape.ts (HumanHandShape.EMBLEMS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanHandShape.emblem.

# src/motion/human/posture/IAutoMovieMotionHumanHandShape.ts#IAutoMovieMotionHumanHandShape.Emblem

## @evidence contracts/development/common.md#meaningful-documentation

Names each shape by what the fingers do and states the counting convention.

## @evidence contracts/development/design.md#principled-representation

A closed union of emblem shapes, each a set of finger joint angles in `emblem`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shapes the emblem rows read; the working shapes stay `IAutoMovieMotionHumanHand.Shape`'s.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A separate union, so no caller of the working shapes changes.
