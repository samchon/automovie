# src/motion/human/ensemble/IAutoMovieMotionHumanInstance.ts#IAutoMovieMotionHumanInstance.IParams

## @evidence contracts/development/common.md#meaningful-documentation

duration: How long the instance lasts, seconds, positive. shift: Whole film frames it lags the template by, at least 0; 0 when absent.

## @evidence contracts/development/design.md#principled-representation

duration: How long the instance lasts, seconds, positive. shift: Whole film frames it lags the template by, at least 0; 0 when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/instance.ts (instance.plan, context); ensemble/instance.ts (instance.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in instance.plan.
