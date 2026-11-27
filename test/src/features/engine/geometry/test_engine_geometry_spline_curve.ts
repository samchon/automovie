import { AutoMovieEngineSplineCurve } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `AutoMovieEngineSplineCurve` is a closed planar uniform periodic cubic B-spline of
 * N control points, coefficients [x_0..x_{N-1}, z_0..z_{N-1}], phase t mapped
 * to u = N t / 2 pi: `evaluate` and `jet` read it with phase derivatives,
 * `interpolate` finds the controls through N points at phases 2 pi m / N, and
 * `project` fits samples by least squares, optionally penalized.
 *
 * Fixture: N = 8 points of the ellipse (3 cos, 2 sin) at its knot phases.
 *
 * Scenarios:
 *
 * 1. At a knot the curve is (P_{i-1} + 4 P_i + P_{i+1}) / 6 of its controls.
 * 2. `interpolate` meets all 8 points within 1e-9, and the controls' mean is the
 *    curve's mean, 0.
 * 3. The phase derivatives equal central differences of `jet` within 1e-6, and
 *    `evaluate` agrees with `jet`; t and t + 2 pi read the same.
 * 4. `project` of 32 samples of the interpolated curve onto 8 controls recovers
 *    those controls within 1e-9; a cutoff smooths but still keeps the mean; a
 *    wave of 3 cycles fitted with cutoff 3 keeps exactly half the unpenalized
 *    controls; 30 samples are refused.
 * 5. `width` is N.
 */
export function test_engine_geometry_spline_curve(): void {
  const N: number = 8;
  const points: [number, number][] = Array.from(
    { length: N },
    (_: unknown, m: number): [number, number] => [
      3 * Math.cos((2 * Math.PI * m) / N),
      2 * Math.sin((2 * Math.PI * m) / N),
    ],
  );
  const c: number[] = AutoMovieEngineSplineCurve.interpolate(points);
  const near = (a: number, b: number, e: number): boolean =>
    Math.abs(a - b) <= e;

  // 1.
  const knot = AutoMovieEngineSplineCurve.evaluate(c, N, (2 * Math.PI * 3) / N);
  TestValidator.predicate(
    "knot rule",
    near(knot[0], (c[2]! + 4 * c[3]! + c[4]!) / 6, 1e-12) &&
      near(knot[1], (c[N + 2]! + 4 * c[N + 3]! + c[N + 4]!) / 6, 1e-12),
  );

  // 2.
  TestValidator.predicate(
    "interpolate",
    points.every((p: [number, number], m: number): boolean => {
      const v = AutoMovieEngineSplineCurve.evaluate(c, N, (2 * Math.PI * m) / N);
      return near(v[0], p[0], 1e-9) && near(v[1], p[1], 1e-9);
    }),
  );
  TestValidator.predicate(
    "mean",
    near(
      c.slice(0, N).reduce((s: number, x: number): number => s + x, 0) / N,
      0,
      1e-12,
    ),
  );

  // 3.
  const h: number = 1e-5;
  for (const t of [0.3, 2.2, 5.9]) {
    const j = AutoMovieEngineSplineCurve.jet(c, N, t);
    const plus = AutoMovieEngineSplineCurve.jet(c, N, t + h);
    const minus = AutoMovieEngineSplineCurve.jet(c, N, t - h);
    TestValidator.predicate(
      `jet ${t}`,
      [0, 1].every(
        (k: number): boolean =>
          near((plus[k]! - minus[k]!) / (2 * h), j[k + 2]!, 1e-6) &&
          near((plus[k + 2]! - minus[k + 2]!) / (2 * h), j[k + 4]!, 1e-5),
      ),
    );
    const e = AutoMovieEngineSplineCurve.evaluate(c, N, t);
    TestValidator.predicate(
      `evaluate ${t}`,
      e.every((x: number, k: number): boolean => near(x, j[k]!, 1e-12)),
    );
    TestValidator.predicate(
      `turn ${t}`,
      AutoMovieEngineSplineCurve.evaluate(c, N, t + 2 * Math.PI).every(
        (x: number, k: number): boolean => near(x, e[k]!, 1e-9),
      ),
    );
  }

  // 4.
  const samples: [number, number][] = Array.from(
    { length: 32 },
    (_: unknown, m: number): [number, number] => {
      const v = AutoMovieEngineSplineCurve.evaluate(c, N, (2 * Math.PI * m) / 32);
      return [v[0], v[1]];
    },
  );
  const fitted: number[] = AutoMovieEngineSplineCurve.project(samples, N);
  TestValidator.predicate(
    "project",
    fitted.every((x: number, k: number): boolean => near(x, c[k]!, 1e-9)),
  );
  const smooth: number[] = AutoMovieEngineSplineCurve.project(samples, N, 2);
  TestValidator.predicate(
    "penalized mean",
    near(
      smooth.slice(0, N).reduce((s: number, x: number): number => s + x, 0) / N,
      0,
      1e-9,
    ),
  );
  const wave: [number, number][] = Array.from(
    { length: 32 },
    (_: unknown, m: number): [number, number] => [
      Math.cos((3 * 2 * Math.PI * m) / 32),
      0,
    ],
  );
  const plain: number[] = AutoMovieEngineSplineCurve.project(wave, N);
  const halved: number[] = AutoMovieEngineSplineCurve.project(wave, N, 3);
  TestValidator.predicate(
    "half at the cutoff",
    plain.every((x: number, k: number): boolean =>
      near(halved[k]!, x / 2, 1e-9),
    ) && plain.some((x: number): boolean => Math.abs(x) > 0.1),
  );
  TestValidator.predicate(
    "multiple",
    throwsError(
      (): unknown => AutoMovieEngineSplineCurve.project(samples.slice(0, 30), N),
      "not a multiple of 8",
    ),
  );

  // 5.
  TestValidator.equals("width", AutoMovieEngineSplineCurve.width(N), N);
}
