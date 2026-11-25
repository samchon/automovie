import {
  AutoMovieNaturalSpline,
  AutoMoviePeriodicCubic,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * `AutoMovieNaturalSpline` is the natural cubic spline through knots (zero end
 * curvature), read as value, first and second derivative and jerk, continued
 * beyond the ends along its end tangents; its `periodic` reader and
 * `AutoMoviePeriodicCubic` are the periodic cubic through equally spaced
 * phases, the latter also enclosing its range.
 *
 * Fixture: knots (0, 0), (1, 2), (3, 1), (4, 3). Its curvatures solve 6 M1 + 2
 * M2 = -15 and 2 M1 + 6 M2 = 15: M = (0, -3.75, 3.75, 0). On span [1, 3] the
 * slope at 1 is -0.5 - 2 (2 M1 + M2) / 6 = 0.75.
 *
 * Scenarios:
 *
 * 1. The curvatures are (0, -3.75, 3.75, 0) and every knot is reproduced.
 * 2. At x = 2: value 1.5, slope -1.125, curvature 0, jerk 3.75 (`read` agrees).
 * 3. At x = -1 the value is -2.625 on the start tangent; at x = 5 it is 5.625 on
 *    the end tangent 2.625, curvature and jerk 0 there.
 * 4. The periodic cubic through cos at 8 phases meets every sample, repeats every
 *    turn, is even like its data and stays within 0.005 of cos; a constant is
 *    constant.
 * 5. Its range encloses 2000 readings and lies within [-1.01, 1.01]; two controls
 *    are refused.
 */
export function test_unit_engine_geometry_natural_spline(): void {
  const near = (a: number, b: number, e: number = 1e-12): boolean =>
    Math.abs(a - b) <= e;
  const xs: number[] = [0, 1, 3, 4];
  const ys: number[] = [0, 2, 1, 3];
  const spline = AutoMovieNaturalSpline.create(xs, ys);

  // 1.
  TestValidator.predicate(
    "curvatures",
    [0, -3.75, 3.75, 0].every((m: number, i: number): boolean =>
      near(spline.curvatures[i]!, m),
    ),
  );
  TestValidator.predicate(
    "knots",
    xs.every((x: number, i: number): boolean =>
      near(AutoMovieNaturalSpline.evaluate(spline, x), ys[i]!),
    ),
  );

  // 2.
  const [d1, d2] = AutoMovieNaturalSpline.derivative(spline, 2);
  TestValidator.predicate(
    "x = 2",
    near(AutoMovieNaturalSpline.evaluate(spline, 2), 1.5) &&
      near(d1, -1.125) &&
      near(d2, 0) &&
      near(AutoMovieNaturalSpline.jerk(spline, 2), 3.75),
  );
  const read = AutoMovieNaturalSpline.read(spline, 2);
  TestValidator.predicate(
    "read",
    near(read[0], 1.5) && near(read[1], -1.125) && near(read[2], 0),
  );

  // 3.
  TestValidator.predicate(
    "before",
    near(AutoMovieNaturalSpline.evaluate(spline, -1), -2.625),
  );
  const [e1, e2] = AutoMovieNaturalSpline.derivative(spline, 5);
  TestValidator.predicate(
    "after",
    near(AutoMovieNaturalSpline.evaluate(spline, 5), 5.625) &&
      near(e1, 2.625) &&
      e2 === 0 &&
      AutoMovieNaturalSpline.jerk(spline, 5) === 0,
  );

  // 4.
  const m: number = 8;
  const samples: number[] = Array.from(
    { length: m },
    (_: unknown, j: number): number => Math.cos((2 * Math.PI * j) / m),
  );
  const at = AutoMovieNaturalSpline.periodic(samples);
  TestValidator.predicate(
    "samples",
    samples.every((y: number, j: number): boolean =>
      near(at((2 * Math.PI * j) / m), y),
    ),
  );
  const probes: number[] = Array.from(
    { length: 2000 },
    (_: unknown, k: number): number => (2 * Math.PI * k) / 2000 + 0.0003,
  );
  TestValidator.predicate(
    "periodic, even, close",
    probes.every(
      (psi: number): boolean =>
        near(at(psi + 2 * Math.PI), at(psi), 1e-12) &&
        near(at(-psi), at(psi), 1e-12) &&
        Math.abs(at(psi) - Math.cos(psi)) <= 0.005,
    ),
  );
  TestValidator.predicate(
    "constant",
    probes.every((psi: number): boolean =>
      near(AutoMovieNaturalSpline.periodic([2, 2, 2])(psi), 2),
    ),
  );

  // 5.
  const cubic = AutoMoviePeriodicCubic.create(samples);
  const [low, high] = cubic.range();
  TestValidator.predicate(
    "range",
    probes.every(
      (psi: number): boolean => cubic.at(psi) >= low && cubic.at(psi) <= high,
    ) &&
      low >= -1.01 &&
      high <= 1.01,
  );
  TestValidator.predicate(
    "two controls",
    throwsError(
      (): unknown => AutoMoviePeriodicCubic.create([1, 2]).range(),
      "periodic cubic range unavailable",
    ),
  );
}
