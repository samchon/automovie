import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/** Type contracts exchanged by AutoMovieHumanHeadNoseBase; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadNoseBase {
  /** What the base reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the base reads.
   * @evidence contracts/development/design.md#principled-representation What the base reads. Pick< IAutoMovieHumanHeadLayout, "subnasale" | "nasion" | "tip" | "noseWidth" | "columella" | "round" > retains the referenced owner's constraints and mutability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadNoseBase.line, AutoMovieHumanHeadNoseBase.floor.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadNoseBase.line, AutoMovieHumanHeadNoseBase.floor for what the base reads.
   */
  export type IInput = Pick<
    IAutoMovieHumanHeadLayout,
    "subnasale" | "nasion" | "tip" | "noseWidth" | "columella" | "round"
  >;

  /** Result of AutoMovieHumanHeadNoseBase.line. Height where the nose's base meets the face, at a distance from the
  midline, and its slope across: the subnasale at the columella, a little
  higher under the alar rims, and level past them. A base that fell away past
  the wing bent its line at 0.3 mm and kept the lobule's tail below it, whose
  cut edge the trim then had to round.
  @param plan The landmark skeleton.
  @param face The prior's face constants (the base's rise).
  @param a Distance of the point from the midline, `|z|`.
  @returns `[height, slope across]`.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Height where the nose's base meets the face, at a distance from the midline, and its slope across: the subnasale at the columella, a little higher under the alar rims, and level past them.
 * @evidence contracts/development/design.md#principled-representation Height where the nose's base meets the face, at a distance from the midline, and its slope across: the subnasale at the columella, a little higher under the alar rims, and level past them. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHeadNoseBase.LineResult is the canonical exchange used by AutoMovieHumanHeadNoseBase.line.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadNoseBase.line for height where the nose's base meets the face, at a distance from the midline, and its slope across: the subnasale at the columella, a little higher under the alar rims, and level past them.
 */
  export type LineResult = [number, number];
}
