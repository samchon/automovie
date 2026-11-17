/** Type contracts exchanged by AutoMovieHumanSternalNotch; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanSternalNotch {
  /** The front argument of AutoMovieHumanSternalNotch.frame. The notch's frame under a neck ring.
  @param neck Height of the neck's bottom ring, mm.
  @param front The front midline's forward place at the notch, as a function of height, mm.
  @returns The frame.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The notch's frame under a neck ring.
 * @evidence contracts/development/design.md#principled-representation The notch's frame under a neck ring. The callable takes y and returns number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanSternalNotch.FrameFront is the canonical exchange used by AutoMovieHumanSternalNotch.frame.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanSternalNotch.frame for the notch's frame under a neck ring.
 */
  export type FrameFront = (y: number) => number;
}
