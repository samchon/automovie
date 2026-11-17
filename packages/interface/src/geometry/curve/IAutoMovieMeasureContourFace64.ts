/**
 * Independent source-space and published-space triangle degeneracy measurements.
 *
 * @evidence contracts/development/design.md#principled-representation Two cross-product magnitudes express double area in source mm squared and published m squared.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Contour staging consumes both values to reject faces that fail either finite-positive predicate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Independent arithmetic exposes conversion collapse instead of assuming exact area scaling.
 * @evidence contracts/development/common.md#meaningful-documentation IResult identifies double area, unit conversion order and nonfinite behavior.
 */
export namespace IAutoMovieMeasureContourFace64 {
  /**
   * Cross-product magnitudes used by contour emission to require finite positive
   * area before and after conversion to metres. Each value is twice triangle area.
   * The metre computation converts positions before subtraction, so it is not
   * obtained by scaling the millimetre result and may expose different rounding.
   *
   * @evidence contracts/development/design.md#principled-representation Two squared-length measurements distinguish source millimetres from rendered metres without implying equality after floating-point conversion.
   * @evidence contracts/development/design.md#minimal-and-owned-surface measureAutoMovieContourFace64 supplies both predicates read by generateAutoMovieContourLoft64 before staging a face.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No epsilon or repaired geometry replaces zero or nonfinite arithmetic; the emission caller decides omission.
   * @evidence contracts/development/common.md#meaningful-documentation Explicitly identifies double area, independent arithmetic paths and the caller's finite-positive check.
   */
  export type IResult = {
    /** Length of (q-p) cross (r-p) in mm squared for supplied millimetre vertices; zero, Infinity or NaN remain observable. */
    millimetresSquared: number;

    /** Double area in metres squared after independently multiplying each position by 0.001 before forming edges and their cross product. */
    metresSquared: number;
  };
}
