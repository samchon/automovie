/** Left and right values of one bilateral item, each specified independently.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Left and right values of one bilateral item, each specified independently.
 * @evidence contracts/development/design.md#principled-representation `left`: Value on the left side. `right`: Value on the right side.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanPair is the canonical exchange used by IAutoMovieHumanPairSchema, IAutoMovieHumanAppearance, IAutoMovieHumanBodyIdentity, IAutoMovieHumanExtremityDimensions.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `left`, `right`; callers supply the complete record.
 */
export interface IAutoMovieHumanPair<T> {
  /** Value on the left side. */
  left: T;

  /** Value on the right side. */
  right: T;
}
