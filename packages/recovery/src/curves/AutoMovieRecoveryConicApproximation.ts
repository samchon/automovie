import { GhoshConicApproximationBalance as GhoshConicApproximationBalanceImplementation } from "./internal/GhoshConicApproximationBalance";
import { GhoshConicApproximationDisplacement as GhoshConicApproximationDisplacementImplementation } from "./internal/GhoshConicApproximationDisplacement";

import { approximateAutoMovieRecoveryConicsAhn as approximateAutoMovieRecoveryConicsAhnImplementation } from "./internal/approximateAutoMovieRecoveryConicsAhn";
import { approximateAutoMovieRecoveryConicsGhosh as approximateAutoMovieRecoveryConicsGhoshImplementation } from "./internal/approximateAutoMovieRecoveryConicsGhosh";

import { type AutoMovieVector2Tuple, type IAutoMovieConicApproximation, type IAutoMovieCubicCriticalParameters, type IAutoMoviePlanarCurveSource, type IAutoMovieRegisteredConicArc, type IAutoMovieGhoshConicApproximationBalance, type IAutoMovieGhoshConicApproximationDisplacement } from "@automovie/interface";

import { findAutoMovieRecoveryCubicCriticalParameters } from "./internal/findAutoMovieRecoveryCubicCriticalParameters";

/**
 * Shared planar, millimetre-valued contract for experimental conic recovery.
 * Rational quadratics use endpoint weights one and a positive middle weight; a
 * collinear control triple with weight one is the admitted line primitive. The
 * contract does not imply a Hausdorff certificate or a globally minimal net.
 */
export namespace AutoMovieRecoveryConicApproximation {
  /**
   * Observe cubic critical parameters without changing its points or jets. The
   * four planar Bernstein controls define normalized t in [0,1]; the caller
   * maps interior candidates to its source chart and reports unrepresentable
   * mapped intervals. Close distinct roots are not merged by an epsilon.
   */
  export function cubicCriticalParameters(
    controls: readonly [
      Readonly<AutoMovieVector2Tuple>,
      Readonly<AutoMovieVector2Tuple>,
      Readonly<AutoMovieVector2Tuple>,
      Readonly<AutoMovieVector2Tuple>,
    ],
  ): IAutoMovieCubicCriticalParameters {
    return findAutoMovieRecoveryCubicCriticalParameters(controls);
  }

  /** Evaluate positive-weight rational Bernstein coefficients on [0,1]. */
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

