import type { IAutoMovieRegisteredPlanarCurvePiece } from "./IAutoMovieRegisteredPlanarCurvePiece";

/**
 * Choices and sampled coverage receipts for bounded planar coefficient
 * reduction.
 */

export namespace IAutoMovieCompactCurveApproximation {
  /**
   * Sampled error tolerance, candidate degree and bounded subdivision work for
   * planar curve reduction.
   *
   * The fitter subdivides within mandatory smooth chart boundaries. Source
   * observation knots increase sampling coverage inside those charts.
   */
  export interface IOptions {
    /**
     * Positive finite threshold in millimetres for admitted held-out
     * source-to-fit correspondence.
     */
    toleranceMm: number;

    /**
     * Fix polynomial degree at three, four or five, or compare those choices
     * with bitangent conics using mixed.
     */
    degree: 3 | 4 | 5 | "mixed";

    /** Positive safe-integer budget for accepted pieces and unresolved leaves. */
    maximumPieces: number;

    /**
     * Positive safe-integer limit through 52 on binary subdivision depth in an
     * initial smooth chart.
     */
    maximumDepth: number;

    /**
     * Positive safe-integer budget for source position and derivative
     * invocations, including nested conic fitting.
     */
    maximumQueries: number;
  }

  /**
   * Sample-qualified reduction receipt with coverage status, accepted pieces
   * and measured work and error.
   *
   * A finite observation grid can miss continuous error or topology changes.
   * Read status together with diagnostic messages and the fixed certification
   * marker.
   */
  export interface IResult {
    /**
     * Sampled coverage state. Complete covers the requested chart domain,
     * partial retains some covering pieces, and refused transfers no pieces.
     */
    status: "complete" | "partial" | "refused";

    /**
     * Admitted registered pieces in increasing source order. Omitted intervals
     * have no fabricated replacement.
     */
    pieces: readonly IAutoMovieRegisteredPlanarCurvePiece[];

    /**
     * Largest measured sample discrepancy over retained pieces in millimetres.
     * An empty result reports zero.
     */
    maximumSampleErrorMm: number;

    /**
     * Scalar storage measure with two coordinates per control and three
     * metadata scalars per piece. Exactly shared adjacent endpoints count
     * once.
     */
    storedScalars: number;

    /**
     * Actual number of position and derivative callback invocations. Cached
     * position reads avoid a repeat charge.
     */
    queries: number;

    /**
     * Ordered messages describing sampled scope, input refusals and reasons for
     * unprocessed geometry.
     */
    diagnostics: readonly string[];

    /**
     * Fixed false marker for the sampled qualification. Continuous error needs
     * its own certificate.
     */
    certified: false;
  }
}
