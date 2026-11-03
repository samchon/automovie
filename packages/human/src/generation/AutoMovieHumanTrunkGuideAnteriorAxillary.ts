import type { IAutoMovieHumanSeam } from "../lofting/IAutoMovieHumanSeam";
import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";
/**
 * The trunk's anterior axillary line guide A at knot 46: the lower border of pectoralis major, running down from the anterior axillary fold point. It stands on the front quadrant at the section's own lateral share, which the front interscye length sets at the axilla and which falls back to `SHARE` below it. Its knot is where the arm's arc of the shoulder ring starts.
 */
export namespace AutoMovieHumanTrunkGuideAnteriorAxillary {
  /** Knot of the 256-control section, on the canonical left side. */
  export const KNOT: number = 46;
  /** Lateral share of the half width away from the axilla. */
  export const SHARE: number = 0.9;

  /**
   * The guide's jet in a section, by arclength in the direction of rising phase.
   *
   * @param s The section's measures.
   * @param folded Whether to add the crotch fold; sectors take the guide without it.
   */
  export function jet(s: AutoMovieHumanTrunkQuadrant.ISection, folded: boolean = true): IAutoMovieHumanSeam.IArcJet {
    return AutoMovieHumanTrunkQuadrant.onQuadrant(s, "front", s.anterior, folded);
  }
}