  /** Euclidean separation in millimetres between two same-frame points. */
  export function distance(
    a: Readonly<AutoMovieVector2Tuple>,
    b: Readonly<AutoMovieVector2Tuple>,
  ): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  }

  /** Signed planar determinant, used for orientation and tangent intersection. */
  export function cross(
    a: Readonly<AutoMovieVector2Tuple>,
    b: Readonly<AutoMovieVector2Tuple>,
  ): number {
    return a[0] * b[1] - a[1] * b[0];
  }

  /** Admit a finite source chart and positive explicit numerical budgets. */
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
        (t: number): boolean => t <= curve.domain.start || t >= curve.domain.end,
      )
    )
      errors.push(
        "Every supplied break must be finite and strictly inside the source domain.",
      );
    if (options.toleranceMm <= 0)
      errors.push("toleranceMm must be finite and positive.");
    if (
      options.maximumArcs < 1 ||
      options.maximumDepth < 1 ||
      options.maximumDepth > 52
    )
      errors.push(
        "Budgets must be positive safe integers; maximumDepth must not exceed binary64's 52-bit subdivision precision.",
      );
    return errors;
  }

  /**
   * Construct G1 bitangent conics using Ahn's control-triangle subdivision
   * scheme.
   *
   * Basis: Y. J. Ahn, Conic approximation of planar curves, CAD 33 (2001),
   * 867-872, doi:10.1016/S0010-4485(00)00110-X. The public primary abstract and
   * section preview establish endpoint tangent interpolation, positive fullness
   * factor and subdivision into a containing tangent triangle. The inaccessible
   * characterization theorem and its specific error function are NOT reproduced.
   * This explicitly labelled adaptation minimizes a sampled radial-correspondence
   * maximum distance instead: each source point and conic point lie on the same
   * ray from the tangent intersection. Its signed displacement increases with the
   * weight, so bisection balances positive and negative extreme discrepancies.
   *
   * Samples at odd 1/32 intervals validate weights fitted on even intervals.
   * Their distance is an observable discrepancy, never a continuous Hausdorff
   * bound. A complete result only covers the supplied chart within this sampled
   * criterion. Inflections and inadmissible triangles cause bisection; exhausted
   * budgets omit unresolved intervals and return partial. Finite straight charts
   * admit an explicit collinear quadratic, the conic's degenerate case: exactly
   * collinear to roundoff, or, where the control triangle refuses a chart whose
   * curvature keeps its sign, when its samples advance along its chord within
   * toleranceMm of it (a bend below its coordinates' roundoff, between close
   * inflections, refused at every depth otherwise). Such a primitive's end
   * tangents are its chord's, so G1 holds there only to that tolerance's bend.
   * Source callbacks are borrowed and must be deterministic; callback failures or
   * nonfinite data refuse the whole call. Incident endpoint jets request exact
   * right/left limits so supplied breaks preserve genuine source corners without
   * finite-difference displacements.
   */
  export function approximateAhn(curve: IAutoMoviePlanarCurveSource, options: IAutoMovieConicApproximation.IOptions): IAutoMovieConicApproximation.IResult {
    return approximateAutoMovieRecoveryConicsAhnImplementation(curve, options);
  }

  /**
   * Numerically reproduce the endpoint-bitangent equioscillation construction of
   * Ghosh, Petitjean and Vegter, Approximation by Conic Splines (2007), sections
   * 3.2–3.4 and 6, DOI 10.1007/s11786-007-0004-8.
   *
   * Source breaks are hard boundaries: piecewise Hermite input does not acquire
   * the paper's smoothness merely by supplying derivatives. On each smooth chart
   * we sample nonzero curvature and monotone affine curvature, construct the
   * endpoint triple-contact limits of the positive-weight bitangent family, and
   * bisect its weight until refined positive and negative normal extrema balance.
   * Located extrema are exchanged into the fitting nodes; independent held-out
   * nodes then validate the selected coefficient rather than driving its fit.
   * Endpoint bisection then selects an interval meeting the requested tolerance.
   * Unlike the paper's symbolic implementation, this experiment uses finite
   * admission/extremum samples, so neither Hausdorff certification nor global
   * minimum arc count is claimed. Collinear charts are an explicit line
   * extension. A zero-curvature chart endpoint uses the compactified
   * infinite-weight limit only to bracket finite positive weights. This is an
   * explicit numerical boundary extension, not a proof that the paper's theorem
   * admits that endpoint. Source callback failures refuse the whole call and
   * discard all coefficients; sampled mathematical admission failures may leave
   * explicitly partial coverage.
   */
  export function approximateGhosh(curve: IAutoMoviePlanarCurveSource, options: IAutoMovieConicApproximation.IOptions): IAutoMovieConicApproximation.IResult {
    return approximateAutoMovieRecoveryConicsGhoshImplementation(curve, options);
  }

  /**
   * Balance a bitangent conic's signed normal extrema with numerical exchange.
   * Initial source nodes bracket witnessed displacement peaks. Golden-section
   * refinement locates each such peak between nodes, then its source coordinate
   * joins the coefficient bisection and the two signed lobes are rebalanced. This
   * implements the extrema/equioscillation criterion of Ghosh et al. (2007),
   * sections 3.2–3.3 and 6, without treating a fixed grid maximum as a supremum.
   *
   * The returned tuple is [rho, refined maximum displacement in millimetres].
   * Finite peak brackets still do not certify that an arbitrary callback has no
   * unwitnessed extrema; exhausted exchange or an invalid normal returns absent.
   * Source endpoints have displacement zero by exact endpoint interpolation.
   */
  export function balanceGhoshApproximation(sample: Parameters<IAutoMovieGhoshConicApproximationBalance.Operation>[0], domain: Parameters<IAutoMovieGhoshConicApproximationBalance.Operation>[1], bounds: Parameters<IAutoMovieGhoshConicApproximationBalance.Operation>[2], maximumExchanges: Parameters<IAutoMovieGhoshConicApproximationBalance.Operation>[3], roundoffMm: Parameters<IAutoMovieGhoshConicApproximationBalance.Operation>[4]): ReturnType<IAutoMovieGhoshConicApproximationBalance.Operation> {
    return GhoshConicApproximationBalanceImplementation(sample, domain, bounds, maximumExchanges, roundoffMm);
  }

  /**
   * Intersect a Euclidean unit normal with a compactified bitangent conic family.
   * The barycentric point and normal use the endpoint tangent triangle; normal
   * coordinates have inverse-millimetre units. For rho=w/(1+w), the implicit
   * conic is (1-rho)^2_l1^2-4_rho^2_l0_l2=0. At rho=1 this is the union of the
   * triangle's two tangent edges, used only as a boundary search limit.
   *
   * A finite normal displacement is returned only for a unique intersection in
   * the positive tangent triangle. Two distinct valid roots remain unsupported; a
   * double algebraic root is one geometric intersection. No shape is emitted.
   */
  export function displaceGhoshApproximation(coordinate: Parameters<IAutoMovieGhoshConicApproximationDisplacement.Operation>[0], rho: Parameters<IAutoMovieGhoshConicApproximationDisplacement.Operation>[1]): ReturnType<IAutoMovieGhoshConicApproximationDisplacement.Operation> {
    return GhoshConicApproximationDisplacementImplementation(coordinate, rho);
  }
}
