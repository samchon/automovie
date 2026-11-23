# src/motion/human/handling/IAutoMovieMotionHumanGrip.ts#IAutoMovieMotionHumanGrip.Digit

## @evidence contracts/development/common.md#meaningful-documentation

A digit.

## @evidence contracts/development/design.md#principled-representation

Closed choices "Index", "Middle", "Ring", "Little", "Thumb" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/HumanClasp.ts (HumanClasp.colliders.digits, digit); handling/HumanGrip.ts (HumanGrip.bones, digit); handling/HumanGrip.ts (HumanGrip.chain, digit); handling/HumanGrip.ts (HumanGrip.close.result, d); handling/HumanGrip.ts (HumanGrip.fingers.digits, d); handling/HumanGrip.ts (HumanGrip.aperture.tip, digit).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanClasp.colliders.digits.

# src/motion/human/handling/IAutoMovieMotionHumanGrip.ts#IAutoMovieMotionHumanGrip.ICloseResult

## @evidence contracts/development/common.md#meaningful-documentation

joints: Closed finger-joint rotations in clinical degrees. gaps: Final signed digit-to-collider gaps in metres, positive while separated; only digits participating in this grip are present.

## @evidence contracts/development/design.md#principled-representation

joints: Closed finger-joint rotations in clinical degrees. gaps: Final signed digit-to-collider gaps in metres, positive while separated; only digits participating in this grip are present.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/HumanGrip.ts (HumanGrip.close, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanGrip.Digit identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
