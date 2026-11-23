import type { IAutoMovieRegisteredConicArc } from "./IAutoMovieRegisteredConicArc";

/**
 * Shared planar, millimetre-valued contract for experimental conic recovery.
 * Rational quadratics use endpoint weights one and a positive middle weight; a
 * collinear control triple with weight one is the admitted line primitive. The
 * contract does not imply a Hausdorff certificate or a globally minimal net.
 */

export namespace IAutoMovieConicApproximation {
  /** Physical fit tolerance and explicit work limits, with no implicit defaults. */
  export interface IOptions {
    /** Requested sampled geometric tolerance, in millimetres. */
    toleranceMm: number;

    /** Maximum accepted and unresolved leaf intervals in the resulting net. */
    maximumArcs: number;

    /** Maximum bisection depth per supplied source interval. */
    maximumDepth: number;
  }

  /**
   * Fitted coefficients and explicit limits of the supporting evidence. Partial
   * results may omit unresolved intervals and must not be mistaken for a
   * complete reconstruction; refused results have no admitted coefficients.
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
