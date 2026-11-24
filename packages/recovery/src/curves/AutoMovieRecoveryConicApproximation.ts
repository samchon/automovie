import type {
  AutoMovieVector2Tuple,
  IAutoMovieConicApproximation,
  IAutoMovieCubicCriticalParameters,
  IAutoMoviePlanarCurveSource,
  IAutoMovieRegisteredConicArc,
} from "@automovie/interface";

import { findAutoMovieRecoveryCubicCriticalParameters } from "./findAutoMovieRecoveryCubicCriticalParameters";

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
    if (curve.domain[0] >= curve.domain[1])
      errors.push("Source domain must be finite and strictly increasing.");
    if (
      curve.breaks.some(
        (t: number): boolean => t <= curve.domain[0] || t >= curve.domain[1],
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
}
