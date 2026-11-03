import type { IAutoMovieHumanSeam } from "../lofting/IAutoMovieHumanSeam";
import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";
/**
 * The trunk's mid-clavicular or bust line guide K at knot 24: the vertical through the clavicle's middle, through the bust point at the chest. It stands on the front quadrant at a fixed lateral share: the clavicle's midpoint, half of the sternoclavicular joint's and the acromion's half breadths (about 20 and 183 mm, ANSUR II biacromial breadth), over the chest's half breadth below the axilla (about 150 mm on the four references), 0.65.
 */
export namespace AutoMovieHumanTrunkGuideBustLine {
  /** Knot of the 256-control section, on the canonical left side. */
  export const KNOT: number = 24;
  /** Lateral share of the half width. */
  export const SHARE: number = 0.65;

  /**
   * The guide's jet in a section, by arclength in the direction of rising phase.
   *
   * @param s The section's measures.
   * @param folded Whether to add the crotch fold; sectors take the guide without it.
   */
  export function jet(s: AutoMovieHumanTrunkQuadrant.ISection, folded: boolean = true): IAutoMovieHumanSeam.IArcJet {
    return AutoMovieHumanTrunkQuadrant.onQuadrant(s, "front", SHARE, folded);
  }
}
