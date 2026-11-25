# src/core/math/IAutoMovieSolveHalfPlaneProgram.ts#IAutoMovieSolveHalfPlaneProgram.IPoint

## @evidence contracts/development/design.md#principled-representation

Two finite coordinates describe a point or a direction in the caller's plane; positions and radius use one common scale, while line directions are dimensionless.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The half-plane solver uses this pair for preferred and returned points and for line point/direction members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The structural pair does not enforce finiteness or unit length; the solver/caller boundary owns numerical admission for each role.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes planar coordinates from unit direction components and states the finite-value premise.

# src/core/math/IAutoMovieSolveHalfPlaneProgram.ts#IAutoMovieSolveHalfPlaneProgram.ILine

## @evidence contracts/development/design.md#principled-representation

A point and unit direction keep points v satisfying det(direction, point-v) <= 0, so the boundary belongs to the half-plane.

## @evidence contracts/development/design.md#minimal-and-owned-surface

solveAutoMovieHalfPlaneProgram reads these two vectors in the supplied constraint order and reuses IPoint.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Finite components and direction norm within 1e-6 of one are checked by the solver; the record does not encode or repair a unit vector.

## @evidence contracts/development/common.md#meaningful-documentation

Documents the inclusion convention, dimensionless direction and admission tolerance.

# src/core/math/IAutoMovieSolveHalfPlaneProgram.ts#IAutoMovieSolveHalfPlaneProgram.IResult

## @evidence contracts/development/design.md#principled-representation

The returned point uses the input plane's units and feasible distinguishes the constrained solution from the least-worst-violation fallback.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Collision-avoidance consumers receive the chosen point and the feasibility result from one solver call.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

False remains observable when the fallback minimizes violation; it is not promoted to satisfaction of every half-plane.

## @evidence contracts/development/common.md#meaningful-documentation

States point scale and why the feasibility flag must accompany the fallback.
