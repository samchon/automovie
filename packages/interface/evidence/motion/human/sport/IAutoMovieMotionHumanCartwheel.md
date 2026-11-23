# src/motion/human/sport/IAutoMovieMotionHumanCartwheel.ts#IAutoMovieMotionHumanCartwheel

## @evidence contracts/development/common.md#meaningful-documentation

to: The side the body wheels to; `left` when absent. duration: Seconds the cartwheel takes; `SECONDS` when absent. Exclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#principled-representation

to: The side the body wheels to; `left` when absent. duration: Seconds the cartwheel takes; `SECONDS` when absent. Exclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: sport/cartwheel.ts (cartwheel.plan, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in cartwheel.plan.

# src/motion/human/sport/IAutoMovieMotionHumanCartwheel.ts#IAutoMovieMotionHumanCartwheel.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The side, the seconds and the manner.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The side is a closed union.
