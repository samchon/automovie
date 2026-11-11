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
 * 0.1 mm from it on average and at most 0.75 mm. 65 independent numbers.
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
    [7.83, 6.64, 5.95, 6.55, 6],
    // front (+u) extreme: v, mm
    [-0.46, 0.58, -0.24, 1.32, -0.11],
    // side (+v) extreme: u, mm
    [0.09, -1.35, -2.94, 1.08, 0.73],
    // side (+v) extreme: v, mm
    [6.99, 7.44, 6.05, 6.22, 5.42],
    // back (-u) extreme: u, mm
    [-7.73, -7.63, -7.04, -5.22, -3.51],
    // back (-u) extreme: v, mm
    [-0.68, 1.06, 0.63, 1.67, 2.39],
    // side (-v) extreme: u, mm
    [0.37, 0.39, 0.52, 0.66, 1.78],
    // side (-v) extreme: v, mm
    [-8.28, -6.42, -5.87, -3.69, -1.91],
    // shoulder rho of the arc after anchor 0, share
    [0.4074, 0.4539, 0.5376, 0.3403, 0.5671],
    // shoulder rho of the arc after anchor 1, share
    [0.4716, 0.4306, 0.3725, 0.4802, 0.4798],
    // shoulder rho of the arc after anchor 2, share
    [0.4539, 0.4224, 0.4492, 0.3524, 0.3787],
    // shoulder rho of the arc after anchor 3, share
    [0.3131, 0.4186, 0.3937, 0.4042, 0.1811],
  ],
};
