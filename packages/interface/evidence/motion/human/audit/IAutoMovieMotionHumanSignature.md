# src/motion/human/audit/IAutoMovieMotionHumanSignature.ts#IAutoMovieMotionHumanSignature.IMotion

## @evidence contracts/development/common.md#meaningful-documentation

duration: Seconds from 0 to the end.

## @evidence contracts/development/design.md#principled-representation

duration: Seconds from 0 to the end.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/HumanSignature.ts (HumanSignature.of, motion).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone, IAutoMovieResolvedBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/audit/IAutoMovieMotionHumanSignature.ts#IAutoMovieMotionHumanSignature.IReader

## @evidence contracts/development/common.md#meaningful-documentation

yaw: The heading their forward is read along, degrees about +Y, 0 facing +Z.

## @evidence contracts/development/design.md#principled-representation

yaw: The heading their forward is read along, degrees about +Y, 0 facing +Z.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/HumanSignature.ts (HumanSignature.of, return); audit/HumanSignature.ts (HumanSignature.bones, reader); audit/HumanSignature.ts (HumanSignature.joint, reader); audit/HumanSignature.ts (HumanSignature.trunk, reader); audit/HumanSignature.ts (HumanSignature.knee, reader); audit/HumanSignature.ts (HumanSignature.hip, reader).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanSignature.IMotion, IAutoMovieMotionHumanBody identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/audit/IAutoMovieMotionHumanSignature.ts#IAutoMovieMotionHumanSignature.IGait

## @evidence contracts/development/common.md#meaningful-documentation

duty: The share of the window each foot bears, averaged over both feet.

## @evidence contracts/development/design.md#principled-representation

duty: The share of the window each foot bears, averaged over both feet.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/HumanSignature.ts (HumanSignature.gait, return); audit/HumanSignature.ts (HumanSignature.gait).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanSignature.gait.
