import type { IAutoMovieHumanSeam } from "../lofting/IAutoMovieHumanSeam";
import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";
import { AutoMovieHumanTrunkGuidePosteriorAxillary } from "./AutoMovieHumanTrunkGuidePosteriorAxillary";

/**
 * The trunk's mid-axillary line guide L at knot 70: the section's widest point. Its tangent runs straight back; its curvature is the mean of the front and back quadrants' parabolas through the anterior and posterior axillary guides, declared once in world terms so both flank sectors share it.
 */
export namespace AutoMovieHumanTrunkGuideMidAxillary {
  /** Knot of the 256-control section, on the canonical left side. */
  export const KNOT: number = 70;

  /**
   * The guide's jet in a section, by arclength in the direction of rising phase; the crotch fold has ended before it.
   *
   * @param s The section's measures.
   */
  export function jet(s: AutoMovieHumanTrunkQuadrant.ISection): IAutoMovieHumanSeam.IArcJet {
    return AutoMovieHumanTrunkQuadrant.onWidest(s, s.anterior, AutoMovieHumanTrunkGuidePosteriorAxillary.SHARE);
  }
}
