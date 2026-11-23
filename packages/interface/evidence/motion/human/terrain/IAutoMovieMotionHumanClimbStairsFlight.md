# src/motion/human/terrain/IAutoMovieMotionHumanClimbStairsFlight.ts#IAutoMovieMotionHumanClimbStairsFlight

## @evidence contracts/development/common.md#meaningful-documentation

riser: Each riser's height, metres; 0.17 when absent. tread: Each tread's depth, metres; 0.28 when absent. direction: Up the flight or down it; `up` when absent.

## @evidence contracts/development/design.md#principled-representation

riser: Each riser's height, metres; 0.17 when absent. tread: Each tread's depth, metres; 0.28 when absent. direction: Up the flight or down it; `up` when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: executable/cases/stairsCases.ts (boxes, flight); terrain/climbStairsFlight.ts (climbStairsFlight.surface, flight); terrain/climbStairsFlight.ts (climbStairsFlight.flight, return); terrain/climbStairsFlight.ts (climbStairsFlight.flight, params); executable/cases/stairsCases.ts (stairsCases); terrain/climbStairs.ts (climbStairs.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanFrame identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/terrain/IAutoMovieMotionHumanClimbStairsFlight.ts#IAutoMovieMotionHumanClimbStairsFlight.IStairs

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and default.

## @evidence contracts/development/design.md#principled-representation

The flight's architecture.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five members, all read by `flight`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Plain numbers and one closed union.

# src/motion/human/terrain/IAutoMovieMotionHumanClimbStairsFlight.ts#IAutoMovieMotionHumanClimbStairsFlight.IFlight

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

The flight in the performer's starting floor frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `surface` and the capture.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Plain numbers.
