# src/motion/human/throwing/IAutoMovieMotionHumanRelease.ts#IAutoMovieMotionHumanRelease

## @evidence contracts/development/common.md#meaningful-documentation

hand: The opening hand; `right` when absent. prop: The prop it lets go of; the one the hand holds at the entry when absent. speed: The launcher's speed along the line, metres per second.

## @evidence contracts/development/design.md#principled-representation

hand: The opening hand; `right` when absent. prop: The prop it lets go of; the one the hand holds at the entry when absent. speed: The launcher's speed along the line, metres per second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainMutual.ts (HumanChainMutual.release, params); throwing/release.ts (release.plan, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanSide identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/throwing/IAutoMovieMotionHumanRelease.ts#IAutoMovieMotionHumanRelease.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The hand, the held prop and a launcher's own launch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members read by `plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The launch speed is the launcher's, given by the row that knows it.
