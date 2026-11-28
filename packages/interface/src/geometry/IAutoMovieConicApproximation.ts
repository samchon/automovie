import type { IAutoMovieRegisteredConicArc } from "./IAutoMovieRegisteredConicArc";

/**
 * Work limits and results for planar conic fitting in millimetres. Each arc
 * uses endpoint weights of one and a positive middle weight. Collinear controls
 * with a middle weight of one represent a line.
 */
export namespace IAutoMovieConicApproximation {
  /** Required sampled fit tolerance and subdivision limits. */
  export interface IOptions {
    /** Requested sampled geometric tolerance, in millimetres. */
    toleranceMm: number;

    /** Maximum accepted and unresolved leaf intervals in the resulting net. */
    maximumArcs: number;

    /** Maximum bisection depth per supplied source interval. */
    maximumDepth: number;
  }

  /**
   * Outcome of fitting the supplied source intervals. A partial result carries
   * only the admitted arcs. A refusal carries diagnostics and an empty arc
   * list.
   */
  export type IResult = IFitted | IRefused;

  /** Observations retained for every outcome. */
  export interface IObservation {
    /** Algorithm or adaptation that performed the fit. */
    method: string;

    /** Admission failures, unresolved intervals and method qualifications. */
    diagnostics: readonly string[];

    /** Number of source evaluation and derivative calls. */
    queries: number;
  }

  /** Fitted arcs for all or part of the supplied source domain. */
  export interface IFitted extends IObservation {
    /** `complete` covers the domain. `partial` omits unresolved intervals. */
    status: "complete" | "partial";

    /** Arc coefficients in source interval order. */
    arcs: readonly IAutoMovieRegisteredConicArc[];

    /** Maximum sampled error of the admitted arcs in millimetres. */
    maximumSampleErrorMm: number;

    /** True only when the method proves a continuous error bound. */
    certified: boolean;
  }

  /** The method admitted no arc coefficients. */
  export interface IRefused extends IObservation {
    /** The method refused the input or could not retain any arcs. */
    status: "refused";

    /** Empty arc list. */
    arcs: readonly [];

    /** Sentinel value for a result without measured arc errors. */
    maximumSampleErrorMm: 0;

    /** A refusal carries no continuous fit certificate. */
    certified: false;
  }
}
