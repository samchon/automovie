import type { IAutoMovieContourLoftCurves64 } from "./IAutoMovieContourLoftCurves64";

/** Closed-curve sampling outcome, including construction retained after refusal. */
export namespace IAutoMovieSampleContourRing64 {
  /**
   * Samples of one declared closed polynomial with any local refusal preserved.
   * An admitted curve retains its exact name and complete phase period. A
   * failed millimetre cubic retains its actual dense finite first endpoint as
   * construction only; an absent or untrusted physical endpoint produces empty
   * construction. Failed metadata is never evaluated again to obtain a period
   * or geometry.
   */
  export type IResult = {
    /**
     * Original string curve name, or the empty string when metadata supplies no
     * string. It is not generated from geometry.
     */
    name: string;

    /**
     * Sampled source restrictions in millimetres. A tessellation refusal
     * returns one copied trusted first endpoint at phase zero, or an empty
     * array; these are construction only. Rank refusal may retain the full
     * sampled array.
     */
    knots: IAutoMovieContourLoftCurves64.Knot[];

    /**
     * Sum of admitted phaseIntervals in the curve's declared phase unit. Zero
     * after tessellation refusal, without consulting invalid phase metadata
     * again.
     */
    period: number;

    /**
     * Local representation or sampled-rank failure. Absent only when sampling
     * and noncollapsed two-dimensional boundary checks pass; absence is no
     * embedding certificate.
     */
    unsupported?: string;
  };
}
