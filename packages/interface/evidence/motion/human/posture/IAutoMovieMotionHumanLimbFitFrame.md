# src/motion/human/posture/IAutoMovieMotionHumanLimbFitFrame.ts#IAutoMovieMotionHumanLimbFitFrame.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

x: The root's x, world metres. z: The root's z, world metres.

## @evidence contracts/development/design.md#principled-representation

x: The root's x, world metres. z: The root's z, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanLimbFitFrame.ts (HumanLimbFitFrame.of, return); posture/HumanLimbFitFrame.ts (HumanLimbFitFrame.point, frame); posture/HumanLimbFitFrame.ts (HumanLimbFitFrame.pose, frame); posture/HumanLimbFitFrame.ts (HumanLimbFitFrame.goal, frame).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
