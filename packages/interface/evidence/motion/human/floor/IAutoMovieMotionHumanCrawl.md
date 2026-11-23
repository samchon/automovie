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
