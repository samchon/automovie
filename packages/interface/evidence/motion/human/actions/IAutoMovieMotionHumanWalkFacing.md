# src/motion/human/actions/IAutoMovieMotionHumanWalkFacing.ts#IAutoMovieMotionHumanWalkFacing.IFacing

## @evidence contracts/development/common.md#meaningful-documentation

yaw: Fixed heading in degrees about world +Y, zero toward +Z. toward: World-space point, metres, toward which the walking body faces. turn: Additional yaw in degrees relative to the direction toward the point; zero when omitted.

## @evidence contracts/development/design.md#principled-representation

yaw: Fixed heading in degrees about world +Y, zero toward +Z. toward: World-space point, metres, toward which the walking body faces. turn: Additional yaw in degrees relative to the direction toward the point; zero when omitted.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/walkFacing.ts (walkFacing.share, facing); actions/walkSteps.ts (walkSteps.plan); lexicon/HumanTravelLeafWalk.ts (HumanTravelLeafWalk.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
