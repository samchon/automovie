import { AutoMovieEngineMonotone, AutoMovieEngineSweep } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `interpolateAutoMovieMonotone({ knots, values, period? })` is the
 * Fritsch-Carlson monotone cubic (1980); `AutoMovieEngineMonotone.slope` writes its
 * knot slopes: the mean of the two secants, 0 at a sign change or a flat
 * secant, the end secants at open ends, pairs scaled back onto the circle of
 * radius 3.
 *
 * Scenarios:
 *
 * 1. Knots 0, 1, 2, 3 with values 0, 1, 3, 3: slopes (1, 1.5, 0, 0).
 * 2. Knots 0, 1, 2 with values 0, 10, 10.1 (secants 10 and 0.1): the first pair
 *    (10, 5.05) stays inside the circle, while the second, ratios (50.5, 1), is
 *    scaled by 3 / |(50.5, 1)|.
 * 3. A rise and fall 0, 1, 0 has slope 0 at its peak, and the curve never exceeds
 *    1 or drops below 0 between knots.
 * 4. Between knots the curve is the cubic Hermite of the slopes: at 1.5 in case 1
 *    it is 0.5 + 0.1875 + 1.5 = 2.1875; outside it holds 0 and 3; linear data
 *    on uneven knots 0, 2, 3 stays linear.
 * 5. Periodic knots 0, 1, 2 with values 0, 1, 2 and period 3 take the wrap secant
 *    -2 at knot 0 (slope 0 there) and repeat every 3; values 0, 1, -1 with
 *    period 4 average the wrap secant 0.5 with 1 to 0.75 at knot 0.
 * 6. One knot is constant; no knot, a missing value, knots not increasing and a
 *    knot at the period are refused.
 */
export function test_engine_geometry_monotone_interpolation(): void {
  const near = (a: number, b: number, e: number = 1e-12): boolean =>
    Math.abs(a - b) <= e;
  const slopes = (xs: number[], ys: number[], period: number = 0): number[] => {
    const out: Float64Array = new Float64Array(xs.length);
    AutoMovieEngineMonotone.slope(xs, ys, xs.length, period, out);
    return [...out];
  };

  // 1.
  TestValidator.equals(
    "slopes",
    slopes([0, 1, 2, 3], [0, 1, 3, 3]),
    [1, 1.5, 0, 0],
  );

  // 2.
  const tau: number = 3 / Math.hypot(50.5, 1);
  const steep: number[] = slopes([0, 1, 2], [0, 10, 10.1]);
  TestValidator.predicate(
    "circle",
    steep[0] === 10 &&
      near(steep[1]!, tau * 5.05) &&
      near(steep[2]!, tau * 0.1),
  );

  // 3.
  TestValidator.equals("peak", slopes([0, 1, 2], [0, 1, 0])[1], 0);
  const hill = AutoMovieEngineSweep.interpolateMonotone({
    knots: [0, 1, 2],
    values: [0, 1, 0],
  });
  TestValidator.predicate(
    "no overshoot",
    Array.from(
      { length: 200 },
      (_: unknown, k: number): number => k / 100,
    ).every((x: number): boolean => hill(x) >= 0 && hill(x) <= 1),
  );

  // 4.
  const curve = AutoMovieEngineSweep.interpolateMonotone({
    knots: [0, 1, 2, 3],
    values: [0, 1, 3, 3],
  });
  TestValidator.predicate("hermite", near(curve(1.5), 2.1875));
  const line = AutoMovieEngineSweep.interpolateMonotone({
    knots: [0, 2, 3],
    values: [0, 2, 3],
  });
  TestValidator.predicate(
    "uneven spacing",
    [0.5, 1, 1.5, 2.5].every((x: number): boolean => near(line(x), x)),
  );
  TestValidator.equals("flat ends", [curve(-2), curve(7)], [0, 3]);

  // 5.
  TestValidator.equals("wrap slopes", slopes([0, 1, 2], [0, 1, 2], 3)[0], 0);
  TestValidator.equals("wrap mean", slopes([0, 1, 2], [0, 1, -1], 4)[0], 0.75);
  const loop = AutoMovieEngineSweep.interpolateMonotone({
    knots: [0, 1, 2],
    values: [0, 1, 2],
    period: 3,
  });
  TestValidator.predicate(
    "wrap",
    [0.25, 1.5, 2.5].every(
      (x: number): boolean =>
        near(loop(x + 3), loop(x)) && near(loop(x - 6), loop(x)),
    ),
  );

  // 6.
  TestValidator.equals(
    "one knot",
    AutoMovieEngineSweep.interpolateMonotone({ knots: [1], values: [4] })(9),
    4,
  );
  for (const [label, run, message] of [
    [
      "none",
      () => AutoMovieEngineSweep.interpolateMonotone({ knots: [], values: [] }),
      "needs at least one knot",
    ],
    [
      "values",
      () => AutoMovieEngineSweep.interpolateMonotone({ knots: [0, 1], values: [0] }),
      "needs one value per knot",
    ],
    [
      "order",
      () => AutoMovieEngineSweep.interpolateMonotone({ knots: [0, 0], values: [0, 1] }),
      "knot 1 does not increase",
    ],
    [
      "period",
      () =>
        AutoMovieEngineSweep.interpolateMonotone({
          knots: [0, 3],
          values: [0, 1],
          period: 3,
        }),
      "periodic knots must lie in [0, period)",
    ],
  ] satisfies [string, () => unknown, string][])
    TestValidator.predicate(label, throwsError(run, message));
}
