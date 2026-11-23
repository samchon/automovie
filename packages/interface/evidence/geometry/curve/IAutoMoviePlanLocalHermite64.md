# src/geometry/curve/IAutoMoviePlanLocalHermite64.ts#IAutoMoviePlanLocalHermite64

## @evidence contracts/development/design.md#principled-representation

The prepared field uses physical millimetre stations while interval leaves carry normalized coordinates and millimetre estimates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IResult gives tessellation one field evaluator and one current/next interval planner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Local budget or arithmetic failure is represented by an empty plan and reason, not coarse fallback geometry.

## @evidence contracts/development/common.md#meaningful-documentation

The result describes retained inputs, lookahead and per-call planning behavior.

# src/geometry/curve/IAutoMoviePlanLocalHermite64.ts#IAutoMoviePlanLocalHermite64.IResult

## @evidence contracts/development/design.md#principled-representation

Physical station distances in millimetres remain distinct from normalized u,t leaf coordinates and millimetre approximation estimates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

tessellateAutoMovieLocalHermite64 uses field for analytic jets and plan for current/next interval conformity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A budget or arithmetic failure returns an empty interval plan with a reason instead of retaining unqualified coarse cells.

## @evidence contracts/development/common.md#meaningful-documentation

States closure lifetime, interval addressing, terminal lookahead and local failure handling.
