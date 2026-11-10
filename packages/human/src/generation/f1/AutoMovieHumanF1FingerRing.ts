import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";

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
 * Source: the f1 reference body cut by this course's own planes over stations 24 to 82 mm, 59 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.11 mm from it on average and at most 0.74 mm. 105 independent numbers.
 */
export const AutoMovieHumanF1FingerRing: AutoMovieHumanConicLoft.IFamily = {
  name: "finger.ring",
  centres: [[173.28, 939.91, 466.79], [189.84, 908.48, 477.48], [201.12, 881.56, 473.51], [211.07, 857.79, 470]],
  halves: [5,5],
  up: [1, 0, 0],
  layout: AutoMovieHumanConicSection.limb(1),
  knots: [24, 38, 44, 53, 82],
  values: [
    // front (+u) extreme: u, mm
    [9.05, 7.95, 7.5, 6.92, 6.16],
    // front (+u) extreme: v, mm
    [1.42, 3.26, 2.13, -0.51, 0.36],
    // median fullness f of the arc pair around anchor 1, share
    [0.4754, 0.3021, 0.3881, 0.4503, 0.4843],
    // side (+v) extreme: u, mm
    [-2.15, 0.7, -1.4, -1.63, -0.07],
    // side (+v) extreme: v, mm
    [8.85, 9, 7.19, 6.92, 5.12],
    // median fullness f of the arc pair around anchor 3, share
    [0.3055, 0.4729, 0.3547, 0.3817, 0.4758],
    // back (-u) extreme: u, mm
    [-7.74, -8.72, -8.49, -8.21, -5.85],
    // back (-u) extreme: v, mm
    [3.31, 0.88, 2.08, -0.05, 1.23],
    // median fullness f of the arc pair around anchor 5, share
    [0.5093, 0.4286, 0.4403, 0.4941, 0.1704],
    // side (-v) extreme: u, mm
    [1.46, -0.21, -0.88, 1.26, -1.32],
    // side (-v) extreme: v, mm
    [-8.06, -7.56, -7.37, -6.96, -3.6],
    // median fullness f of the arc pair around anchor 7, share
    [0.3584, 0.5797, 0.5729, 0.3157, 0.3943],
    // shoulder rho of the arc after anchor 0, share
    [0.5348, 0.1253, 0.0832, 0.6473, 0.3317],
    // shoulder rho of the arc after anchor 1, share
    [0.94, 0.4623, 0.9403, 0.4142, 0.9403],
    // shoulder rho of the arc after anchor 2, share
    [0.4557, 0.7157, 0.9356, 0.3607, 0.9402],
    // shoulder rho of the arc after anchor 3, share
    [0.06, 0.3673, 0.15, 0.4935, 0.4101],
    // shoulder rho of the arc after anchor 4, share
    [0.5865, 0.5249, 0.7252, 0.3142, 0.9401],
    // shoulder rho of the arc after anchor 5, share
    [0.5336, 0.4608, 0.3738, 0.7055, 0.06],
    // shoulder rho of the arc after anchor 6, share
    [0.3983, 0.5454, 0.587, 0.2111, 0.7241],
    // shoulder rho of the arc after anchor 7, share
    [0.322, 0.6971, 0.7037, 0.4349, 0.1144],
  ],
};
