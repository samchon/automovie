import type { IAutoMovieContourLoftCurves64 } from "./IAutoMovieContourLoftCurves64";

/** Closed-curve sampling outcome, including construction retained after refusal. */
export namespace IAutoMovieSampleContourRing64 {
  /**
   * Samples of one closed cubic with its local refusal, if any. The accepted
   * path gives the declared name and phase period. On tessellation failure the
   * fallback copies a dense first endpoint of a millimetre cubic for
   * construction only, if one is available. Supply finite source coordinates.
   */
  export type IResult = {
    /**
     * Original string curve name, or the empty string when metadata supplies no
     * string. It is not generated from geometry.
     */
    name: string;

    /**
     * Sampled source restrictions in millimetres. A tessellation refusal
     * returns one copied first endpoint at phase zero, or an empty array; these
     * are construction only. Rank refusal may retain the full sampled array.
     */
    knots: IAutoMovieContourLoftCurves64.Knot[];

    /**
     * Sum of admitted phaseIntervals in the curve's declared phase unit. Zero
     * after tessellation refusal, without consulting invalid phase metadata
     * again.
     */
    period: number;

    /**
     * Local representation or sampled-rank failure. Absence means the sampled
     * boundary passed those checks. Embedding requires its own qualification.
     */
    unsupported?: string;
  };
}
