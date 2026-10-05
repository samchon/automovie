import type { IAutoMovieHumanHeadMeasurement } from "./IAutoMovieHumanHeadMeasurement";

/**
 * Head measurement rules read on the head view of a person's skin at rest,
 * keyed by the ANSUR II measurement they follow (Hotzman et al. 2011,
 * NATICK/TR-11/017). https://tools.openlab.psu.edu/publicData/ANSURII-TR11-017.pdf
 *
 * Every rule reads the rest skin (`measureHumanPersonHead`): shape only, no
 * pose, neutral expression. Two named approximations apply to all of them:
 * - The source's rest head orientation stands in for the Frankfurt plane, so
 *   "vertical" is +Y and "horizontal" is the XZ plane of the person frame.
 * - The skin carries no hair, so the skin's top stands in for the vertex under
 *   a compressing blade or tape.
 *
 * The skin points (`glabella`, `sellion`, `menton`, `tragion-right`) are fixed
 * vertices chosen on the neutral generation by their definitions. A shape
 * that moves a definition's extreme to a neighbouring vertex is not followed;
 * the points are named approximations recorded in the generation manifest.
 * The vertex, the opisthocranion and the euryons are extremes the instruments
 * find on each skin, never fixed vertices.
 *
 * Each recorded range spans both sexes of the public ANSUR II release
 * (1,986 women and 4,082 men) and is a report, not a bound.
 *
 * @author Samchon
 */
export const HUMAN_HEAD_MEASUREMENTS: Record<string, IAutoMovieHumanHeadMeasurement> = {
  /**
   * Tragion–top of head: ANSUR II 6.4.83 (p. 159), "the vertical distance
   * between the right tragion landmark ... and the horizontal plane tangent to
   * the top of the head", head in the Frankfurt plane. Tragion (5.2.42, p. 66)
   * is "the superior point on the juncture of the cartilaginous flap (tragus)
   * of the ear with the head". Observed 105–148 mm in women and 110–150 mm in
   * men.
   */
  tragionTopOfHead: {
    kind: "tragion-top",
    tragion: "tragion-right",
    sampleMinimumMetres: 0.105,
    sampleMaximumMetres: 0.15,
  },
  /**
   * Head length: ANSUR II 6.4.48 (p. 124), the distance from glabella to
   * opisthocranion: one caliper tip on glabella (5.2.14, p. 36, "the most
   * anterior point on the frontal bone midway between the bony browridges"),
   * the other moved "up and down on the back of the head in the midsagittal
   * plane until the maximum measurement is obtained". The instrument takes
   * the farthest midsagittal point at or above the tragion height
   * (`findHumanOpisthocranion`): below the Frankfurt plane the open head
   * view continues down the neck, whose points can lie farther away. The
   * tragion height stands in for that plane at the back of the head (named
   * approximation); a shape whose occipital maximum falls below it reads at
   * the floor.
   * Observed 168–215 mm in women and 172–225 mm in men.
   */
  headLength: {
    kind: "head-length",
    glabella: "glabella",
    tragion: "tragion-right",
    sampleMinimumMetres: 0.168,
    sampleMaximumMetres: 0.225,
  },
  /**
   * Head breadth: ANSUR II 6.4.46 (p. 122), "the maximum horizontal breadth
   * of the head above the ears" (euryon, right and left), with a spreading
   * caliper. The
   * ears are the head view's `ear-right` and `ear-left` areas, bounded by the
   * attachment loop read from renders. Observed 131–167 mm in women and
   * 135–180 mm in men.
   */
  headBreadth: {
    kind: "head-breadth",
    rightEar: "ear-right",
    leftEar: "ear-left",
    sampleMinimumMetres: 0.131,
    sampleMaximumMetres: 0.18,
  },
  /**
   * Menton–sellion length: ANSUR II 6.4.62 (p. 138), "the distance between
   * the menton landmark and the sellion landmark in the midsagittal plane",
   * with a sliding caliper and the teeth lightly occluded. Menton (5.2.23,
   * p. 45) is the inferior point of the mandible in the midsagittal plane;
   * sellion (5.2.35, p. 59) the deepest depression of the nasal bones. The
   * rest skin's neutral expression closes the jaw. Observed 91–136 mm in
   * women and 99–156 mm in men.
   */
  mentonSellionLength: {
    kind: "landmark-distance",
    from: "menton",
    to: "sellion",
    sampleMinimumMetres: 0.091,
    sampleMaximumMetres: 0.156,
  },
  /**
   * Head circumference: ANSUR II 6.4.47 (p. 123), "the maximum circumference
   * of the head above the supraorbital ridges and ears"; the tape passes just
   * above the eyebrow ridges and around the back of the head, its plane
   * "higher in front than it is in the back but ... not tilted to either
   * side". The plane through glabella and the head length's opisthocranion,
   * level from side to side, stands in for the tape's path, held level where
   * it would rise behind the glabella and raised at the back to touch the
   * highest ear point where it would cut an ear (named approximations:
   * glabella itself rather than just above the ridges, and the admissible
   * plane nearest the longest front-to-back line rather than a search for the
   * maximum girth). Observed 500–635 mm in women and 516–633 mm in men.
   */
  headCircumference: {
    kind: "head-circumference",
    glabella: "glabella",
    tragion: "tragion-right",
    rightEar: "ear-right",
    leftEar: "ear-left",
    sampleMinimumMetres: 0.5,
    sampleMaximumMetres: 0.635,
  },
};
