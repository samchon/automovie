# src/posture/HumanSeidelProgram.ts#HumanSeidelProgram.Row

## @evidence contracts/development/common.md#meaningful-documentation

States the row's meaning, `a x0 + b x1 + c <= 0`.

## @evidence contracts/development/design.md#principled-representation

TOPP-RA's `MatrixX3` row of `solve_lp2d` (seidel.cpp at commit 8a2a9252e42089f1082d8d5d69b9852f32d0b338, MIT, Copyright (c) 2017 Hung Pham), three coefficients in the source's order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanPathParameterization.ts (the stages' rows).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A plain tuple; nothing derived.

# src/posture/HumanSeidelProgram.ts#HumanSeidelProgram.Line

## @evidence contracts/development/common.md#meaningful-documentation

States the row's meaning, `a x + b <= 0`.

## @evidence contracts/development/design.md#principled-representation

TOPP-RA's `A_1d` row of `solve_lp1d` (seidel-internal.hpp at the same commit).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanSeidelProgram.ts (solve2's projected rows).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A plain tuple; nothing derived.

# src/posture/HumanSeidelProgram.ts#HumanSeidelProgram.Pair

## @evidence contracts/development/common.md#meaningful-documentation

States it holds one value per variable.

## @evidence contracts/development/design.md#principled-representation

TOPP-RA's `Vector2` of the variables (u, x) and their bounds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanPathParameterization.ts (bounds, controllable sets).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A plain tuple; nothing derived.

# src/posture/HumanSeidelProgram.ts#HumanSeidelProgram.ISolution1

## @evidence contracts/development/common.md#meaningful-documentation

feasible: whether the program is feasible. optvar: the optimum, meaningful when feasible.

## @evidence contracts/development/design.md#principled-representation

TOPP-RA's `LpSol1d` less its active-constraint index, which only its warm start reads and this port does not keep.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanSeidelProgram.ts (solve2).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Two fields of the source's record; nothing derived.

# src/posture/HumanSeidelProgram.ts#HumanSeidelProgram.ISolution2

## @evidence contracts/development/common.md#meaningful-documentation

feasible: whether the program is feasible. optvar: the optimal (x0, x1), meaningful when feasible.

## @evidence contracts/development/design.md#principled-representation

TOPP-RA's `LpSol` less its objective value and active constraints. Seidel::solveStagewiseOptim reads only the variables. The warm start that would read the active constraints orders a copy of the rows that the solve never receives.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanPathParameterization.ts (every stage solve).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Two fields of the source's record; nothing derived.

# src/posture/HumanSeidelProgram.ts#HumanSeidelProgram.solve1

## @evidence contracts/development/common.md#meaningful-documentation

States the program, its rows and the solution.

## @evidence contracts/development/implementation.md#principled-implementation

`solve_lp1d` of TOPP-RA's seidel-internal.hpp line for line: each row tightens the current interval from above or below, a row with no variable is feasible within ABS_TOLERANCE, bounds crossed by under 2 ABS_TOLERANCE are widened, and the optimum is the bound in the objective's direction (the middle for a zero objective).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the rows and the source's three exits.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tolerances are the source's REL_TOLERANCE 1e-10 and ABS_TOLERANCE 1e-13.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(rows).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads only its own rows.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates only the returned record.

# src/posture/HumanSeidelProgram.ts#HumanSeidelProgram.solve2

## @evidence contracts/development/common.md#meaningful-documentation

States the program, its rows, its bounds and the solution.

## @evidence contracts/development/implementation.md#principled-implementation

`solve_lp2d` of TOPP-RA's seidel.cpp line for line. Crossed bounds within tolerance hold a variable at their middle and leave a one-variable program. Otherwise the optimum starts at the bounds' corner in the objective's direction. Each violated row in turn projects the earlier rows and the four bounds onto its line (`project_linear_constraint`) and solves that one-variable program (Seidel 1991).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The source's two phases, bounds then rows, with the projection a private function.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The source's tolerances only; an infeasible projection returns infeasible.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(rows²) in the worst case, as the source's deterministic order.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads only its own rows.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The projected rows live for one row's step.

# src/posture/HumanSeidelProgram.ts#HumanSeidelProgram.presolve

## @evidence contracts/development/common.md#meaningful-documentation

States the in-place changes and the result.

## @evidence contracts/development/implementation.md#principled-implementation

`presolve` of TOPP-RA's seidel.cpp line for line: rows normalised, one-variable rows folded into the bounds, and of parallel rows within REL_TOLERANCE only the tightest kept.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The source's two passes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The source's tolerances only.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(rows²), once per stage when the stages are prepared.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Runs once per stage.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Changes the caller's rows and bounds in place.

# src/posture/HumanSeidelProgram.ts#HumanSeidelProgram.value

## @evidence contracts/development/common.md#meaningful-documentation

States the value and its infinite-variable rule.

## @evidence contracts/development/implementation.md#principled-implementation

`value` of TOPP-RA's seidel.cpp: a zero coefficient of an infinite variable counts as zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over two variables.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(1).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing.
