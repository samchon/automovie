# src/motion/human/floor/IAutoMovieMotionHumanRoll.ts#IAutoMovieMotionHumanRoll

## @evidence contracts/development/common.md#meaningful-documentation

direction: Which way the body turns; `forward` when absent.

## @evidence contracts/development/design.md#principled-representation

direction: Which way the body turns; `forward` when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: floor/roll.ts (roll.plan, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in roll.plan.

# src/motion/human/floor/IAutoMovieMotionHumanRoll.ts#IAutoMovieMotionHumanRoll.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The way the body turns.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The value the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A closed union.
