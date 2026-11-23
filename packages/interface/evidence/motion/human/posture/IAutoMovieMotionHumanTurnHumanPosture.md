# src/motion/human/posture/IAutoMovieMotionHumanTurnHumanPosture.ts#IAutoMovieMotionHumanTurnHumanPosture.ITurned

## @evidence contracts/development/common.md#meaningful-documentation

position: The root's world position, metres.

## @evidence contracts/development/design.md#principled-representation

position: The root's world position, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/turnHumanPosture.ts (turnHumanPosture, return); everyday/HumanTrunk.ts (HumanTrunk.resolve); lexicon/HumanCarriedLift.ts (HumanCarriedLift.over.mix); posture/resolveHumanPosture.ts (resolveHumanPosture.seeded).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
