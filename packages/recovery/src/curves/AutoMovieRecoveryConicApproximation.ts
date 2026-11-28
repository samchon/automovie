import {
  type AutoMovieVector2Tuple,
  type IAutoMovieConicApproximation,
  type IAutoMovieCubicCriticalParameters,
  type IAutoMovieGhoshConicApproximationBalance,
  type IAutoMovieGhoshConicApproximationDisplacement,
  type IAutoMoviePlanarCurveSource,
  type IAutoMovieRegisteredConicArc,
} from "@automovie/interface";

import { GhoshConicApproximationBalance as GhoshConicApproximationBalanceImplementation } from "./internal/GhoshConicApproximationBalance";
import { GhoshConicApproximationDisplacement as GhoshConicApproximationDisplacementImplementation } from "./internal/GhoshConicApproximationDisplacement";
import { approximateRecoveryConicsAhn as approximateRecoveryConicsAhnImplementation } from "./internal/approximateRecoveryConicsAhn";
import { approximateRecoveryConicsGhosh as approximateRecoveryConicsGhoshImplementation } from "./internal/approximateRecoveryConicsGhosh";
import { findRecoveryCubicCriticalParameters } from "./internal/findRecoveryCubicCriticalParameters";

/** Fits positive-weight planar rational quadratics to registered source curves. */
export namespace AutoMovieRecoveryConicApproximation {
  /**
   * Finds critical parameters of four planar Bernstein controls on normalized
   * [0, 1].
   *
   * The returned candidates describe interior stationary, zero-curvature and
   * affine-curvature events. Distinct close roots retain their identities. The
   * caller maps candidates back to its source chart.
   */
  export function cubicCriticalParameters(
    controls: readonly [
      Readonly<AutoMovieVector2Tuple>,
      Readonly<AutoMovieVector2Tuple>,
      Readonly<AutoMovieVector2Tuple>,
      Readonly<AutoMovieVector2Tuple>,
    ],
  ): IAutoMovieCubicCriticalParameters {
    return findRecoveryCubicCriticalParameters(controls);
  }

  /**
   * Evaluates saved positive-weight rational Bernstein controls in the
   * millimetre plane. Supply a normalized parameter in [0, 1]. The two endpoint
   * weights are one.
   */
  export function evaluate(
    arc: IAutoMovieRegisteredConicArc,
    u: number,
  ): Readonly<AutoMovieVector2Tuple> {
    const a: number = (1 - u) ** 2;
    const b: number = 2 * arc.weight * u * (1 - u);
    const c: number = u * u;
    const denominator: number = a + b + c;
    return [
      (a * arc.controls[0][0] +
        b * arc.controls[1][0] +
        c * arc.controls[2][0]) /
        denominator,
      (a * arc.controls[0][1] +
        b * arc.controls[1][1] +
        c * arc.controls[2][1]) /
        denominator,
    ];
  }

