import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's auricle tape wall on the +Z side, lofted along the ear's long axis; the other side is its mirror image in the median plane z = 0.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course
 * (`AutoMovieHumanF1Joints.auricle`) runs from above the helix's top down through the shell's middle to below the lobule; each section lies in
 * the plane normal to it, charted by `u` (from `up`, out of the head and a little forward) and `v` (forward).
 *
 * Each plane cuts the auricle in one C-shaped piece: from the head out along the cranial face to the helix's curl and back along the scapha
 * and the antihelix. The head's skin under 76.5 mm out is left out (rising toward the helix's top, where the head stands 77 to 78 mm out), and
 * the piece is closed along that level. The concha's bowl and the fossa lie inside each piece's hull.
 *
 * Source: the f1 reference head cut by this course's own planes over stations 12 to 62 mm, 101 sections 0.5 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts auricle --auricle-domain=12,62
 * --auricle-up=0.3,0,0.95` (joint least squares over all sections). Regenerated through the engine's view loft from these numbers alone, the
 * vertices of each section's hull lie 0.31 mm from it on average and at most 5.23 mm. 91 independent numbers.
 *
 * Hand edit after that fit: the medial (-u) extreme is sunk 3.5 mm, so the wall's medial side stands inside the head's own wall (74 to 77 mm
 * out over the ear's root, the trunk realized alone) and the auricle is merged onto the head along one loop round its root. The upper end
 * closes from the first knot to the station where the reference's loop vanishes above the helix's top (6 mm).
 */
export const AutoMovieHumanF1Auricle: AutoMovieHumanConicLoft.IFamily = {
  name: "auricle",
  centres: AutoMovieHumanF1Joints.auricle,
  halves: [4, 5, 5, 3],
  up: [0.3, 0, 0.95],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [12, 19, 25, 37, 47, 55, 62],
  values: [
    // front (+u) extreme: u, mm
    [5.96, 7.08, 7.42, 6.57, 5.9, 3.89, 2.91],
    // front (+u) extreme: v, mm
    [-14.38, -12.31, -10.99, -11.32, -2.92, -3.26, 1.19],
    // side (+v) extreme: u, mm
    [-2.94, -4.76, -2.18, 3.43, -1.21, -7.07, -2.21],
    // side (+v) extreme: v, mm
    [15.03, 17.52, 9.14, 2.94, 5.34, 9.71, 7.71],
    // back (-u) extreme: u, mm; sunk 3.5 mm by hand (above)
    [-11.28, -11.52, -13.11, -13.93, -10.24, -8.2, -5.94],
    // back (-u) extreme: v, mm
    [5.38, 0.55, -0.59, -0.07, -0.73, 0.12, 1.71],
    // side (-v) extreme: u, mm
    [12.64, 5.5, 9.49, 6.27, 6.1, 2.46, 4.96],
    // side (-v) extreme: v, mm
    [-11.74, -13.2, -13.16, -6.21, -4.98, -3.65, -2.37],
    // shoulder rho of the arc after anchor 0, share
    [0.132, 0.0199, 0.1068, 0.6069, 0.2462, 0.2624, 0.0691],
    // shoulder rho of the arc after anchor 1, share
    [0.5503, 0.1697, 0.5338, 0.267, 0.5017, 0.3788, 0.5119],
    // shoulder rho of the arc after anchor 2, share
    [0.3046, 0.272, 0.2075, 0.367, 0.4041, 0.2817, 0.6025],
    // shoulder rho of the arc after anchor 3, share
    [0.5016, 0.4957, 0.4966, 0.5, 0.4965, 0.4976, 0.4968],
  ],

  // Phases round the part stand at most this far apart, mm (`AutoMovieHumanConicLoft.IFamily.pitch`).
  pitch: 1.5,

  // Both ends close in a point: above the helix's top at the station where the reference's loop vanishes, below the lobule likewise.
  tips: [{ from: 12, tip: 6 }, { from: 62, tip: 67.38 }],
};
