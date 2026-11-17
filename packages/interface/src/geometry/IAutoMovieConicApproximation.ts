import type { IAutoMovieRegisteredConicArc } from "./IAutoMovieRegisteredConicArc";

/**
 * Shared planar, millimetre-valued contract for experimental conic recovery.
 * Rational quadratics use endpoint weights one and a positive middle weight;
 * a collinear control triple with weight one is the admitted line primitive.
 * The contract does not imply a Hausdorff certificate or a globally minimal net.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States units, coefficient normalization, line representation and the limits of reported evidence.
 * @evidence contracts/development/design.md#principled-representation Readonly planar tuples and explicit domains represent source charts and conic coefficients; finite values, positive weights and ordered domains require runtime admission.
 * @evidence contracts/development/design.md#minimal-and-owned-surface approximateAutoMovieRecoveryCompactCurves, approximateAutoMovieRecoveryConicsAhn, approximateAutoMovieRecoveryConicsGhosh share IAutoMovieConicApproximation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No specimen, source artifact, rendering option or optional algorithm-specific state enters this planar contract.
 */

export namespace IAutoMovieConicApproximation {
  /** Physical fit tolerance and explicit work limits, with no implicit defaults.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes physical tolerance from arc and subdivision budgets.
   * @evidence contracts/development/design.md#principled-representation Positive finite tolerance and positive integer budgets require admission; reaching a budget returns partial evidence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The caller supplies the three controls needed to bound adaptive approximation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No specimen-dependent preset or hidden quality option is exposed.
   */
  export interface IOptions {
    /** Requested sampled geometric tolerance, in millimetres. */
    toleranceMm: number;

    /** Maximum accepted and unresolved leaf intervals in the resulting net. */
    maximumArcs: number;

    /** Maximum bisection depth per supplied source interval. */
    maximumDepth: number;
  }

  /** Fitted coefficients and explicit limits of the supporting evidence.
   * Partial results may omit unresolved intervals and must not be mistaken for
   * a complete reconstruction; refused results have no admitted coefficients.
   * @evidence contracts/development/common.md#meaningful-documentation Defines status, omission, certification and query accounting.
   * @evidence contracts/development/design.md#principled-representation The closed status union separates complete, limited and refused operations; runtime logic owns consistency with coefficients.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both experiments report their coefficients and limitations through one recovery result owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Diagnostics preserve unsupported premises rather than hiding them behind an empty successful fit.
   */
  export interface IResult {
    /** Honest algorithm/provenance label, including adaptation where applicable. */
    method: string;

    /** Completeness of admitted source coverage. */
    status: "complete" | "partial" | "refused";

    /** Ordered coefficients; no source samples are retained. */
    arcs: readonly IAutoMovieRegisteredConicArc[];

    /** Admission failures, approximation limits and provenance qualifications. */
    diagnostics: readonly string[];

    /** Maximum of accepted arcs' sampled error; zero for an empty result. */
    maximumSampleErrorMm: number;

    /** True only with a proven continuous error bound, never mere sampling. */
    certified: boolean;

    /** Number of source evaluate/derivative callback invocations. */
    queries: number;
  }
}
