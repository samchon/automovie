import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/** Data and callback contracts shared by the EvaluateCurve64 operations. */
export namespace IAutoMovieEvaluateCurve64 {
  /**
   * Evaluate a millimetre primitive in its declared phase chart. Piecewise
   * derivatives are divided by the selected positive phase width; analytic oval
   * derivatives are per turn. Interior seams choose the following piece, and
   * the final endpoint chooses the final piece at local t=1.
   */
  export type IResult = {
    /** Position in the primitive's millimetre chart. */
    point: Readonly<AutoMovieVector3Tuple>;

    /** Millimetres per declared phase unit; no unit normalization is applied. */
    tangentPerParameter: Readonly<AutoMovieVector3Tuple>;
  };
}
