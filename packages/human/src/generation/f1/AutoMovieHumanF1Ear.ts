import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's ear tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes and one median point per quarter, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference head cut by this course's own planes over stations 4 to 18 mm, 28 sections 0.5 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the vertices of each section's hull lie
 * 0.08 mm from it on average and at most 0.36 mm; the concha's hollow inside that hull is not modelled. 105 independent numbers.
 */
export const AutoMovieHumanF1Ear: AutoMovieHumanConicLoft.IFamily = {
  name: "ear",
  centres: [AutoMovieHumanF1Joints.earRoot, AutoMovieHumanF1Joints.earTip],
  halves: [],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.limb(1),
  knots: [4, 7, 11, 14, 18],
  values: [
    // front (+u) extreme: u, mm
    [17.7, 20.13, 22.24, 22.35, 19.98],
    // front (+u) extreme: v, mm
    [12.96, 9.38, 6.39, 4.11, -0.02],
    // median fullness f of the arc pair around anchor 1, share
    [0.4712, 0.4408, 0.5238, 0.5548, 0.5908],
    // side (+v) extreme: u, mm
    [11.9, 15.6, 16.23, 16.89, 23.61],
    // side (+v) extreme: v, mm
    [18.13, 16.34, 13.05, 9.1, 1.99],
    // median fullness f of the arc pair around anchor 3, share
    [0.4627, 0.3964, 0.1786, 0.0584, 0.44],
    // back (-u) extreme: u, mm
    [-36.41, -33.93, -28.79, -23.45, -13.34],
    // back (-u) extreme: v, mm
    [15.06, 9.75, 5.48, 2.21, -2.15],
    // median fullness f of the arc pair around anchor 5, share
    [0.2478, 0.2832, 0.4215, 0.3812, 0.3483],
    // side (-v) extreme: u, mm
    [-5.4, -3.46, -0.99, 4.18, 4.17],
    // side (-v) extreme: v, mm
    [-5.13, -4.26, -4.82, -6.55, -9.65],
    // median fullness f of the arc pair around anchor 7, share
    [0.3422, 0.2529, 0.3881, 0.4178, 0.2564],
    // shoulder rho of the arc after anchor 0, share
    [0.4183, 0.8196, 0.5462, 0.4898, 1.1137],
    // shoulder rho of the arc after anchor 1, share
    [0.3624, 0.3414, 0.06, 0.2688, 1.0042],
    // shoulder rho of the arc after anchor 2, share
    [0.0677, 0.1132, 0.5248, 0.5744, 0.4218],
    // shoulder rho of the arc after anchor 3, share
    [0.5692, 0.8566, 0.9011, 0.8724, -0.3203],
    // shoulder rho of the arc after anchor 4, share
    [0.7928, 0.5566, 0.5446, 0.6316, 0.3492],
    // shoulder rho of the arc after anchor 5, share
    [0.6519, 0.4506, 0.0597, 0.5253, 0.405],
    // shoulder rho of the arc after anchor 6, share
    [0.5232, 0.5143, 0.3565, 0.4296, 0.2772],
    // shoulder rho of the arc after anchor 7, share
    [0.5291, 0.517, 0.5095, 0.3292, 0.5412],
  ],

  // The part closes in a point at `tip`, the side distance of the auricle's rim; its cap starts at `from`.
  tips: [null, {from: 18, tip: 23}],
};
