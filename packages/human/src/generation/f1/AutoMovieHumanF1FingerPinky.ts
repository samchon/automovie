import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";

/**
 * f1's finger.pinky tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes and one median point per quarter, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 16 to 61 mm, 46 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.13 mm from it on average and at most 0.45 mm. 126 independent numbers.
 */
export const AutoMovieHumanF1FingerPinky: AutoMovieHumanConicLoft.IFamily = {
  name: "finger.pinky",
  centres: [AutoMovieHumanF1Joints.pinky1, AutoMovieHumanF1Joints.pinky2, AutoMovieHumanF1Joints.pinky3, AutoMovieHumanF1Joints.pinkyEnd],
  halves: [5,5],
  up: AutoMovieHumanF1Placement.direction("finger.pinky.up"),
  layout: AutoMovieHumanConicSection.limb(1),
  knots: [16, 22, 38.5, 46, 54, 61],
  values: [
    // front (+u) extreme: u, mm
    [7.63, 7, 6, 5.98, 5.88, 5],
    // front (+u) extreme: v, mm
    [0.15, 0.94, 0.17, 0.23, 0.68, 0.87],
    // median fullness f of the arc pair around anchor 1, share
    [0.4557, 0.4735, 0.4768, 0.4749, 0.4905, 0.4821],
    // side (+v) extreme: u, mm
    [-0.67, -1.03, -1.19, -1.04, -0.17, 0.03],
    // side (+v) extreme: v, mm
    [6.81, 7.36, 6.18, 5.64, 5.83, 4.34],
    // median fullness f of the arc pair around anchor 3, share
    [0.4818, 0.4845, 0.4791, 0.4717, 0.493, 0.4835],
    // back (-u) extreme: u, mm
    [-7.64, -7.68, -6.94, -6.52, -5.56, -4.23],
    // back (-u) extreme: v, mm
    [-0.51, 0.74, 1.08, 0.91, 2.28, 2.35],
    // median fullness f of the arc pair around anchor 5, share
    [0.4763, 0.4789, 0.4715, 0.481, 0.4639, 0.4475],
    // side (-v) extreme: u, mm
    [-0.48, 0.04, 0.06, 0.32, 0.81, 0.14],
    // side (-v) extreme: v, mm
    [-8.08, -7.09, -5.67, -5.19, -3.78, -2.64],
    // median fullness f of the arc pair around anchor 7, share
    [0.4592, 0.4682, 0.481, 0.4826, 0.4812, 0.4769],
    // shoulder rho of the arc after anchor 0, share
    [0.4929, 0.4976, 0.4992, 0.5017, 0.4976, 0.5002],
    // shoulder rho of the arc after anchor 1, share
    [0.5031, 0.5024, 0.497, 0.4998, 0.4985, 0.5021],
    // shoulder rho of the arc after anchor 2, share
    [0.4982, 0.5, 0.4992, 0.5024, 0.4988, 0.5014],
    // shoulder rho of the arc after anchor 3, share
    [0.4993, 0.4992, 0.4989, 0.5018, 0.4983, 0.4998],
    // shoulder rho of the arc after anchor 4, share
    [0.5023, 0.4994, 0.5006, 0.498, 0.5062, 0.506],
    // shoulder rho of the arc after anchor 5, share
    [0.4991, 0.4972, 0.4989, 0.4986, 0.5014, 0.5084],
    // shoulder rho of the arc after anchor 6, share
    [0.5019, 0.5016, 0.4977, 0.5, 0.4971, 0.5008],
    // shoulder rho of the arc after anchor 7, share
    [0.4954, 0.4991, 0.4989, 0.4993, 0.4999, 0.5024],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 61, tip: 64.63}],
};
