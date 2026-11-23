# src/motion/human/terrain/IAutoMovieMotionHumanClimbStairs.ts#IAutoMovieMotionHumanClimbStairs

## @evidence contracts/development/common.md#meaningful-documentation

pattern: One foot per tread, or both feet on each; `stepOverStep` when absent. lead: The foot that steps first; `right` when absent.

## @evidence contracts/development/design.md#principled-representation

pattern: One foot per tread, or both feet on each; `stepOverStep` when absent. lead: The foot that steps first; `right` when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainTravel.ts (HumanChainTravel.climbStairs, params); terrain/climbStairs.ts (climbStairs.plan, context); executable/cases/stairsCases.ts (stairsCases); terrain/climbStairs.ts (climbStairs.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/terrain/IAutoMovieMotionHumanClimbStairs.ts#IAutoMovieMotionHumanClimbStairs.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and default.

## @evidence contracts/development/design.md#principled-representation

The flight's architecture and the stepping pattern.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Nine members with the flight's, all read by `plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No footprint is typed; they follow from the flight.

# src/motion/human/terrain/IAutoMovieMotionHumanClimbStairs.ts#IAutoMovieMotionHumanClimbStairs.IRail

## @evidence contracts/development/common.md#meaningful-documentation

Names the side and the exact bar.

## @evidence contracts/development/design.md#principled-representation

The prop's bar affordance owns the axis and length in world metres; the hand owns the contact side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two inputs read by climbStairsRail.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No anchor or claimed fit is supplied beside the two identifiers; a missing, moving or unreachable bar is refused at runtime.
