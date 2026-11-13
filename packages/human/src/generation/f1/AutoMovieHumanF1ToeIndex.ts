import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's toe.index tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 25 to 53 mm, 29 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.07 mm from it on average and at most 0.28 mm. 65 independent numbers.
 */
export const AutoMovieHumanF1ToeIndex: AutoMovieHumanConicLoft.IFamily = {
  name: "toe.index",
  centres: [AutoMovieHumanF1Joints.indextoe1, AutoMovieHumanF1Joints.indextoe2, AutoMovieHumanF1Joints.beyond(AutoMovieHumanF1Joints.indextoe2, AutoMovieHumanF1Joints.indextoePad, 4)],
  halves: [5],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [25, 33, 39, 47, 53],
  values: [
    // front (+u) extreme: u, mm
    [4.68, 5.02, 4.68, 3.93, 4.43],
    // front (+u) extreme: v, mm
    [-1.46, 0.11, -0.17, -0.04, -0.02],
    // side (+v) extreme: u, mm
    [-5.87, -4.22, -3.99, -3.17, -2.01],
    // side (+v) extreme: v, mm
    [7.36, 7.72, 8, 8.33, 7.71],
    // back (-u) extreme: u, mm
    [-14.64, -12.62, -11.45, -10.16, -7],
    // back (-u) extreme: v, mm
    [-2.93, -0.75, 0.51, 0.58, -0.1],
    // side (-v) extreme: u, mm
    [-2.17, -2.69, -3.35, -2.97, -2.07],
    // side (-v) extreme: v, mm
    [-7.93, -8.15, -8.35, -8.49, -7.05],
    // shoulder rho of the arc after anchor 0, share
    [0.4644, 0.4131, 0.4428, 0.4007, 0.3773],
    // shoulder rho of the arc after anchor 1, share
    [0.5503, 0.4981, 0.4803, 0.4884, 0.4403],
    // shoulder rho of the arc after anchor 2, share
    [0.5106, 0.4375, 0.4492, 0.5049, 0.5438],
    // shoulder rho of the arc after anchor 3, share
    [0.3877, 0.4248, 0.4355, 0.4082, 0.3382],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 53, tip: 56.63}],
};
