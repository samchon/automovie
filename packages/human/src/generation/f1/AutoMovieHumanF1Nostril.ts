import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";

/**
 * f1's nostril tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference head cut by this course's own planes over stations 9 to 13 mm, 17 sections 0.25 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the vertices of each section's hull lie
 * 0.19 mm from it on average and at most 1.46 mm; what lies inside that hull is not modelled. 39 independent numbers.
 */
export const AutoMovieHumanF1Nostril: AutoMovieHumanConicLoft.IFamily = {
  name: "nostril",
  centres: [AutoMovieHumanF1Joints.nostrilRoot, AutoMovieHumanF1Joints.nostrilTip],
  halves: [],
  up: AutoMovieHumanF1Placement.direction("nostril.up"),
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [0, 3, 6, 9, 11, 13],
  values: [
    // front (+u) extreme: u, mm
    [8.24, 8.24, 8.24, 8.24, 5.14, 5.09],
    // front (+u) extreme: v, mm
    [4.86, 4.86, 4.86, 4.86, -1.62, -2.06],
    // side (+v) extreme: u, mm
    [3.07, 3.07, 3.07, 3.07, -3.12, -4.01],
    // side (+v) extreme: v, mm
    [6.11, 6.11, 6.11, 6.11, 3.84, 3.72],
    // back (-u) extreme: u, mm
    [-6.08, -6.08, -6.08, -6.08, -6.49, -5.87],
    // back (-u) extreme: v, mm
    [2.57, 2.57, 2.57, 2.57, 2.04, 1.12],
    // side (-v) extreme: u, mm
    [2.4, 2.4, 2.4, 2.4, 4.09, 3.07],
    // side (-v) extreme: v, mm
    [-3.59, -3.59, -3.59, -3.59, -4.59, -4.43],
    // shoulder rho of the arc after anchor 0, share
    [0.3156, 0.3156, 0.3156, 0.3156, 0.3172, 0.3193],
    // shoulder rho of the arc after anchor 1, share
    [0.4296, 0.4296, 0.4296, 0.4296, 0.4779, 0.4724],
    // shoulder rho of the arc after anchor 2, share
    [0.317, 0.317, 0.317, 0.317, 0.3855, 0.3368],
    // shoulder rho of the arc after anchor 3, share
    [0.3321, 0.3321, 0.3321, 0.3321, 0.283, 0.4845],
  ],

  // The part closes in a point at `tip`, a station placed by anatomy; its cap starts at `from`.
  tips: [null, {from: 13, tip: 16}],
};
