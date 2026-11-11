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
 * them: the section is a chain of conics through its four extremes and one median point per quarter, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 25 to 43 mm, 19 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.07 mm from it on average and at most 0.41 mm. 63 independent numbers.
 */
export const AutoMovieHumanF1ToeIndex: AutoMovieHumanConicLoft.IFamily = {
  name: "toe.index",
  centres: [AutoMovieHumanF1Joints.indextoe1, AutoMovieHumanF1Joints.indextoe2, AutoMovieHumanF1Joints.beyond(AutoMovieHumanF1Joints.indextoe1, AutoMovieHumanF1Joints.indextoe2, 18)],
  halves: [5],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.limb(1),
  knots: [25, 34, 43],
  values: [
    // front (+u) extreme: u, mm
    [4.72, 4.12, 1.41],
    // front (+u) extreme: v, mm
    [-1.2, -1.56, 2.19],
    // median fullness f of the arc pair around anchor 1, share
    [0.4226, 0.4973, 0.3993],
    // side (+v) extreme: u, mm
    [-4.23, -6.55, -8.18],
    // side (+v) extreme: v, mm
    [7.39, 7.93, 8.65],
    // median fullness f of the arc pair around anchor 3, share
    [0.6386, 0.3344, 0.3814],
    // back (-u) extreme: u, mm
    [-14.32, -13.01, -14.05],
    // back (-u) extreme: v, mm
    [-5.39, 3.28, 2.22],
    // median fullness f of the arc pair around anchor 5, share
    [0.333, 0.5122, 0.5581],
    // side (-v) extreme: u, mm
    [-3.71, -5.57, -4.67],
    // side (-v) extreme: v, mm
    [-8.01, -8.12, -8.22],
    // median fullness f of the arc pair around anchor 7, share
    [0.4626, 0.4178, 0.44],
    // shoulder rho of the arc after anchor 0, share
    [0.4756, 0.5836, 0.178],
    // shoulder rho of the arc after anchor 1, share
    [0.2626, 0.5492, 0.5757],
    // shoulder rho of the arc after anchor 2, share
    [0.5797, 0.4058, 0.2649],
    // shoulder rho of the arc after anchor 3, share
    [0.8037, 0.1125, 0.1602],
    // shoulder rho of the arc after anchor 4, share
    [0.06, 0.8651, 0.4249],
    // shoulder rho of the arc after anchor 5, share
    [0.2539, 0.2837, 0.67],
    // shoulder rho of the arc after anchor 6, share
    [0.5779, 0.6722, 0.1629],
    // shoulder rho of the arc after anchor 7, share
    [0.4581, 0.2099, 0.7096],
  ],

  // Past its last knot the part closes in a point at this station, where the reference's own loop vanishes.
  tips: [null, 47.13],
};
