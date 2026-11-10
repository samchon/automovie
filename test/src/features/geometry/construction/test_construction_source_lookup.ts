import {
  AutoMovieNaturalSpline,
  AutoMovieViewOutline,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { ConstructionHermiteReading } from "../../internal/construction/ConstructionHermiteReading";
import { nclose } from "../../internal/nclose";

/**
 * Shared source interval lookup preserves scalar/jet arithmetic and avoids knot-linear query work.
 *
 * Scenarios:
 * 1. The three-knot natural overshoot has independent cubic derivatives on both spans at three scales, including every knot and its straight exterior tangents.
 * 2. A large affine spline with query-owned indexed-read observation bounds value, derivative and combined lookup work logarithmically; fewer reads are allowed. An exact internal knot retains the original left polynomial's rounding.
 * 3. NaN keeps the old last-span nonfinite value/first derivative and zero exterior second derivative. Infinity uses each documented end tangent; source admission still rejects nonfinite parameters.
 * 4. A closing sqrt source keeps its exact pole zero, finite parameter jet and absent singular station jet. A near-pole finite point survives overflowing station2; fresh value-copied source data gives the same result.
 * 5. The requested quintic 1+t+2t²-3t³+t⁴+t⁵/2 and its analytic first/second derivatives agree at three physical scales, knots and tangent extensions. Combined readings strictly preserve the existing separate APIs, including multi-span knots, signed zero, NaN and infinities.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real natural and requested-quintic value/derivative/combined readers and Outline.at/value, observing source values, qualified jets, failures and indexed-read counts on an unchanged query-owned array.
 * @evidence contracts/development/testing.md#independent-expectations The first cubic is 1-1.2375t+0.2475t^3 and the second is 0.01-0.495t+0.7425t^2-0.2475t^3; derivatives and exterior tangent lines follow directly. The quintic scenario differentiates its stated degree-five polynomial analytically, and separate original value/derivative APIs additionally enforce strict binary64 arithmetic. The large fixture is y=2x+3 with zero curvature. sqrt(s) and its singular derivatives give the pole oracle. For exact-knot rounding, the independent three-knot natural equation M1=3*(d1-d0)/(h0+h1) derives the middle curvature from input secants before evaluating the left cubic. Decimal coefficients used by the toleranced checks are not substituted into this strict representation check, which also distinguishes direct right-knot return. The lookup allowance is a generous logarithmic upper bound, not an exact implementation layout.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes reciprocal length scales, natural and genuine requested quintics, unequal multi-span knots/extrema/extensions, signed-zero and negative stations, large knot populations, NaN/infinities and exact/tiny closing stations. A first-to-last scan exceeds the work allowance; evaluating a pole's station derivative as finite or clamping its neighbour loses the tiny-value oracle.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU question through --include construction_source_lookup, with synthetic immutable sources and no host, timing benchmark, Human generation, viewer or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The three-knot natural overshoot has independent cubic derivatives on both spans at three scales, including every knot and its straight...).
 */
export function test_construction_source_lookup(): void {
  const failures: string[] = [];
  ConstructionHermiteReading.check(failures);
  for (const scale of [0.001, 1, 1000]) {
    const spline: AutoMovieNaturalSpline.ISpline =
      AutoMovieNaturalSpline.create(
        [0, scale, 2 * scale],
        [scale, 0.01 * scale, 0.01 * scale],
      );
    for (const x of [-1, 0, 0.25, 1, 1.5, 2, 3]) {
      const expected: [number, number, number] =
        x < 0
          ? [1 - 1.2375 * x, -1.2375, 0]
          : x > 2
            ? [0.01 + 0.2475 * (x - 2), 0.2475, 0]
            : x <= 1
              ? [
                  1 - 1.2375 * x + 0.2475 * x ** 3,
                  -1.2375 + 0.7425 * x * x,
                  1.485 * x,
                ]
              : second(x - 1);
      const at: [number, number, number] = AutoMovieNaturalSpline.read(
        spline,
        x * scale,
      );
      const d: [number, number] = AutoMovieNaturalSpline.derivative(
        spline,
        x * scale,
      );
      if (
        !nclose(at[0], expected[0] * scale, 2e-11 * scale) ||
        !nclose(at[1], expected[1], 2e-11) ||
        !nclose(at[2], expected[2] / scale, 2e-11 / scale)
      )
        failures.push(`independent natural polynomial ${scale}/${x}`);
      if (
        !Object.is(at[0], AutoMovieNaturalSpline.evaluate(spline, x * scale)) ||
        !Object.is(at[1], d[0]) ||
        !Object.is(at[2], d[1])
      )
        failures.push(`combined arithmetic ${scale}/${x}`);
    }
  }
  const tie: AutoMovieNaturalSpline.ISpline = AutoMovieNaturalSpline.create(
    [0, 1, 2],
    [1, 0.01, 0.01],
  );

  // Natural zero end curvatures give M1=3*(d1-d0)/(h0+h1).
  // Derive this unit-span cubic from its inputs: pre-rounded decimal
  // polynomial coefficients need not retain the same binary64 knot value.
  const firstSecant: number = 0.01 - 1;
  const lastSecant: number = 0.01 - 0.01;
  const middleCurvature: number = (3 * (lastSecant - firstSecant)) / 2;
  const cubic: number = middleCurvature / 6;
  const expectedLeft: number = 1 + (firstSecant - cubic + cubic);
  const actualKnot: number = AutoMovieNaturalSpline.evaluate(tie, 1);
  if (Object.is(expectedLeft, 0.01))
    failures.push(
      "red: the knot fixture cannot distinguish direct right return",
    );
  if (!Object.is(actualKnot, expectedLeft))
    failures.push(
      `left polynomial knot ${actualKnot.toPrecision(17)}, expected ${expectedLeft.toPrecision(17)}`,
    );
  const invalid: [number, number, number] = AutoMovieNaturalSpline.read(
    tie,
    NaN,
  );
  if (
    !(Number.isNaN(invalid[0]) && Number.isNaN(invalid[1]) && invalid[2] === 0)
  )
    failures.push("NaN's existing last-span/exterior behavior changed");
  for (const x of [-Infinity, Infinity]) {
    const at: [number, number, number] = AutoMovieNaturalSpline.read(tie, x);
    if (
      !(
        at[0] === Infinity &&
        nclose(at[1], x < 0 ? -1.2375 : 0.2475, 2e-11) &&
        at[2] === 0
      )
    )
      failures.push(`infinite tangent ${x}`);
  }
  lookupWork(failures);

  const raw: IAutoMovieViewPart.IOutline = {
    knots: [
      { site: "pole", station: 0, value: 0 },
      { site: "open", station: 4, value: 2 },
    ],
  };
  const prepared:
    | AutoMovieViewOutline.IOutline
    | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(raw, {
    bottom: 0,
  });
  if ("detail" in prepared) throw new Error(prepared.detail);
  const copied: AutoMovieViewOutline.IOutline = structuredClone(prepared);
  for (const s of [0, 1e-310, 0.25, 1, 4, 9]) {
    const at: AutoMovieViewOutline.IReading | string = AutoMovieViewOutline.at(
      prepared,
      s,
    );
    const copy: AutoMovieViewOutline.IReading | string =
      AutoMovieViewOutline.at(copied, s);
    if (typeof at === "string" || typeof copy === "string") {
      failures.push(`sqrt source unavailable ${s}`);
      continue;
    }
    if (s === 0) {
      if (
        !(
          at.value === 0 &&
          at.stationJet === null &&
          at.stationJetStatus === "singular-pole" &&
          at.parameterJet.every(Number.isFinite)
        )
      )
        failures.push("pole capability changed");
    } else if (!(at.value > 0 && nclose(at.value / Math.sqrt(s), 1, 2e-12)))
      failures.push(`finite sqrt value ${s}`);
    if (
      s === 1e-310 &&
      !(at.stationJet === null && at.stationJetStatus === "nonfinite")
    )
      failures.push("overflowing near-pole station2 is no longer unavailable");
    if (
      !Object.is(at.value, copy.value) ||
      !Object.is(at.value, AutoMovieViewOutline.value(prepared, s))
    )
      failures.push("cold/value-copy source changed");
  }
  for (const s of [-1, NaN, Infinity])
    if (typeof AutoMovieViewOutline.at(prepared, s) !== "string")
      failures.push(`invalid closing query admitted ${s}`);
  TestValidator.predicate(
    `${failures.length} source lookup findings:\n${failures.join("\n")}`,
    (): boolean => failures.length === 0,
  );
}

/** Independent second-span cubic and its analytic derivatives in unit coordinates. */
function second(t: number): [number, number, number] {
  return [
    0.01 - 0.495 * t + 0.7425 * t * t - 0.2475 * t ** 3,
    -0.495 + 1.485 * t - 0.7425 * t * t,
    1.485 - 1.485 * t,
  ];
}

/** Observe indexed reads on unchanged synthetic knot data; never replace a global evaluator. */
function lookupWork(failures: string[]): void {
  const count: number = 8193;
  const xs: number[] = Array.from(
    { length: count },
    (_: unknown, i: number): number => i - 4096,
  );
  const original: AutoMovieNaturalSpline.ISpline =
    AutoMovieNaturalSpline.create(
      xs,
      xs.map((x: number): number => 2 * x + 3),
    );
  const work: { reads: number } = { reads: 0 };
  const counted: readonly number[] = new Proxy(xs, {
    /** Numeric index reads expose the lookup cost without changing an ordinate. */
    get(
      target: number[],
      property: string | symbol,
      receiver: unknown,
    ): unknown {
      if (typeof property === "string" && /^\d+$/.test(property)) work.reads++;
      return Reflect.get(target, property, receiver);
    },
  });
  const spline: AutoMovieNaturalSpline.ISpline = { ...original, xs: counted };
  const x: number = xs.at(-1)! - 0.25;
  const limit: number = 6 * Math.ceil(Math.log2(count)) + 32;
  work.reads = 0;
  const value: number = AutoMovieNaturalSpline.evaluate(spline, x);
  const valueReads: number = work.reads;
  work.reads = 0;
  const d: [number, number] = AutoMovieNaturalSpline.derivative(spline, x);
  const derivativeReads: number = work.reads;
  work.reads = 0;
  const at: [number, number, number] = AutoMovieNaturalSpline.read(spline, x);
  if (
    !(
      nclose(value, 2 * x + 3, 1e-12) &&
      nclose(d[0], 2, 1e-12) &&
      nclose(d[1], 0, 1e-12) &&
      nclose(at[0], value, 1e-12) &&
      nclose(at[1], 2, 1e-12) &&
      nclose(at[2], 0, 1e-12)
    )
  )
    failures.push("large affine source changed");
  if (!(valueReads <= limit && derivativeReads <= limit && work.reads <= limit))
    failures.push(
      `lookup work ${valueReads}/${derivativeReads}/${work.reads} exceeds ${limit}`,
    );
  console.log(
    `source lookup work: value ${valueReads}, derivative ${derivativeReads}, combined ${work.reads}, allowance ${limit}`,
  );
}
