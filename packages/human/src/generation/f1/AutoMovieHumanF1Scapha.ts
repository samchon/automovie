import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's scapha on the +Z side, the groove between the helix and the antihelix, cut from the ear's leaf after its helix is merged; the other side
 * is its mirror image in the median plane z = 0.
 *
 * The reference's scapha floor lies under the helix's overhang, 3 to 6 mm inside the crest, and rises gently to the antihelix's plateau 88 to
 * 91 mm out (`FamilyConicEar.ts --map`). The leaf's outer face is the hull of the auricle's plane cuts, 2 to 3 mm fuller than that plateau and
 * flat up to the tube's foot, so without a groove the rim read as a tube lying on a plate.
 *
 * The course runs down the inside of the helix (`AutoMovieHumanF1Joints.scapha`), 2.3 mm inside its foot and 1.2 mm under the face. Each
 * section's chart has `u` out of the face (from `up`, +Z) and `v` toward the antihelix. The floor (-u) lies 1.8 mm under the course, 3 mm
 * under the face. The rim's side (-v) stands 1.2 mm out, 0.5 mm above the course, so the cut's curve stays about a millimetre inside the
 * tube's foot: carried to the foot, the curve ran onto the helix's blend and its walk was lost there, and closer to the leaf's pole, which
 * lies under the tube on the helix's back, no rail was found. The antihelix's side (+v) reaches 4 mm in, 2.5 mm toward the lower end, 1 mm
 * above the course, with a shoulder of 0.35 down to the floor, so that wall slopes up gently; at 4 mm to the lower end no rail was found
 * where the curve turns round the closed end. The rim's wall keeps 0.55, so it stands under the tube. Each end closes in a point over 4
 * and 5 mm, inside the leaf: with 6 mm at the lower end no rail was found where the curve turns round it, and with 3 mm on a longer course.
 *
 * Frame and model: as `AutoMovieHumanF1Ear`. The course is 18.2 mm long. 60 independent numbers, placed from the probe and not fitted.
 */
export const AutoMovieHumanF1Scapha: AutoMovieHumanConicLoft.IFamily = {
  name: "scapha",
  centres: AutoMovieHumanF1Joints.scapha,
  halves: [2, 2],
  up: [0, 0, 1],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [4, 6.3, 8.6, 10.9, 13.2],
  values: [
    // front (+u) extreme: u, mm
    [2.5, 2.5, 2.5, 2.5, 2.5],
    // front (+u) extreme: v, mm
    [0, 0, 0, 0, 0],
    // side (+v) extreme: u, mm
    [1, 1, 1, 1, 1],
    // side (+v) extreme: v, mm
    [4, 4, 4, 3, 2.5],
    // back (-u) extreme: u, mm
    [-1.8, -1.8, -1.8, -1.8, -1.8],
    // back (-u) extreme: v, mm
    [0, 0, 0, 0, 0],
    // side (-v) extreme: u, mm
    [0.5, 0.5, 0.5, 0.5, 0.5],
    // side (-v) extreme: v, mm
    [-1.2, -1.2, -1.2, -1.2, -1.2],
    // shoulder rho of the arc after anchor 0, share
    [0.45, 0.45, 0.45, 0.45, 0.45],
    // shoulder rho of the arc after anchor 1, share
    [0.35, 0.35, 0.35, 0.35, 0.35],
    // shoulder rho of the arc after anchor 2, share
    [0.55, 0.55, 0.55, 0.55, 0.55],
    // shoulder rho of the arc after anchor 3, share
    [0.45, 0.45, 0.45, 0.45, 0.45],
  ],

  // Both ends close in a point on the course, inside the leaf.
  tips: [{ from: 4, tip: 0 }, { from: 13.2, tip: 18.2 }],
};
