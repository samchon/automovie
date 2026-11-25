# src/motion/human/striking/IAutoMovieMotionHumanStrikingTarget.ts#IAutoMovieMotionHumanStrikingTarget.IStance

## @evidence contracts/development/common.md#meaningful-documentation

centre: The stance centre a range is measured from: midway between the ankles, on the floor. forward: The horizontal unit direction toward the virtual opponent.

## @evidence contracts/development/design.md#principled-representation

centre: The stance centre a range is measured from: midway between the ankles, on the floor. forward: The horizontal unit direction toward the virtual opponent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: striking/StrikingTarget.ts (StrikingTarget.stance, return); striking/KickGeometry.ts (KickGeometry.build); striking/StrikingTarget.ts (StrikingTarget.aim).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
