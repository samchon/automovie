# src/motion/human/everyday/IAutoMovieMotionHumanRest.ts#IAutoMovieMotionHumanRest.IParams

## @evidence contracts/development/common.md#meaningful-documentation

left: The left hand's place; `side` when absent. right: The right hand's place; `side` when absent. hold: How long, seconds; 2 when absent. Exclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#principled-representation

left: The left hand's place; `side` when absent. right: The right hand's place; `side` when absent. hold: How long, seconds; 2 when absent. Exclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainManual.ts (HumanChainManual.rest, params); everyday/rest.ts (rest.plan, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanRest.Place identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/everyday/IAutoMovieMotionHumanRest.ts#IAutoMovieMotionHumanRest.Place

## @evidence contracts/development/common.md#meaningful-documentation

Both hands' rest goals on a posture ({@link restGoals}). A rest place.

## @evidence contracts/development/design.md#principled-representation

Closed choices "side", "pocket", "hip", "crossed", "claspedFront", "claspedBehind", "behindHead", "chinRest", "elbowSupport" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/rest.ts (rest.goals, places); everyday/restGoals.ts (restGoals, places); everyday/rest.ts (rest.PAIRED); everyday/rest.ts (rest.plan); everyday/restGoals.ts (restGoals).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in rest.goals.

# src/motion/human/everyday/IAutoMovieMotionHumanRest.ts#IAutoMovieMotionHumanRest.IGoal

## @evidence contracts/development/common.md#meaningful-documentation

point: Where the surface goes, world metres. elbow: The elbow's bend hint, world metres.

## @evidence contracts/development/design.md#principled-representation

point: Where the surface goes, world metres. elbow: The elbow's bend hint, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/rest.ts (rest.goals, return); everyday/restClasped.ts (restClasped.front, return); everyday/restClasped.ts (restClasped.front.goals, return); everyday/restClasped.ts (restClasped.behind, return); everyday/restClasped.ts (laid, return); everyday/restClasped.ts (stacked, left).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanHand.Surface, IAutoMovieMotionHumanHand.Shape, IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
