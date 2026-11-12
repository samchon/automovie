import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's concha tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 * It is the cutter of the ear's bowl, cut from the figure after the ear is attached.
 *
 * Its sections are not plane cuts of the skin: the bowl's sides open toward the cheek, only 3 to 5 mm above its floor, so no plane
 * holds a loop of it. Each is read from the skin's depth over the ear: at the plane `|z| = c` the region round the course where the
 * outermost skin lies deeper than `c` (`FamilyConicBody.ts concha --concha-depth=-5,35,1540,1590 --concha-course=16.5,1563,90/16.5,1563,60
 * --concha-up=0,1,0 --concha-domain=21,24 --concha-tip=25 --concha-lead=18`). Fitted 65.5 to 69 mm out, where those regions close,
 * it is then moved 15.5 mm outward along its course (`conchaRoot`, `conchaTip`) so it stays within the ear's leaf, which starts 78 mm
 * out: a cut across the ear's band is refused by the trim. Its outer end is closed 9 mm past its lead's start, so the curve where it
 * meets the leaf never runs along an open end.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference head's depth over stations 21 to 24 mm of the fitting course, 13 sections 0.25 mm apart, every second
 * one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over all
 * sections). Regenerated through the engine's view loft from these numbers alone, the vertices of each section lie 0.24 mm from it
 * on average and at most 1.05 mm. 39 independent numbers.
 */
export const AutoMovieHumanF1Concha: AutoMovieHumanConicLoft.IFamily = {
  name: "concha",
  centres: [AutoMovieHumanF1Joints.conchaRoot, AutoMovieHumanF1Joints.conchaTip],
  halves: [],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [3, 9, 15, 21, 22.5, 24],
  values: [
    // front (+u) extreme: u, mm
    [6.54, 6.54, 6.54, 6.54, 5.99, 5.19],
    // front (+u) extreme: v, mm
    [1.13, 1.13, 1.13, 1.13, -0.33, -1.08],
    // side (+v) extreme: u, mm
    [3.76, 3.76, 3.76, 3.76, -1.05, -2.05],
    // side (+v) extreme: v, mm
    [8.66, 8.66, 8.66, 8.66, 6.8, 3.08],
    // back (-u) extreme: u, mm
    [-7.13, -7.13, -7.13, -7.13, -6.11, -4.72],
    // back (-u) extreme: v, mm
    [-10.6, -10.6, -10.6, -10.6, -13.38, -41.83],
    // side (-v) extreme: u, mm
    [-8.73, -8.73, -8.73, -8.73, -4.44, 0.88],
    // side (-v) extreme: v, mm
    [-4.89, -4.89, -4.89, -4.89, -4.22, -3.23],
    // shoulder rho of the arc after anchor 0, share
    [0.4816, 0.4816, 0.4816, 0.4816, 0.4549, 0.4888],
    // shoulder rho of the arc after anchor 1, share
    [0.4396, 0.4396, 0.4396, 0.4396, 0.4917, 0.5188],
    // shoulder rho of the arc after anchor 2, share
    [0.4992, 0.4992, 0.4992, 0.4992, 0.4991, 0.4942],
    // shoulder rho of the arc after anchor 3, share
    [0.4705, 0.4705, 0.4705, 0.4705, 0.4748, 0.5003],
  ],

  // The part closes in a point at `tip`, a station placed by anatomy; its cap starts at `from`.
  tips: [{from: 3, tip: -6}, {from: 24, tip: 25}],
};
