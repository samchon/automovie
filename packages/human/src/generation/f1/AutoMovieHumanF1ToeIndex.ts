import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's toe.index tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes and one median point per quarter, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 25 to 43 mm, 19 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.13 mm from it on average and at most 0.6 mm. 63 independent numbers.
 */
export const AutoMovieHumanF1ToeIndex: AutoMovieHumanConicLoft.IFamily = {
  name: "toe.index",
  centres: [AutoMovieHumanF1Joints.indextoe1, AutoMovieHumanF1Joints.indextoe2, AutoMovieHumanF1Joints.beyond(AutoMovieHumanF1Joints.indextoe1, AutoMovieHumanF1Joints.indextoe2, 18)],
  halves: [5],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.limb(1),
  knots: [25, 34, 43],
  values: [
    // front (+u) extreme: u, mm
    [4.65, 3.84, 1.29],
    // front (+u) extreme: v, mm
    [-0.68, -0.13, 0.01],
    // median fullness f of the arc pair around anchor 1, share
    [0.4991, 0.4987, 0.4942],
    // side (+v) extreme: u, mm
    [-7.7, -5.11, -8.16],
    // side (+v) extreme: v, mm
    [7.28, 7.79, 8.61],
    // median fullness f of the arc pair around anchor 3, share
    [0.5036, 0.4978, 0.4989],
    // back (-u) extreme: u, mm
    [-14.2, -12.93, -13.92],
    // back (-u) extreme: v, mm
    [-4.08, 1.54, 0.09],
    // median fullness f of the arc pair around anchor 5, share
    [0.4969, 0.5007, 0.4963],
    // side (-v) extreme: u, mm
    [-2.13, -4.53, -7.19],
    // side (-v) extreme: v, mm
    [-7.94, -7.98, -8.22],
    // median fullness f of the arc pair around anchor 7, share
    [0.4972, 0.4996, 0.4926],
    // shoulder rho of the arc after anchor 0, share
    [0.4994, 0.5002, 0.4995],
    // shoulder rho of the arc after anchor 1, share
    [0.5004, 0.4998, 0.5001],
    // shoulder rho of the arc after anchor 2, share
    [0.4991, 0.5001, 0.4997],
    // shoulder rho of the arc after anchor 3, share
    [0.5012, 0.4997, 0.4997],
    // shoulder rho of the arc after anchor 4, share
    [0.5015, 0.5, 0.4997],
    // shoulder rho of the arc after anchor 5, share
    [0.4995, 0.4996, 0.4995],
    // shoulder rho of the arc after anchor 6, share
    [0.4996, 0.5001, 0.4994],
    // shoulder rho of the arc after anchor 7, share
    [0.5, 0.5, 0.5],
  ],
};
