import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's ear tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference head cut by this course's own planes over stations 4 to 12 mm, 17 sections 0.5 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the vertices of each section's hull lie
 * 0.12 mm from it on average and at most 0.74 mm; what lies inside that hull is not modelled. 39 independent numbers.
 */
export const AutoMovieHumanF1Ear: AutoMovieHumanConicLoft.IFamily = {
  name: "ear",
  centres: [AutoMovieHumanF1Joints.earRoot, AutoMovieHumanF1Joints.earTip],
  halves: [],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [4, 8, 12],
  values: [
    // front (+u) extreme: u, mm
    [12.75, 16.03, 17.39],
    // front (+u) extreme: v, mm
    [12.09, 7.32, 4.06],
    // side (+v) extreme: u, mm
    [7.33, 9.37, 14.1],
    // side (+v) extreme: v, mm
    [16.71, 14.72, 10.43],
    // back (-u) extreme: u, mm
    [-41.77, -38.13, -32.42],
    // back (-u) extreme: v, mm
    [10.89, 8.61, 3.52],
    // side (-v) extreme: u, mm
    [-13.34, -5.68, -4.06],
    // side (-v) extreme: v, mm
    [-6.71, -4.84, -6.15],
    // shoulder rho of the arc after anchor 0, share
    [0.4809, 0.5042, 0.5215],
    // shoulder rho of the arc after anchor 1, share
    [0.7521, 0.3849, 0.3017],
    // shoulder rho of the arc after anchor 2, share
    [0.1258, 0.4016, 0.4729],
    // shoulder rho of the arc after anchor 3, share
    [0.3667, 0.2394, 0.4032],
  ],

  // The part closes in a point at `tip`, a station placed by anatomy; its cap starts at `from`.
  tips: [null, {from: 5, tip: 17}],
};
