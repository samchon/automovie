/** Type contracts exchanged by AutoMovieHumanArmGirth; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanArmGirth {
  /** Result of AutoMovieHumanArmGirth.knots. The spans' knots in walk order, a shared boundary knot once.
  @param pieces The spans, proximal to distal.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The spans' knots in walk order, a shared boundary knot once.
 * @evidence contracts/development/design.md#principled-representation The spans' knots in walk order, a shared boundary knot once.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanArmGirth.KnotsResult is the canonical exchange used by AutoMovieHumanArmGirth.knots.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanArmGirth.knots for the spans' knots in walk order, a shared boundary knot once.
 */
  export type KnotsResult = [number, number][];

  /** The list argument of AutoMovieHumanArmGirth.at. The girth at a walk length, held past the first and last knots.
  @param list The knots from {@link knots}.
  @param s Walk length, mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The girth at a walk length, held past the first and last knots.
 * @evidence contracts/development/design.md#principled-representation The girth at a walk length, held past the first and last knots. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanArmGirth.AtList is the canonical exchange used by AutoMovieHumanArmGirth.at.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanArmGirth.at for the girth at a walk length, held past the first and last knots.
 */
  export type AtList = readonly [number, number][];
}
