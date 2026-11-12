import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's hollow above the concha on the +Z side, the cymba and the triangular fossa as one shallow dish, cut from the ear's leaf after its
 * helix is merged and before the ear is attached; the other side is its mirror image in the median plane z = 0.
 *
 * The leaf's outer face is the hull of the auricle's plane cuts, a slope from 91 to 93 mm out behind to 84 mm at the front, 86 to 87 mm out
 * along x 13.5. The reference's outer skin (`FamilyConicEar.ts --map`) is the antihelix's plateau, 88 to 91 mm out from x 0 to 6, falling at
 * x 8 to 11 into a hollow at x 12 to 16 from the concha's top at y 1574 up to the fossa's head under the helix's front limb at y 1592,
 * rising again at x 17 to 18 to the limb. The dish is held to a few millimetres under the leaf's face with soft walls, the antihelix's edge
 * and not a window: cut as deep as the map's floor (74 to 78 mm out) with walls square to the face, it read as a slot.
 *
 * The course runs straight up the hollow at x 13.5, 84 mm out (`AutoMovieHumanF1Joints.fossaRoot`, `fossaTip`). Each section is in a level
 * plane, its chart `u` straight out from the head and `v` backward (`u` x the course): the floor is the back (-u) extreme, 1 to 2.5 mm under
 * the course (81.5 to 83 mm out, 4 to 5 mm under the leaf's face, deepest over the cymba); the side (+v) extreme stands 5.5 to 7 mm behind
 * the course (x 6.5 to 8, the plateau's edge) and the side (-v) extreme 3 to 4.5 mm in front (x 16.5 to 18, the limb's foot), both 0.5 to
 * 3.5 mm above it. The arcs down to the floor have shoulders of 0.3, near their chords, so the walls slope at about 40 degrees; the arcs over
 * the top, 6 to 8 mm out from the course and clear of the face, have 0.45. Each end closes in a point over 3 and 3.5 mm: at y 1576, above
 * the concha's cut (closed at y 1574, its blend 1.5 mm wide came near the concha's and the twin ear's face was refused: "interior point
 * does not share one original diagonal"), and at y 1592.5, about a millimetre under the helix's front limb (carried to y 1596 the cut's walk was lost on the
 * helix's blend).
 *
 * Frame and model: as `AutoMovieHumanF1Ear`. 48 independent numbers, read from the map and the leaf's face and not fitted.
 */
export const AutoMovieHumanF1Fossa: AutoMovieHumanConicLoft.IFamily = {
  name: "fossa",
  centres: [AutoMovieHumanF1Joints.fossaRoot, AutoMovieHumanF1Joints.fossaTip],
  halves: [],
  up: [0, 0, 1],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [5, 9, 13, 15],
  values: [
    // front (+u) extreme: u, mm
    [8, 8, 7, 6],
    // front (+u) extreme: v, mm
    [0.5, 0.5, 0.5, 0.5],
    // side (+v) extreme: u, mm
    [3.5, 3.5, 3.5, 3],
    // side (+v) extreme: v, mm
    [7, 7, 6.5, 5.5],
    // back (-u) extreme: u, mm
    [-2.5, -2, -1.5, -1],
    // back (-u) extreme: v, mm
    [0, 0, 0, 0],
    // side (-v) extreme: u, mm
    [0.5, 0.5, 0.5, 0.5],
    // side (-v) extreme: v, mm
    [-4.5, -4, -3.5, -3],
    // shoulder rho of the arc after anchor 0, share
    [0.45, 0.45, 0.45, 0.45],
    // shoulder rho of the arc after anchor 1, share
    [0.3, 0.3, 0.3, 0.3],
    // shoulder rho of the arc after anchor 2, share
    [0.3, 0.3, 0.3, 0.3],
    // shoulder rho of the arc after anchor 3, share
    [0.45, 0.45, 0.45, 0.45],
  ],

  // Both ends close in a point on the course.
  tips: [{ from: 5, tip: 2 }, { from: 15, tip: 18.5 }],
};
