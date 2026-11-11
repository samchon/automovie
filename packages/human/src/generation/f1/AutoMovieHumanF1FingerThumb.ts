import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's finger.thumb tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 43 to 82 mm, 40 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.11 mm from it on average and at most 0.74 mm. 65 independent numbers.
 */
export const AutoMovieHumanF1FingerThumb: AutoMovieHumanConicLoft.IFamily = {
  name: "finger.thumb",
  centres: [AutoMovieHumanF1Joints.thumb1, AutoMovieHumanF1Joints.thumb2, AutoMovieHumanF1Joints.thumb3, AutoMovieHumanF1Joints.beyond(AutoMovieHumanF1Joints.thumb2, AutoMovieHumanF1Joints.thumb3, 30)],
  halves: [5,5],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [43, 51, 62.5, 69, 82],
  values: [
    // front (+u) extreme: u, mm
    [8.98, 7.76, 7.88, 7.12, 0.97],
    // front (+u) extreme: v, mm
    [-2.35, -0.88, -0.43, -0.03, -1.57],
    // side (+v) extreme: u, mm
    [-2.64, -1.97, -0.69, -2.92, -5.57],
    // side (+v) extreme: v, mm
    [11.28, 9.33, 8.68, 8.98, 7.45],
    // back (-u) extreme: u, mm
    [-13.66, -11.55, -9.77, -10.72, -12.73],
    // back (-u) extreme: v, mm
    [-5, -1.69, -2.22, -0.08, -1.37],
    // side (-v) extreme: u, mm
    [-10.13, -3.41, -2.23, -2.67, -4.75],
    // side (-v) extreme: v, mm
    [-11.88, -8.69, -8.96, -9.59, -9.94],
    // shoulder rho of the arc after anchor 0, share
    [0.4804, 0.4192, 0.4131, 0.4554, 0.4125],
    // shoulder rho of the arc after anchor 1, share
    [0.4215, 0.3892, 0.4841, 0.348, 0.4156],
    // shoulder rho of the arc after anchor 2, share
    [0.1041, 0.3862, 0.3453, 0.477, 0.4386],
    // shoulder rho of the arc after anchor 3, share
    [0.3463, 0.4014, 0.4262, 0.4233, 0.3051],
  ],

  // Past its last knot the part closes in a point at this station, where the reference's own loop vanishes.
  tips: [null, 85.88],
};
