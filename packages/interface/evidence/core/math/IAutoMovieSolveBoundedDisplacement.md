# src/core/math/IAutoMovieSolveBoundedDisplacement.ts#IAutoMovieSolveBoundedDisplacement

## @evidence contracts/development/design.md#principled-representation

Input weights, box caps and affine rows define a nonnegative displacement problem; the result records accepted travel and complete-row violation in caller-chosen numerical units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

solveAutoMovieBoundedDisplacement owns the grouped solve while IInput and IResult share existing quadratic-row contracts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Grouping schedules work without deleting constraints; unsuccessful or budget-exhausted solves cannot publish partial travel.

## @evidence contracts/development/common.md#meaningful-documentation

The nested records state variable alignment, row units, exact box clipping, work limits and zero-start status.

# src/core/math/IAutoMovieSolveBoundedDisplacement.ts#IAutoMovieSolveBoundedDisplacement.IInput

## @evidence contracts/development/design.md#principled-representation

Positive diagonal masses define 1/2 sum(mass[i]*travel[i]²), while upper and every affine row bound the same variable vector.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Group ids select the work schedule without changing the complete feasible set or objective.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Tolerance is an absolute numerical row error, not permission to drop a contact or change its bound.

## @evidence contracts/development/common.md#meaningful-documentation

States variable alignment, caller-owned physical units, full admission, deterministic grouping and failure behavior.

# src/core/math/IAutoMovieSolveBoundedDisplacement.ts#IAutoMovieSolveBoundedDisplacement.IResult

## @evidence contracts/development/design.md#principled-representation

The accepted vector and its maximum original-row violation publish the same full-system feasibility decision used by the solver.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Round count and last numerical status explain whether the exact zero start or restricted numerical work produced the accepted vector.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A null status identifies the already-feasible zero start; it does not hide an unsuccessful numerical attempt.

## @evidence contracts/development/common.md#meaningful-documentation

Specifies clipping, units, full-row admission, empty-work behavior and refusal rather than partial publication.
