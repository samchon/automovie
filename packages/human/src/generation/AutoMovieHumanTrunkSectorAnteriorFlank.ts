import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";
import { AutoMovieHumanTrunkGuideAnteriorAxillary } from "./AutoMovieHumanTrunkGuideAnteriorAxillary";
import { AutoMovieHumanTrunkGuideMidAxillary } from "./AutoMovieHumanTrunkGuideMidAxillary";

/**
 * The trunk's anterior flank sector, from the anterior axillary line A to the widest point L: serratus anterior and the external oblique over the ribs, the iliac roll at the pelvis.
 *
 * The arc is the quintic Hermite of its two guides' jets at the quadrant's
 * own speeds, so it meets both with their point, tangent
 * and curvature (G2) and holds no number of its own.
 */
export namespace AutoMovieHumanTrunkSectorAnteriorFlank {
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
      "front",
      AutoMovieHumanTrunkGuideAnteriorAxillary.jet(s, false),
      AutoMovieHumanTrunkGuideMidAxillary.jet(s),
      [AutoMovieHumanTrunkGuideAnteriorAxillary.KNOT, AutoMovieHumanTrunkGuideMidAxillary.KNOT],
      speeds,
      false,
    );
  }
}
