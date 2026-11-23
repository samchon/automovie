# src/physics/IAutoMovieFitPhysicalWholeBodyTarget.ts#IAutoMovieFitPhysicalWholeBodyTarget.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Separates total fit residual, endpoint error and optional weighted direction error.

## @evidence contracts/development/design.md#principled-representation

World bone transforms accompany nonnegative metre residual norms; approach is zero when no direction task exists.

## @evidence contracts/development/design.md#minimal-and-owned-surface

fitPhysicalWholeBodyTarget returns the original segment population for downstream motor targets and diagnostics.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reported motor goals do not move actual bodies, and residuals remain measurable when the target cannot be reached.

# src/physics/IAutoMovieFitPhysicalWholeBodyTarget.ts#IAutoMovieFitPhysicalWholeBodyTarget.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Defines the held support, allowed turn, selected bones and independent endpoint/direction task.

## @evidence contracts/development/design.md#principled-representation

World and bone-local metre points, unit directions, radian support limits and metre residual weights form a bounded articulation problem.

## @evidence contracts/development/design.md#minimal-and-owned-surface

fitPhysicalWholeBodyTarget reroots the canonical profile and delegates the selected coordinates to the shared articulation solver.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An optional approach adds a weighted direction task; finite budgets and residuals do not guarantee an unreachable goal is met.
