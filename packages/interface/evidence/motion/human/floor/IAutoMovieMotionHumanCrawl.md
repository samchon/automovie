# src/motion/human/floor/IAutoMovieMotionHumanCrawl.ts#IAutoMovieMotionHumanCrawl

## @evidence contracts/development/common.md#meaningful-documentation

kind: On what it crawls: `knees` (hands and knees), `bear` (hands and feet, the knees off the floor) or `inchworm` (the hands walked out to a plank, the feet in to the hands); `knees` when absent. count: How many crawl cycles; 3 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless.

## @evidence contracts/development/design.md#principled-representation

kind: On what it crawls: `knees` (hands and knees), `bear` (hands and feet, the knees off the floor) or `inchworm` (the hands walked out to a plank, the feet in to the hands); `knees` when absent. count: How many crawl cycles; 3 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainTravel.ts (HumanChainTravel.crawl, params); floor/crawl.ts (crawl.plan, context); floor/crawlInchworm.ts (crawlInchworm.plan, context); floor/crawl.ts (crawl.plan.centred, limb); floor/crawl.ts (crawl.plan.landed, limb); floor/crawl.ts (crawl.plan.print, limb).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/floor/IAutoMovieMotionHumanCrawl.ts#IAutoMovieMotionHumanCrawl.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its default.

## @evidence contracts/development/design.md#principled-representation

A kind, a cycle count and a manner.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members read by `plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No distance is typed.

# src/motion/human/floor/IAutoMovieMotionHumanCrawl.ts#IAutoMovieMotionHumanCrawl.Kind

## @evidence contracts/development/common.md#meaningful-documentation

On what the body crawls.

## @evidence contracts/development/design.md#principled-representation

Closed choices "knees", "bear", "inchworm" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: floor/crawl.ts (crawl.KINDS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in crawl.KINDS.

# src/motion/human/floor/IAutoMovieMotionHumanCrawl.ts#IAutoMovieMotionHumanCrawl.Limb

## @evidence contracts/development/common.md#meaningful-documentation

A limb of the crawl.

## @evidence contracts/development/design.md#principled-representation

Closed choices "leftHand", "rightHand", "leftKnee", "rightKnee" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: floor/crawl.ts (crawl.plan.centred, limb); floor/crawl.ts (crawl.plan.landed, limb); floor/crawl.ts (crawl.plan.print, limb); floor/crawl.ts (crawl.plan.kneeling, at); floor/crawl.ts (crawl.plan.down, limb); floor/crawl.ts (crawl.plan.lift, limb).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in crawl.plan.centred.
