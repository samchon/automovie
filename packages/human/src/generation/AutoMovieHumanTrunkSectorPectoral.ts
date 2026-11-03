import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";
import { AutoMovieHumanTrunkGuideBustLine } from "./AutoMovieHumanTrunkGuideBustLine";
import { AutoMovieHumanTrunkGuideAnteriorAxillary } from "./AutoMovieHumanTrunkGuideAnteriorAxillary";

/**
 * The trunk's pectoral sector, from the bust line K to the anterior axillary line A: pectoralis major over the ribs above, the rectus' lateral edge and the oblique below. The crotch fold acts on it and ends at A.
 *
 * The arc is the quintic Hermite of its two guides' jets at the quadrant's
 * own speeds, so it meets both with their point, tangent
 * and curvature (G2) and holds no number of its own.
 */
export namespace AutoMovieHumanTrunkSectorPectoral {
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
      AutoMovieHumanTrunkGuideBustLine.jet(s, false),
      AutoMovieHumanTrunkGuideAnteriorAxillary.jet(s, false),
      [AutoMovieHumanTrunkGuideBustLine.KNOT, AutoMovieHumanTrunkGuideAnteriorAxillary.KNOT],
      speeds,
      true,
    );
  }
}
