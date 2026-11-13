import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's breast tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes and one median point per quarter, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 11 to 28 mm, 35 sections 0.5 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the vertices of each section's hull lie
 * 0.12 mm from it on average and at most 1.45 mm; what lies inside that hull is not modelled. 105 independent numbers.
 */
export const AutoMovieHumanF1Breast: AutoMovieHumanConicLoft.IFamily = {
  name: "breast",
  centres: [AutoMovieHumanF1Joints.breastRoot, AutoMovieHumanF1Joints.breastTip],
  halves: [],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.limb(1),
  knots: [11, 15, 19.5, 23, 28],
  values: [
    // front (+u) extreme: u, mm
    [57.94, 49.55, 39.36, 30.76, 15.57],
    // front (+u) extreme: v, mm
    [1.29, 1.49, 1.28, -0.17, -1.1],
    // median fullness f of the arc pair around anchor 1, share
    [0.4293, 0.4115, 0.3849, 0.4143, 0.4752],
    // side (+v) extreme: u, mm
    [7.03, 4.84, 4.26, 0, -1.65],
    // side (+v) extreme: v, mm
    [49.71, 45.11, 38.69, 32.42, 16.59],
    // median fullness f of the arc pair around anchor 3, share
    [0.4496, 0.3952, 0.4384, 0.3862, 0.444],
    // back (-u) extreme: u, mm
    [-44.05, -39.71, -33.66, -28.23, -15.12],
    // back (-u) extreme: v, mm
    [3.45, 6.54, 2.72, 4.65, 3.95],
    // median fullness f of the arc pair around anchor 5, share
    [0.3889, 0.4137, 0.3843, 0.3802, 0.4123],
    // side (-v) extreme: u, mm
    [10.04, 7.75, 3.38, 0.49, 0.04],
    // side (-v) extreme: v, mm
    [-47.57, -42.96, -36.11, -30.3, -16.71],
    // median fullness f of the arc pair around anchor 7, share
    [0.441, 0.4245, 0.4446, 0.4452, 0.4373],
    // shoulder rho of the arc after anchor 0, share
    [0.5443, 0.5114, 0.5101, 0.47, 0.6574],
    // shoulder rho of the arc after anchor 1, share
    [0.4704, 0.4542, 0.4564, 0.4475, 1.0792],
    // shoulder rho of the arc after anchor 2, share
    [0.4341, 0.4472, 0.5013, 0.3858, 0.9015],
    // shoulder rho of the arc after anchor 3, share
    [0.5524, 0.4805, 0.5858, 0.4291, 0.749],
    // shoulder rho of the arc after anchor 4, share
    [0.3906, 0.4641, 0.4595, 0.4748, 1.0626],
    // shoulder rho of the arc after anchor 5, share
    [0.4938, 0.4586, 0.5017, 0.36, 0.652],
    // shoulder rho of the arc after anchor 6, share
    [0.5033, 0.4578, 0.5507, 0.4971, 0.9402],
    // shoulder rho of the arc after anchor 7, share
    [0.4659, 0.4798, 0.4359, 0.353, 0.7637],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 26, tip: 29.88}],
};
