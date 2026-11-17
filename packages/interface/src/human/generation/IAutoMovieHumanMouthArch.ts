/** Type contracts exchanged by AutoMovieHumanMouthArch; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanMouthArch {
  /** A beta arch fitted to one quadrant's teeth.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A beta arch fitted to one quadrant's teeth.
   * @evidence contracts/development/design.md#principled-representation `width`: Full width between the arch's ends, mm. `depth`: Depth from the ends' line to the front, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanMouthArch.arch. Read by AutoMovieHumanMouthArch.place, AutoMovieHumanMouthArch.beta, AutoMovieHumanMouthArch.walk. Also types AutoMovieHumanMouth.upperArch, AutoMovieHumanMouthArch.sized.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `width`, `depth`; callers supply the complete record.
   */
  export interface IArch {
    /** Full width between the arch's ends, mm. */
    width: number;

    /** Depth from the ends' line to the front, mm. */
    depth: number;
  }

  /** The edge argument of AutoMovieHumanMouthArch.place. Teeth of one jaw, both sides, on the upper arch inset by an offset.
  @param crowns The jaw's quadrant crowns from the central incisor back.
  @param upper The upper arch.
  @param inset Inward offset of this jaw's cusp line from the upper's, mm (the overjet for the lower).
  @param start Forward place of the upper central incisors' cusp line, mm.
  @param edge The upper incisal edge `[x, y]`, mm.
  @param cant Slope of the occlusal plane, rise per millimetre backward.
  @param jaw Which jaw.
  @returns The jaw's teeth, left side first.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Teeth of one jaw, both sides, on the upper arch inset by an offset.
 * @evidence contracts/development/design.md#principled-representation Teeth of one jaw, both sides, on the upper arch inset by an offset. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanMouthArch.PlaceEdge is the canonical exchange used by AutoMovieHumanMouthArch.place.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanMouthArch.place for teeth of one jaw, both sides, on the upper arch inset by an offset.
 */
  export type PlaceEdge = [number, number];
}
