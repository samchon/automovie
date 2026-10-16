import {
  type IAutoMovieSweep,
  type IAutoMovieSweepSurface,
  compileAutoMovieSweep,
  interpolateAutoMovieMonotone,
  interpolateAutoMovieSpline,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/** A profile whose values alternate up and down on uneven knots, every interior knot a local extremum but one. */
const KNOTS: number[] = [0, 0.2, 0.35, 0.5, 0.7, 1];
const VALUES: number[] = [1, 3, 2.9, 0.5, 0.6, 2];
/** Overshoot allowed beyond a segment's knots, as a fraction of the largest value step within two segments of it. */
const BOUND: number = 0.1;
/** One-sided second differences of `f` at `x`, from below and from above. */
function curvature(
  f: (x: number) => number,
  x: number,
  h: number,
): [number, number] {
  return [
    (f(x - 2 * h) - 2 * f(x - h) + f(x)) / (h * h),
    (f(x + 2 * h) - 2 * f(x + h) + f(x)) / (h * h),
  ];
}
/** Largest excursion beyond each segment's knot range over the allowed bound, sampled 400 times a segment. */
function overshoot(
  f: (x: number) => number,
  knots: number[],
  values: number[],
): number {
  let worst: number = 0;
  function rise(k: number): number {
    return k < 0 || k + 1 >= values.length
      ? 0
      : Math.abs(values[k + 1]! - values[k]!);
  }
  for (let k: number = 0; k + 1 < knots.length; ++k) {
    const allowed: number =
      BOUND *
      Math.max(rise(k - 2), rise(k - 1), rise(k), rise(k + 1), rise(k + 2));
    for (let i: number = 1; i < 400; ++i) {
      const y: number = f(knots[k]! + ((knots[k + 1]! - knots[k]!) * i) / 400);
      const excess: number = Math.max(
        y - Math.max(values[k]!, values[k + 1]!),
        Math.min(values[k]!, values[k + 1]!) - y,
      );
      // a flat run with flat neighbours allows nothing, so any excess there is unbounded
      worst = Math.max(
        worst,
        excess <= 1e-15 ? 0 : allowed === 0 ? Infinity : excess / allowed,
      );
    }
  }
  return worst;
}
/** The natural cubic spline through knots, written here independently, the zero-tension curve. */
function natural(knots: number[], values: number[]): (x: number) => number {
  const n: number = knots.length;
  const h: number[] = knots
    .slice(1)
    .map((x: number, k: number): number => x - knots[k]!);
  const m: number[] = new Array<number>(n).fill(0);
  // tridiagonal for interior second derivatives, solved by elimination
  const c: number[] = [];
  const d: number[] = [];
  for (let i: number = 1; i < n - 1; ++i) {
    const a: number = h[i - 1]! / 6;
    const b: number = (h[i - 1]! + h[i]!) / 3;
    const r: number =
      (values[i + 1]! - values[i]!) / h[i]! -
      (values[i]! - values[i - 1]!) / h[i - 1]!;
    const q: number = i === 1 ? b : b - a * c[i - 2]!;
    c.push(h[i]! / 6 / q);
    d.push((i === 1 ? r : r - a * d[i - 2]!) / q);
  }
  for (let i: number = n - 2; i >= 1; --i)
    m[i] = d[i - 1]! - (i < n - 2 ? c[i - 1]! * m[i + 1]! : 0);
  return (x: number): number => {
    const k: number = Math.min(
      n - 2,
      Math.max(
        0,
        knots.findIndex(
          (_: number, j: number): boolean => j + 1 < n && x < knots[j + 1]!,
        ),
      ),
    );
    const t: number = (x - knots[k]!) / h[k]!;
    return (
      (1 - t) * values[k]! +
      t * values[k + 1]! +
      ((h[k]! * h[k]!) / 6) *
        (m[k]! * ((1 - t) ** 3 - (1 - t)) + m[k + 1]! * (t ** 3 - t))
    );
  };
}
/**
 * The bounded spline every sweep profile uses keeps curvature continuous
 * through its knots, so a densely sampled sweep shows no terrace at its
 * stations, and keeps overshoot within a tenth of the local variation.
 *
 * Scenarios:
 *
 * 1. On a profile alternating up and down, the curve passes through every
 *    knot and its one-sided second derivatives agree at every interior knot,
 *    within 1e-3 of their size, while the monotone cubic's differ there by
 *    more than a tenth of theirs.
 * 2. On the same profile and on a step, no segment overshoots its knots by
 *    more than the bound; on the step the natural cubic spline would, so the
 *    spline has raised its tension and still passes through every knot.
 * 3. Two knots give their straight segment, one knot a constant, and a
 *    periodic profile repeats with continuous curvature across its wrap.
 * 4. A sweep whose station radii alternate has continuous radius curvature
 *    along `u` at every station, and a feature through three points bent
 *    gently leaves no crease inside the bend: the radius slope along `u`
 *    across its middle point jumps by less than 1e-4, where a polyline
 *    feature, whose nearest segment switches there, jumps by 2e-2.
 * 5. Empty, unmatched, unsorted, non-finite and out-of-period knots are
 *    refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates `interpolateAutoMovieSpline` and sweeps compiled with `compileAutoMovieSweep`; a C1 scheme, an unbounded cubic, a tension that left knots, a broken wrap, flat-stepped station profiles or polyline features fail, while any C2 interpolant within the bound passes.
 * @evidence contracts/testing.md#independent-expectations Curvature continuity is measured by one-sided second differences; the bound is computed from the knot values; the natural cubic spline is written in this test; a straight segment and a constant are exact; the feature's crease would show as a slope jump across the bend's middle, measured by one-sided differences that a smooth field shrinks with the step and a crease does not.
 * @evidence contracts/testing.md#distinguishing-cases Covers extrema and near-level steps, a step that needs tension, the monotone cubic as the defect's reference, open and periodic profiles, degenerate counts, sweep stations, a feature corner and each refusal; the sweep's Gordon blend is owned by the Gordon test and the monotone scheme by its own test.
 * @evidence contracts/testing.md#execution-ownership A portable unit test reached through the discoverable `test_geometry_sweep_spline` entry with no process, browser or GPU.
 */
export function test_geometry_sweep_spline(): void {
  const f: (x: number) => number = interpolateAutoMovieSpline({
    knots: KNOTS,
    values: VALUES,
  });
  const monotone: (x: number) => number = interpolateAutoMovieMonotone({
    knots: KNOTS,
    values: VALUES,
  });
  function continuous(g: (x: number) => number, tolerance: number): boolean {
    return KNOTS.slice(1, -1).every((x: number): boolean => {
      const [below, above]: [number, number] = curvature(g, x, 1e-5);
      return (
        Math.abs(below - above) <=
        tolerance * Math.max(1, Math.abs(below), Math.abs(above))
      );
    });
  }
  TestValidator.equals(
    "curvature runs on through every knot of an alternating profile",
    namedFacts([
      [
        "knots",
        (): boolean =>
          KNOTS.every((x: number, k: number): boolean =>
            nclose(f(x), VALUES[k]!, 1e-12),
          ),
      ],
      ["spline", (): boolean => continuous(f, 1e-3)],
      ["monotoneJumps", (): boolean => !continuous(monotone, 0.1)],
    ]),
    { knots: true, spline: true, monotoneJumps: true },
  );
  const stepKnots: number[] = [0, 0.1, 0.2, 0.3, 0.4];
  const stepValues: number[] = [0, 0, 1, 1, 1];
  const step: (x: number) => number = interpolateAutoMovieSpline({
    knots: stepKnots,
    values: stepValues,
  });
  TestValidator.equals(
    "overshoot stays within a tenth of the local variation",
    namedFacts([
      ["alternating", (): boolean => overshoot(f, KNOTS, VALUES) <= 1.01],
      ["step", (): boolean => overshoot(step, stepKnots, stepValues) <= 1.01],
      [
        "cubicWould",
        (): boolean =>
          overshoot(natural(stepKnots, stepValues), stepKnots, stepValues) >
          1.2,
      ],
      [
        "stepKnots",
        (): boolean =>
          stepKnots.every((x: number, k: number): boolean =>
            nclose(step(x), stepValues[k]!, 1e-12),
          ),
      ],
    ]),
    { alternating: true, step: true, cubicWould: true, stepKnots: true },
  );
  const line: (x: number) => number = interpolateAutoMovieSpline({
    knots: [0, 1],
    values: [2, 4],
  });
  const period: number = 2 * Math.PI;
  const periodic: (x: number) => number = interpolateAutoMovieSpline({
    knots: [0, 1.5, 3, 4.5],
    values: [1, 2, 0.5, 1.8],
    period,
  });
  TestValidator.equals(
    "degenerate and periodic profiles",
    namedFacts([
      [
        "line",
        (): boolean =>
          [0, 0.3, 0.71, 1].every((x: number): boolean =>
            nclose(line(x), 2 + 2 * x, 1e-14),
          ),
      ],
      [
        "constant",
        (): boolean =>
          interpolateAutoMovieSpline({ knots: [0.4], values: [7] })(3) === 7,
      ],
      [
        "repeats",
        (): boolean =>
          [-3, 0.4, 5.9].every((x: number): boolean =>
            nclose(periodic(x), periodic(x + period), 1e-12),
          ),
      ],
      [
        "wrap",
        (): boolean => {
          const [below, above]: [number, number] = curvature(
            periodic,
            period,
            1e-5,
          );
          return Math.abs(below - above) <= 1e-3 * Math.max(1, Math.abs(below));
        },
      ],
    ]),
    { line: true, constant: true, repeats: true, wrap: true },
  );
  function circle(r: number): IAutoMovieSweep.IStation["section"] {
    return {
      type: "superellipse",
      right: r,
      up: r,
      left: r,
      down: r,
      exponents: [2, 2, 2, 2],
    };
  }
  const spine: IAutoMovieSweep["spine"] = {
    points: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    ],
    normal: { x: 0, y: 0, z: 1 },
  };
  const stations: IAutoMovieSweep.IStation[] = Array.from(
    { length: 9 },
    (_: unknown, k: number): IAutoMovieSweep.IStation => ({
      at: k / 8,
      section: circle(k % 2 === 0 ? 0.05 : 0.06),
    }),
  );
  const ridged: IAutoMovieSweepSurface = compileAutoMovieSweep({
    spine,
    stations,
  });
  function along(u: number): number {
    return ridged.radius(u, 0.1);
  }
  const bent: IAutoMovieSweepSurface = compileAutoMovieSweep({
    spine,
    stations: [0, 1].map(
      (at: number): IAutoMovieSweep.IStation => ({ at, section: circle(0.05) }),
    ),
    features: [
      {
        points: [
          { at: 0.2, angle: -0.5, offset: -0.004 },
          { at: 0.5, angle: 0, offset: -0.004 },
          { at: 0.8, angle: -0.5, offset: -0.004 },
        ],
        width: 0.03,
      },
    ],
  });
  // inside the gentle bend, across its middle point: a polyline's nearest segment switches there
  function inside(u: number): number {
    return bent.radius(u, -0.2 / (2 * Math.PI));
  }
  const jump: number = Math.abs(
    (inside(0.5 + 1e-5) - inside(0.5)) / 1e-5 -
      (inside(0.5) - inside(0.5 - 1e-5)) / 1e-5,
  );
  TestValidator.equals(
    "a sweep shows no terrace at its stations and no crease inside a feature's bend",
    namedFacts([
      [
        "stations",
        (): boolean =>
          stations
            .slice(1, -1)
            .every((s: IAutoMovieSweep.IStation): boolean => {
              const [below, above]: [number, number] = curvature(
                along,
                s.at,
                1e-5,
              );
              return (
                Math.abs(below - above) <=
                1e-2 * Math.max(1, Math.abs(below), Math.abs(above))
              );
            }),
      ],
      ["corner", (): boolean => jump <= 1e-4],
    ]),
    { stations: true, corner: true },
  );
  const invalids: Array<readonly [string, () => unknown, string]> = [
    [
      "no knot",
      (): unknown => interpolateAutoMovieSpline({ knots: [], values: [] }),
      "needs at least one knot",
    ],
    [
      "short values",
      (): unknown => interpolateAutoMovieSpline({ knots: [0, 1], values: [1] }),
      "needs one value per knot",
    ],
    [
      "unsorted knot",
      (): unknown =>
        interpolateAutoMovieSpline({ knots: [0, 0.5, 0.2], values: [1, 2, 3] }),
      "knot 2 does not increase",
    ],
    [
      "non-finite value",
      (): unknown =>
        interpolateAutoMovieSpline({ knots: [0, 1], values: [1, Number.NaN] }),
      "knot 1 is not finite",
    ],
    [
      "knot beyond period",
      (): unknown =>
        interpolateAutoMovieSpline({
          knots: [0, 1, 7],
          values: [1, 2, 3],
          period,
        }),
      "periodic knots must lie in [0, period)",
    ],
  ];
  for (const [name, callback, message] of invalids)
    TestValidator.predicate(
      `${name} is refused by its own diagnostic`,
      throwsError(callback, message),
    );
}
