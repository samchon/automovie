/**
 * Type contracts exchanged by AutoMovieHumanMouthArch; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanMouthArch {
  /** A beta arch fitted to one quadrant's teeth. */
  export interface IArch {
    /** Full width between the arch's ends, mm. */
    width: number;

    /** Depth from the ends' line to the front, mm. */
    depth: number;
  }

  /**
   * The edge argument of AutoMovieHumanMouthArch.place. Teeth of one jaw, both
   * sides, on the upper arch inset by an offset.
   *
   * @param crowns The jaw's quadrant crowns from the central incisor back.
   * @param upper The upper arch.
   * @param inset Inward offset of this jaw's cusp line from the upper's, mm
   *   (the overjet for the lower).
   * @param start Forward place of the upper central incisors' cusp line, mm.
   * @param edge The upper incisal edge `[x, y]`, mm.
   * @param cant Slope of the occlusal plane, rise per millimetre backward.
   * @param jaw Which jaw.
   * @returns The jaw's teeth, left side first.
   */
  export type PlaceEdge = [number, number];
}
