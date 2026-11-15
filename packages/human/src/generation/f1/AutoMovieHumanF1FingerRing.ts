import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";

/**
 * f1's finger.ring tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes and one median point per quarter, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 24 to 83 mm, 60 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.15 mm from it on average and at most 0.72 mm. 147 independent numbers.
 */
export const AutoMovieHumanF1FingerRing: AutoMovieHumanConicLoft.IFamily = {
  name: "finger.ring",
  centres: [AutoMovieHumanF1Joints.ring1, AutoMovieHumanF1Joints.ring2, AutoMovieHumanF1Joints.ring3, AutoMovieHumanF1Joints.ringEnd],
  halves: [5,5],
  up: AutoMovieHumanF1Placement.direction("finger.ring.up"),
  layout: AutoMovieHumanConicSection.limb(1),
  knots: [24, 38, 44, 53.5, 64, 74, 83],
  values: [
    // front (+u) extreme: u, mm
    [8.5, 7.93, 7.51, 6.74, 6.4, 5.91, 4.88],
    // front (+u) extreme: v, mm
    [1.26, 0.56, -0.04, 0.53, 0.21, 0.81, 1.06],
    // median fullness f of the arc pair around anchor 1, share
    [0.4841, 0.4939, 0.4937, 0.4921, 0.4966, 0.4923, 0.5005],
    // side (+v) extreme: u, mm
    [-0.55, -0.79, -1.32, -1.35, -0.63, -0.74, 0.13],
    // side (+v) extreme: v, mm
    [8.92, 8.92, 7.13, 6.86, 5.74, 6.12, 4.63],
    // median fullness f of the arc pair around anchor 3, share
    [0.4923, 0.4962, 0.4966, 0.4954, 0.4969, 0.4938, 0.4966],
    // back (-u) extreme: u, mm
    [-7.48, -8.44, -8.22, -7.83, -7.52, -6.85, -5.77],
    // back (-u) extreme: v, mm
    [1.19, 0.31, 0.65, 0.71, -0.05, 1.3, 0.7],
    // median fullness f of the arc pair around anchor 5, share
    [0.4939, 0.4961, 0.4915, 0.4938, 0.4944, 0.49, 0.4932],
    // side (-v) extreme: u, mm
    [0.23, 0.75, 0.13, -0.78, -0.1, 0.17, 0.4],
    // side (-v) extreme: v, mm
    [-7.91, -7.5, -7.32, -6.74, -6.03, -4.38, -3.46],
    // median fullness f of the arc pair around anchor 7, share
    [0.4887, 0.4964, 0.491, 0.4931, 0.4932, 0.494, 0.4962],
    // shoulder rho of the arc after anchor 0, share
    [0.5011, 0.5003, 0.4996, 0.4999, 0.4994, 0.5002, 0.4997],
    // shoulder rho of the arc after anchor 1, share
    [0.498, 0.4999, 0.4997, 0.5006, 0.4999, 0.5004, 0.4999],
    // shoulder rho of the arc after anchor 2, share
    [0.4987, 0.4994, 0.5, 0.4997, 0.5, 0.4996, 0.5012],
    // shoulder rho of the arc after anchor 3, share
    [0.5008, 0.4998, 0.4999, 0.4996, 0.5, 0.4997, 0.4998],
    // shoulder rho of the arc after anchor 4, share
    [0.5002, 0.5, 0.5008, 0.4998, 0.5002, 0.5011, 0.4993],
    // shoulder rho of the arc after anchor 5, share
    [0.4989, 0.5001, 0.4997, 0.4998, 0.4993, 0.5005, 0.4986],
    // shoulder rho of the arc after anchor 6, share
    [0.5002, 0.5002, 0.5005, 0.5001, 0.5003, 0.4996, 0.4994],
    // shoulder rho of the arc after anchor 7, share
    [0.4996, 0.4993, 0.5011, 0.4995, 0.5006, 0.4998, 0.5003],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 83, tip: 86.13}],
};
