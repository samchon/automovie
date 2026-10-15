import { interpolateAutoMovieMonotone } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/** A profile that rises, holds nearly level, falls past its start and rises again, on uneven knots. */
const KNOTS: number[] = [0, 0.2, 0.35, 0.5, 0.7, 1];
const VALUES: number[] = [1, 3, 2.9, 0.5, 0.6, 2];

/** Samples per segment when scanning for overshoot. */
const SAMPLES: number = 400;

/** The uniform Catmull-Rom curve through the same data, the interpolant the sweep's profiles replaced, which overshoots. */
const catmullRom = (x: number): number => {
  const found: number = KNOTS.findIndex((_: number, i: number): boolean => i + 1 < KNOTS.length && x < KNOTS[i + 1]!);
  const k: number = found < 0 ? KNOTS.length - 2 : found;
  const at = (i: number): number => VALUES[Math.min(VALUES.length - 1, Math.max(0, i))]!;
  const t: number = (x - KNOTS[k]!) / (KNOTS[k + 1]! - KNOTS[k]!);
  const m0: number = (at(k + 1) - at(k - 1)) / 2;
  const m1: number = (at(k + 2) - at(k)) / 2;
  return (2 * t ** 3 - 3 * t ** 2 + 1) * at(k) + (t ** 3 - 2 * t ** 2 + t) * m0 + (-2 * t ** 3 + 3 * t ** 2) * at(k + 1) + (t ** 3 - t ** 2) * m1;
};

/** Largest excursion of `f` beyond the range of each segment's two knot values, and whether every segment runs one way. */
const scan = (f: (x: number) => number, knots: number[], values: number[]): { overshoot: number; monotone: boolean } => {
  let overshoot: number = 0;
  let monotone: boolean = true;
  for (let k: number = 0; k + 1 < knots.length; ++k) {
    const low: number = Math.min(values[k]!, values[k + 1]!);
    const high: number = Math.max(values[k]!, values[k + 1]!);
    const sign: number = Math.sign(values[k + 1]! - values[k]!);
    let previous: number = f(knots[k]!);
    for (let i: number = 1; i <= SAMPLES; ++i) {
      const y: number = f(knots[k]! + ((knots[k + 1]! - knots[k]!) * i) / SAMPLES);
      overshoot = Math.max(overshoot, low - y, y - high);
      if ((y - previous) * sign < -1e-15) monotone = false;
      previous = y;
    }
  }
  return { overshoot, monotone };
};

/**
 * The shape-preserving interpolation every sweep profile uses keeps each
 * segment within, and monotone between, its two knot values.
 *
 * Scenarios:
 *
 * 1. On a rising-and-falling profile with a near-level step and uneven knots,
 *    every segment stays within its knots' range and runs one way, while the
 *    uniform Catmull-Rom curve through the same data overshoots by more than
 *    0.1, so the data distinguishes a shape-preserving scheme.
 * 2. The curve passes through every knot, holds the end values outside the
 *    knots, reproduces linear data exactly, and is C1 at interior knots.
 * 3. A periodic profile repeats with its period and its wrap segment stays
 *    within its two knot values.
 * 4. A single knot is constant; empty, short, unsorted, non-finite and
 *    out-of-period knots are refused by their own diagnostics.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates `interpolateAutoMovieMonotone` densely on open and periodic data and asserts range, monotonicity, knot passage, flat extrapolation, linear reproduction, C1 joins, periodicity and refusals; an interpolant with unrestricted slopes, a non-zero slope at an extremum, a missing wrap segment or a silent sort fails them, while any monotone C1 cubic through the knots passes.
 * @evidence contracts/testing.md#independent-expectations The bounds are the knot values themselves, the Fritsch-Carlson guarantee; the overshooting reference is a Catmull-Rom curve computed in this test; linear data has the exact linear answer; C1 is checked by one-sided difference quotients, an oracle accurate to the step used.
 * @evidence contracts/testing.md#distinguishing-cases Covers rising, falling, near-level and extremum segments, uneven spacing, both ends, the periodic wrap, one knot, and each malformed input; the sweep's use of these profiles is owned by the Gordon and loft tests.
 * @evidence contracts/testing.md#execution-ownership A portable unit test reached through the discoverable `test_geometry_sweep_monotone` entry, calling the engine function directly with no process, browser or GPU.
 */
