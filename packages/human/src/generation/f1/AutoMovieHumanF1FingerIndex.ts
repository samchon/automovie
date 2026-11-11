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
 * 0.05 mm from it on average and at most 0.37 mm. 117 independent numbers.
 */
export const AutoMovieHumanF1FingerIndex: AutoMovieHumanConicLoft.IFamily = {
  name: "finger.index",
  centres: [AutoMovieHumanF1Joints.index1, AutoMovieHumanF1Joints.index2, AutoMovieHumanF1Joints.index3, AutoMovieHumanF1Joints.beyond(AutoMovieHumanF1Joints.index2, AutoMovieHumanF1Joints.index3, 26)],
  halves: [5,5],
  up: [1, 0, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [18, 24, 30, 36, 49, 60, 66, 74, 80],
  values: [
    // front (+u) extreme: u, mm
    [9.24, 9.23, 9.15, 9.24, 8.33, 7.84, 7.74, 7, 5.67],
    // front (+u) extreme: v, mm
    [1.49, 1.29, 1.64, 1.52, 2.65, 2.52, 1.9, 2.94, 3.16],
    // side (+v) extreme: u, mm
    [1.6, 1.01, 1.25, 1.48, 1.51, 1.04, 0, 1.1, 1.03],
    // side (+v) extreme: v, mm
    [9.3, 9.83, 9.83, 9.35, 8.79, 7.66, 7.8, 7.78, 6.56],
    // back (-u) extreme: u, mm
    [-9.47, -9.04, -9.01, -8.88, -8.04, -7.12, -7.11, -6.71, -5.53],
    // back (-u) extreme: v, mm
    [1.09, 1.66, 1.63, 1.19, 1.53, 1.48, 2.08, 1.38, 1.44],
    // side (-v) extreme: u, mm
    [0.11, -0.6, -1.12, -1.24, -0.71, -0.98, -0.49, -0.06, 0.64],
    // side (-v) extreme: v, mm
    [-8.42, -8.01, -7.59, -7.35, -5.97, -5.38, -4.69, -2.73, -1.69],
    // shoulder rho of the arc after anchor 0, share
    [0.4057, 0.4284, 0.4176, 0.4066, 0.4077, 0.4123, 0.5055, 0.4048, 0.4283],
    // shoulder rho of the arc after anchor 1, share
    [0.3522, 0.3546, 0.3956, 0.3946, 0.404, 0.4062, 0.3307, 0.4477, 0.4799],
    // shoulder rho of the arc after anchor 2, share
    [0.3984, 0.429, 0.4312, 0.438, 0.4195, 0.3864, 0.4477, 0.4216, 0.3814],
    // shoulder rho of the arc after anchor 3, share
    [0.4055, 0.4086, 0.4014, 0.4022, 0.4072, 0.4535, 0.3932, 0.3283, 0.2875],
  ],
};
