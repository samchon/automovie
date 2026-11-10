import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";

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
 * Source: the f1 reference body cut by this course's own planes over stations 76 to 500 mm, 213 sections 2 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.09 mm from it on average and at most 1.2 mm. 420 independent numbers.
 */
export const AutoMovieHumanF1Arm: AutoMovieHumanConicLoft.IFamily = {
  name: "arm",
  centres: [[-16.33, 1353.22, 142.22], [-9.1, 1140.12, 304.87], [140.73, 993.53, 427.22]],
  halves: [30],
  up: [1, 0, 0],
  layout: AutoMovieHumanConicSection.limb(1),
  knots: [76, 88, 104, 132, 148, 160, 172, 224, 236, 248, 260, 272, 288, 300, 328, 396, 436, 448, 484, 500],
  values: [
    // front (+u) extreme: u, mm
    [37.46, 36.86, 36.51, 36.41, 37.13, 37.7, 38.16, 33.25, 30.4, 28.94, 30.02, 30.54, 30.9, 30.85, 30.42, 22.4, 22.09, 22.62, 25.56, 27.23],
    // front (+u) extreme: v, mm
    [-9.04, 1.21, 2.48, 5.32, 6.93, 4.33, 5.41, 11.59, 14.9, 3.33, -8.67, -12.2, -8.97, -9.26, -4.21, -2.1, -6.31, -3.48, -6.04, -0.28],
    // median fullness f of the arc pair around anchor 1, share
    [0.4206, 0.3559, 0.3402, 0.3255, 0.307, 0.3435, 0.3703, 0.4245, 0.4083, 0.521, 0.5295, 0.5179, 0.4383, 0.3971, 0.359, 0.3303, 0.3948, 0.3606, 0.3983, 0.3672],
    // side (+v) extreme: u, mm
    [-8.02, -12.32, -14.59, -15.77, -11.46, -8.74, -8.76, -8.07, -4.49, -3.06, 0.72, -2, -6.44, -8.28, -12.3, -13.19, -13.84, -12.25, -4.83, 5.21],
    // side (+v) extreme: v, mm
    [45.9, 48.15, 50.15, 50.58, 49.61, 48.36, 47.19, 42.95, 42.56, 42.47, 42.41, 43.08, 44.64, 44.97, 44.05, 34.85, 29.02, 27.7, 21.95, 21],
    // median fullness f of the arc pair around anchor 3, share
    [0.4788, 0.43, 0.4164, 0.4037, 0.4362, 0.4516, 0.4468, 0.4362, 0.4551, 0.4426, 0.3402, 0.3124, 0.4175, 0.4455, 0.4465, 0.4366, 0.4083, 0.4166, 0.4923, 0.6118],
    // back (-u) extreme: u, mm
    [-46.72, -46.73, -47.29, -47.44, -46.89, -46.32, -45.82, -41.82, -40.39, -38.59, -38.2, -38.63, -38.86, -39.65, -41.89, -40.24, -34.92, -33.33, -27.15, -25.31],
    // back (-u) extreme: v, mm
    [6.96, 11.6, 12.02, 10.94, 9.9, 10.12, 9.82, 9.69, 10.17, 11.03, 18.94, 16.65, 2.84, 1.86, 7.66, 9.13, 9, 8.7, 5.35, -2.08],
    // median fullness f of the arc pair around anchor 5, share
    [0.4219, 0.424, 0.4169, 0.4152, 0.4181, 0.4198, 0.4135, 0.3802, 0.3669, 0.3428, 0.3229, 0.3224, 0.2847, 0.3119, 0.3887, 0.4158, 0.447, 0.4628, 0.5882, 0.6014],
    // side (-v) extreme: u, mm
    [0.09, -1.47, -1.86, -4.45, -5.07, -5.35, -5.06, -0.12, 1.76, 2.47, 3.21, 6.38, 8.4, 7.83, 2.05, -4.56, -1.86, -1.35, 4.11, 6.86],
    // side (-v) extreme: v, mm
    [-48.38, -45.59, -41.39, -36.7, -35.27, -34.29, -33.42, -31.29, -31.31, -31.43, -31.75, -32.44, -33.7, -34.64, -34.99, -27.88, -23.64, -22.51, -19.11, -16.75],
    // median fullness f of the arc pair around anchor 7, share
    [0.4288, 0.4663, 0.4171, 0.39, 0.3946, 0.3747, 0.3905, 0.4698, 0.5322, 0.5524, 0.4721, 0.4169, 0.4151, 0.4014, 0.4124, 0.442, 0.4064, 0.4632, 0.3352, 0.369],
    // shoulder rho of the arc after anchor 0, share
    [0.5938, 0.5522, 0.5689, 0.5063, 0.5076, 0.5787, 0.5365, 0.4571, 0.4491, 0.6497, 0.4449, 0.3083, 0.1456, 0.286, 0.3747, 0.4047, 0.5195, 0.4242, 0.5962, 0.7354],
    // shoulder rho of the arc after anchor 1, share
    [0.3187, 0.4918, 0.5611, 0.5795, 0.3813, 0.1974, 0.1732, 0.4675, 0.4977, 0.4519, 0.4213, 0.4759, 0.5006, 0.5118, 0.5206, 0.5092, 0.5218, 0.4887, 0.5319, 0.3942],
    // shoulder rho of the arc after anchor 2, share
    [0.4984, 0.4842, 0.3911, 0.3896, 0.4791, 0.5754, 0.577, 0.5155, 0.5035, 0.456, 0.6503, 0.6328, 0.4844, 0.4842, 0.4603, 0.5237, 0.3988, 0.4475, 0.4566, 0.5146],
    // shoulder rho of the arc after anchor 3, share
    [0.4803, 0.5012, 0.5125, 0.5073, 0.4906, 0.4576, 0.452, 0.4423, 0.4616, 0.5494, 0.2452, 0.1585, 0.39, 0.4654, 0.4642, 0.4668, 0.455, 0.4454, 0.4082, 0.6225],
    // shoulder rho of the arc after anchor 4, share
    [0.5254, 0.5153, 0.4831, 0.4697, 0.4641, 0.4755, 0.4689, 0.4962, 0.4801, 0.4307, 0.5503, 0.657, 0.4993, 0.5249, 0.5495, 0.4264, 0.455, 0.4269, 0.5907, 0.6758],
    // shoulder rho of the arc after anchor 5, share
    [0.4887, 0.4376, 0.4632, 0.4828, 0.4864, 0.4854, 0.5054, 0.4804, 0.4922, 0.4861, 0.4866, 0.4781, 0.6061, 0.5954, 0.4161, 0.5299, 0.5368, 0.5166, 0.433, 0.7225],
    // shoulder rho of the arc after anchor 6, share
    [0.4232, 0.4438, 0.4945, 0.5078, 0.4904, 0.5168, 0.506, 0.4864, 0.4491, 0.4478, 0.5883, 0.54, 0.4139, 0.3681, 0.4475, 0.5265, 0.4711, 0.508, 0.4497, 0.3591],
    // shoulder rho of the arc after anchor 7, share
    [0.5239, 0.5348, 0.4941, 0.5417, 0.5356, 0.4509, 0.4591, 0.3754, 0.4294, 0.6712, 0.5084, 0.4144, 0.5385, 0.5049, 0.4853, 0.523, 0.4041, 0.5427, 0.2915, 0.5655],
  ],

  // Reliefs: heights in mm of a uniform cubic B-spline net over a window of the wall's chart, moved along `axis`; they carry the skin that lies inside the tape wall.
  reliefs: [
    {"name":"arm.hollow.0", "stations":[212, 314], "phases":[-0.5718775560994974, 0.983983737482587], "axis":[-0.9431963501127909, -0.05997610587331187, 0.32677746534634633], "rows":14, "columns":14, "heights":[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.15, 0.12, 0.03, -0.12, -0.18, 0.25, 0.4, 0.14, 0, 0, 0, 0, 0, 0, 0.16, 0.78, 0.88, 0.7, 0.09, -0.34, -0.35, 0.01, 0, 0, 0, 0, 0, 0, 0.31, 0.67, 1.08, 1.27, 1.2, 0.6, 0.01, 0.09, 0, 0, 0, 0, 0, 0, 0.02, 0.55, 1.51, 1.85, 1.74, 1.26, 0.29, -0.42, 0, 0, 0, 0, 0, 0, 0.08, 0.18, 1.03, 1.46, 1.38, 1.12, 0.35, -0.24, 0, 0, 0, 0, 0, 0, -0.16, -0.25, 0.36, 0.85, 1.01, 0.93, 0.51, -0.11, 0, 0, 0, 0, 0, 0, 0.3, 0.02, 0.09, 0.31, 0.5, 0.36, 0.15, -0.23, 0, 0, 0, 0, 0, 0, 0.27, -0.17, -0.33, -0.15, 0.07, 0.13, 0.28, 0.62, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]},
  ],
};
