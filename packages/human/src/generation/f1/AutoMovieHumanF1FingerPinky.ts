import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's finger.pinky tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 16 to 61 mm, 46 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.09 mm from it on average and at most 0.52 mm. 65 independent numbers.
 */
export const AutoMovieHumanF1FingerPinky: AutoMovieHumanConicLoft.IFamily = {
  name: "finger.pinky",
  centres: [AutoMovieHumanF1Joints.pinky1, AutoMovieHumanF1Joints.pinky2, AutoMovieHumanF1Joints.pinky3, AutoMovieHumanF1Joints.beyond(AutoMovieHumanF1Joints.pinky2, AutoMovieHumanF1Joints.pinky3, 22)],
  halves: [5,5],
  up: [1, 0, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [16, 28, 38.5, 54, 61],
  values: [
    // front (+u) extreme: u, mm
    [7.85, 6.66, 6.05, 6.53, 5.87],
    // front (+u) extreme: v, mm
    [-0.34, 0.64, -0.24, 1.77, 0.74],
    // side (+v) extreme: u, mm
    [0, -1.28, -2.32, 1.34, 0.66],
    // side (+v) extreme: v, mm
    [6.95, 7.52, 6.17, 6.17, 5.52],
    // back (-u) extreme: u, mm
    [-7.76, -7.7, -7.1, -5.26, -3.61],
    // back (-u) extreme: v, mm
    [-1.05, 1.45, 0.81, 1.72, 1.56],
    // side (-v) extreme: u, mm
    [0.09, 0.61, 0.09, 0.86, -0.93],
    // side (-v) extreme: v, mm
    [-8.36, -6.38, -6.01, -3.55, -2.09],
    // shoulder rho of the arc after anchor 0, share
    [0.4028, 0.4225, 0.4914, 0.2816, 0.4608],
    // shoulder rho of the arc after anchor 1, share
    [0.4735, 0.3887, 0.363, 0.4697, 0.4859],
    // shoulder rho of the arc after anchor 2, share
    [0.4013, 0.4461, 0.393, 0.3602, -0.0005],
    // shoulder rho of the arc after anchor 3, share
    [0.3174, 0.3928, 0.3642, 0.4549, 0.4628],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 61, tip: 64.13}],
};
