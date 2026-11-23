# src/physics/IAutoMovieSolvePhysicalArticulationTargets.ts#IAutoMovieSolvePhysicalArticulationTargets.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Bounded joint-coordinate fitting of borrowed world goals against a caller's geometric residual.

## @evidence contracts/development/design.md#principled-representation

At most 64 free coordinates and 1024 finite residual entries are allowed; iterations is an integer in [1,64], and tolerance uses the residual's metre norm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

solvePhysicalArticulationTargets clones the initial goals, calls synchronous measure/linearize during fitting and retains no callbacks after return; callbacks must not mutate supplied poses.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The solver checks budgets, selected bones and residual size/finiteness, and propagates callback exceptions. The caller supplies an admitted acyclic profile and complete world poses; a fixed residual dimension is required across all probes.

# src/physics/IAutoMovieSolvePhysicalArticulationTargets.ts#IAutoMovieSolvePhysicalArticulationTargets.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Accepted world motor goals and the remaining Euclidean geometric residual.

## @evidence contracts/development/design.md#principled-representation

targets retains fixed pivots and projected angular coordinates; residual is the nonnegative norm of the final measure vector in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

solvePhysicalArticulationTargets returns an owned initial clone with subsequent accepted branches updated without mutating caller goals.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Backtracking accepts only actual residual decreases, but exhausted budgets or unreachable goals can leave residual above tolerance. No simulated body is moved and no success flag conceals that residual.
