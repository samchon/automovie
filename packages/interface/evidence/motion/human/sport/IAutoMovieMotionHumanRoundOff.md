# src/motion/human/sport/IAutoMovieMotionHumanRoundOff.ts#IAutoMovieMotionHumanRoundOff

## @evidence contracts/development/common.md#meaningful-documentation

lead: The hand that goes down first; `left` when absent. duration: Seconds the round-off takes; `SECONDS` when absent. Exclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#principled-representation

lead: The hand that goes down first; `left` when absent. duration: Seconds the round-off takes; `SECONDS` when absent. Exclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: sport/roundOff.ts (roundOff.plan, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in roundOff.plan.

# src/motion/human/sport/IAutoMovieMotionHumanRoundOff.ts#IAutoMovieMotionHumanRoundOff.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The leading hand and the seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The hand is a closed union.
