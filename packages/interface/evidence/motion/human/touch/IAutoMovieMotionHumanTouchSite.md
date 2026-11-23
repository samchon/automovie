# src/motion/human/touch/IAutoMovieMotionHumanTouchSite.ts#IAutoMovieMotionHumanTouchSite.ISite

## @evidence contracts/development/common.md#meaningful-documentation

States the three forms, the unit and what the one rule chooses.

## @evidence contracts/development/design.md#principled-representation

The three ways a site is chosen as one closed union: fixed, drawn, ruled.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three forms, each read by `of`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The radius is the author's, in metres, because a region's frame carries no extent to read one from.

# src/motion/human/touch/IAutoMovieMotionHumanTouchSite.ts#IAutoMovieMotionHumanTouchSite.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

A region's point and outward unit normal.

## @evidence contracts/development/design.md#principled-representation

Closed choices "point", "normal" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: touch/touchHold.ts (touchHold.region, perceived); touch/touchHold.ts (touchHold.region, held); touch/touchHold.ts (touchHold.region, return); touch/touchHold.ts (touchHold.perceived, perceived); touch/touchHold.ts (touchHold.perceived, return); touch/touchRegion.ts (touchRegion.reader, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanTarget.IPlace identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
