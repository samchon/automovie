# src/motion/human/carrier/IAutoMovieMotionHumanSupportCarry.ts#IAutoMovieMotionHumanSupportCarry.ICarry

## @evidence contracts/development/common.md#meaningful-documentation

yaw: That turn's yaw about the vertical, degrees.

## @evidence contracts/development/design.md#principled-representation

yaw: That turn's yaw about the vertical, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/stand.ts (stand.plan.carried, return); actions/standFeet.ts (standFeet.of, carry); carrier/HumanSupportAim.ts (HumanSupportAim.correction, carry); carrier/HumanSupportAim.ts (HumanSupportAim.posture, carry); carrier/HumanSupportCarry.ts (HumanSupportCarry.of, return); carrier/HumanSupportCarry.ts (HumanSupportCarry.posture, carry).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
