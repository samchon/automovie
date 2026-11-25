# src/motion/human/perform/IAutoMovieMotionHumanPerformanceAim.ts#IAutoMovieMotionHumanPerformanceAim.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

root: Their root, world metres. yaw: Their heading, degrees about +Y. heights: The heights of a `none` target's lines, world metres.

## @evidence contracts/development/design.md#principled-representation

root: Their root, world metres. yaw: Their heading, degrees about +Y. heights: The heights of a `none` target's lines, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanPerformance.ts (HumanPerformance.aim, frame); perform/HumanPerformanceAim.ts (HumanPerformanceAim.aim, frame); perform/HumanPerformanceAim.ts (HumanPerformanceAim.frame, bones); perform/HumanPerformanceAim.ts (HumanPerformanceAim.frame, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanBody, AutoMovieHumanoidBone, IAutoMovieResolvedBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
