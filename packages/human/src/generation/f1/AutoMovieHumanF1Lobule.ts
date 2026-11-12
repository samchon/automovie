import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's gap under the lobule on the +Z side, the cutter that frees the lobule from the head; the other side is its mirror image in the median
 * plane z = 0.
 *
 * The lobule hangs free below a crease at 1,551.5 to 1,555.5 mm, and under its free part the reference has air down to the skull, 60 to
 * 62 mm out (`FamilyConicScan.ts lobule`). The ear's band spans from the head's loop under the lobule to the leaf's root ring, and in front
 * the trunk's own skin keeps the lobule's inner part, so the figure had a web there 10 to 18 mm proud of the skull. A port cannot hang the
 * lobule below its loop, so the web is cut away after the ear is attached: this loft runs up under the lobule from below and in front, its
 * sections the gap's outline, and closes at its top under the crease. Its wall left inside the head is the skull under the lobule and the
 * lobule's medial face.
 *
 * Read in the course's own planes (`FamilyConicScan.ts lobule-course`), whose `u` runs forward and `v` out from the course: the skull
 * crosses each line of `u` at the medial (-v) side, the lobule's medial face at the lateral (+v) side down to its free edge, and the gap
 * closes in front where the lobule meets the cheek. Each extreme is placed from those readings and the figure's own skin on the same lines:
 * - medial (-v): 0.2 to 0.6 mm outside the skull (-7.5 to -4.4 mm at stations 10 to 21), so the cut's floor lies on the skull;
 * - lateral (+v): at the lobule's free edge, 1.3 to 2.2 mm short of the leaf's lower face (12.7 to 14.4 mm), so the lobule keeps its
 *   edge; at station 10, below the lobule, 6 mm, in the air under the band;
 * - front (+u): where the gap closes against the cheek, 11 to 13 mm at stations 10 to 19 (x 20 to 23.5), 8.5 mm at 21;
 * - back (-u): 3 to 4 mm above the band where it stands proud of the skull behind the lobule, so the back wall rises from the floor to the
 *   band and the cut runs out there.
 * The lobule's medial face runs nearly straight from the front to the free edge, so the arc between them keeps a shoulder of 0.35; the floor
 * is flat along the skull and turns up in front (0.55); the back wall is a gentle ramp (0.4). The course leans 15 degrees back from straight
 * up, so its sections follow the gap's middle as it narrows back and up, and the tip stands at the gap's apex.
 *
 * Its blends are 0.5 mm wide on both sides: with 1 mm on the head, the host rail was not found beside the seed for one shape in two, where
 * the curve runs within a few millimetres of the band's lower edge, the seam along which the band leaves the head's skin.
 *
 * Frame and model: as `AutoMovieHumanF1Ear`. The course is 26.4 mm long; the cap below the first knot closes 6 mm under it, in the air,
 * and the one above the last closes at the course's end. 60 independent numbers, placed by hand from those readings.
 */
export const AutoMovieHumanF1Lobule: AutoMovieHumanConicLoft.IFamily = {
  name: "lobule",
  centres: [AutoMovieHumanF1Joints.lobuleRoot, AutoMovieHumanF1Joints.lobuleTip],
  halves: [],
  up: [1, 0, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [10, 13, 16, 19, 21],
  values: [
    // front (+u) extreme: u, mm
    [12, 13, 11, 11, 8.5],
    // front (+u) extreme: v, mm
    [-2, -1.2, -1, -1.5, -1.8],
    // side (+v) extreme: u, mm
    [2, 1.5, -0.5, -1.5, -2.5],
    // side (+v) extreme: v, mm
    [6, 10.5, 11.5, 12.5, 12.5],
    // back (-u) extreme: u, mm
    [-6.5, -7, -8, -9, -9.5],
    // back (-u) extreme: v, mm
    [-5.2, -4.3, -2.5, -1.5, -0.3],
    // side (-v) extreme: u, mm
    [1, 0, 1, 1, 0.5],
    // side (-v) extreme: v, mm
    [-7, -6.7, -5.9, -5, -4.2],
    // shoulder rho of the arc after anchor 0, share
    [0.35, 0.35, 0.35, 0.35, 0.4],
    // shoulder rho of the arc after anchor 1, share
    [0.6, 0.6, 0.6, 0.6, 0.6],
    // shoulder rho of the arc after anchor 2, share
    [0.4, 0.4, 0.4, 0.4, 0.4],
    // shoulder rho of the arc after anchor 3, share
    [0.55, 0.55, 0.55, 0.55, 0.55],
  ],

  // The part closes in a point at `tip` at each end; its cap starts at `from`.
  tips: [{ from: 10, tip: 4 }, { from: 21, tip: 24 }],
};
