import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's toe.ring tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 22 to 27 mm, 6 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.18 mm from it on average and at most 1.3 mm. 39 independent numbers.
 */
export const AutoMovieHumanF1ToeRing: AutoMovieHumanConicLoft.IFamily = {
  name: "toe.ring",
  centres: [AutoMovieHumanF1Joints.ringtoe1, AutoMovieHumanF1Joints.ringtoe2, AutoMovieHumanF1Joints.beyond(AutoMovieHumanF1Joints.ringtoe1, AutoMovieHumanF1Joints.ringtoe2, 18)],
  halves: [5],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [22, 24.5, 27],
  values: [
    // front (+u) extreme: u, mm
    [3.84, 3.32, 2.5],
    // front (+u) extreme: v, mm
    [2.17, 1.96, 1.21],
    // side (+v) extreme: u, mm
    [-2.36, -2.87, -2.9],
    // side (+v) extreme: v, mm
    [7.33, 7.72, 7.74],
    // back (-u) extreme: u, mm
    [-11.51, -11.52, -11.53],
    // back (-u) extreme: v, mm
    [0.08, 2.7, 26.58],
    // side (-v) extreme: u, mm
    [-5.05, -5.2, -3.68],
    // side (-v) extreme: v, mm
    [-5.73, -5.38, -4.77],
    // shoulder rho of the arc after anchor 0, share
    [0.3905, 0.4453, 0.5447],
    // shoulder rho of the arc after anchor 1, share
    [0.4206, 0.3808, -0.2348],
    // shoulder rho of the arc after anchor 2, share
    [0.4614, 0.4878, 0.9255],
    // shoulder rho of the arc after anchor 3, share
    [0.429, 0.3976, 0.2699],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 27, tip: 30.63}],
};
