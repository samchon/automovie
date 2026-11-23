# src/motion/human/striking/IAutoMovieMotionHumanStep.ts#IAutoMovieMotionHumanStep

## @evidence contracts/development/common.md#meaningful-documentation

steps: How many steps; 1 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. length: Each step's length, metres; half a stance length when absent.

## @evidence contracts/development/design.md#principled-representation

steps: How many steps; 1 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. length: Each step's length, metres; half a stance length when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainStriking.ts (HumanChainStriking.step, params); striking/step.ts (step.plan, context); striking/step.ts (step.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanChainStriking.step.

# src/motion/human/striking/IAutoMovieMotionHumanStep.ts#IAutoMovieMotionHumanStep.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame, unit and default.

## @evidence contracts/development/design.md#principled-representation

A stance-local direction, a whole step count, metric travel, a signed world turn, and optional lead and guard choices.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The travel, stance and guard values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
