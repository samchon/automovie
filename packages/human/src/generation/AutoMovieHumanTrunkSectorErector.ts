import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";
import { AutoMovieHumanTrunkGuideScapular } from "./AutoMovieHumanTrunkGuideScapular";
import { AutoMovieHumanTrunkGuideBackMidline } from "./AutoMovieHumanTrunkGuideBackMidline";

/**
 * The trunk's erector sector, from the scapular line E to the back midline S: the erector spinae column, the sacrum and the gluteal cleft at the pelvis. The spinal furrow is a relief over it, not this arc.
 *
 * The arc is the quintic Hermite of its two guides' jets at the quadrant's
 * own speeds, so it meets both with their point, tangent
 * and curvature (G2) and holds no number of its own.
 */
export namespace AutoMovieHumanTrunkSectorErector {
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
      AutoMovieHumanTrunkGuideScapular.jet(s, false),
      AutoMovieHumanTrunkGuideBackMidline.jet(s, false),
      [AutoMovieHumanTrunkGuideScapular.KNOT, AutoMovieHumanTrunkGuideBackMidline.KNOT],
      speeds,
      true,
    );
  }
}
