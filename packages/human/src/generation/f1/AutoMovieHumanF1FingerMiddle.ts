import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's finger.middle tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 21 to 89 mm, 69 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.07 mm from it on average and at most 0.57 mm. 104 independent numbers.
 */
export const AutoMovieHumanF1FingerMiddle: AutoMovieHumanConicLoft.IFamily = {
  name: "finger.middle",
  centres: [AutoMovieHumanF1Joints.middle1, AutoMovieHumanF1Joints.middle2, AutoMovieHumanF1Joints.middle3, AutoMovieHumanF1Joints.beyond(AutoMovieHumanF1Joints.middle3, AutoMovieHumanF1Joints.middlePad, 4)],
  halves: [5,5],
  up: [1, 0, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [21, 33, 41, 49, 61, 69, 81, 89],
  values: [
    // front (+u) extreme: u, mm
    [8.42, 8.79, 9.08, 8.76, 8.13, 7.85, 7.32, 5.56],
    // front (+u) extreme: v, mm
    [2.77, -0.26, 0.01, -0.18, 0.23, 0.14, 1.36, 1.28],
    // side (+v) extreme: u, mm
    [3.63, -0.37, 1.36, 1.29, 0.61, 0.43, -0.01, 0.45],
    // side (+v) extreme: v, mm
    [9.88, 9.61, 8.8, 7.38, 7.08, 6.51, 7.06, 5.38],
    // back (-u) extreme: u, mm
    [-9.14, -9.02, -9.07, -8.48, -7.71, -7.35, -7.19, -6.16],
    // back (-u) extreme: v, mm
    [1.5, 1.43, -0.67, -0.4, 0.21, 0.35, 0.87, 1.15],
    // side (-v) extreme: u, mm
    [0.01, -0.03, -1.86, -0.41, 0.07, -0.08, -0.21, 0.81],
    // side (-v) extreme: v, mm
    [-7.74, -8.39, -8.59, -7.98, -7.27, -6.61, -4.54, -3.28],
    // shoulder rho of the arc after anchor 0, share
    [0.4011, 0.4937, 0.4067, 0.4344, 0.4502, 0.4534, 0.3903, 0.4633],
    // shoulder rho of the arc after anchor 1, share
    [0.5972, 0.3991, 0.4683, 0.4561, 0.4413, 0.4228, 0.4044, 0.4044],
    // shoulder rho of the arc after anchor 2, share
    [0.3743, 0.4548, 0.3586, 0.4198, 0.4311, 0.4611, 0.3764, 0.3866],
    // shoulder rho of the arc after anchor 3, share
    [0.453, 0.4257, 0.507, 0.4429, 0.4281, 0.4854, 0.4198, 0.2515],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 89, tip: 92.88}],
};
