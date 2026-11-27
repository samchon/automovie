import { AutoMovieEngineViewHermite as Hermite, AutoMovieEngineNaturalSpline as Natural, AutoMovieEngineConstruction } from "@automovie/engine";
import type {
  IAutoMovieNaturalCubicSpline,
  IAutoMovieViewHermite,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/** One source span with independent closed-form derivative observations. */
interface ICase {
  /** The case's name. */
  name: string;

  /** The span's abscissae. */
  from: number;
  to: number;

  /** The endpoint values. */
  values: readonly [number, number];

  /**
   * The authored endpoint first and second derivatives, in the whole source's
   * normalized parameter.
   */
  first: readonly [number, number];
  second: readonly [number, number];

  /** The physical source derivative extrema, from the stated polynomial. */
  minimum: number;
  maximum: number;

  /** Closed-form derivative probes `[abscissa, derivative]`. */
  probes: readonly (readonly [number, number])[];

  /** The expected sign of the whole range. */
  sign: "zero" | "positive" | "negative" | "mixed";
}

/**
 * `viewHermiteDerivativeRange` bounds the derivative of a prepared
 * Hermite curve from its actual coefficients and tells positive, negative and
 * mixed speed apart.
 *
 * Scenarios, each a span with a closed-form derivative:
 *
 * 1. A constant scalar (7, 7) has derivative 0; a linear one (0 to 1) has 1.
 * 2. The cubic x + x^3 over [0, 1] (values 0 and 2, endpoint derivatives 1 and 4,
 *    bends 0 and 6) has derivative 1 + 3 x^2, from 1 to 4 and 7/4 at 1/2; its
 *    enclosure keeps a positive margin (lower above 0.5, upper below 5).
 * 3. The reversed line -x (values 0 and -1) has derivative -1 and a negative upper
 *    bound.
 * 4. Equal large endpoint values 1e20 with endpoint derivatives 1 and bends 0 give
 *    the increment x - 10 x^3 + 15 x^4 - 6 x^5, whose derivative reaches -7/8
 *    at 1/2 although the authored endpoint derivatives are positive: the range
 *    is mixed (lower below 0, upper above 0).
 * 5. Physical knots 1 and 1.2 have the encoded span 0.19999999999999996, so a
 *    normalized derivative 1 reads as 1 / span rather than 1.
 * 6. Every derivative probe equals its closed form within 65536 epsilon of its
 *    size; the range contains the stated extrema, and for a constant derivative
 *    its width is at most 65536 epsilon of its size; bounding leaves the
 *    prepared curve unchanged.
 */
export function test_engine_geometry_hermite_derivative_range(): void {
  const epsilon: number = 65536 * Number.EPSILON;
  const offsetEnd: number = 1 + 0.2;
  const encodedSpan: number = offsetEnd - 1;
  const offsetSpeed: number = 1 / encodedSpan;
  TestValidator.equals(
    "offset span differs from 0.2",
    Object.is(encodedSpan, 0.2),
    false,
  );
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
  for (const entry of cases) {
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
    if (typeof prepared === "string")
      throw new Error(`${entry.name}: preparation refused: ${prepared}`);
    const before: string = JSON.stringify(prepared);
    for (const [at, expected] of entry.probes)
      TestValidator.predicate(
        `${entry.name} derivative ${at}`,
        nclose(
          Hermite.derivative(prepared, at)[0],
          expected,
          epsilon * Math.max(1, Math.abs(expected)),
        ),
      );
    const result: readonly [number, number] | string =
      AutoMovieEngineConstruction.viewHermiteDerivativeRange(prepared);
    TestValidator.equals(
      `${entry.name} leaves the curve`,
      JSON.stringify(prepared),
      before,
    );
    if (typeof result === "string")
      throw new Error(`${entry.name}: range unavailable: ${result}`);
    const [lower, upper] = result;
    TestValidator.predicate(`${entry.name} ordered`, lower <= upper);
    TestValidator.predicate(
      `${entry.name} holds the minimum`,
      lower <= entry.minimum,
    );
    TestValidator.predicate(
      `${entry.name} holds the maximum`,
      upper >= entry.maximum,
    );
    if (entry.sign === "positive")
      TestValidator.predicate(`${entry.name} positive`, lower > 0);
    if (entry.sign === "negative")
      TestValidator.predicate(`${entry.name} negative`, upper < 0);
    if (entry.sign === "mixed")
      TestValidator.predicate(`${entry.name} mixed`, lower < 0 && upper > 0);
    if (entry.minimum === entry.maximum)
      TestValidator.predicate(
        `${entry.name} tight`,
        upper - lower <= epsilon * Math.max(1, Math.abs(entry.minimum)),
      );
    if (entry.name === "positive cubic derivative")
      TestValidator.predicate("cubic margin", lower > 0.5 && upper < 5);
  }
}
