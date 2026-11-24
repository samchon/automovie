import type {
  AutoMovieVector2Tuple,
  IAutoMovieConicApproximation,
  IAutoMovieCubicCriticalParameters,
  IAutoMoviePlanarCurveSource,
  IAutoMovieRegisteredConicArc,
} from "@automovie/interface";
import {
  AutoMovieRecoveryConicApproximation as C,
  approximateAutoMovieRecoveryConicsAhn as approximate,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { ConicPaperInput } from "../../reference-conics/ConicPaperInput";
import { nclose } from "../internal/nclose";

/**
 * Critical preprocessing separates nondyadic inflections before conic fitting.
 *
 * Scenarios:
 * 1. The analytic cubic (u,(u-1/3)^3) exposes a non-midpoint curvature zero.
 * 2. Exact source jets on [7,11] and on [0,1] fit completely after that split.
 * 3. A symmetric regular arch exposes an affine critical parameter at one half.
 * 4. A stationary cusp retains a repeated curvature root and velocity root.
 * 5. Collinear/constant sources, near-lines and rigid/scaled frames keep their meaning.
 * 6. Nonfinite coefficients refuse, while input coefficients remain unchanged.
 * 7. Both experiment charts preserve the analytic cubic after one shared span preparation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the analytic scenarios, parameter mappings and numerical root scope.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public critical-coefficient operation and Ahn producer, then checks actual source coverage, finite positive coefficients and preservation of source jet values.
 * @evidence contracts/development/testing.md#independent-expectations Differentiating (u,(u-1/3)^3) gives D=6(u-1/3); the symmetric arch's derivative symmetry gives an affine critical point at one half; the cusp (v^3/3,v^2/2) has D=-v² and zero velocity at v=0.
 * @evidence contracts/development/testing.md#distinguishing-cases Nondyadic roots expose midpoint-only subdivision; a nonzero parameter origin exposes endpoint residual handling; a repeated root distinguishes velocity failure from regular inflection, and exact lines distinguish a critical continuum from isolated roots.
 * @evidence contracts/development/testing.md#execution-ownership The central runner owns this CPU-only analytic test with no data files, source specimen, fitting benchmark, renderer or process.
 */
export function test_recovery_conics_critical(): void {
  const alpha: number = 1 / 3;
  const controls: readonly [
    Readonly<AutoMovieVector2Tuple>,
    Readonly<AutoMovieVector2Tuple>,
    Readonly<AutoMovieVector2Tuple>,
    Readonly<AutoMovieVector2Tuple>,
  ] = [
    [0, -1 / 27],
    [1 / 3, 2 / 27],
    [2 / 3, -4 / 27],
    [1, 8 / 27],
  ];
  const before: string = JSON.stringify(controls);
  const critical: IAutoMovieCubicCriticalParameters =
    C.cubicCriticalParameters(controls);
  TestValidator.equals(
    "one regular inflection",
    critical.zeroCurvature.length,
    1,
  );
  TestValidator.predicate(
    "nondyadic analytic root",
    nclose(critical.zeroCurvature[0]!, alpha, 1e-12),
  );
  TestValidator.equals(
    "regular cubic not stationary",
    critical.stationary.length,
    0,
  );

  /** Exact analytic source under an affine parameter chart; no endpoint offset is used. */
  const source: (
    origin: number,
    width: number,
    height: number,
  ) => IAutoMoviePlanarCurveSource = (
    origin: number,
    width: number,
    height: number,
  ): IAutoMoviePlanarCurveSource => ({
    domain: [origin, origin + width],
    breaks: critical.zeroCurvature.map(
      (u: number): number => origin + width * u,
    ),
    closed: false,
    evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => {
      const u: number = (t - origin) / width;
      return [u, height * (u - alpha) ** 3];
    },
    derivative: (
      t: number,
      order: 1 | 2 | 3 | 4 | 5,
    ): Readonly<AutoMovieVector2Tuple> => {
      const u: number = (t - origin) / width;
      return order === 1
        ? [1 / width, (3 * height * (u - alpha) ** 2) / width]
        : order === 2
          ? [0, (6 * height * (u - alpha)) / width ** 2]
          : order === 3
            ? [0, (6 * height) / width ** 3]
            : [0, 0];
    },
  });

  const span: ConicPaperInput.Span = [
    [controls[0][0], 22, controls[0][1]],
    [controls[1][0], 22, controls[1][1]],
    [controls[2][0], 22, controls[2][1]],
    [controls[3][0], 22, controls[3][1]],
  ];
  const bind: ReturnType<typeof ConicPaperInput.prepareChart> =
    ConicPaperInput.prepareChart(span, 7);
  const exact: IAutoMoviePlanarCurveSource = source(7, 1, 1);
  for (const method of ["ahn", "ghosh"] as const) {
    let queries: number = 0;
    const scoped: IAutoMoviePlanarCurveSource = bind(
      (): void => { ++queries; },
      method,
      (): void => {},
    );
    TestValidator.predicate(
      method + " prepared analytic inflection",
      scoped.breaks.some((t: number): boolean => nclose(t, 7 + alpha, 1e-12)),
    );
    for (const t of [7.75, 7, 8, 7 + alpha]) {
      for (const order of [0, 1, 2, 3, 4, 5] as const) {
        const value: Readonly<AutoMovieVector2Tuple> =
          order === 0 ? scoped.evaluate(t) : scoped.derivative(t, order);
        const want: Readonly<AutoMovieVector2Tuple> =
          order === 0 ? exact.evaluate(t) : exact.derivative(t, order);
        TestValidator.predicate(
          method + " prepared cubic derivative " + order,
          nclose(value[0], want[0], 1e-12) && nclose(value[1], want[1], 1e-12),
        );
      }
    }
    TestValidator.equals(method + " exact callback count", queries, 24);
  }

  for (const [origin, width, height] of [
    [0, 1, 1],
    [7, 4, 1],
    [0, 1, 1e-10],
  ] as const) {
    const curve: IAutoMoviePlanarCurveSource = source(origin, width, height);
    const beforeJet: Readonly<AutoMovieVector2Tuple> = curve.derivative(
      curve.breaks[0]!,
      2,
    );
    const fitted: IAutoMovieConicApproximation.IResult = approximate(curve, {
      toleranceMm: 0.001,
      maximumArcs: 128,
      maximumDepth: 12,
    });
    TestValidator.equals(
      "preprocessed inflection complete",
      fitted.status,
      "complete",
    );
    TestValidator.predicate(
      "finite positive conics",
      fitted.arcs.length >= 2 &&
        fitted.arcs.every(
          (arc: IAutoMovieRegisteredConicArc): boolean =>
            Number.isFinite(arc.weight) && arc.weight > 0,
        ),
    );
    let previous: number = origin;
    for (const arc of fitted.arcs) {
      TestValidator.predicate(
        "no missing source interval",
        nclose(arc.domain[0], previous, 0),
      );
      TestValidator.predicate(
        "does not cross inflection",
        arc.domain[1] <= curve.breaks[0]! || arc.domain[0] >= curve.breaks[0]!,
      );
      previous = arc.domain[1];
    }
    TestValidator.predicate(
      "covers full original domain",
      nclose(previous, origin + width, 0),
    );
    const afterJet: Readonly<AutoMovieVector2Tuple> = curve.derivative(
      curve.breaks[0]!,
      2,
    );
    TestValidator.predicate(
      "source second jet unchanged",
      nclose(beforeJet[0], afterJet[0], 0) &&
        nclose(beforeJet[1], afterJet[1], 0),
    );
    TestValidator.equals("sampled fit not certified", fitted.certified, false);
  }

  const arch: IAutoMovieCubicCriticalParameters = C.cubicCriticalParameters([
    [-2 / 3, 1 / 2],
    [-2 / 3, -1 / 6],
    [2 / 3, -1 / 6],
    [2 / 3, 1 / 2],
  ]);
  TestValidator.equals("arch regular curvature", arch.zeroCurvature.length, 0);
  TestValidator.predicate(
    "arch affine extremum",
    arch.affineCritical.some((t: number): boolean => nclose(t, 0.5, 1e-12)),
  );
  const cusp: IAutoMovieCubicCriticalParameters = C.cubicCriticalParameters([
    [-1 / 24, 1 / 8],
    [1 / 24, -1 / 24],
    [-1 / 24, -1 / 24],
    [1 / 24, 1 / 8],
  ]);
  TestValidator.predicate(
    "double curvature root retained",
    cusp.zeroCurvature.some((t: number): boolean => nclose(t, 0.5, 1e-12)),
  );
  TestValidator.predicate(
    "stationary velocity root retained",
    cusp.stationary.some((t: number): boolean => nclose(t, 0.5, 1e-12)),
  );
  const line: IAutoMovieCubicCriticalParameters = C.cubicCriticalParameters([
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 3],
  ]);
  TestValidator.equals("line curvature continuum", line.collinear, true);
  TestValidator.equals(
    "line no isolated curvature roots",
    line.zeroCurvature.length,
    0,
  );
  TestValidator.equals("line no stationary source", line.stationary.length, 0);
  const constant: IAutoMovieCubicCriticalParameters = C.cubicCriticalParameters(
    [
      [2, 3],
      [2, 3],
      [2, 3],
      [2, 3],
    ],
  );
  TestValidator.equals(
    "constant no fabricated isolated roots",
    constant.breaks.length,
    0,
  );
  TestValidator.predicate(
    "constant continuum explained",
    constant.diagnostics.some((s: string): boolean =>
      s.includes("every parameter is stationary"),
    ),
  );

  /** Map all four coefficients without changing parameterization. */
  const transform: (
    point: Readonly<AutoMovieVector2Tuple>,
    mode: number,
  ) => Readonly<AutoMovieVector2Tuple> = (
    point: Readonly<AutoMovieVector2Tuple>,
    mode: number,
  ): Readonly<AutoMovieVector2Tuple> =>
    mode === 0
      ? [-point[1] + 2000, point[0] - 1000]
      : mode === 1
        ? [5 * point[0], 5 * point[1]]
        : [point[0], -point[1]];
  for (const mode of [0, 1, 2]) {
    const transformed: IAutoMovieCubicCriticalParameters =
      C.cubicCriticalParameters([
        transform(controls[0], mode),
        transform(controls[1], mode),
        transform(controls[2], mode),
        transform(controls[3], mode),
      ]);
    TestValidator.predicate(
      "critical root frame invariance",
      transformed.zeroCurvature.some((t: number): boolean =>
        nclose(t, alpha, 1e-10),
      ),
    );
    TestValidator.predicate(
      "critical candidates interior finite sorted",
      transformed.breaks.every(
        (t: number, i: number): boolean =>
          Number.isFinite(t) &&
          t > 0 &&
          t < 1 &&
          (i === 0 || t > transformed.breaks[i - 1]!),
      ),
    );
  }
  let refused: boolean = false;
  try {
    C.cubicCriticalParameters([
      [0, 0],
      [1, 1],
      [2, 2],
      [Infinity, 3],
    ]);
  } catch (error) {
    refused = error instanceof RangeError;
  }
  TestValidator.predicate("nonfinite controls refuse", refused);
  TestValidator.equals(
    "source controls unchanged",
    JSON.stringify(controls),
    before,
  );
}
