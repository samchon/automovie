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
 * 0.07 mm from it on average and at most 0.48 mm. 104 independent numbers.
 */
export const AutoMovieHumanF1FingerMiddle: AutoMovieHumanConicLoft.IFamily = {
  name: "finger.middle",
  centres: [AutoMovieHumanF1Joints.middle1, AutoMovieHumanF1Joints.middle2, AutoMovieHumanF1Joints.middle3, AutoMovieHumanF1Joints.beyond(AutoMovieHumanF1Joints.middle2, AutoMovieHumanF1Joints.middle3, 26)],
  halves: [5,5],
  up: [1, 0, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [21, 41, 49, 55, 61, 69, 79, 89],
  values: [
    // front (+u) extreme: u, mm
    [8.41, 9.01, 8.85, 8.39, 8.15, 7.82, 7.77, 6.07],
    // front (+u) extreme: v, mm
    [4.1, -0.64, -0.02, -0.23, 0.43, -0.12, 0.81, 0.13],
    // side (+v) extreme: u, mm
    [4.38, 0.4, 1.77, 0.47, 0.53, 0.19, 0.26, 0.58],
    // side (+v) extreme: v, mm
    [9.83, 8.79, 7.44, 7.14, 7.12, 6.41, 6.95, 4.98],
    // back (-u) extreme: u, mm
    [-9.11, -8.96, -8.57, -8.01, -7.76, -7.32, -7.16, -5.71],
    // back (-u) extreme: v, mm
    [1.62, -0.29, -0.8, 0.32, 0.05, 0.35, 0.62, 0.49],
    // side (-v) extreme: u, mm
    [-0.26, -0.93, -0.71, 0.33, -0.49, 0.1, 0.08, 2.24],
    // side (-v) extreme: v, mm
    [-7.63, -8.53, -8.02, -7.61, -7.2, -6.67, -5.05, -3.93],
    // shoulder rho of the arc after anchor 0, share
    [0.2397, 0.4601, 0.3956, 0.4741, 0.4387, 0.4825, 0.3972, 0.4792],
    // shoulder rho of the arc after anchor 1, share
    [0.596, 0.4366, 0.47, 0.4073, 0.4329, 0.4068, 0.3927, 0.3923],
    // shoulder rho of the arc after anchor 2, share
    [0.3619, 0.3989, 0.3961, 0.4444, 0.4037, 0.4664, 0.3977, 0.4039],
    // shoulder rho of the arc after anchor 3, share
    [0.5008, 0.4535, 0.4522, 0.3894, 0.4602, 0.4605, 0.4256, 0.06],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 89, tip: 92.63}],
};
