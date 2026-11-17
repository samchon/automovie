import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * Data and callback contracts shared by the EvaluateBernstein64 operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A Bernstein evaluation returns a millimetre point and derivative per normalized local t, before enclosing phase-width scaling. Position and derivative remain distinct tuples; their presence alone certifies neither regularity nor a valid rational denominator.
 * @evidence contracts/development/design.md#principled-representation A Bernstein evaluation returns a millimetre point and derivative per normalized local t, before enclosing phase-width scaling.
 * @evidence contracts/development/design.md#minimal-and-owned-surface evaluateAutoMovieBernstein64 publishes the common jet used by source-curve evaluators.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Position and derivative remain distinct tuples; their presence alone certifies neither regularity nor a valid rational denominator.
 */
export namespace IAutoMovieEvaluateBernstein64 {
  /**
   * Evaluate an admitted Bernstein piece at local t in [0,1], returning position in millimetres and its derivative per local t. De Casteljau evaluation preserves the supplied degree; rational coordinates use the quotient rule and hybrid Y uses its independent polynomial degree.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A Bernstein evaluation returns a millimetre point and derivative per normalized local t, before enclosing phase-width scaling. Position and derivative remain distinct tuples; their presence alone certifies neither regularity nor a valid rational denominator.
   * @evidence contracts/development/design.md#principled-representation A Bernstein evaluation returns a millimetre point and derivative per normalized local t, before enclosing phase-width scaling.
   * @evidence contracts/development/design.md#minimal-and-owned-surface evaluateAutoMovieBernstein64 publishes the common jet used by source-curve evaluators.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Position and derivative remain distinct tuples; their presence alone certifies neither regularity nor a valid rational denominator.
   */
  export type IResult = {
    /** Millimetre position after any rational and hybrid-Y evaluation. */
    point: Readonly<AutoMovieVector3Tuple>;

    /** Millimetres per normalized local t, before any enclosing phase-width division. */
    derivative: Readonly<AutoMovieVector3Tuple>;
  };
}
