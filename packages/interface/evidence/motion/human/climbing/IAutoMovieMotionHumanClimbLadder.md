# src/motion/human/climbing/IAutoMovieMotionHumanClimbLadder.ts#IAutoMovieMotionHumanClimbLadder.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and default.

## @evidence contracts/development/design.md#principled-representation

The ladder as the scene's prop, and how far to climb.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members read by `plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No hold is typed.

# src/motion/human/climbing/IAutoMovieMotionHumanClimbLadder.ts#IAutoMovieMotionHumanClimbLadder.Limb

## @evidence contracts/development/common.md#meaningful-documentation

A limb of the climb.

## @evidence contracts/development/design.md#principled-representation

Closed choices "leftHand", "rightHand", "leftFoot", "rightFoot" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: climbing/climbLadder.ts (climbLadder.plan, limb); climbing/climbLadder.ts (climbLadder.plan.level, limb); climbing/climbLadder.ts (climbLadder.ORDER); climbing/climbLadder.ts (climbLadder.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in climbLadder.plan.

# src/motion/human/climbing/IAutoMovieMotionHumanClimbLadder.ts#IAutoMovieMotionHumanClimbLadder.IPlan

## @evidence contracts/development/common.md#meaningful-documentation

ladder: The ladder.

## @evidence contracts/development/design.md#principled-representation

ladder: The ladder.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: climbing/climbLadder.ts (climbLadder.plan, return); executable/cases/climbCases.ts (climbCases).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanLadder.ILadder identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/climbing/IAutoMovieMotionHumanClimbLadder.ts#IAutoMovieMotionHumanClimbLadder.Direction

## @evidence contracts/development/common.md#meaningful-documentation

States both directions.

## @evidence contracts/development/design.md#principled-representation

A closed choice; down replays the same stances in reverse order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by planLadderAccess.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly.

# src/motion/human/climbing/IAutoMovieMotionHumanClimbLadder.ts#IAutoMovieMotionHumanClimbLadder.ILanding

## @evidence contracts/development/common.md#meaningful-documentation

Names the placed surface and the direction, with its default.

## @evidence contracts/development/design.md#principled-representation

The prop's level surface affordance supplies the height, width and depth in world metres; the direction orders the same contact route.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by planLadderAccess only when the author requests a complete route.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The landing names a real surface, without an invented endpoint; a moving, sloped, misaligned or unreachable one is refused at runtime.
