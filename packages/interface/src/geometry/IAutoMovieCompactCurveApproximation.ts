import type { IAutoMovieRegisteredPlanarCurvePiece } from "./IAutoMovieRegisteredPlanarCurvePiece";

/** Planar coefficient-reduction experiment, independent of source meshes. */

export namespace IAutoMovieCompactCurveApproximation {
  /** Error and finite work controls for a fixed-degree or storage-selected fit. */
  export interface IOptions {
    /** Maximum admitted held-out correspondence discrepancy, millimetres. */
    toleranceMm: number;

    /** Mixed admits one conic and polynomial degrees three through five. */
    degree: 3 | 4 | 5 | "mixed";

    /** Maximum accepted plus unresolved leaf pieces. */
    maximumPieces: number;

    /** Maximum binary subdivision depth per initial chart. */
    maximumDepth: number;

    /** Maximum source evaluate/derivative invocations, including conic fitting. */
    maximumQueries: number;
  }

  /** Admitted coefficients, omitted-domain status and explicit evidence scope. */
  export interface IResult {
    /**
     * Whether sampled fitting covered the entire requested domain, only part,
     * or none.
     */
    status: "complete" | "partial" | "refused";

    /**
     * Ordered admitted coefficient records; omitted domains have no fabricated
     * piece.
     */
    pieces: readonly IAutoMovieRegisteredPlanarCurvePiece[];

    /**
     * Maximum sampled discrepancy across retained pieces, millimetres; zero
     * when empty.
     */
    maximumSampleErrorMm: number;

    /**
     * Numeric coefficient/chart count under storedScalars' planar seam-sharing
     * convention.
     */
    storedScalars: number;

    /**
     * Actual source position and derivative callback invocations, including
     * nested conic fitting.
     */
    queries: number;

    /**
     * Representation limitations, numerical admission failures and
     * omitted-domain reasons.
     */
    diagnostics: readonly string[];

    /**
     * Always false: finite fitting/held-out observations are not continuous
     * error certificates.
     */
    certified: false;
  }
}
