import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's helix on the +Z side, the rolled rim of the ear, merged onto the ear's plate (`AutoMovieHumanF1Plate`) and the head once the plate is
 * on the head; the other side is its mirror image in the median plane.
 *
 * A round tube swept along the rim's crest (`AutoMovieHumanF1Joints.helix`): from inside the head under the helix's crus, up its front limb, over the
 * top, down the back and into the lobule, turning 3 mm either side of each centre. Its course is the crest read by `FamilyConicScan.ts helix`
 * sunk 1.8 mm toward the head; the plate stops 3 mm short of the auricle's outermost skin, under the tube, so the tube crosses the plate's
 * two faces at an angle and the curve where they meet the plate and the head is one closed loop round both of its buried ends. (Fitted first against the leaf,
 * the hull of the reference's plane cuts, a tube on the crest itself lay along that wall, and two surfaces that agree do not cross.)
 *
 * Every section is a circle: four extremes on the chart's axes at the radius and shoulders of 0.4142, a quarter circle as a conic. The radius
 * is half the rim's width from its edge to the scapha's floor, 6 to 8 mm over the top and down the back (`FamilyConicScan.ts helix`), so
 * 3 mm; it falls to 1.8 mm toward each buried end, to 2.6 mm at the front limb, which is narrower, and to 2 mm on the lower limb at
 * 1,555 to 1,565 mm, where the scapha narrows and the antihelix must stay clear of it. The tube stands about 1 mm proud of
 * the reference's crest.
 *
 * Frame and model: as `AutoMovieHumanF1Plate`. The course is 93.4 mm long; each end closes in a point at its end of the course from 3 mm in.
 */
export const AutoMovieHumanF1Helix: AutoMovieHumanConicLoft.IFamily = {
  name: "helix",
  centres: AutoMovieHumanF1Joints.helix,
  halves: [3, 3, 3, 3, 3, 3, 3, 3, 3],
  up: [0, 0, 1],
  layout: AutoMovieHumanConicSection.limb(0),
  // Each knot past the front limb stands where it stood on the course before the front limb was carried down into the head and the top
  // moved onto the plate (`AutoMovieHumanF1Joints.helix`), which made the course 8.62 mm longer from the top on (9.3 at the front limb);
  // the knot at 12 mm is on the new descent into the head, at the front limb's radius.
  knots: [3, 12, 22.2, 50.22, 79.43, 90.4],
  values: [
    // front (+u) extreme: u, mm
    [1.8, 2.6, 2.6, 3, 2, 1.8],
    // front (+u) extreme: v, mm
    [0, 0, 0, 0, 0, 0],
    // side (+v) extreme: u, mm
    [0, 0, 0, 0, 0, 0],
    // side (+v) extreme: v, mm
    [1.8, 2.6, 2.6, 3, 2, 1.8],
    // back (-u) extreme: u, mm
    [-1.8, -2.6, -2.6, -3, -2, -1.8],
    // back (-u) extreme: v, mm
    [0, 0, 0, 0, 0, 0],
    // side (-v) extreme: u, mm
    [0, 0, 0, 0, 0, 0],
    // side (-v) extreme: v, mm
    [-1.8, -2.6, -2.6, -3, -2, -1.8],
    // shoulder rho of the arc after anchor 0, share
    [0.4142, 0.4142, 0.4142, 0.4142, 0.4142, 0.4142],
    // shoulder rho of the arc after anchor 1, share
    [0.4142, 0.4142, 0.4142, 0.4142, 0.4142, 0.4142],
    // shoulder rho of the arc after anchor 2, share
    [0.4142, 0.4142, 0.4142, 0.4142, 0.4142, 0.4142],
    // shoulder rho of the arc after anchor 3, share
    [0.4142, 0.4142, 0.4142, 0.4142, 0.4142, 0.4142],
  ],

  // The front end is buried in the head, the back end in the plate's lobule.
  tips: [{ from: 3, tip: 0 }, { from: 90.4, tip: 93.4 }],
};
