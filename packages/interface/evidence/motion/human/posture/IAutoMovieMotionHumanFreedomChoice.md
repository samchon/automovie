# src/motion/human/posture/IAutoMovieMotionHumanFreedomChoice.ts#IAutoMovieMotionHumanFreedomChoice.Freedom

## @evidence contracts/development/common.md#meaningful-documentation

kind: Coordinate-domain discriminant: finite bounded interval or periodic wrapped coordinate. step: Search increment in the coordinate's own units. least: Inclusive lower coordinate bound in the coordinate's own units.

## @evidence contracts/development/design.md#principled-representation

kind: Coordinate-domain discriminant: finite bounded interval or periodic wrapped coordinate. step: Search increment in the coordinate's own units. least: Inclusive lower coordinate bound in the coordinate's own units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanFreedomChoice.ts (HumanFreedomChoice.chosen.within).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanFreedomChoice.chosen.within.

# src/motion/human/posture/IAutoMovieMotionHumanFreedomChoice.ts#IAutoMovieMotionHumanFreedomChoice.IProblem

## @evidence contracts/development/common.md#meaningful-documentation

judge: How far the fitted hand misses the pose the values give, metres, at each instant the pose is judged at, read lazily and in order.

## @evidence contracts/development/design.md#principled-representation

judge: How far the fitted hand misses the pose the values give, metres, at each instant the pose is judged at, read lazily and in order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanFreedomChoice.ts (HumanFreedomChoice.chosen, problem).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanFreedomChoice.Freedom identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanFreedomChoice.ts#IAutoMovieMotionHumanFreedomChoice.IChoice

## @evidence contracts/development/common.md#meaningful-documentation

miss: The worst of the misses at every instant, metres.

## @evidence contracts/development/design.md#principled-representation

miss: The worst of the misses at every instant, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanFreedomChoice.ts (HumanFreedomChoice.chosen, return); handling/pushSled.ts (pushSled.plan.take).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanFreedomChoice.chosen.
