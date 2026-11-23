import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/** Data and callback contracts shared by the EvaluateBernstein64 operations. */
export namespace IAutoMovieEvaluateBernstein64 {
  /**
   * Evaluate an admitted Bernstein piece at local t in [0,1], returning
   * position in millimetres and its derivative per local t. De Casteljau
   * evaluation preserves the supplied degree; rational coordinates use the
   * quotient rule and hybrid Y uses its independent polynomial degree.
   */
  export type IResult = {
    /** Millimetre position after any rational and hybrid-Y evaluation. */
    point: Readonly<AutoMovieVector3Tuple>;

    /**
     * Millimetres per normalized local t, before any enclosing phase-width
     * division.
     */
    derivative: Readonly<AutoMovieVector3Tuple>;
  };
}
