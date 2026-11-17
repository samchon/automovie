/**
 * Calibration inseam and bilateral mean ankle height used to place the crotch. Runtime construction and admission remain with AutoMovieHumanLegCrotchHeight in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes calibration inseam and bilateral mean ankle height used to place the crotch; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Calibration inseam and bilateral mean ankle height used to place the crotch. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanLegCrotchHeight; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing LegCrotchHeight contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanLegCrotchHeight {
  /** What the crotch height is placed from.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the crotch height is placed from.
   * @evidence contracts/development/design.md#principled-representation `inseam`: Inseam, calibration mm: the body control, the specimen's when unknown. `ankleHeight`: Lateral malleolus height, calibration mm: the feet's `ankleHeight` inputs, the mean of the two sides.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanLegCrotchHeight.of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `inseam`, `ankleHeight`; callers supply the complete record.
   */
  export interface IInput {
    /** Inseam, calibration mm: the body control, the specimen's when unknown. */
    inseam: number;

    /** Lateral malleolus height, calibration mm: the feet's `ankleHeight` inputs, the mean of the two sides. */
    ankleHeight: number;
  }
}
