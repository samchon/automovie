import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";

/**
 * f1's foot tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes and one median point per quarter, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 24 to 133 mm, 110 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.12 mm from it on average and at most 0.89 mm. 189 independent numbers.
 */
export const AutoMovieHumanF1Foot: AutoMovieHumanConicLoft.IFamily = {
  name: "foot",
  centres: [[1, 45, 134], [133, 20, 157]],
  halves: [],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.limb(1),
  knots: [24, 32, 40, 48, 64, 78.5, 88, 96, 133],
  values: [
    // front (+u) extreme: u, mm
    [75.52, 59.79, 48.7, 40.75, 32.81, 28.67, 26.23, 24.04, 15.11],
    // front (+u) extreme: v, mm
    [-1.03, 1.37, 7.32, 6.05, 2.53, 2.78, 7, 8.5, 24.25],
    // median fullness f of the arc pair around anchor 1, share
    [0.4171, 0.44, 0.3858, 0.4041, 0.4211, 0.4229, 0.3783, 0.3726, 0.408],
    // side (+v) extreme: u, mm
    [16.2, 2.76, -4.29, -4.72, -3.85, -2.62, -1.53, -3.97, -5.81],
    // side (+v) extreme: v, mm
    [29.01, 29.98, 30.77, 31.02, 31.82, 31.98, 32.39, 33.15, 37.62],
    // median fullness f of the arc pair around anchor 3, share
    [0.6023, 0.5294, 0.4581, 0.4446, 0.4376, 0.487, 0.543, 0.5609, 0.6672],
    // back (-u) extreme: u, mm
    [-41.45, -39.94, -38.46, -37, -33.93, -31.38, -29.63, -28.4, -22.05],
    // back (-u) extreme: v, mm
    [-14.9, -18.46, -21.41, -25.44, -28.15, -33.32, -36.77, -37.03, -33.56],
    // median fullness f of the arc pair around anchor 5, share
    [0.5905, 0.5831, 0.5126, 0.4927, 0.5295, 0.398, 0.2776, 0.4472, 0.6511],
    // side (-v) extreme: u, mm
    [-25.49, -23.56, -26.9, -24.06, -19.68, -21.65, -23.29, -19.02, -10.51],
    // side (-v) extreme: v, mm
    [-39.79, -40.2, -41, -41.98, -45.34, -48.4, -49.67, -50.97, -51.3],
    // median fullness f of the arc pair around anchor 7, share
    [0.1639, 0.1706, 0.2727, 0.3024, 0.2375, 0.2144, 0.2469, 0.2325, 0.2302],
    // shoulder rho of the arc after anchor 0, share
    [0.604, 0.6319, 0.5197, 0.5644, 0.5614, 0.65, 0.6138, 0.564, 0.1661],
    // shoulder rho of the arc after anchor 1, share
    [0.5111, 0.3779, 0.4047, 0.417, 0.3345, 0.3059, 0.2414, 0.3262, 0.4866],
    // shoulder rho of the arc after anchor 2, share
    [0.7282, 0.6371, 0.4865, 0.4794, 0.452, 0.4556, 0.4908, 0.4526, 0.6365],
    // shoulder rho of the arc after anchor 3, share
    [0.5766, 0.5469, 0.498, 0.4664, 0.341, 0.3217, 0.3416, 0.3197, 0.4386],
    // shoulder rho of the arc after anchor 4, share
    [0.6669, 0.6327, 0.5961, 0.5151, 0.4987, 0.4132, 0.3211, 0.3528, 0.7547],
    // shoulder rho of the arc after anchor 5, share
    [0.4541, 0.53, 0.2012, 0.4665, 0.6843, 0.2949, 0.0641, 0.4226, 0.6967],
    // shoulder rho of the arc after anchor 6, share
    [0.0585, 0.1158, 0.3076, 0.196, 0.0895, 0.5077, 0.7015, 0.5816, 0.7514],
    // shoulder rho of the arc after anchor 7, share
    [0.6317, 0.6379, 0.5869, 0.5196, 0.5871, 0.5011, 0.4388, 0.4936, 0.5451],
  ],

  // Reliefs: heights in mm of a uniform cubic B-spline net over a window of the wall's chart, moved along `axis`; they carry the skin that lies inside the tape wall.
  reliefs: [
    {"name":"foot.hollow.0", "stations":[-6, 129], "phases":[-2.2648, 0.2173], "axis":[0.13411, -0.18716, -0.97313], "rows":17, "columns":20, "heights":[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.21, 0.79, 1.39, 1.81, 2.06, 2.15, 1.85, 1.54, 1.73, 2.01, 1.64, 0.37, -0.36, -0.1, 0, 0, 0, 0, 0, 0, 0.18, 0.86, 1.76, 2.38, 2.66, 2.69, 2.38, 2.27, 3.05, 3.41, 2.88, 0.59, -0.76, 0.75, 0, 0, 0, 0, 0, 0, -0.3, -0.49, -0.16, -0.09, -0.25, -0.33, 0.01, 0.62, 1.22, 0.99, 0.56, 0.13, -0.69, 1.32, 0, 0, 0, 0, 0, 0, 0.18, 0.75, 0.93, 0.55, 0.06, -0.23, -0.53, -0.21, -0.14, 0.13, 0.17, 0.35, -0.19, 0.13, 0, 0, 0, 0, 0, 0, 0.15, 0.45, 0.5, -0.02, -0.09, -0.28, 0.18, 0.37, 0.13, 0.27, 0.2, 0.23, 0, 0.48, 0, 0, 0, 0, 0, 0, -0.1, 0.02, 1.05, 0.6, 0.41, 0.41, 0.42, -0.42, -0.78, -0.6, -0.35, -0.01, 0.12, 0.76, 0, 0, 0, 0, 0, 0, 0.29, -0.24, 1.86, 2.58, 1.96, 0.88, -0.05, -0.57, -0.57, -0.4, -0.06, 0.43, 0.67, 1.27, 0, 0, 0, 0, 0, 0, 0.53, -0.87, 0.76, 1.31, 0.81, 0.12, -0.19, -0.45, -0.54, -0.37, -0.08, 0.22, 0.19, 1.41, 0, 0, 0, 0, 0, 0, 0.31, -0.78, 0.07, -0.47, -0.33, -0.18, -0.12, -0.18, -0.09, -0.07, -0.11, -0.12, -0.36, -0.04, 0, 0, 0, 0, 0, 0, 0.75, 0.64, 0.75, -0.3, 0.78, 0.44, 0.33, 0.44, 0.52, 0.52, 0.54, 0.66, 0.79, 0.77, 0, 0, 0, 0, 0, 0, 0.03, -0.24, 0.07, -0.39, 1.12, 0.33, 0.19, -0.28, -0.61, -0.36, -0.09, -0.01, -0.03, -0.55, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]},
    {"name":"foot.hollow.1", "stations":[95, 163], "phases":[-2.0695, -0.7832], "axis":[0.15358, -0.09406, -0.98365], "rows":10, "columns":12, "heights":[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.15, -0.51, 0.31, 0.99, 0.36, -0.01, 0, 0, 0, 0, 0, 0, -0.48, 0.38, 0.44, 0.54, 0.41, 0.38, 0, 0, 0, 0, 0, 0, 1, 1, -0.14, 0.74, 1.15, 0.89, 0, 0, 0, 0, 0, 0, 0.6, 0.49, 0.01, 0.36, 0.65, 0.48, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]},
  ],
};
