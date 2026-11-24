import { findAutoMovieRecoveryCubicCriticalParameters } from "@automovie/recovery";
import type { IAutoMovieCubicCriticalParameters } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `findAutoMovieRecoveryCubicCriticalParameters` finds a planar cubic's
 * curvature zeros as the roots of `D = p′ × p″`, a quadratic in t.
 *
 * Scenarios:
 *
 * 1. Controls (0,0), (1,1), (2,−1), (3,0) form a cubic point-symmetric about
 *    its middle, so its one inflection is at t = ½: D = −13.5 + 27t there on
 *    the normalized edges.
 * 2. Collinear controls along +X are collinear with no curvature zero.
 * 3. Four equal controls are a constant cubic with no break.
 */
export function test_unit_recovery_curves_find_cubic_critical_parameters(): void {
  const s: IAutoMovieCubicCriticalParameters =
    findAutoMovieRecoveryCubicCriticalParameters([
      [0, 0],
      [1, 1],
      [2, -1],
      [3, 0],
    ]);
  TestValidator.predicate(
    "the symmetric inflection",
    s.collinear === false &&
      s.zeroCurvature.length === 1 &&
      nclose(s.zeroCurvature[0]!, 0.5, 1e-12),
  );
  const line: IAutoMovieCubicCriticalParameters =
    findAutoMovieRecoveryCubicCriticalParameters([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ]);
  TestValidator.predicate(
    "a straight cubic",
    line.collinear && line.zeroCurvature.length === 0,
  );
  const point: IAutoMovieCubicCriticalParameters =
    findAutoMovieRecoveryCubicCriticalParameters([
      [1, 1],
      [1, 1],
      [1, 1],
      [1, 1],
    ]);
  TestValidator.predicate(
    "a constant cubic",
    point.collinear && point.breaks.length === 0,
  );
}