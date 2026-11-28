import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/** Evaluated geometry in a whole curve's declared phase chart. */
export namespace IAutoMovieEvaluateCurve64 {
  /**
   * Position and derivative at a finite parameter in the curve's closed domain.
   * Piecewise evaluation divides the local derivative by its phase width. An
   * interior seam selects the following piece. The last endpoint uses the last
   * piece at t=1. Analytic ovals operate in turns. An unrepresentable point or
   * phase derivative causes evaluation to fail.
   */
  export type IResult = {
    /** Position in the primitive's millimetre chart. */
    point: Readonly<AutoMovieVector3Tuple>;

    /** Millimetres per declared phase unit; no unit normalization is applied. */
    tangentPerParameter: Readonly<AutoMovieVector3Tuple>;
  };
}
