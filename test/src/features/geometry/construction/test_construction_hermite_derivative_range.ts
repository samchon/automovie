import {
  AutoMovieViewHermite as Hermite,
  AutoMovieNaturalSpline as Natural,
  AutoMovieViewHermiteDerivativeRange as derivativeRange,
} from "@automovie/engine";
import type {
  IAutoMovieNaturalCubicSpline,
  IAutoMovieViewHermite,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Independent polynomial constraints and derivative observations for one source
 * span.
 */
interface ICase {
  /** The source's ordinary scalar abscissae and endpoint values. */
  name: string;
  from: number;
  to: number;
  values: readonly [number, number];
  /**
   * Jets use the whole source's normalized parameter, as the public contract
   * states.
   */
  first: readonly [number, number];
  second: readonly [number, number];
  /** Physical source derivative extrema, derived from the stated polynomial. */
  minimum: number;
  maximum: number;
  /** Interior or endpoint probes are independent closed-form derivatives. */
  probes: readonly (readonly [number, number])[];
  sign: "zero" | "positive" | "negative" | "mixed";
}

/**
 * Actual Hermite coefficient ranges distinguish positive, negative and mixed
 * speed.
 *
 * Scenarios:
 *
 * 1. A constant scalar has derivative zero and a linear scalar derivative one.
 * 2. The cubic x+x^3 has positive derivative 1+3x^2 over [0,1].
 * 3. The reversed line -x has negative derivative; a general range accepts it.
 * 4. Equal large endpoint values with endpoint derivatives one and bends zero give
 *    the increment x-10x^3+15x^4-6x^5. Its derivative reaches -7/8, despite
 *    positive authored endpoint derivatives and constant Point0 rounding.
 * 5. Physical knots 1 and 1+.2 have encoded span .19999999999999996. A normalized
 *    derivative one therefore reads as 1/span, rather than one.
 * 6. Bounding leaves every actual prepared source coefficient and jet unchanged.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public range capability on preparations made by the real NaturalSpline and Hermite owners, comparing returned enclosures and the existing derivative reader. No Human, source callback, process or geometry is built; each case finishes before one aggregate verdict.
 * @evidence contracts/development/testing.md#independent-expectations Constant/linear/cubic identities give exact derivative extrema. The equal-value Hermite constraints uniquely give 1-30x^2(1-x)^2 with minimum -7/8; the offset-span expectation follows the published normalized-jet units and actual endpoint subtraction. No stored production coefficient or Human measurement supplies an expected bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers zero, constant positive, varying positive, reversed and cancellation-induced mixed signs, plus a non-dyadic offset span. Strict enclosure comparisons catch an underestimated maximum or missed negative derivative; tight constant-range and bounded cubic checks prevent an uninformative universal enclosure. Existing owner tests cover scalar interpolation and source admission independently.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU test discovered as construction_hermite_derivative_range. The supervisor owns its grouped RED and GREEN after the one shared watch; the test starts no checker, runner, viewer or renderer.
 * @evidence contracts/development/common.md#meaningful-documentation States all six scenarios, derivative/source-parameter units, the independent polynomial and Float64 bases, immutable preparation and the difference between valid negative bounds and consumer positivity admission.
 */
export function test_construction_hermite_derivative_range(): void {
  const failures: string[] = [];
  const epsilon: number = 65536 * Number.EPSILON;
  const offsetEnd: number = 1 + 0.2;
  const encodedSpan: number = offsetEnd - 1;
  const offsetSpeed: number = 1 / encodedSpan;
  const cases: readonly ICase[] = [
    {
      name: "constant scalar",
      from: 0,
      to: 1,
      values: [7, 7],
      first: [0, 0],
      second: [0, 0],
      minimum: 0,
      maximum: 0,
      probes: [
        [0, 0],
        [0.5, 0],
        [1, 0],
      ],
      sign: "zero",
    },
    {
      name: "constant positive derivative",
      from: 0,
      to: 1,
      values: [0, 1],
      first: [1, 1],
      second: [0, 0],
      minimum: 1,
      maximum: 1,
      probes: [
        [0, 1],
        [0.5, 1],
        [1, 1],
      ],
      sign: "positive",
    },
    {
      name: "positive cubic derivative",
      from: 0,
      to: 1,
      values: [0, 2],
      first: [1, 4],
      second: [0, 6],
      minimum: 1,
      maximum: 4,
      probes: [
        [0, 1],
        [0.5, 7 / 4],
        [1, 4],
      ],
      sign: "positive",
    },
    {
      name: "reversed derivative",
      from: 0,
      to: 1,
      values: [0, -1],
      first: [-1, -1],
      second: [0, 0],
      minimum: -1,
      maximum: -1,
      probes: [
        [0, -1],
        [0.5, -1],
        [1, -1],
      ],
      sign: "negative",
    },
    {
      name: "cancellation reverses interior speed",
      from: 0,
      to: 1,
      values: [1e20, 1e20],
      first: [1, 1],
      second: [0, 0],
      minimum: -7 / 8,
      maximum: 1,
      probes: [
        [0, 1],
        [0.5, -7 / 8],
        [1, 1],
      ],
      sign: "mixed",
    },
    {
      name: "actual encoded offset span",
      from: 1,
      to: offsetEnd,
      values: [0, 1],
      first: [1, 1],
      second: [0, 0],
      minimum: offsetSpeed,
      maximum: offsetSpeed,
      probes: [
        [1, offsetSpeed],
        [(1 + offsetEnd) / 2, offsetSpeed],
        [offsetEnd, offsetSpeed],
      ],
      sign: "positive",
    },
  ];
  if (Object.is(encodedSpan, 0.2))
    failures.push(
      "offset span premise did not distinguish the actual abscissae",
    );

  for (const entry of cases) {
    try {
      const spline: IAutoMovieNaturalCubicSpline = Natural.create(
        [entry.from, entry.to],
        [...entry.values],
      );
      const knots: IAutoMovieViewPart.IKnot[] = [0, 1].map(
        (k: number): IAutoMovieViewPart.IKnot => ({
          station: k === 0 ? entry.from : entry.to,
          value: entry.values[k]!,
          site: "endpoint" + k,
          jet: { first: entry.first[k]!, second: entry.second[k]! },
        }),
      );
      const prepared: IAutoMovieViewHermite.ICurve | string = Hermite.create(
        spline,
        knots,
        undefined,
      );
      if (typeof prepared === "string") {
        failures.push(
          entry.name + ": original source preparation refused: " + prepared,
        );
        continue;
      }
      const before: string = JSON.stringify(prepared);
      for (const [at, expected] of entry.probes) {
        const actual: number = Hermite.derivative(prepared, at)[0];
        if (
          !nclose(actual, expected, epsilon * Math.max(1, Math.abs(expected)))
        )
          failures.push(
            entry.name +
              ": independent derivative " +
              at +
              ": " +
              actual +
              " vs " +
              expected,
          );
      }
      const result: readonly [number, number] | string =
        derivativeRange(prepared);
      if (JSON.stringify(prepared) !== before)
        failures.push(
          entry.name + ": bounding mutated the original preparation",
        );
      if (typeof result === "string") {
        failures.push(entry.name + ": range unavailable: " + result);
        continue;
      }
      const [lower, upper]: readonly [number, number] = result;
      if (!(lower <= upper && lower <= entry.minimum && upper >= entry.maximum))
        failures.push(
          entry.name + ": misses independent derivative range: " + result,
        );
      if (entry.sign === "positive" && !(lower > 0))
        failures.push(
          entry.name +
            ": positive source lacks a positive lower bound: " +
            result,
        );
      if (entry.sign === "negative" && !(upper < 0))
        failures.push(
          entry.name +
            ": reversed source was not enclosed as negative: " +
            result,
        );
      if (entry.sign === "mixed" && !(lower < 0 && upper > 0))
        failures.push(
          entry.name +
            ": cancellation was hidden by positive endpoint jets: " +
            result,
        );
      if (
        entry.minimum === entry.maximum &&
        !(upper - lower <= epsilon * Math.max(1, Math.abs(entry.minimum)))
      )
        failures.push(
          entry.name +
            ": constant derivative enclosure is uninformative: " +
            result,
        );
      if (
        entry.name === "positive cubic derivative" &&
        !(lower > 0.5 && upper < 5)
      )
        failures.push(
          entry.name +
            ": cubic enclosure lost its independent positive margin: " +
            result,
        );
    } catch (error: unknown) {
      failures.push(
        entry.name +
          ": " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }
  TestValidator.predicate(
    "Hermite derivative ranges: " + failures.join(" | "),
    failures.length === 0,
  );
}
