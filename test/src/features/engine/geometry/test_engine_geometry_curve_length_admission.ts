import { AutoMovieEngineCurve } from "@automovie/engine";
import type {
  IAutoMovieCubicBezierCurve64,
  IAutoMovieMeasureCurveLength64,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * Strict curve length checks whole panels, finite charts and complete finite
 * derivatives, including the previously sampled endpoints.
 *
 * Unit and zero speed preserve exact length within quadrature rounding. One
 * panel reads both endpoints first and then the original interior nodes in
 * order. Invalid panels, coordinates and collapsed charts are diagnosed. A
 * callback's own exception propagates. The legacy cubic path still yields its
 * unit line length.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names strict endpoints and panel count, finite derivative shape, callback exceptions and legacy cubic compatibility.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public strict and cubic length measures, records strict callback parameters and exercises invalid counts, domain and returned derivative values.
 * @evidence contracts/development/testing.md#independent-expectations All Gauss-Legendre panels integrate constant unit speed to their widths. The one-panel schedule uses two endpoints, eight coarse and sixteen fine interior evaluations. At start 1 a single-ulp domain cannot supply all strictly interior quadrature nodes.
 */
export function test_engine_geometry_curve_length_admission(): void {
  const length = AutoMovieEngineCurve.measureCurveLength64;
  const reads: number[] = [];
  const derivative = (t: number): readonly [number, number, number] => {
    reads.push(t);
    return [1, 0, 0];
  };
  const domain = { start: 0, end: 1 };
  const sample: IAutoMovieMeasureCurveLength64.IPiece = { domain, derivative };
  const measured = length([sample]);
  const tolerance: number = 1e-12;
  TestValidator.predicate(
    "one panel and preserved two-rule schedule",
    Math.abs(measured.lengthMm - 1) <= tolerance &&
      measured.differenceMm <= tolerance &&
      reads.length === 26 &&
      reads[0] === 0 &&
      reads[1] === 1 &&
      reads
        .slice(2, 10)
        .every(
          (value, index, values) =>
            value > 0 &&
            value < 1 &&
            (index === 0 || value > values[index - 1]!),
        ) &&
      reads
        .slice(10)
        .every(
          (value, index, values) =>
            value > 0 &&
            value < 1 &&
            (index === 0 || value > values[index - 1]!),
        ),
  );
  TestValidator.predicate(
    "1024 panels stay legal",
    Math.abs(
      length([{ domain, derivative: () => [1, 0, 0] }], 1024).lengthMm - 1,
    ) <= tolerance,
  );
  TestValidator.equals(
    "finite zero speed",
    length([{ domain, derivative: () => [0, 0, 0] }]),
    { lengthMm: 0, differenceMm: 0 },
  );
  const old: IAutoMovieCubicBezierCurve64 = {
    type: "cubicBezier",
    name: "unit-line",
    closed: false,
    unit: "mm",
    phaseUnit: "normalized",
    phaseIntervals: [1],
    spans: [
      [
        [0, 0, 0],
        [1 / 3, 0, 0],
        [2 / 3, 0, 0],
        [1, 0, 0],
      ],
    ],
  };
  TestValidator.predicate(
    "legacy cubic unit length",
    Math.abs(
      AutoMovieEngineCurve.measureCubicCurveLength64(old, 1).lengthMm - 1,
    ) <= tolerance,
  );

  const malformedDerivative = new Array<number>(3) as unknown as readonly [
    number,
    number,
    number,
  ];
  const bad: [string, () => unknown, string][] = [
    ...[0, 1.5, NaN, Infinity, 1025].map(
      (n): [string, () => unknown, string] => [
        String(n),
        () => length([sample], n),
        "integer in [1,1024]",
      ],
    ),
    [
      "nonfinite domain",
      () => length([{ ...sample, domain: { start: 0, end: Infinity } }]),
      "finite increasing representable domains",
    ],
    [
      "nonfinite endpoint",
      () => length([{ domain, derivative: (t) => [t === 0 ? NaN : 1, 0, 0] }]),
      "finite original world derivatives",
    ],
    [
      "nonfinite interior",
      () =>
        length([
          { domain, derivative: (t) => [t === 0 || t === 1 ? 1 : NaN, 0, 0] },
        ]),
      "finite original world derivatives",
    ],
    [
      "sparse derivative",
      () => length([{ domain, derivative: () => malformedDerivative }]),
      "finite original world derivatives",
    ],
    [
      "short derivative",
      () =>
        length([
          {
            domain,
            derivative: () =>
              [1] as unknown as readonly [number, number, number],
          },
        ]),
      "finite original world derivatives",
    ],
    [
      "collapsed chart",
      () =>
        length([
          {
            domain: { start: 1, end: 1 + Number.EPSILON },
            derivative: () => [1, 0, 0],
          },
        ]),
      "nodes are not representable",
    ],
  ];
  TestValidator.equals(
    "strict chart and derivative refusals",
    bad
      .filter(([, attempt, message]) => !throwsError(attempt, message))
      .map(([name]) => name),
    [],
  );
  const original = new Error("source stopped");
  let received: unknown;
  try {
    length([
      {
        domain,
        derivative: () => {
          throw original;
        },
      },
    ]);
  } catch (error) {
    received = error;
  }
  TestValidator.predicate(
    "callback exception preserves identity",
    received === original,
  );
}
