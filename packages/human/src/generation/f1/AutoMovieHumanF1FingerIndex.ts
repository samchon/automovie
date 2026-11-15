import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";

/**
 * f1's finger.index tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 18 to 81 mm, 64 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.11 mm from it on average and at most 0.89 mm. 65 independent numbers.
 */
export const AutoMovieHumanF1FingerIndex: AutoMovieHumanConicLoft.IFamily = {
  name: "finger.index",
  centres: [AutoMovieHumanF1Joints.index1, AutoMovieHumanF1Joints.index2, AutoMovieHumanF1Joints.index3, AutoMovieHumanF1Joints.indexEnd],
  halves: [5,5],
  up: AutoMovieHumanF1Placement.direction("finger.index.up"),
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [18, 49.5, 56, 68, 81],
  values: [
    // front (+u) extreme: u, mm
    [9.2, 8.33, 7.87, 7.65, 5.35],
    // front (+u) extreme: v, mm
    [1.14, 2.16, 2.21, 2.62, 1.18],
    // side (+v) extreme: u, mm
    [0.75, 1.73, 1.69, 0.58, 0.74],
    // side (+v) extreme: v, mm
    [9.53, 8.61, 7.9, 7.5, 5.43],
    // back (-u) extreme: u, mm
    [-9.07, -7.92, -7.28, -7.16, -5.66],
    // back (-u) extreme: v, mm
    [1.21, 1.22, 1.34, 1.23, 0.96],
    // side (-v) extreme: u, mm
    [0.01, -1.07, -0.7, -1.28, 1.29],
    // side (-v) extreme: v, mm
    [-8.43, -6.11, -5.62, -4.65, -2.62],
    // shoulder rho of the arc after anchor 0, share
    [0.4517, 0.433, 0.4333, 0.4244, 0.5364],
    // shoulder rho of the arc after anchor 1, share
    [0.3937, 0.4382, 0.4547, 0.3926, 0.4919],
    // shoulder rho of the arc after anchor 2, share
    [0.4302, 0.4232, 0.3975, 0.3946, 0.5378],
    // shoulder rho of the arc after anchor 3, share
    [0.4091, 0.4107, 0.4181, 0.4632, 0.1675],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 81, tip: 84.38}],
};
