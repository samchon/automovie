# src/motion/human/lexicon/IAutoMovieMotionHumanTravelDoor.ts#IAutoMovieMotionHumanTravelDoor.Mode

## @evidence contracts/development/common.md#meaningful-documentation

States what each posture does and the crawl's entry requirement.

## @evidence contracts/development/design.md#principled-representation

A closed choice of posture; the opening's dimensions decide whether it fits.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by HumanTravelDoor.passThrough and planReducedOpening.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; the fit is measured at runtime.

# src/motion/human/lexicon/IAutoMovieMotionHumanTravelDoor.ts#IAutoMovieMotionHumanTravelDoor.IParams

## @evidence contracts/development/common.md#meaningful-documentation

aperture: The opening's id within that obstacle; its only opening when absent. mode: The posture fitted through the opening; upright when absent. pace: The pace of the standing gait.

## @evidence contracts/development/design.md#principled-representation

aperture: The opening's id within that obstacle; its only opening when absent. mode: The posture fitted through the opening; upright when absent. pace: The pace of the standing gait.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanTravelDoor.ts (HumanTravelDoor.passThrough, context); lexicon/planReducedOpening.ts (planReducedOpening, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanGait.WalkPace identity used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
