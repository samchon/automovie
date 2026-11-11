import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's finger.ring tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes and one median point per quarter, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 24 to 82 mm, 59 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.07 mm from it on average and at most 0.47 mm. 147 independent numbers.
 */
export const AutoMovieHumanF1FingerRing: AutoMovieHumanConicLoft.IFamily = {
  name: "finger.ring",
  centres: [AutoMovieHumanF1Joints.ring1, AutoMovieHumanF1Joints.ring2, AutoMovieHumanF1Joints.ring3, AutoMovieHumanF1Joints.beyond(AutoMovieHumanF1Joints.ring2, AutoMovieHumanF1Joints.ring3, 26)],
  halves: [5,5],
  up: [1, 0, 0],
  layout: AutoMovieHumanConicSection.limb(1),
  knots: [24, 38, 44, 53, 64, 74, 82],
  values: [
    // front (+u) extreme: u, mm
    [9.03, 7.98, 7.62, 6.97, 6.44, 6.54, 5.65],
    // front (+u) extreme: v, mm
    [3.24, -0.77, -0.75, 0.28, -0.39, 1.26, 0.35],
    // median fullness f of the arc pair around anchor 1, share
    [0.3966, 0.4717, 0.4396, 0.4336, 0.4397, 0.3669, 0.4144],
    // side (+v) extreme: u, mm
    [-1.86, 0.12, -0.47, -1.28, -0.75, -0.49, 0.72],
    // side (+v) extreme: v, mm
    [8.87, 9, 7.16, 7.05, 5.97, 6.45, 4.94],
    // median fullness f of the arc pair around anchor 3, share
    [0.3287, 0.4714, 0.4282, 0.4227, 0.4524, 0.3698, 0.4065],
    // back (-u) extreme: u, mm
    [-7.81, -8.72, -8.64, -8.01, -7.63, -6.91, -5.56],
    // back (-u) extreme: v, mm
    [2.94, 0.35, 0.87, 0.09, -0.57, 1.29, 1.55],
    // median fullness f of the arc pair around anchor 5, share
    [0.4652, 0.4568, 0.454, 0.3296, 0.4627, 0.4192, 0.39],
    // side (-v) extreme: u, mm
    [0.09, 1.32, 0.63, -2.56, 1.02, 0.97, 1.98],
    // side (-v) extreme: v, mm
    [-8.08, -7.56, -7.4, -6.98, -6.09, -4.65, -3.79],
    // median fullness f of the arc pair around anchor 7, share
    [0.4516, 0.4124, 0.4183, 0.492, 0.3832, 0.3715, 0.2107],
    // shoulder rho of the arc after anchor 0, share
    [0.2498, 0.6599, 0.5281, 0.459, 0.6026, 0.3228, 0.7367],
    // shoulder rho of the arc after anchor 1, share
    [0.7165, 0.4109, 0.5031, 0.4734, 0.5217, 0.4452, 0.4975],
    // shoulder rho of the arc after anchor 2, share
    [0.3842, 0.5999, 0.8006, 0.3368, 0.506, 0.314, 0.94],
    // shoulder rho of the arc after anchor 3, share
    [0.1308, 0.4493, 0.3466, 0.5217, 0.545, 0.3877, 0.3007],
    // shoulder rho of the arc after anchor 4, share
    [0.5639, 0.4528, 0.5661, 0.4848, 0.3189, 0.6606, 0.564],
    // shoulder rho of the arc after anchor 5, share
    [0.4177, 0.6244, 0.5632, 0.1396, 0.7095, 0.3604, 0.6995],
    // shoulder rho of the arc after anchor 6, share
    [0.5143, 0.4575, 0.4772, 0.7108, 0.3446, 0.0814, 0.0632],
    // shoulder rho of the arc after anchor 7, share
    [0.5049, 0.3486, 0.4014, 0.3975, 0.4845, 0.6192, 0.94],
  ],

  // Past its last knot the part closes in a point at this station, where the reference's own loop vanishes.
  tips: [null, 85.88],
};
