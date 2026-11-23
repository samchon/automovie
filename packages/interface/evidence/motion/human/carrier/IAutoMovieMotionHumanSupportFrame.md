# src/motion/human/carrier/IAutoMovieMotionHumanSupportFrame.ts#IAutoMovieMotionHumanSupportFrame.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

position: Its origin, world metres.

## @evidence contracts/development/design.md#principled-representation

position: Its origin, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: carrier/HumanSupportFrame.ts (HumanSupportFrame.at, return); carrier/HumanSupportCarry.ts (HumanSupportCarry.plan.frame).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanContactWindow.Support, IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
