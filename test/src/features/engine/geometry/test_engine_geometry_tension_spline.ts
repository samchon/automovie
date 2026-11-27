import { AutoMovieEngineNaturalSpline, AutoMovieEngineSweep } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `interpolateAutoMovieSpline({ knots, values, period? })` is the spline under
 * tension (Schweikert 1966, Cline 1974): at tension 0 the natural cubic spline,
 * raised only until the sixteen-part scan of every segment stays within its
 * knots' range widened by a tenth of the largest value step within two
 * segments. Open curves hold their end values outside the knots.
 *
 * Scenarios:
 *
 * 1. Knots (0, 0), (1, 2), (3, 1), (4, 3) pass the scan at tension 0: the curve
 *    equals the natural cubic spline at 400 points within 1e-12, and holds 0
 *    below and 3 above.
 * 2. The step 0, 0, 1, 1, 1 at knots 0 to 4 overshoots as a cubic, about -0.13 on
 *    the first segment (premise); the tension spline meets every knot within
 *    1e-12 and keeps every sixteenth of every segment within 0.1 of its own two
 *    knots' range.
 * 3. Periodic knots 0, 1, 2, 3 with values 0, 1, 0, -1 and period 4 repeat every 4
 *    and meet their knots.
 * 4. One knot is constant; two open knots are their straight segment.
 * 5. No knot, a missing value, knots not increasing and a knot at the period are
 *    refused.
 */
export function test_engine_geometry_tension_spline(): void {
  const near = (a: number, b: number, e: number = 1e-12): boolean =>
    Math.abs(a - b) <= e;

  // 1.
  const knots: number[] = [0, 1, 3, 4];
  const values: number[] = [0, 2, 1, 3];
  const curve = AutoMovieEngineSweep.interpolateSpline({ knots, values });
  const natural = AutoMovieEngineNaturalSpline.create(knots, values);
  TestValidator.predicate(
    "tension 0",
    Array.from(
      { length: 400 },
      (_: unknown, k: number): number => (4 * k) / 400 + 0.005,
    ).every((x: number): boolean =>
      near(curve(x), AutoMovieEngineNaturalSpline.evaluate(natural, x)),
    ),
  );
  TestValidator.equals("flat ends", [curve(-1), curve(9)], [0, 3]);

  // 2.
  const xs: number[] = [0, 1, 2, 3, 4];
  const ys: number[] = [0, 0, 1, 1, 1];
  const sixteenths = (k: number): number[] =>
    Array.from(
      { length: 15 },
      (_: unknown, j: number): number =>
        xs[k]! + ((j + 1) / 16) * (xs[k + 1]! - xs[k]!),
    );
  const inside = (f: (x: number) => number): boolean =>
    [0, 1, 2, 3].every((k: number): boolean =>
      sixteenths(k).every(
        (x: number): boolean =>
          f(x) >= Math.min(ys[k]!, ys[k + 1]!) - 0.1 - 1e-12 &&
          f(x) <= Math.max(ys[k]!, ys[k + 1]!) + 0.1 + 1e-12,
      ),
    );
  const cubic = AutoMovieEngineNaturalSpline.create(xs, ys);
  TestValidator.predicate(
    "premise",
    !inside((x: number): number => AutoMovieEngineNaturalSpline.evaluate(cubic, x)),
  );
  const tense = AutoMovieEngineSweep.interpolateSpline({ knots: xs, values: ys });
  TestValidator.predicate(
    "knots",
    xs.every((x: number, i: number): boolean => near(tense(x), ys[i]!)),
  );
  TestValidator.predicate("scan", inside(tense));

  // 3.
  const wave = AutoMovieEngineSweep.interpolateSpline({
    knots: [0, 1, 2, 3],
    values: [0, 1, 0, -1],
    period: 4,
  });
  TestValidator.predicate(
    "periodic",
    [0, 1, 2, 3].every((x: number, i: number): boolean =>
      near(wave(x), [0, 1, 0, -1][i]!),
    ) &&
      [0.3, 1.7, 2.9].every(
        (x: number): boolean =>
          near(wave(x + 4), wave(x)) && near(wave(x - 8), wave(x)),
      ),
  );

  // 4.
  TestValidator.equals(
    "one knot",
    [
      AutoMovieEngineSweep.interpolateSpline({ knots: [2], values: [5] })(-3),
      AutoMovieEngineSweep.interpolateSpline({ knots: [2], values: [5] })(9),
    ],
    [5, 5],
  );
  TestValidator.predicate(
    "two knots",
    near(
      AutoMovieEngineSweep.interpolateSpline({ knots: [0, 2], values: [1, 3] })(0.5),
      1.5,
    ),
  );

  // 5.
  for (const [label, run, message] of [
    [
      "none",
      () => AutoMovieEngineSweep.interpolateSpline({ knots: [], values: [] }),
      "needs at least one knot",
    ],
    [
      "values",
      () => AutoMovieEngineSweep.interpolateSpline({ knots: [0, 1], values: [0] }),
      "needs one value per knot",
    ],
    [
      "order",
      () => AutoMovieEngineSweep.interpolateSpline({ knots: [0, 0], values: [0, 1] }),
      "knot 1 does not increase",
    ],
    [
      "period",
      () =>
        AutoMovieEngineSweep.interpolateSpline({
          knots: [0, 4],
          values: [0, 1],
          period: 4,
        }),
      "periodic knots must lie in [0, period)",
    ],
  ] satisfies [string, () => unknown, string][])
    TestValidator.predicate(label, throwsError(run, message));
}
