import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's concha tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference head cut by this course's own planes over stations 11.5 to 23 mm, 40 sections 0.25 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the vertices of each section's hull lie
 * 0.45 mm from it on average and at most 8.17 mm; what lies inside that hull is not modelled. 39 independent numbers.
 */
export const AutoMovieHumanF1Concha: AutoMovieHumanConicLoft.IFamily = {
  name: "concha",
  centres: [AutoMovieHumanF1Joints.conchaRoot, AutoMovieHumanF1Joints.conchaTip],
  halves: [],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [-0.5, 3.5, 7.5, 11.5, 17.25, 23],
  values: [
    // front (+u) extreme: u, mm
    [17.17, 17.17, 17.17, 17.17, 17.06, 15.35],
    // front (+u) extreme: v, mm
    [3.13, 3.13, 3.13, 3.13, -3.01, -2.11],
    // side (+v) extreme: u, mm
    [10.97, 10.97, 10.97, 10.97, -6.57, -11.7],
    // side (+v) extreme: v, mm
    [3.61, 3.61, 3.61, 3.61, 8.59, 11.98],
    // back (-u) extreme: u, mm
    [-6.15, -6.15, -6.15, -6.15, -25.49, -31.05],
    // back (-u) extreme: v, mm
    [0.41, 0.41, 0.41, 0.41, 0.47, -2.26],
    // side (-v) extreme: u, mm
    [5.22, 5.22, 5.22, 5.22, -5.95, -9.35],
    // side (-v) extreme: v, mm
    [-5.21, -5.21, -5.21, -5.21, -6.15, -8.5],
    // shoulder rho of the arc after anchor 0, share
    [-0.0143, -0.0143, -0.0143, -0.0143, 0.3423, 0.0484],
    // shoulder rho of the arc after anchor 1, share
    [0.0587, 0.0587, 0.0587, 0.0587, 0.0534, 0.0486],
    // shoulder rho of the arc after anchor 2, share
    [0.3769, 0.3769, 0.3769, 0.3769, 0.2962, 0.1001],
    // shoulder rho of the arc after anchor 3, share
    [0.5917, 0.5917, 0.5917, 0.5917, 0.4568, 0.652],
  ],

  // The part closes in a point at `tip`, a station placed by anatomy; its cap starts at `from`.
  tips: [null, {from: 23, tip: 24.5}],
};
