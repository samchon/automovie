import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/** Local-parameter result of Bernstein coefficient evaluation. */
export namespace IAutoMovieEvaluateBernstein64 {
  /**
   * Position and derivative at a finite normalized t from 0 through 1. De
   * Casteljau evaluation uses the admitted piece's degree. Rational coordinates
   * apply the quotient rule. Hybrid Y evaluates its own independent polynomial.
   * Evaluation refuses nonfinite inputs or unresolved output arithmetic.
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
