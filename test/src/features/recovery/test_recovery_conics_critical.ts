import {
  AutoMovieRecoveryConicApproximation as C,
  approximateAutoMovieRecoveryConicsAhn as approximate,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the six analytic scenarios, parameter mappings and numerical root scope.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public critical-coefficient operation and Ahn producer, then checks actual source coverage, finite positive coefficients and preservation of source jet values.
 * @evidence contracts/development/testing.md#independent-expectations Differentiating (u,(u-1/3)^3) gives D=6(u-1/3); the symmetric arch's derivative symmetry gives an affine critical point at one half; the cusp (v^3/3,v^2/2) has D=-v² and zero velocity at v=0.
 * @evidence contracts/development/testing.md#distinguishing-cases Nondyadic roots expose midpoint-only subdivision; a nonzero parameter origin exposes endpoint residual handling; a repeated root distinguishes velocity failure from regular inflection, and exact lines distinguish a critical continuum from isolated roots.
 * @evidence contracts/development/testing.md#execution-ownership The central runner owns this CPU-only analytic test with no data files, source specimen, fitting benchmark, renderer or process.
 */
export function test_recovery_conics_critical(): void {
  const alpha: number = 1 / 3;
  const controls: readonly [C.Point, C.Point, C.Point, C.Point] = [
    [0, -1 / 27], [1 / 3, 2 / 27], [2 / 3, -4 / 27], [1, 8 / 27],
  ];
  const before: string = JSON.stringify(controls);
  const critical: C.ICubicCriticalParameters = C.cubicCriticalParameters(controls);
  TestValidator.equals("one regular inflection", critical.zeroCurvature.length, 1);
  TestValidator.predicate("nondyadic analytic root", nclose(critical.zeroCurvature[0]!, alpha, 1e-12));
  TestValidator.equals("regular cubic not stationary", critical.stationary.length, 0);

  /** Exact analytic source under an affine parameter chart; no endpoint offset is used. */
  const source: (origin: number, width: number, height: number) => C.ICurve = (
    origin: number,
    width: number,
    height: number,
  ): C.ICurve => ({
    domain: [origin, origin + width],
    breaks: critical.zeroCurvature.map((u: number): number => origin + width * u),
    closed: false,
    evaluate: (t: number): C.Point => {
      const u: number = (t - origin) / width;
      return [u, height * (u - alpha) ** 3];
    },
    derivative: (t: number, order: 1 | 2 | 3 | 4 | 5): C.Point => {
      const u: number = (t - origin) / width;
      return order === 1 ? [1 / width, 3 * height * (u - alpha) ** 2 / width]
        : order === 2 ? [0, 6 * height * (u - alpha) / width ** 2]
          : order === 3 ? [0, 6 * height / width ** 3] : [0, 0];
    },
  });
  for (const [origin, width, height] of [[0, 1, 1], [7, 4, 1], [0, 1, 1e-10]] as const) {
    const curve: C.ICurve = source(origin, width, height);
    const beforeJet: C.Point = curve.derivative(curve.breaks[0]!, 2);
    const fitted: C.IResult = approximate(curve, { toleranceMm: 0.001, maximumArcs: 128, maximumDepth: 12 });
    TestValidator.equals("preprocessed inflection complete", fitted.status, "complete");
    TestValidator.predicate("finite positive conics", fitted.arcs.length >= 2 && fitted.arcs.every((arc: C.IArc): boolean => Number.isFinite(arc.weight) && arc.weight > 0));
    let previous: number = origin;
    for (const arc of fitted.arcs) {
      TestValidator.predicate("no missing source interval", nclose(arc.domain[0], previous, 0));
      TestValidator.predicate("does not cross inflection", arc.domain[1] <= curve.breaks[0]! || arc.domain[0] >= curve.breaks[0]!);
      previous = arc.domain[1];
    }
    TestValidator.predicate("covers full original domain", nclose(previous, origin + width, 0));
    const afterJet: C.Point = curve.derivative(curve.breaks[0]!, 2);
    TestValidator.predicate("source second jet unchanged", nclose(beforeJet[0], afterJet[0], 0) && nclose(beforeJet[1], afterJet[1], 0));
    TestValidator.equals("sampled fit not certified", fitted.certified, false);
  }

  const arch: C.ICubicCriticalParameters = C.cubicCriticalParameters([
    [-2 / 3, 1 / 2], [-2 / 3, -1 / 6], [2 / 3, -1 / 6], [2 / 3, 1 / 2],
  ]);
  TestValidator.equals("arch regular curvature", arch.zeroCurvature.length, 0);
  TestValidator.predicate("arch affine extremum", arch.affineCritical.some((t: number): boolean => nclose(t, 0.5, 1e-12)));
  const cusp: C.ICubicCriticalParameters = C.cubicCriticalParameters([
    [-1 / 24, 1 / 8], [1 / 24, -1 / 24], [-1 / 24, -1 / 24], [1 / 24, 1 / 8],
  ]);
  TestValidator.predicate("double curvature root retained", cusp.zeroCurvature.some((t: number): boolean => nclose(t, 0.5, 1e-12)));
  TestValidator.predicate("stationary velocity root retained", cusp.stationary.some((t: number): boolean => nclose(t, 0.5, 1e-12)));
  const line: C.ICubicCriticalParameters = C.cubicCriticalParameters([[0, 0], [1, 1], [2, 2], [3, 3]]);
  TestValidator.equals("line curvature continuum", line.collinear, true);
  TestValidator.equals("line no isolated curvature roots", line.zeroCurvature.length, 0);
  TestValidator.equals("line no stationary source", line.stationary.length, 0);
  const constant: C.ICubicCriticalParameters = C.cubicCriticalParameters([[2, 3], [2, 3], [2, 3], [2, 3]]);
  TestValidator.equals("constant no fabricated isolated roots", constant.breaks.length, 0);
  TestValidator.predicate("constant continuum explained", constant.diagnostics.some((s: string): boolean => s.includes("every parameter is stationary")));

  /** Map all four coefficients without changing parameterization. */
  const transform: (point: C.Point, mode: number) => C.Point = (point: C.Point, mode: number): C.Point =>
    mode === 0 ? [-point[1] + 2000, point[0] - 1000] : mode === 1 ? [5 * point[0], 5 * point[1]] : [point[0], -point[1]];
  for (const mode of [0, 1, 2]) {
    const transformed: C.ICubicCriticalParameters = C.cubicCriticalParameters([
      transform(controls[0], mode), transform(controls[1], mode), transform(controls[2], mode), transform(controls[3], mode),
    ]);
    TestValidator.predicate("critical root frame invariance", transformed.zeroCurvature.some((t: number): boolean => nclose(t, alpha, 1e-10)));
    TestValidator.predicate("critical candidates interior finite sorted", transformed.breaks.every((t: number, i: number): boolean => Number.isFinite(t) && t > 0 && t < 1 && (i === 0 || t > transformed.breaks[i - 1]!)));
  }
  let refused: boolean = false;
  try { C.cubicCriticalParameters([[0, 0], [1, 1], [2, 2], [Infinity, 3]]); }
  catch (error) { refused = error instanceof RangeError; }
  TestValidator.predicate("nonfinite controls refuse", refused);
  TestValidator.equals("source controls unchanged", JSON.stringify(controls), before);
}
