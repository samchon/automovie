import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";

/**
 * f1's toe.middle tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes and one median point per quarter, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 24 to 44 mm, 21 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.15 mm from it on average and at most 0.74 mm. 63 independent numbers.
 */
export const AutoMovieHumanF1ToeMiddle: AutoMovieHumanConicLoft.IFamily = {
  name: "toe.middle",
  centres: [AutoMovieHumanF1Joints.middletoe1, AutoMovieHumanF1Joints.middletoe2, AutoMovieHumanF1Joints.middletoeEnd],
  halves: [5],
  up: AutoMovieHumanF1Placement.direction("toe.middle.up"),
  layout: AutoMovieHumanConicSection.limb(1),
  knots: [24, 34, 44],
  values: [
    // front (+u) extreme: u, mm
    [5.82, 4.54, 3.84],
    // front (+u) extreme: v, mm
    [1.48, 1.12, 0.66],
    // median fullness f of the arc pair around anchor 1, share
    [0.4735, 0.4768, 0.4585],
    // side (+v) extreme: u, mm
    [-1.02, -2.47, -1.51],
    // side (+v) extreme: v, mm
    [6.44, 7.01, 5.89],
    // median fullness f of the arc pair around anchor 3, share
    [0.497, 0.4729, 0.4837],
    // back (-u) extreme: u, mm
    [-11.14, -9.74, -6.78],
    // back (-u) extreme: v, mm
    [0.31, -0.72, -0.54],
    // median fullness f of the arc pair around anchor 5, share
    [0.473, 0.4719, 0.4913],
    // side (-v) extreme: u, mm
    [-2.97, -4.98, -2],
    // side (-v) extreme: v, mm
    [-6.31, -6.76, -6.11],
    // median fullness f of the arc pair around anchor 7, share
    [0.4223, 0.4824, 0.426],
    // shoulder rho of the arc after anchor 0, share
    [0.4855, 0.5016, 0.4902],
    // shoulder rho of the arc after anchor 1, share
    [0.5009, 0.5026, 0.498],
    // shoulder rho of the arc after anchor 2, share
    [0.4994, 0.4978, 0.4977],
    // shoulder rho of the arc after anchor 3, share
    [0.5053, 0.4978, 0.5021],
    // shoulder rho of the arc after anchor 4, share
    [0.5243, 0.496, 0.4995],
    // shoulder rho of the arc after anchor 5, share
    [0.5047, 0.4997, 0.4895],
    // shoulder rho of the arc after anchor 6, share
    [0.4968, 0.4997, 0.4951],
    // shoulder rho of the arc after anchor 7, share
    [0.4841, 0.4979, 0.4887],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 44, tip: 47.63}],
};
