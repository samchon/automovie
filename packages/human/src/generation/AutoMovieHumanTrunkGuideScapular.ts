import type { IAutoMovieHumanSeam } from "../lofting/IAutoMovieHumanSeam";
import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";
/**
 * The trunk's scapular line guide E at knot 108: the vertical through the inferior scapular angle, the erector column's lateral edge below it, on the back quadrant at a fixed lateral share: the inferior angle about 80 mm off the midline (Gray 1918) over the chest's half breadth, 0.55.
 */
export namespace AutoMovieHumanTrunkGuideScapular {
  /** Knot of the 256-control section, on the canonical left side. */
  export const KNOT: number = 108;
  /** Lateral share of the half width. */
  export const SHARE: number = 0.55;

  /**
   * The guide's jet in a section, by arclength in the direction of rising phase.
   *
   * @param s The section's measures.
   * @param folded Whether to add the crotch fold; sectors take the guide without it.
   */
  export function jet(s: AutoMovieHumanTrunkQuadrant.ISection, folded: boolean = true): IAutoMovieHumanSeam.IArcJet {
    return AutoMovieHumanTrunkQuadrant.onQuadrant(s, "back", SHARE, folded);
  }
}
