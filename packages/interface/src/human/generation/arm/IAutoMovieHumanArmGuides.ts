import type { IAutoMovieHumanArmTube } from "./IAutoMovieHumanArmTube";

/** Type contracts exchanged by AutoMovieHumanArmGuides; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanArmGuides {
  /** Result of AutoMovieHumanArmGuides.shape. The normalised section at any walk length.
  @param pieces The spans, proximal to distal.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The normalised section at any walk length.
 * @evidence contracts/development/design.md#principled-representation The normalised section at any walk length. The callable takes s and returns IAutoMovieHumanArmTube.IShape.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanArmGuides.ShapeResult is the canonical exchange used by AutoMovieHumanArmGuides.shape.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanArmGuides.shape for the normalised section at any walk length.
 */
  export type ShapeResult = (s: number) => IAutoMovieHumanArmTube.IShape;
}
