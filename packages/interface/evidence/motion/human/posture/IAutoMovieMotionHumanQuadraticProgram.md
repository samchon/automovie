# src/motion/human/posture/IAutoMovieMotionHumanQuadraticProgram.ts#IAutoMovieMotionHumanQuadraticProgram.IProblem

## @evidence contracts/development/common.md#meaningful-documentation

n: The number of variables. band: Half-bandwidth of the curvature and of every row's coupling. p: The curvature's band, `p[i][j]` the entry `(i, i + j)`.

## @evidence contracts/development/design.md#principled-representation

n: The number of variables. band: Half-bandwidth of the curvature and of every row's coupling. p: The curvature's band, `p[i][j]` the entry `(i, i + j)`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmTrajectoryConvex.ts (HumanArmTrajectoryConvex.convexify, return); posture/HumanQuadraticBand.ts (HumanQuadraticBand.scaled, problem); posture/HumanQuadraticProgram.ts (HumanQuadraticProgram.multipliers, problem); posture/HumanQuadraticProgram.ts (HumanQuadraticProgram.solve, problem); posture/HumanQuadraticProgram.ts (HumanQuadraticProgram.value, problem).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanQuadraticProgram.IRow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanQuadraticProgram.ts#IAutoMovieMotionHumanQuadraticProgram.IRow

## @evidence contracts/development/common.md#meaningful-documentation

coef: Each variable's coefficient, in `index`'s order. weight: The l1 penalty weight; absent for a hard row.

## @evidence contracts/development/design.md#principled-representation

coef: Each variable's coefficient, in `index`'s order. weight: The l1 penalty weight; absent for a hard row.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanBodyFitRows.ts (HumanBodyFitRows); posture/HumanArmTrajectoryRanges.ts (HumanArmTrajectoryRanges); posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt); posture/HumanQuadraticAdmission.ts (HumanQuadraticAdmission).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanQuadraticAdmission.

# src/motion/human/posture/IAutoMovieMotionHumanQuadraticProgram.ts#IAutoMovieMotionHumanQuadraticProgram.IState

## @evidence contracts/development/common.md#meaningful-documentation

x: The variables. z: Each row's value as the splitting holds it, inside or penalised toward its interval. y: Each row's multiplier.

## @evidence contracts/development/design.md#principled-representation

x: The variables. z: Each row's value as the splitting holds it, inside or penalised toward its interval. y: Each row's multiplier.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanQuadraticProgram.ts (HumanQuadraticProgram.multipliers, state); posture/HumanQuadraticProgram.ts (HumanQuadraticProgram.solve, warm); posture/HumanQuadraticProgram.ts (HumanQuadraticProgram.solve, return); lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.fit.solved); posture/HumanArmOptimiser.ts (HumanArmOptimiser.optimise.problem).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Primal and dual infinity norms describe the original unscaled problem, and status preserves solved, infeasible or exhausted outcomes; a warm-start iterate does not certify feasibility.
