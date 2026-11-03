import type { IAutoMovieHumanSeam } from "../lofting/IAutoMovieHumanSeam";
import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";
import { AutoMovieHumanTrunkGuideScapular } from "./AutoMovieHumanTrunkGuideScapular";

/**
 * The trunk's back midline guide S at knot 128: the spinous processes and the sacrum. It owns the back place, the tangent across the midline and the curvature of the back quadrant's parabola through the scapular guide, the gluteal cleft's curvature added.
 */
export namespace AutoMovieHumanTrunkGuideBackMidline {
  /** Knot of the 256-control section, on the canonical left side. */
  export const KNOT: number = 128;

  /**
   * The guide's jet in a section, by arclength in the direction of rising phase.
   *
   * @param s The section's measures.
   * @param folded Whether to add the crotch fold; sectors take the guide without it.
   */
  export function jet(s: AutoMovieHumanTrunkQuadrant.ISection, folded: boolean = true): IAutoMovieHumanSeam.IArcJet {
    return AutoMovieHumanTrunkQuadrant.onMidline(s, "back", AutoMovieHumanTrunkGuideScapular.SHARE, folded);
  }
}
