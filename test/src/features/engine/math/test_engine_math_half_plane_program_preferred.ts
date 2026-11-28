import { AutoMovieEngineMath } from "@automovie/engine";
import type { IAutoMovieSolveHalfPlaneProgram } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * With no half-plane, `solveHalfPlaneProgram` returns the point of the
 * disc of the given radius nearest the preferred point: the point itself
 * inside, its radial projection `r p / |p|` outside.
 *
 * Scenarios:
 *
 * 1. Preferred (0.25, 0.5) inside the unit disc is returned unchanged.
 * 2. Preferred (3, 4) outside projects to (0.6, 0.8).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers preservation of an interior preference and the radial projection of an exterior preference onto a unit disc.
 * @evidence contracts/development/testing.md#behavioral-verification Calls solveHalfPlaneProgram with an empty constraint array, unit radius and two explicit preferred points. Both results must be feasible.
 * @evidence contracts/development/testing.md#independent-expectations An interior point minimizes displacement at itself. The norm of (3, 4) is five, so its nearest point on a unit disc is (0.6, 0.8). The comparisons use the fixed helper tolerance.
 */
export function test_engine_math_half_plane_program_preferred(): void {
  const interior: IAutoMovieSolveHalfPlaneProgram.IResult =
    AutoMovieEngineMath.solveHalfPlaneProgram([], 1, { x: 0.25, y: 0.5 });
  const exterior: IAutoMovieSolveHalfPlaneProgram.IResult =
    AutoMovieEngineMath.solveHalfPlaneProgram([], 1, { x: 3, y: 4 });
  TestValidator.predicate(
    "the interior preference is kept",
    interior.feasible &&
      nclose(interior.point.x, 0.25) &&
      nclose(interior.point.y, 0.5),
  );
  TestValidator.predicate(
    "the exterior preference projects onto the disc",
    exterior.feasible &&
      nclose(exterior.point.x, 0.6) &&
      nclose(exterior.point.y, 0.8),
  );
}
