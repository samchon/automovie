import { solveAutoMovieHalfPlaneProgram } from "@automovie/engine";
import type { IAutoMovieSolveHalfPlaneProgram } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { nclose } from "../internal/predicates";

/**
 * Preferred-point admission applies even when no half-plane is supplied.
 *
 * Scenarios:
 * 1. NaN and either infinity in either preferred coordinate are refused for empty and singleton constraints.
 * 2. Finite interior and exterior preferred points retain the nearest point in the unit disc.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the solver with nonfinite preferred coordinates and requires throws before an invalid feasible result can escape; finite twins still solve.
 * @evidence contracts/development/testing.md#independent-expectations The unit disc contains (0.25,0.5), and radial projection of (3,4) is (0.6,0.8); these values follow Euclidean geometry rather than another solver.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both coordinates, NaN and signed infinities, no constraints and one nonrestricting half-plane, plus interior/exterior finite preferences. Existing collision-avoidance tests own infeasible constraint combinations.
 * @evidence contracts/development/testing.md#execution-ownership This portable entry invokes only in-memory planar arithmetic and owns every assertion.
 * @evidence contracts/development/common.md#meaningful-documentation States invalid-coordinate coverage and the independent finite projection cases.
 */
export function test_math_halfplane_preferred_finite(): void {
  const constraints: readonly (readonly IAutoMovieSolveHalfPlaneProgram.ILine[])[] =
    [[], [{ point: { x: 0, y: -2 }, direction: { x: 1, y: 0 } }]];
  for (const lines of constraints)
    for (const axis of ["x", "y"] as const)
      for (const value of [NaN, Infinity, -Infinity])
        assert.throws((): void => {
          solveAutoMovieHalfPlaneProgram(lines, 1, {
            x: 0,
            y: 0,
            [axis]: value,
          });
        });
  const interior: IAutoMovieSolveHalfPlaneProgram.IResult =
    solveAutoMovieHalfPlaneProgram([], 1, { x: 0.25, y: 0.5 });
  const exterior: IAutoMovieSolveHalfPlaneProgram.IResult =
    solveAutoMovieHalfPlaneProgram([], 1, { x: 3, y: 4 });
  TestValidator.predicate(
    "finite preferences retain their geometric projections",
    interior.feasible &&
      exterior.feasible &&
      nclose(interior.point.x, 0.25) &&
      nclose(interior.point.y, 0.5) &&
      nclose(exterior.point.x, 0.6) &&
      nclose(exterior.point.y, 0.8),
  );
}