export function test_geometry_sweep_monotone(): void {
  const f: (x: number) => number = interpolateAutoMovieMonotone({ knots: KNOTS, values: VALUES });
  const shaped: { overshoot: number; monotone: boolean } = scan(f, KNOTS, VALUES);
  const reference: { overshoot: number; monotone: boolean } = scan(catmullRom, KNOTS, VALUES);
  TestValidator.equals(
    "a rising-and-falling profile never leaves a segment's range, where Catmull-Rom does",
    namedFacts([
      ["withinRange", (): boolean => shaped.overshoot <= 1e-15],
      ["monotone", (): boolean => shaped.monotone],
      ["referenceOvershoots", (): boolean => reference.overshoot > 0.1],
    ]),
    { withinRange: true, monotone: true, referenceOvershoots: true },
  );

  const linear: (x: number) => number = interpolateAutoMovieMonotone({ knots: [0, 0.3, 1], values: [2, 2.6, 4] });
  const derivative = (x: number, side: number): number => (side * (f(x + side * 1e-7) - f(x))) / 1e-7;
  TestValidator.equals(
    "the curve passes through its knots, holds its ends, keeps linear data linear and is C1",
    namedFacts([
      ["knots", (): boolean => KNOTS.every((x: number, k: number): boolean => f(x) === VALUES[k])],
      ["before", (): boolean => f(-0.5) === VALUES[0] && f(-1e9) === VALUES[0]],
      ["after", (): boolean => f(1.5) === VALUES[VALUES.length - 1]],
      ["linear", (): boolean => Array.from({ length: 101 }, (_: unknown, i: number): number => i / 100).every((x: number): boolean => nclose(linear(x), 2 + 2 * x, 1e-14))],
      ["smooth", (): boolean => KNOTS.slice(1, -1).every((x: number): boolean => nclose(derivative(x, -1), derivative(x, 1), 1e-4 * (1 + Math.abs(derivative(x, 1)))))],
    ]),
    { knots: true, before: true, after: true, linear: true, smooth: true },
  );

  const knots: number[] = [0, 1.5, 3, 4.5];
  const values: number[] = [1, 2, 0.5, 1.8];
  const period: number = 2 * Math.PI;
  const periodic: (x: number) => number = interpolateAutoMovieMonotone({ knots, values, period });
  const wrapped: { overshoot: number; monotone: boolean } = scan(periodic, [...knots, period], [...values, values[0]!]);
  TestValidator.equals(
    "a periodic profile repeats and its wrap segment stays within its knots",
    namedFacts([
      ["repeats", (): boolean => [-3, 0.4, 2.2, 5.9].every((x: number): boolean => nclose(periodic(x), periodic(x + period), 1e-12) && nclose(periodic(x), periodic(x - 2 * period), 1e-12))],
      ["withinRange", (): boolean => wrapped.overshoot <= 1e-15],
      ["monotone", (): boolean => wrapped.monotone],
    ]),
    { repeats: true, withinRange: true, monotone: true },
  );

  const single: (x: number) => number = interpolateAutoMovieMonotone({ knots: [0.4], values: [7] });
  TestValidator.predicate("a single knot gives a constant", [-1, 0.4, 3].every((x: number): boolean => single(x) === 7));
  const invalids: Array<readonly [string, () => unknown, string]> = [
    ["no knot", (): unknown => interpolateAutoMovieMonotone({ knots: [], values: [] }), "needs at least one knot"],
    ["short values", (): unknown => interpolateAutoMovieMonotone({ knots: [0, 1], values: [1] }), "needs one value per knot"],
    ["repeated knot", (): unknown => interpolateAutoMovieMonotone({ knots: [0, 0.5, 0.5], values: [1, 2, 3] }), "knot 2 does not increase"],
    ["unsorted knot", (): unknown => interpolateAutoMovieMonotone({ knots: [0, 0.5, 0.2], values: [1, 2, 3] }), "knot 2 does not increase"],
    ["non-finite value", (): unknown => interpolateAutoMovieMonotone({ knots: [0, 1], values: [1, Number.NaN] }), "knot 1 is not finite"],
    ["knot beyond period", (): unknown => interpolateAutoMovieMonotone({ knots: [0, 1, 7], values: [1, 2, 3], period }), "periodic knots must lie in [0, period)"],
    ["negative periodic knot", (): unknown => interpolateAutoMovieMonotone({ knots: [-1, 1], values: [1, 2], period }), "periodic knots must lie in [0, period)"],
  ];
  for (const [name, callback, message] of invalids)
    TestValidator.predicate(`${name} is refused by its own diagnostic`, throwsError(callback, message));
}
