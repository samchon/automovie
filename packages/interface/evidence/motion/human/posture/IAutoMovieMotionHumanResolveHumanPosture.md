# src/motion/human/posture/IAutoMovieMotionHumanResolveHumanPosture.ts#IAutoMovieMotionHumanResolveHumanPosture.INear

## @evidence contracts/development/common.md#meaningful-documentation

Each limb's nearby fit to continue (`IAutoMovieSwivelNear`).

## @evidence contracts/development/design.md#principled-representation

A borrowed partial map gives a nearby fit only for limbs the caller can continue; an absent key requests that limb's ordinary cold fit, not a fabricated seed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/resolveHumanPosture.ts (resolveHumanPosture, near); posture/resolveHumanPosture.ts (resolveHumanPosture.seeded, near); posture/resolveHumanPosture.ts (resolveHumanPosture.refit, near).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanLimb, IAutoMovieSwivelNear identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanResolveHumanPosture.ts#IAutoMovieMotionHumanResolveHumanPosture.ISeeded

## @evidence contracts/development/common.md#meaningful-documentation

pose: The canonical pose. seeds: Each fitted limb's seed. values: Each fitted limb's fit value (`IAutoMovieSeededChainFit.value`), where its fit reports one.

## @evidence contracts/development/design.md#principled-representation

pose: The canonical pose. seeds: Each fitted limb's seed. values: Each fitted limb's fit value (`IAutoMovieSeededChainFit.value`), where its fit reports one.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/resolveHumanPosture.ts (resolveHumanPosture.seeded, return); posture/resolveHumanPosture.ts (resolveHumanPosture.refit, return); handling/HumanGraspSearch.ts (HumanGraspSearch.fit); perform/HumanSegmentOverlay.ts (HumanSegmentOverlay.overlaid.build); perform/HumanSegmentOverlay.ts (HumanSegmentOverlay.overlaid); perform/HumanSegmentPose.ts (HumanSegmentPose.seeded).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMoviePose, AutoMovieHumanLimb, IAutoMovieSwivelSeed, IAutoMovieSeededChainFit identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
