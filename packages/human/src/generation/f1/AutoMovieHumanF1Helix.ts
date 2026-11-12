import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's helix on the +Z side, the rolled rim of the ear, merged onto the ear's leaf; the other side is its mirror image in the median plane.
 *
 * A round tube swept along the rim's crest (`AutoMovieHumanF1Joints.helix`): from inside the leaf under the helix's front limb, up over the
 * top, down the back and into the lobule, turning 3 mm either side of each centre. Its course is the crest read by `FamilyConicScan.ts helix`
 * sunk 1.8 mm toward the head, which leaves it 1 to 2 mm inside the leaf's wall all the way (the leaf's wall is the hull of the reference's
 * plane cuts, which passes over the crest), so the tube crosses the leaf's outer and inner faces at an angle and the curve where they meet is
 * one closed loop round both of its buried ends. A tube on the crest itself, as wide as the rim, would lie along the leaf's own wall, and two
 * surfaces that agree do not cross.
 *
 * Every section is a circle: four extremes on the chart's axes at the radius and shoulders of 0.4142, a quarter circle as a conic. The radius
 * is half the rim's width from its edge to the scapha's floor, 6 to 8 mm over the top and down the back (`FamilyConicScan.ts helix`), so
 * 3 mm; it falls to 1.8 mm toward each buried end, and to 2.6 mm at the front limb, which is narrower. The tube stands about 1 mm proud of
 * the reference's crest.
 *
 * Frame and model: as `AutoMovieHumanF1Ear`. The course is 81.96 mm long; each end closes in a point at its end of the course from 3 mm in.
 */
export const AutoMovieHumanF1Helix: AutoMovieHumanConicLoft.IFamily = {
  name: "helix",
  centres: AutoMovieHumanF1Joints.helix,
  halves: [3, 3, 3, 3, 3, 3, 3, 3],
  up: [0, 0, 1],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [3, 12, 40, 68, 78.96],
  values: [
    // front (+u) extreme: u, mm
    [1.8, 2.6, 3, 2.9, 1.8],
    // front (+u) extreme: v, mm
    [0, 0, 0, 0, 0],
    // side (+v) extreme: u, mm
    [0, 0, 0, 0, 0],
    // side (+v) extreme: v, mm
    [1.8, 2.6, 3, 2.9, 1.8],
    // back (-u) extreme: u, mm
    [-1.8, -2.6, -3, -2.9, -1.8],
    // back (-u) extreme: v, mm
    [0, 0, 0, 0, 0],
    // side (-v) extreme: u, mm
    [0, 0, 0, 0, 0],
    // side (-v) extreme: v, mm
    [-1.8, -2.6, -3, -2.9, -1.8],
    // shoulder rho of the arc after anchor 0, share
    [0.4142, 0.4142, 0.4142, 0.4142, 0.4142],
    // shoulder rho of the arc after anchor 1, share
    [0.4142, 0.4142, 0.4142, 0.4142, 0.4142],
    // shoulder rho of the arc after anchor 2, share
    [0.4142, 0.4142, 0.4142, 0.4142, 0.4142],
    // shoulder rho of the arc after anchor 3, share
    [0.4142, 0.4142, 0.4142, 0.4142, 0.4142],
  ],

  // Both ends are buried in the leaf.
  tips: [{ from: 3, tip: 0 }, { from: 78.96, tip: 81.96 }],
};
