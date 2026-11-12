import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's nose tape wall.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes and one median point per quarter, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference head cut by this course's own planes over stations 5 to 14 mm, 19 sections 0.5 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the vertices of each section's hull lie
 * 0.1 mm from it on average and at most 0.61 mm; what lies inside that hull is not modelled. 63 independent numbers.
 */
export const AutoMovieHumanF1Nose: AutoMovieHumanConicLoft.IFamily = {
  name: "nose",
  centres: [AutoMovieHumanF1Joints.noseRoot, AutoMovieHumanF1Joints.noseTip],
  halves: [],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.limb(1),
  knots: [5, 9.5, 14],
  values: [
    // front (+u) extreme: u, mm
    [18.99, 11.15, 5.33],
    // front (+u) extreme: v, mm
    [-1.01, 0.31, 0.08],
    // median fullness f of the arc pair around anchor 1, share
    [0.2298, 0.2445, 0.3844],
    // side (+v) extreme: u, mm
    [-9.58, -6.96, -4.74],
    // side (+v) extreme: v, mm
    [16.4, 13.03, 9],
    // median fullness f of the arc pair around anchor 3, share
    [0.3305, 0.2473, 0.2872],
    // back (-u) extreme: u, mm
    [-17.35, -15.29, -13.39],
    // back (-u) extreme: v, mm
    [-0.25, 0.05, -0.84],
    // median fullness f of the arc pair around anchor 5, share
    [0.3046, 0.3125, 0.2553],
    // side (-v) extreme: u, mm
    [-9.36, -5.82, -3.62],
    // side (-v) extreme: v, mm
    [-16.47, -13.09, -8.9],
    // median fullness f of the arc pair around anchor 7, share
    [0.1656, 0.2735, 0.4016],
    // shoulder rho of the arc after anchor 0, share
    [0.7229, 0.4825, 0.5358],
    // shoulder rho of the arc after anchor 1, share
    [0.3772, 0.4258, 0.5061],
    // shoulder rho of the arc after anchor 2, share
    [0.3835, 0.5334, 0.504],
    // shoulder rho of the arc after anchor 3, share
    [0.5305, 0.4849, 0.5425],
    // shoulder rho of the arc after anchor 4, share
    [0.4784, 0.4436, 0.568],
    // shoulder rho of the arc after anchor 5, share
    [0.4346, 0.4887, 0.5021],
    // shoulder rho of the arc after anchor 6, share
    [0.5226, 0.4397, 0.5313],
    // shoulder rho of the arc after anchor 7, share
    [0.632, 0.5139, 0.5094],
  ],

  // The part closes in a point at `tip`, a station placed by anatomy; its cap starts at `from`.
  tips: [null, {from: 14, tip: 18}],
};
