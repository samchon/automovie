import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * Data and callback contracts shared by the EvaluateCurve64 operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A primitive evaluation returns millimetre position and millimetres per declared phase-unit tangent. The tangent is not normalized; closure and regularity are independent of having a finite returned jet.
 * @evidence contracts/development/design.md#principled-representation A primitive evaluation returns millimetre position and millimetres per declared phase-unit tangent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface evaluateAutoMovieCurve64 owns piece selection and derivative scaling for curve consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tangent is not normalized; closure and regularity are independent of having a finite returned jet.
 */
export namespace IAutoMovieEvaluateCurve64 {
  /**
   * Evaluate a millimetre primitive in its declared phase chart. Piecewise derivatives are divided by the selected positive phase width; analytic oval derivatives are per turn. Interior seams choose the following piece, and the final endpoint chooses the final piece at local t=1.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A primitive evaluation returns millimetre position and millimetres per declared phase-unit tangent. The tangent is not normalized; closure and regularity are independent of having a finite returned jet.
   * @evidence contracts/development/design.md#principled-representation A primitive evaluation returns millimetre position and millimetres per declared phase-unit tangent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface evaluateAutoMovieCurve64 owns piece selection and derivative scaling for curve consumers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The tangent is not normalized; closure and regularity are independent of having a finite returned jet.
   */
  export type IResult = {
    /** Position in the primitive's millimetre chart. */
    point: Readonly<AutoMovieVector3Tuple>;

    /** Millimetres per declared phase unit; no unit normalization is applied. */
    tangentPerParameter: Readonly<AutoMovieVector3Tuple>;
  };
}
