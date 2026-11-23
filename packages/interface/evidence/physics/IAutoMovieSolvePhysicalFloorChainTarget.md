# src/physics/IAutoMovieSolvePhysicalFloorChainTarget.ts#IAutoMovieSolvePhysicalFloorChainTarget

## @evidence contracts/development/design.md#principled-representation

Explicit surface witnesses target the floor and use the patch minimum for nonpenetration. A patch without witnesses can fit its minimum to the floor alongside an endpoint height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

solvePhysicalFloorChainTarget consumes canonical profile transforms and provider contact carriers through the existing articulation solver.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing patch geometry, invalid carrier witnesses and invalid finite iteration/tolerance inputs refuse; solver exhaustion returns its actual residual rather than claiming contact.

## @evidence contracts/development/common.md#meaningful-documentation

Keeps horizontal endpoint intent and real floor witnesses in one bounded chain task.

# src/physics/IAutoMovieSolvePhysicalFloorChainTarget.ts#IAutoMovieSolvePhysicalFloorChainTarget.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Keeps horizontal endpoint intent and real floor witnesses in one bounded chain task.

## @evidence contracts/development/design.md#principled-representation

World goals/floor and carrier-local witnesses are metres; endpointBone can select an interior chain endpoint and budgets limit iterations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

solvePhysicalFloorChainTarget consumes canonical profile transforms and provider contact carriers through the existing articulation solver.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A prescribed endpoint height keeps its own equality, and the requested surface constraint contributes its error to the same residual.