  /**
   * Returns Euclidean distance in millimetres between two points in the same
   * planar frame.
   */
  export function distance(
    a: Readonly<AutoMovieVector2Tuple>,
    b: Readonly<AutoMovieVector2Tuple>,
  ): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  }

  /**
   * Returns the signed determinant of two planar vectors. Positive sign records
   * a counter-clockwise turn from the first vector to the second.
   */
  export function cross(
    a: Readonly<AutoMovieVector2Tuple>,
    b: Readonly<AutoMovieVector2Tuple>,
  ): number {
    return a[0] * b[1] - a[1] * b[0];
  }

  /**
   * Checks the finite increasing source chart and the requested work policy
   * before sampling.
   *
   * Breaks lie strictly inside the chart. Tolerance is finite and positive in
   * millimetres. Arc and depth limits are positive safe integers, with depth at
   * most 52. The result lists violated conditions in evaluation order.
   */
  export function validate(
    curve: IAutoMoviePlanarCurveSource,
    options: IAutoMovieConicApproximation.IOptions,
  ): string[] {
    const errors: string[] = [];
    if (
      !Number.isFinite(curve.domain.start) ||
      !Number.isFinite(curve.domain.end) ||
      curve.domain.start >= curve.domain.end
    )
      errors.push("Source domain must be finite and strictly increasing.");
    if (
      curve.breaks.some(
        (t: number): boolean =>
          !Number.isFinite(t) ||
          t <= curve.domain.start ||
          t >= curve.domain.end,
      )
    )
      errors.push(
        "Every supplied break must be finite and strictly inside the source domain.",
      );
    if (!Number.isFinite(options.toleranceMm) || options.toleranceMm <= 0)
      errors.push("toleranceMm must be finite and positive.");
    if (
      !Number.isSafeInteger(options.maximumArcs) ||
      options.maximumArcs < 1 ||
      !Number.isSafeInteger(options.maximumDepth) ||
      options.maximumDepth < 1 ||
      options.maximumDepth > 52
    )
      errors.push(
        "Budgets must be positive safe integers; maximumDepth must not exceed binary64's 52-bit subdivision precision.",
      );
    return errors;
  }

  /**
   * Fits tangent-aligned conics using a sampled radial-displacement criterion.
   *
   * Supply deterministic source callbacks and exact left and right endpoint
   * jets at breaks. The solver subdivides around inflections and inadmissible
   * tangent triangles. A compatible near-flat chart can use a line under the
   * sampled tolerance. Complete covers the supplied chart at the sampled
   * criterion, and exhausted work leaves explicit omitted intervals. Invalid
   * source data or callback failure refuses the call without arcs.
   */
  export function approximateAhn(
    curve: IAutoMoviePlanarCurveSource,
    options: IAutoMovieConicApproximation.IOptions,
  ): IAutoMovieConicApproximation.IResult {
    return approximateRecoveryConicsAhnImplementation(curve, options);
  }

  /**
   * Fits bitangent conics using sampled equal signed normal extrema.
   *
   * Supply deterministic source observations and explicit smooth-chart
   * boundaries. The solver brackets weight limits, exchanges measured extrema
   * into the fit and checks independently held-out observations. It can extend
   * to a collinear chart with a line. Complete describes the sampled criterion.
   * Unresolved intervals leave a partial result when some arcs qualify. A
   * nonfinite source observation or callback failure refuses the call without
   * arcs.
   */
  export function approximateGhosh(
    curve: IAutoMoviePlanarCurveSource,
    options: IAutoMovieConicApproximation.IOptions,
  ): IAutoMovieConicApproximation.IResult {
    return approximateRecoveryConicsGhoshImplementation(curve, options);
  }

  /**
   * Balances sampled normal displacement extrema within the supplied weight
   * bracket.
   *
   * The returned pair is compactified weight and refined maximum displacement
   * in millimetres. The finite exchange limit bounds peak-refinement rounds. An
   * invalid normal or unresolved exchange returns undefined.
   */
  export function balanceGhoshApproximation(
    sample: Parameters<IAutoMovieGhoshConicApproximationBalance.Operation>[0],
    domain: Parameters<IAutoMovieGhoshConicApproximationBalance.Operation>[1],
    bounds: Parameters<IAutoMovieGhoshConicApproximationBalance.Operation>[2],
    maximumExchanges: Parameters<IAutoMovieGhoshConicApproximationBalance.Operation>[3],
    roundoffMm: Parameters<IAutoMovieGhoshConicApproximationBalance.Operation>[4],
  ): ReturnType<IAutoMovieGhoshConicApproximationBalance.Operation> {
    return GhoshConicApproximationBalanceImplementation(
      sample,
      domain,
      bounds,
      maximumExchanges,
      roundoffMm,
    );
  }

  /**
   * Measures a unique normal intersection with a compactified bitangent conic.
   *
   * The barycentric point and normal belong to the tangent triangle. The normal
   * coordinates have inverse-millimetre units. Compactified weight rho equal to
   * one selects the limit along the triangle edges. A unique qualified
   * intersection returns signed millimetre displacement. Multiple qualified
   * roots or an invalid intersection return undefined.
   */
  export function displaceGhoshApproximation(
    coordinate: Parameters<IAutoMovieGhoshConicApproximationDisplacement.Operation>[0],
    rho: Parameters<IAutoMovieGhoshConicApproximationDisplacement.Operation>[1],
  ): ReturnType<IAutoMovieGhoshConicApproximationDisplacement.Operation> {
    return GhoshConicApproximationDisplacementImplementation(coordinate, rho);
  }
}
