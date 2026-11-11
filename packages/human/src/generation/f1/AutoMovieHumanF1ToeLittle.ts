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
    [4.3, 3.67, 2.56],
    // front (+u) extreme: v, mm
    [-0.14, 0.64, 1.01],
    // side (+v) extreme: u, mm
    [-3.84, -5.63, -6.52],
    // side (+v) extreme: v, mm
    [5.66, 6.22, 6.55],
    // back (-u) extreme: u, mm
    [-10.72, -10.97, -10.91],
    // back (-u) extreme: v, mm
    [-0.04, 0.82, 1.43],
    // side (-v) extreme: u, mm
    [-2.52, -3.11, -4.32],
    // side (-v) extreme: v, mm
    [-6.82, -6.29, -5.31],
    // shoulder rho of the arc after anchor 0, share
    [0.4221, 0.4538, 0.4228],
    // shoulder rho of the arc after anchor 1, share
    [0.4655, 0.4347, 0.4513],
    // shoulder rho of the arc after anchor 2, share
    [0.4586, 0.4436, 0.4146],
    // shoulder rho of the arc after anchor 3, share
    [0.3593, 0.4164, 0.4412],
  ],
};
