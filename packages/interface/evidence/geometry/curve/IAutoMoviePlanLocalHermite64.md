# src/geometry/curve/IAutoMoviePlanLocalHermite64.ts#IAutoMoviePlanLocalHermite64.IResult

## @evidence contracts/development/design.md#principled-representation

Physical station distances in millimetres remain distinct from normalized u,t leaf coordinates and millimetre approximation estimates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

tessellateAutoMovieLocalHermite64 uses field for analytic jets and plan for current/next interval conformity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A budget or arithmetic failure returns an empty interval plan with a reason instead of retaining unqualified coarse cells.

## @evidence contracts/development/common.md#meaningful-documentation

States closure lifetime, interval addressing, terminal lookahead and local failure handling.
