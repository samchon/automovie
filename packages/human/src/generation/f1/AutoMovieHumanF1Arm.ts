import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's arm tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes and one median point per quarter, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 76 to 570 mm, 248 sections 2 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.31 mm from it on average and at most 4.19 mm. 273 independent numbers.
 */
export const AutoMovieHumanF1Arm: AutoMovieHumanConicLoft.IFamily = {
  name: "arm",
  centres: [AutoMovieHumanF1Joints.upperarm, AutoMovieHumanF1Joints.lowerarm, AutoMovieHumanF1Joints.hand, AutoMovieHumanF1Joints.middle1],
  halves: [30,10],
  up: [1, 0, 0],
  layout: AutoMovieHumanConicSection.limb(1),
  knots: [76, 92, 116, 152, 236, 260, 272, 323, 428, 452, 496, 528, 570],
  values: [
    // front (+u) extreme: u, mm
    [36.99, 36.87, 36.04, 37.87, 31.5, 29.34, 30.05, 30.29, 20.8, 21.75, 25.96, 35.57, 64.88],
    // front (+u) extreme: v, mm
    [-1.91, -1.78, -0.15, 3.97, 3.82, -10.97, -8.36, -8.95, 4.06, 3.12, 1.44, 6.65, 29.84],
    // median fullness f of the arc pair around anchor 1, share
    [0.42, 0.4096, 0.3541, 0.3715, 0.4987, 0.5724, 0.4381, 0.3825, 0.2093, 0.2245, 0.3572, 0.7133, 0.9469],
    // side (+v) extreme: u, mm
    [-12.41, -14.73, -13.51, -15.86, -6.1, -2.32, 0.85, -10.36, -5.47, -4.63, -1.98, 26.04, 321.67],
    // side (+v) extreme: v, mm
    [44.9, 48.19, 50.69, 48.92, 42.65, 42.75, 42.96, 44.73, 29.53, 26.91, 21.31, 32.25, 30.58],
    // median fullness f of the arc pair around anchor 3, share
    [0.492, 0.4209, 0.4315, 0.3818, 0.3942, 0.3309, 0.432, 0.3999, 0.5562, 0.4423, 0.324, 0.7263, 0.0029],
    // back (-u) extreme: u, mm
    [-46.48, -46.79, -47.42, -46.6, -40.15, -37.42, -37.68, -41.54, -35.41, -30.43, -24.74, -31.35, -39.67],
    // back (-u) extreme: v, mm
    [6.4, 12.44, 11.29, 11.62, 13.75, 18.19, 8.29, 12.66, 6.7, 18.8, 13.04, 12.55, 24.97],
    // median fullness f of the arc pair around anchor 5, share
    [0.4277, 0.4301, 0.4292, 0.4186, 0.3952, 0.3767, 0.3145, 0.4323, 0.4859, 0.6679, 0.7408, 0.467, 0.4111],
    // side (-v) extreme: u, mm
    [-0.65, -1.36, -1.49, -6.06, 1.99, 4.94, 6.84, 4.01, 1.35, 8.68, 21.33, 10.73, 7.37],
    // side (-v) extreme: v, mm
    [-48.35, -44.13, -38.96, -34.77, -30.88, -31.24, -32.16, -34.72, -23.47, -20.66, -16.73, -12.17, -9.47],
    // median fullness f of the arc pair around anchor 7, share
    [0.4852, 0.4469, 0.3531, 0.3941, 0.4687, 0.4597, 0.4776, 0.383, 0.557, 0.5577, 0.0212, 0.1744, 0.1368],
    // shoulder rho of the arc after anchor 0, share
    [0.5011, 0.5418, 0.6055, 0.5081, 0.5359, 0.5178, 0.3981, 0.5, 0.2704, 0.2341, 0.7118, 0.9356, 0.3244],
    // shoulder rho of the arc after anchor 1, share
    [0.5111, 0.5008, 0.5165, 0.4534, 0.4727, 0.4865, 0.493, 0.3877, 0.3227, 0.2178, 0.574, 0.0621, 1.0238],
    // shoulder rho of the arc after anchor 2, share
    [0.5078, 0.4796, 0.4816, 0.4604, 0.4747, 0.4748, 0.6136, 0.5714, 0.8126, 0.8354, 0.3042, 0.4393, 0.9677],
    // shoulder rho of the arc after anchor 3, share
    [0.499, 0.5018, 0.5035, 0.5009, 0.4933, 0.4876, 0.4457, 0.4294, 0.346, 0.1013, 0.0738, 0.138, 1.1816],
    // shoulder rho of the arc after anchor 4, share
    [0.5022, 0.5065, 0.4875, 0.5, 0.505, 0.5155, 0.4684, 0.6045, 0.4518, 0.7901, 0.881, 0.5166, 0.8362],
    // shoulder rho of the arc after anchor 5, share
    [0.4918, 0.4894, 0.5048, 0.4923, 0.5068, 0.5148, 0.537, 0.4558, 0.5818, 0.563, 0.7811, 0.6729, 0.3481],
    // shoulder rho of the arc after anchor 6, share
    [0.4814, 0.4918, 0.4978, 0.5086, 0.4983, 0.5158, 0.519, 0.4795, 0.3959, 0.2368, 0.2155, 0.2512, 0.9735],
    // shoulder rho of the arc after anchor 7, share
    [0.5499, 0.4614, 0.4319, 0.4617, 0.509, 0.3847, 0.516, 0.4052, 0.8649, 0.9117, 0.0149, 0.1571, -0.0158],
  ],

  // The part closes in a point at `tip`, a station placed by anatomy; its cap starts at `from`.
  tips: [null, {from: 570, tip: 600}],

  // Reliefs: heights in mm of a uniform cubic B-spline net over a window of the wall's chart, moved along `axis`; they carry the skin that lies inside the tape wall.
  reliefs: [
    {"name":"arm.hollow.0", "stations":[212, 314], "phases":[-0.5719, 2.8093], "axis":[-0.42406, 0.46689, 0.776], "rows":14, "columns":26, "heights":[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4.08, 10.87, 10.2, 3.79, 0.68, -0.12, 0.11, 0.07, -0.08, 0.19, 0.26, 0.09, 0.07, 0.06, 0.27, 0.23, -0.29, -0.84, -0.59, -0.16, 0, 0, 0, 0, 0, 0, 3.83, 7.48, 7.07, 7.05, 4.52, 0.56, -0.35, 0.09, 0.27, 0.63, 0.49, 0.09, -0.12, -0.06, 0.23, 0.07, -0.43, -1.3, -0.86, -0.08, 0, 0, 0, 0, 0, 0, 1.66, 2.94, 3.4, 4.02, 3.87, 1.57, -0.24, 0.3, 0.7, 1.14, 0.77, 0.33, 0.11, 0.29, 0.43, -0.03, -0.49, -0.71, 0.83, 0.66, 0, 0, 0, 0, 0, 0, -0.06, -0.03, 1.22, 2.16, 2.23, 1.53, -0.28, -0.3, 0.29, 0.78, 0.71, 0.29, 0.19, 0.44, 0.42, -0.14, -0.05, 0.76, 1.68, 0.9, 0, 0, 0, 0, 0, 0, -0.47, -0.49, 0.88, 1.86, 1.83, 1.32, -0.78, -1.53, -1.19, -0.81, -0.12, 0.14, 0.29, 0.17, 0.37, 0.36, 0.43, 1.09, 1.08, 0.91, 0, 0, 0, 0, 0, 0, -0.02, 0.43, 1.43, 2.15, 2.23, 1.69, 0.06, -1.4, -1.77, -1.71, -0.9, 0.13, 0.34, -0.71, -0.54, 0.31, -0.12, 0.2, 3.56, 2.5, 0, 0, 0, 0, 0, 0, 0.44, 1.17, 1.61, 1.92, 2.31, 1.88, 1.17, -0.22, -1.13, -1.25, -0.84, 0.07, 0.37, -1.08, -1.36, 0.11, -0.08, -0.89, 4.95, 3.46, 0, 0, 0, 0, 0, 0, 0.46, 1.4, 1.97, 2.1, 2.34, 2.04, 1.84, 1.32, 0.49, -0.28, -0.6, -0.12, 0.84, -0.13, -1.66, -0.2, 0.73, -1.76, 1.33, 1.7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]},
    {"name":"arm.hollow.1", "stations":[484, 600], "phases":[-0.5719, 2.8093], "axis":[-0.36502, 0.36803, 0.85517], "rows":15, "columns":26, "heights":[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -3.79, -8.08, -1.98, -1.18, 0.6, 1.13, -0.62, -0.08, -0.26, 0.08, 0.64, 1.01, 1.41, 2.19, 2.68, 2.49, 2.72, 2.4, 5.4, 3.46, 0, 0, 0, 0, 0, 0, -2.52, -1.6, 6.88, 4.4, -0.86, 2.62, 0.89, 1.21, 1.66, 1.13, 1.27, 2.06, 3.12, 3.31, 2.58, 2.27, 1.55, 2.91, 9.99, 5.97, 0, 0, 0, 0, 0, 0, -0.49, -0.39, -1.5, -1.09, -6.78, -3.45, -0.6, -0.95, -0.91, 1.03, 2.9, 3.81, 4.42, 3.71, 2.85, 2.67, 1.84, 7.42, 9.75, 4.62, 0, 0, 0, 0, 0, 0, -0.28, -0.21, 0.7, 2.07, -5.55, -7.7, -0.55, 3.67, 1.37, 1.82, 2.58, 6.44, 8.34, 7.8, 6.39, 5.26, 3.99, 6.55, 3.66, 1.36, 0, 0, 0, 0, 0, 0, -0.2, -1.25, -2.39, 0.29, -4.03, -6.84, 4.02, 0.55, -2.87, -1.9, 6.09, 13.58, 13.29, 11.48, 8.7, 6.14, 3.76, 2.78, 0.94, -0.11, 0, 0, 0, 0, 0, 0, 0.26, 1.15, 1.22, 2.11, 1.37, -7.41, -0.37, -5.97, -3.85, 5.79, 17.16, 16.01, 14.43, 12.58, 9.67, 6.53, 3.27, 0.01, -1.54, -1.08, 0, 0, 0, 0, 0, 0, -0.23, 1.31, 6.09, -10.76, -1.58, 15.04, 4.34, -10.83, 6.8, 14.84, 14.17, 12, 11.75, 10.17, 8.24, 5.95, 3.57, 0.7, -1.94, -1.43, 0, 0, 0, 0, 0, 0, 0.02, 2.18, 6.65, -8.8, 1.27, 30.47, 23.84, 2.4, 10.6, 10.39, 11.36, 12.24, 11.2, 9.53, 8.01, 6.22, 4.27, 1.69, -0.98, -1.02, 0, 0, 0, 0, 0, 0, 0.32, 1.46, 2.18, -0.95, 3.96, 15.48, 14.82, 6.48, 5.39, 4.84, 5.66, 6.32, 5.83, 4.98, 4.21, 3.37, 2.34, 1.01, -0.17, -0.36, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]},
  ],
};
