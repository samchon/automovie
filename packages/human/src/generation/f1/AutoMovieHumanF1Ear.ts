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
 * them: the section is a chain of conics through its four extremes and one median point per quarter, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference head cut by this course's own planes over stations 4 to 12 mm, 17 sections 0.5 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the vertices of each section's hull lie
 * 0.21 mm from it on average and at most 0.89 mm; what lies inside that hull is not modelled. 63 independent numbers.
 */
export const AutoMovieHumanF1Ear: AutoMovieHumanConicLoft.IFamily = {
  name: "ear",
  centres: [AutoMovieHumanF1Joints.earRoot, AutoMovieHumanF1Joints.earTip],
  halves: [],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.limb(1),
  knots: [4, 8, 12],
  values: [
    // front (+u) extreme: u, mm
    [26.88, 30.16, 31.5],
    // front (+u) extreme: v, mm
    [13.78, 9.22, 5.27],
    // median fullness f of the arc pair around anchor 1, share
    [0.5017, 0.495, 0.4978],
    // side (+v) extreme: u, mm
    [6.22, 23.62, 18.69],
    // side (+v) extreme: v, mm
    [16.59, 13.63, 10.28],
    // median fullness f of the arc pair around anchor 3, share
    [0.5005, 0.4866, 0.4907],
    // back (-u) extreme: u, mm
    [-27.67, -23.94, -17.56],
    // back (-u) extreme: v, mm
    [11.76, 7.08, 1.77],
    // median fullness f of the arc pair around anchor 5, share
    [0.2181, 0.3556, 0.4736],
    // side (-v) extreme: u, mm
    [3.58, 6.73, 8.09],
    // side (-v) extreme: v, mm
    [-7.14, -5.81, -7.19],
    // median fullness f of the arc pair around anchor 7, share
    [0.3863, 0.3554, 0.4852],
    // shoulder rho of the arc after anchor 0, share
    [0.4988, 0.4989, 0.5],
    // shoulder rho of the arc after anchor 1, share
    [0.4997, 0.5008, 0.4991],
    // shoulder rho of the arc after anchor 2, share
    [0.5, 0.5, 0.5],
    // shoulder rho of the arc after anchor 3, share
    [0.4989, 0.4951, 0.4874],
    // shoulder rho of the arc after anchor 4, share
    [0.5787, 0.5108, 0.5125],
    // shoulder rho of the arc after anchor 5, share
    [0.5635, 0.4817, 0.5074],
    // shoulder rho of the arc after anchor 6, share
    [0.4799, 0.487, 0.4897],
    // shoulder rho of the arc after anchor 7, share
    [0.527, 0.5243, 0.5014],
  ],

  // The part closes in a point at `tip`, a station placed by anatomy; its cap starts at `from`.
  tips: [null, {from: 5, tip: 17}],
};
