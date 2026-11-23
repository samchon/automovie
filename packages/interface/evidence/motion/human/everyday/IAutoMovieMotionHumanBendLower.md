# src/motion/human/everyday/IAutoMovieMotionHumanBendLower.ts#IAutoMovieMotionHumanBendLower.ISolved

## @evidence contracts/development/common.md#meaningful-documentation

lean: How far the hips move back for balance per unit sine of the inclination, metres. pitch: The trunk's inclination, degrees.

## @evidence contracts/development/design.md#principled-representation

lean: How far the hips move back for balance per unit sine of the inclination, metres. pitch: The trunk's inclination, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/bend.ts (bend.lowering, return); everyday/bendLower.ts (bendLower.solve, return); everyday/bend.ts (bend.plan); handling/pickUpLift.ts (pickUpLift); handling/pickUpPosture.ts (pickUpPosture.lowered).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBend.Strategy identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
