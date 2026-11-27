export namespace AutoMovieHumanF1Data {
  /*
     * The least shoulder of a toe's arcs (`AutoMovieHumanConicSection.ILayout.least`). The big toe's arc from its top to its medial side held
     * shoulders of 0.24 and 0.27 at its last two knots, 43 and 53 mm: an arc that hugs its chord turns at its ends, and the toe's medial side
     * stood a corner that its short cap carried into a fan of facets (`toes.front` px 640..790 x 440..540, folds of 33 degrees). The bound is
     * the knee's (`FamilyConicBody.ts --least=0.3`); every other toe's arcs and every toe's first section already hold 0.34 or more, so the
     * seams read on the toes' first rings (`fanSeams`) do not move.
     */
    export const TOE_LEAST: number = 0.3;

  /*
     * The length of a toe's dome as a share of its section's mean reach where the dome starts (`rounded`). The big toe's reference section
     * reaches 7.95 mm on average 3.13 mm before its tip and 10.97 mm at 13.13 mm (its fitted fields at 53 and 43 mm, within 0.6 mm of the
     * skin): a half ellipse through the first whose foot stands on the wall is 8 mm long on a reach of 10 mm. A dome as long as its reach
     * (share 1) drew the big toe's end as a tapered ellipsoid on `toes.left`, where the reference's is blunt.
     */
    export const TOE_DOME: number = 0.8;

  /*
     * The largest turn of a toe's ring between two neighbouring phases, radians (`AutoMovieHumanConicLoft.IFamily.turn`), the arm's. On the
     * uniform 48 phases a toe takes by its girth, the big toe's medial side, where its section turns fastest, stood as flat strips along the toe
     * that read as a fan of facets from the front (`toes.front` px 640..790 x 440..540), as the forefoot's edge did on the leg's uniform phases.
     * Only a toe whose fit held an arc under `TOE_LEAST` has such a corner, the big toe alone: spaced by turn at 0.1 or 0.2 rad, the little
     * toe's band folded at its plantar fork (edges of 130 to 170 degrees over 32 to 53 edges at [132, 1, 198], against none past 112 on its
     * uniform phases), since its ring's phases moved under the fork's fill.
     */
    export const TOE_TURN: number = 0.1;

  /*
     * Rings a toe's dome is meshed in (`AutoMovieHumanConicLoft.ITip.rings`). The dome turns its normal a quarter turn from the wall to the
     * tip, and the cap's twelve rings, at equal steps of the root of the distance to the tip, turned it 6 to 9 degrees each: under flat
     * shading every toe's tip stood as a bullseye of bands (`toes.front` px 200..260 x 520..570 and 540..600 x 440..500). Thirty turn it
     * 3 degrees or less each.
     */
    export const TOE_CAP_RINGS: number = 30;

  /*
     * The four fingers in order across the hand, starting with the index.
     */
    export const EMPTY_PROBE_FINGERS: readonly string[] = [
      "finger.index",
      "finger.middle",
      "finger.ring",
      "finger.pinky",
    ];
}
