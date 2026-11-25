import type { IAutoMovieCubicCriticalParameters } from "@automovie/interface";
import { findAutoMovieRecoveryCubicCriticalParameters } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `findAutoMovieRecoveryCubicCriticalParameters` finds where a planar cubic
 * Bezier's curvature numerator D = p' × p'' vanishes, where its affine
 * curvature is stationary, and where its velocity vanishes, in (0, 1).
 *
 * With the edges e0, e1, e2 normalized by their largest coordinate, a = e2 -
 * 2·e1 + e0, b = 3·(e1 - e0) and c = 3·e0, so D = d0 + e·t + f·t²/2 with d0 =
 * 2·(c × b), e = 6·(c × a) and f = 12·(b × a).
 *
 * Scenarios:
 *
 * 1. Four equal controls are constant: nothing isolated, collinear.
 * 2. Controls along the x axis are collinear (D ≡ 0) with no stationary parameter,
 *    and say so.
 * 3. The S-curve (0, 0), (1, 1), (2, -1), (3, 0): edges (1, 1), (1, -2), (1, 1)
 *    over scale 2 give a = (0, 3), b = (0, -4.5), c = (1.5, 1.5), so d0 =
 *    -13.5, e = 27 and f = 0: one inflection at 13.5 / 27 = 0.5, no affine
 *    extremum and no stationary point.
 * 4. The cusp (0, 0), (1, 1), (0, 1), (1, 0): a = (4, 0), b = (-6, -3), c = (3,
 *    3), so D = 18 - 72·t + 72·t², the square of 0.5 - t scaled; the affine
 *    conditions e + f·t = 0 and 4e² - 9f·d0 - f·e·t - f²·t²/2 = 0 both meet at
 *    0.5, and the velocity (3 - 12t + 12t², 3 - 6t) vanishes there.
 */
export function test_recovery_curves_find_cubic_critical_parameters(): void {
  const lead: string =
    "Critical parameters are binary64 polynomial-root candidates, not certified real-root enclosures; close multiple roots may remain unresolved.";
  TestValidator.equals(
    "a constant cubic",
    findAutoMovieRecoveryCubicCriticalParameters([
      [2, 2],
      [2, 2],
      [2, 2],
      [2, 2],
    ]),
    {
      breaks: [],
      zeroCurvature: [],
      affineCritical: [],
      stationary: [],
      collinear: true,
      diagnostics: [
        "Constant cubic: every parameter is stationary; no isolated critical parameters exist.",
      ],
    },
  );
  const line: IAutoMovieCubicCriticalParameters =
    findAutoMovieRecoveryCubicCriticalParameters([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ]);
  TestValidator.equals(
    "a line",
    [line.breaks, line.collinear, line.diagnostics.length],
    [[], true, 2],
  );
  TestValidator.equals(
    "an S-curve",
    findAutoMovieRecoveryCubicCriticalParameters([
      [0, 0],
      [1, 1],
      [2, -1],
      [3, 0],
    ]),
    {
      breaks: [0.5],
      zeroCurvature: [0.5],
      affineCritical: [],
      stationary: [],
      collinear: false,
      diagnostics: [lead],
    },
  );
  TestValidator.equals(
    "a cusp",
    findAutoMovieRecoveryCubicCriticalParameters([
      [0, 0],
      [1, 1],
      [0, 1],
      [1, 0],
    ]),
    {
      breaks: [0.5],
      zeroCurvature: [0.5],
      affineCritical: [0.5],
      stationary: [0.5],
      collinear: false,
      diagnostics: [lead],
    },
  );
}
