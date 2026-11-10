import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";

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
 * 0.11 mm from it on average and at most 0.64 mm. 65 independent numbers.
 */
export const AutoMovieHumanF1ToeBig: AutoMovieHumanConicLoft.IFamily = {
  name: "toe.big",
  centres: [[146.79, 19.12, 132.1], [174.35, 15.57, 139.54], [201.17, 12.12, 146.78]],
  halves: [5],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [21, 29, 36.5, 43, 52],
  values: [
    // front (+u) extreme: u, mm
    [6.95, 6.73, 5.41, 5.68, 7.37],
    // front (+u) extreme: v, mm
    [-2.42, -3.77, -3.91, -3.7, -3.3],
    // side (+v) extreme: u, mm
    [-6.46, -7.1, -6.45, -5.03, -2.38],
    // side (+v) extreme: v, mm
    [9.98, 10.71, 10.28, 8.8, 5.02],
    // back (-u) extreme: u, mm
    [-15.33, -15.55, -14.8, -13.32, -8.95],
    // back (-u) extreme: v, mm
    [-5.46, -4.43, -4.98, -5.57, -2.95],
    // side (-v) extreme: u, mm
    [-8.94, -7.14, -6.14, -3.19, -1.68],
    // side (-v) extreme: v, mm
    [-13.55, -14.93, -15.61, -15.38, -12.83],
    // shoulder rho of the arc after anchor 0, share
    [0.4267, 0.4228, 0.3934, 0.3357, 0.3685],
    // shoulder rho of the arc after anchor 1, share
    [0.4752, 0.4693, 0.4677, 0.463, 0.4178],
    // shoulder rho of the arc after anchor 2, share
    [0.4889, 0.4929, 0.4855, 0.5149, 0.569],
    // shoulder rho of the arc after anchor 3, share
    [0.5157, 0.4097, 0.4488, 0.3623, 0.3338],
  ],
};
