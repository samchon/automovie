import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's finger.index tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 18 to 80 mm, 63 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.05 mm from it on average and at most 0.33 mm. 117 independent numbers.
 */
export const AutoMovieHumanF1FingerIndex: AutoMovieHumanConicLoft.IFamily = {
  name: "finger.index",
  centres: [AutoMovieHumanF1Joints.index1, AutoMovieHumanF1Joints.index2, AutoMovieHumanF1Joints.index3, AutoMovieHumanF1Joints.beyond(AutoMovieHumanF1Joints.index2, AutoMovieHumanF1Joints.index3, 26)],
  halves: [5,5],
  up: [1, 0, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [18, 24, 30, 38, 49, 60, 66, 74, 80],
  values: [
    // front (+u) extreme: u, mm
    [9.24, 9.24, 9.14, 9.19, 8.32, 7.84, 7.75, 6.99, 5.7],
    // front (+u) extreme: v, mm
    [1.3, 1.56, 1.62, 1.67, 2.37, 2.35, 2.19, 3.02, 3.1],
    // side (+v) extreme: u, mm
    [1.29, 1.33, 1.22, 1.58, 1.35, 1.09, 0.66, 0.74, 0.84],
    // side (+v) extreme: v, mm
    [9.29, 9.81, 9.8, 9.22, 8.8, 7.62, 7.81, 7.81, 6.61],
    // back (-u) extreme: u, mm
    [-9.47, -9.06, -9, -8.82, -8.03, -7.12, -7.08, -6.75, -5.55],
    // back (-u) extreme: v, mm
    [1.5, 1.2, 1.64, 0.94, 1.63, 1.52, 1.64, 1.72, 1.71],
    // side (-v) extreme: u, mm
    [0.38, -0.77, -1.21, -1.2, -0.67, -0.84, -0.76, -0.16, 0.81],
    // side (-v) extreme: v, mm
    [-8.41, -8.03, -7.57, -7.25, -5.95, -5.4, -4.71, -2.68, -1.69],
    // shoulder rho of the arc after anchor 0, share
    [0.4271, 0.4052, 0.4223, 0.401, 0.4234, 0.4243, 0.4575, 0.4205, 0.4175],
    // shoulder rho of the arc after anchor 1, share
    [0.316, 0.3888, 0.3926, 0.4057, 0.3952, 0.4054, 0.3885, 0.4095, 0.4379],
    // shoulder rho of the arc after anchor 2, share
    [0.4222, 0.4017, 0.4282, 0.4172, 0.4301, 0.3927, 0.4097, 0.4565, 0.4224],
    // shoulder rho of the arc after anchor 3, share
    [0.3903, 0.4198, 0.407, 0.4074, 0.3924, 0.4438, 0.4183, 0.3418, 0.2717],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 80, tip: 83.38}],
};
