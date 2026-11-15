import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";

/**
 * f1's toe.ring tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes and one median point per quarter, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 23 to 38 mm, 16 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.2 mm from it on average and at most 1.02 mm. 63 independent numbers.
 */
export const AutoMovieHumanF1ToeRing: AutoMovieHumanConicLoft.IFamily = {
  name: "toe.ring",
  centres: [AutoMovieHumanF1Joints.ringtoe1, AutoMovieHumanF1Joints.ringtoe2, AutoMovieHumanF1Joints.ringtoeEnd],
  halves: [5],
  up: AutoMovieHumanF1Placement.direction("toe.ring.up"),
  layout: AutoMovieHumanConicSection.limb(1),
  knots: [23, 30.5, 38],
  values: [
    // front (+u) extreme: u, mm
    [4.27, 2.9, 1.12],
    // front (+u) extreme: v, mm
    [2.86, 1.96, 1.17],
    // median fullness f of the arc pair around anchor 1, share
    [0.5003, 0.495, 0.4914],
    // side (+v) extreme: u, mm
    [-1.59, -2.21, -5.55],
    // side (+v) extreme: v, mm
    [6.78, 7.28, 7.07],
    // median fullness f of the arc pair around anchor 3, share
    [0.5003, 0.495, 0.4994],
    // back (-u) extreme: u, mm
    [-11.08, -10.42, -8.57],
    // back (-u) extreme: v, mm
    [-0.44, 0.46, 0.4],
    // median fullness f of the arc pair around anchor 5, share
    [0.497, 0.4969, 0.4998],
    // side (-v) extreme: u, mm
    [-5.21, -5.11, -5.35],
    // side (-v) extreme: v, mm
    [-5.9, -5.49, -4.03],
    // median fullness f of the arc pair around anchor 7, share
    [0.4943, 0.4939, 0.4945],
    // shoulder rho of the arc after anchor 0, share
    [0.5001, 0.499, 0.4978],
    // shoulder rho of the arc after anchor 1, share
    [0.4999, 0.5, 0.5011],
    // shoulder rho of the arc after anchor 2, share
    [0.5003, 0.4989, 0.5006],
    // shoulder rho of the arc after anchor 3, share
    [0.5004, 0.4998, 0.5002],
    // shoulder rho of the arc after anchor 4, share
    [0.5019, 0.4997, 0.5003],
    // shoulder rho of the arc after anchor 5, share
    [0.4997, 0.5, 0.4997],
    // shoulder rho of the arc after anchor 6, share
    [0.4984, 0.5005, 0.5],
    // shoulder rho of the arc after anchor 7, share
    [0.5001, 0.4993, 0.4981],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 38, tip: 41.13}],
};
