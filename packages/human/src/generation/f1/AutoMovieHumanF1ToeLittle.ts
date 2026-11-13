import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's toe.little tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes and one median point per quarter, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 20 to 30 mm, 11 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.14 mm from it on average and at most 0.54 mm. 63 independent numbers.
 */
export const AutoMovieHumanF1ToeLittle: AutoMovieHumanConicLoft.IFamily = {
  name: "toe.little",
  centres: [AutoMovieHumanF1Joints.littletoe1, AutoMovieHumanF1Joints.littletoe2, AutoMovieHumanF1Joints.beyond(AutoMovieHumanF1Joints.littletoe2, AutoMovieHumanF1Joints.littletoePad, 4)],
  halves: [5],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.limb(1),
  knots: [20, 25, 30],
  values: [
    // front (+u) extreme: u, mm
    [4.88, 3.82, 1.78],
    // front (+u) extreme: v, mm
    [0.23, -0.22, -0.45],
    // median fullness f of the arc pair around anchor 1, share
    [0.4994, 0.4993, 0.499],
    // side (+v) extreme: u, mm
    [-3.05, -4.23, -3.57],
    // side (+v) extreme: v, mm
    [4.87, 4.93, 4.2],
    // median fullness f of the arc pair around anchor 3, share
    [0.4996, 0.4996, 0.4998],
    // back (-u) extreme: u, mm
    [-9.6, -8.74, -6.72],
    // back (-u) extreme: v, mm
    [-0.4, 0.08, 0.53],
    // median fullness f of the arc pair around anchor 5, share
    [0.4993, 0.4993, 0.4996],
    // side (-v) extreme: u, mm
    [-2.92, -3.45, -3.47],
    // side (-v) extreme: v, mm
    [-7.18, -6.2, -4.67],
    // median fullness f of the arc pair around anchor 7, share
    [0.4983, 0.4988, 0.4974],
    // shoulder rho of the arc after anchor 0, share
    [0.5, 0.4999, 0.4995],
    // shoulder rho of the arc after anchor 1, share
    [0.5, 0.5, 0.5],
    // shoulder rho of the arc after anchor 2, share
    [0.5, 0.5, 0.5],
    // shoulder rho of the arc after anchor 3, share
    [0.5, 0.5, 0.5],
    // shoulder rho of the arc after anchor 4, share
    [0.5, 0.5, 0.5],
    // shoulder rho of the arc after anchor 5, share
    [0.4999, 0.4999, 0.4999],
    // shoulder rho of the arc after anchor 6, share
    [0.4998, 0.5002, 0.5002],
    // shoulder rho of the arc after anchor 7, share
    [0.4998, 0.5002, 0.4998],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 30, tip: 33.63}],
};
