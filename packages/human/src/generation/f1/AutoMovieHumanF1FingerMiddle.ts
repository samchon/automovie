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
 * 0.08 mm from it on average and at most 0.5 mm. 91 independent numbers.
 */
export const AutoMovieHumanF1FingerMiddle: AutoMovieHumanConicLoft.IFamily = {
  name: "finger.middle",
  centres: [AutoMovieHumanF1Joints.middle1, AutoMovieHumanF1Joints.middle2, AutoMovieHumanF1Joints.middle3, AutoMovieHumanF1Joints.beyond(AutoMovieHumanF1Joints.middle2, AutoMovieHumanF1Joints.middle3, 26)],
  halves: [5,5],
  up: [1, 0, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [21, 41, 49, 55, 69, 79, 89],
  values: [
    // front (+u) extreme: u, mm
    [8.41, 9, 8.85, 8.45, 7.85, 7.75, 6.08],
    // front (+u) extreme: v, mm
    [4.24, -0.71, -0.04, 0.06, -0.05, 0.87, 0.13],
    // side (+v) extreme: u, mm
    [4.61, 0.46, 2.03, 0.36, 0.2, 0.28, 0.54],
    // side (+v) extreme: v, mm
    [9.79, 8.76, 7.39, 7.32, 6.49, 6.9, 5.02],
    // back (-u) extreme: u, mm
    [-9.09, -8.94, -8.54, -8.11, -7.36, -7.14, -5.74],
    // back (-u) extreme: v, mm
    [1.45, -0.25, -0.94, 0.32, 0.22, 0.61, 0.46],
    // side (-v) extreme: u, mm
    [-0.31, -0.79, -0.62, -0.02, -0.19, 0, 2.23],
    // side (-v) extreme: v, mm
    [-7.64, -8.53, -8.03, -7.56, -6.65, -5.06, -3.91],
    // shoulder rho of the arc after anchor 0, share
    [0.2113, 0.4627, 0.384, 0.4561, 0.4767, 0.3952, 0.4849],
    // shoulder rho of the arc after anchor 1, share
    [0.6085, 0.4395, 0.488, 0.3903, 0.4126, 0.3942, 0.3928],
    // shoulder rho of the arc after anchor 2, share
    [0.3531, 0.4071, 0.3949, 0.4285, 0.4473, 0.3923, 0.4055],
    // shoulder rho of the arc after anchor 3, share
    [0.5055, 0.4462, 0.4479, 0.4117, 0.4722, 0.4341, 0.0599],
  ],
};
