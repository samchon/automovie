import type { IAutoMovieConicFieldJet } from "./IAutoMovieConicFieldJet";
import type { IAutoMoviePolarSector } from "./IAutoMoviePolarSector";

/**
 * Data and callback contracts shared by the ConicArcField operations.
 *
 * @evidence contracts/development/design.md#principled-representation Geometry separates source-length positions from dimensionless tangent directions; reading/failure discriminants preserve required source Hessians and radial phase jets.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ConicArcField and native section readers use the same interface records for numeric and differentiated conic evaluation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unavailable derivative orders stay failures; numeric finiteness and source admission are checked by the engine, not by generic T.
 * @evidence contracts/development/common.md#meaningful-documentation Documents point and tangent derivative layouts, curvature and named failure.
 */
export namespace IAutoMovieConicArcField {
  /**
   * Cartesian point and increasing-polar unit tangent in one quarter chart.
   *
   * @evidence contracts/development/design.md#principled-representation The normalized positive native velocity fixes orientation independently of its speed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two pairs separate position from unit direction.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Higher source tangent partials are internal algebra outputs, not required physical derivatives.
   * @evidence contracts/development/common.md#meaningful-documentation Point uses source length units; tangent is dimensionless.
   */
  export interface IGeometry<T> {
    /** Cartesian point, in the selected quarter chart. */
    point: readonly [T, T];

    /** Unit tangent in increasing original polar direction. */
    tangent: readonly [T, T];
  }

  /**
   * Required fixed-clock source jets, paired with the same primal ray geometry.
   *
   * @evidence contracts/development/design.md#principled-representation Only point source order two and unit-tangent source order one feed the geometric radial lift.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One reading exposes the exact derivative orders its consumer needs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Tangent Hessians are neither fabricated as zero nor required finite.
   * @evidence contracts/development/common.md#meaningful-documentation Point entries use [value,s,p,ss,sp,pp]; tangent entries use [value,s,p]; radial uses [rho,rho_phi,rho_phiphi].
   */
  export interface IReading {
    /** Successful source reading discriminator. */
    kind: "reading";

    /** Two Cartesian source Hessians in source length units. */
    point: readonly [
      IAutoMovieConicFieldJet.IJet,
      IAutoMovieConicFieldJet.IJet,
    ];

    /** Two unit-tangent source gradients. */
    tangent: readonly [
      readonly [number, number, number],
      readonly [number, number, number],
    ];

    /** Existing numeric radial phase jet. */
    radial: IAutoMoviePolarSector.Jet;

    /** Natural logarithm of positive geometric curvature, inverse length. */
    logCurvature: number;
  }

  /**
   * Named source-reading failure, never a replacement derivative.
   *
   * @evidence contracts/development/design.md#principled-representation A failed finite-input or required-output premise remains explicit.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One discriminator and detail identify failure.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing derivatives are never silently zeroed or sent to a legacy shape.
   * @evidence contracts/development/common.md#meaningful-documentation Detail names the failed fixed-clock source premise.
   */
  export interface IFailure {
    /** Failed source-reading discriminator. */
    kind: "failure";

    /** Original failed numerical premise. */
    detail: string;
  }
}
