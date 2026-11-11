import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's toe.big tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 21 to 52 mm, 32 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.1 mm from it on average and at most 0.61 mm. 65 independent numbers.
 */
export const AutoMovieHumanF1ToeBig: AutoMovieHumanConicLoft.IFamily = {
  name: "toe.big",
  centres: [AutoMovieHumanF1Joints.bigtoe1, AutoMovieHumanF1Joints.bigtoe2, AutoMovieHumanF1Joints.beyond(AutoMovieHumanF1Joints.bigtoe1, AutoMovieHumanF1Joints.bigtoe2, 28)],
  halves: [5],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [21, 29, 36.5, 43, 52],
  values: [
    // front (+u) extreme: u, mm
    [7.03, 6.81, 5.28, 5.64, 7.24],
    // front (+u) extreme: v, mm
    [-2.64, -3.96, -4.4, -2.95, -3.69],
    // side (+v) extreme: u, mm
    [-5.98, -7.19, -6.61, -4.44, -2.26],
    // side (+v) extreme: v, mm
    [9.99, 10.74, 10.24, 8.8, 4.94],
    // back (-u) extreme: u, mm
    [-15.3, -15.54, -14.77, -13.33, -8.9],
    // back (-u) extreme: v, mm
    [-5.92, -3.73, -4.77, -5.88, -4.4],
    // side (-v) extreme: u, mm
    [-8.96, -6.71, -5.91, -4.02, -1.93],
    // side (-v) extreme: v, mm
    [-13.57, -14.93, -15.59, -15.36, -12.82],
    // shoulder rho of the arc after anchor 0, share
    [0.409, 0.4222, 0.4181, 0.2832, 0.3872],
    // shoulder rho of the arc after anchor 1, share
    [0.5003, 0.4513, 0.4599, 0.4957, 0.4698],
    // shoulder rho of the arc after anchor 2, share
    [0.4626, 0.5265, 0.4971, 0.4921, 0.5056],
    // shoulder rho of the arc after anchor 3, share
    [0.5065, 0.382, 0.4341, 0.4191, 0.3551],
  ],

  // Past its last knot the part closes in a point at this station, where the reference's own loop vanishes.
  tips: [null, 55.38],
};
