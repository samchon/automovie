import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's toe.little tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 18 to 24 mm, 7 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.03 mm from it on average and at most 0.15 mm. 39 independent numbers.
 */
export const AutoMovieHumanF1ToeLittle: AutoMovieHumanConicLoft.IFamily = {
  name: "toe.little",
  centres: [AutoMovieHumanF1Joints.littletoe1, AutoMovieHumanF1Joints.littletoe2, AutoMovieHumanF1Joints.beyond(AutoMovieHumanF1Joints.littletoe1, AutoMovieHumanF1Joints.littletoe2, 14)],
  halves: [5],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [18, 21, 24],
  values: [
    // front (+u) extreme: u, mm
    [4.27, 3.68, 2.58],
    // front (+u) extreme: v, mm
    [-0.19, 0.57, 1.03],
    // side (+v) extreme: u, mm
    [-3.84, -5.52, -6.51],
    // side (+v) extreme: v, mm
    [5.66, 6.23, 6.53],
    // back (-u) extreme: u, mm
    [-10.72, -10.97, -10.93],
    // back (-u) extreme: v, mm
    [-0.01, 0.63, 1.37],
    // side (-v) extreme: u, mm
    [-2.43, -3.21, -4.33],
    // side (-v) extreme: v, mm
    [-6.82, -6.3, -5.3],
    // shoulder rho of the arc after anchor 0, share
    [0.4256, 0.4465, 0.4197],
    // shoulder rho of the arc after anchor 1, share
    [0.4667, 0.4493, 0.452],
    // shoulder rho of the arc after anchor 2, share
    [0.4642, 0.4279, 0.4074],
    // shoulder rho of the arc after anchor 3, share
    [0.3602, 0.4158, 0.4392],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 24, tip: 27.13}],
};
