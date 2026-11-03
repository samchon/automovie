import type { IAutoMovieHumanSeam } from "../lofting/IAutoMovieHumanSeam";
import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";
/**
 * The trunk's posterior axillary line guide P at knot 94: latissimus dorsi and teres major down from the posterior axillary fold point, on the back quadrant at a fixed lateral share. Its knot is where the arm's arc of the shoulder ring ends.
 */
export namespace AutoMovieHumanTrunkGuidePosteriorAxillary {
  /** Knot of the 256-control section, on the canonical left side. */
  export const KNOT: number = 94;
  /** Lateral share of the half width. */
  export const SHARE: number = 0.9;

  /**
   * The guide's jet in a section, by arclength in the direction of rising phase.
   *
   * @param s The section's measures.
   * @param folded Whether to add the crotch fold; sectors take the guide without it.
   */
  export function jet(s: AutoMovieHumanTrunkQuadrant.ISection, folded: boolean = true): IAutoMovieHumanSeam.IArcJet {
    return AutoMovieHumanTrunkQuadrant.onQuadrant(s, "back", s.posterior ?? SHARE, folded);
  }
}
