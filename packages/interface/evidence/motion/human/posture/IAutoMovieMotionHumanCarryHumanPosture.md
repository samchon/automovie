# src/motion/human/posture/IAutoMovieMotionHumanCarryHumanPosture.ts#IAutoMovieMotionHumanCarryHumanPosture.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

position: Origin, world metres.

## @evidence contracts/development/design.md#principled-representation

position: Origin, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanCarried.ts (HumanCarried.carried.frame, return); posture/carryHumanPosture.ts (carryHumanPosture, origin); posture/carryHumanPosture.ts (carryHumanPosture, now); lexicon/HumanCarried.ts (HumanCarried.carried).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
