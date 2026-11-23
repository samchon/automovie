# src/motion/human/handling/IAutoMovieMotionHumanPushSled.ts#IAutoMovieMotionHumanPushSled

## @evidence contracts/development/common.md#meaningful-documentation

to: Where the walk goes, world metres. left: The handle the left hand takes, an affordance id; `left` when absent. right: The handle the right hand takes, an affordance id; `right` when absent.

## @evidence contracts/development/design.md#principled-representation

to: Where the walk goes, world metres. left: The handle the left hand takes, an affordance id; `left` when absent. right: The handle the right hand takes, an affordance id; `right` when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/pushSled.ts (pushSled.plan, context); handling/pushSled.ts (pushSled.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanWalkFacing.IFacing identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/handling/IAutoMovieMotionHumanPushSled.ts#IAutoMovieMotionHumanPushSled.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and default.

## @evidence contracts/development/design.md#principled-representation

The load, its two handles, the lean and the length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The handles are named affordances of the prop.
