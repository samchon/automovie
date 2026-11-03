import type { IAutoMovieHumanSeam } from "../lofting/IAutoMovieHumanSeam";
import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";
import { AutoMovieHumanTrunkGuideBustLine } from "./AutoMovieHumanTrunkGuideBustLine";

/**
 * The trunk's front midline guide M: the linea alba and the sternum, at knot 0 of the section. It owns the front place, the tangent across the midline and the curvature of the front quadrant's parabola through the bust line guide, the crotch fold's curvature added.
 */
export namespace AutoMovieHumanTrunkGuideFrontMidline {
  /** Knot of the 256-control section, on the canonical left side. */
  export const KNOT: number = 0;

  /**
   * The guide's jet in a section, by arclength in the direction of rising phase.
   *
   * @param s The section's measures.
   * @param folded Whether to add the crotch fold; sectors take the guide without it.
   */
  export function jet(s: AutoMovieHumanTrunkQuadrant.ISection, folded: boolean = true): IAutoMovieHumanSeam.IArcJet {
    return AutoMovieHumanTrunkQuadrant.onMidline(s, "front", AutoMovieHumanTrunkGuideBustLine.SHARE, folded);
  }
}
