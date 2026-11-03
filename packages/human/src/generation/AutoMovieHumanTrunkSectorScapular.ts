import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";
import { AutoMovieHumanTrunkGuidePosteriorAxillary } from "./AutoMovieHumanTrunkGuidePosteriorAxillary";
import { AutoMovieHumanTrunkGuideScapular } from "./AutoMovieHumanTrunkGuideScapular";

/**
 * The trunk's scapular sector, from the posterior axillary line P to the scapular line E: the scapula's lateral border and teres major above, latissimus below, the gluteus medius at the pelvis. The gluteal cleft's displacement ends at P.
 *
 * The arc is the quintic Hermite of its two guides' jets at the quadrant's
 * own speeds, so it meets both with their point, tangent
 * and curvature (G2) and holds no number of its own.
 */
export namespace AutoMovieHumanTrunkSectorScapular {
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
      AutoMovieHumanTrunkGuidePosteriorAxillary.jet(s, false),
      AutoMovieHumanTrunkGuideScapular.jet(s, false),
      [AutoMovieHumanTrunkGuidePosteriorAxillary.KNOT, AutoMovieHumanTrunkGuideScapular.KNOT],
      speeds,
      true,
    );
  }
}
