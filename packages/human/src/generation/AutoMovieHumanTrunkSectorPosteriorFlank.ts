import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";
import { AutoMovieHumanTrunkGuideMidAxillary } from "./AutoMovieHumanTrunkGuideMidAxillary";
import { AutoMovieHumanTrunkGuidePosteriorAxillary } from "./AutoMovieHumanTrunkGuidePosteriorAxillary";

/**
 * The trunk's posterior flank sector, from the widest point L to the posterior axillary line P: latissimus dorsi over the ribs, the iliac crest's back at the pelvis.
 *
 * The arc is the quintic Hermite of its two guides' jets at the quadrant's
 * own speeds, so it meets both with their point, tangent
 * and curvature (G2) and holds no number of its own.
 */
export namespace AutoMovieHumanTrunkSectorPosteriorFlank {
  /**
   * The sector of a section: its jet at a phase between its guides' knots,
   * per radian (point, first and second derivatives), its guides' jets read
   * once.
   *
   * @param s The section's measures.
   * @param speeds Its guides' speeds, mm per radian.
   */
  export function create(s: AutoMovieHumanTrunkQuadrant.ISection, speeds: readonly [number, number]): (t: number) => [number[], number[], number[]] {
    return AutoMovieHumanTrunkQuadrant.between(
      s,
      "back",
      AutoMovieHumanTrunkGuideMidAxillary.jet(s),
      AutoMovieHumanTrunkGuidePosteriorAxillary.jet(s, false),
      [AutoMovieHumanTrunkGuideMidAxillary.KNOT, AutoMovieHumanTrunkGuidePosteriorAxillary.KNOT],
      speeds,
      false,
    );
  }
}
