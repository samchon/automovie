import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";
import { AutoMovieHumanTrunkGuideFrontMidline } from "./AutoMovieHumanTrunkGuideFrontMidline";
import { AutoMovieHumanTrunkGuideBustLine } from "./AutoMovieHumanTrunkGuideBustLine";

/**
 * The trunk's sternal sector, from the front midline M to the bust line K: the linea alba and rectus below, the sternum and the pectorals' medial part above. The crotch fold acts on it.
 *
 * The arc is the quintic Hermite of its two guides' jets at the quadrant's
 * own speeds, so it meets both with their point, tangent
 * and curvature (G2) and holds no number of its own.
 */
export namespace AutoMovieHumanTrunkSectorSternal {
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
      AutoMovieHumanTrunkGuideFrontMidline.jet(s, false),
      AutoMovieHumanTrunkGuideBustLine.jet(s, false),
      [AutoMovieHumanTrunkGuideFrontMidline.KNOT, AutoMovieHumanTrunkGuideBustLine.KNOT],
      speeds,
      true,
    );
  }
}
