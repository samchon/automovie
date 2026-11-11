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
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 76 to 508 mm, 217 sections 2 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.12 mm from it on average and at most 1 mm. 221 independent numbers.
 */
export const AutoMovieHumanF1Arm: AutoMovieHumanConicLoft.IFamily = {
  name: "arm",
  centres: [[-16.33, 1353.22, 142.22], [-9.1, 1140.12, 304.87], [140.73, 993.53, 427.22]],
  halves: [30],
  up: [1, 0, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [76, 88, 116, 148, 172, 228, 240, 252, 264, 280, 308, 360, 388, 460, 472, 488, 508],
  values: [
    // front (+u) extreme: u, mm
    [37.75, 37.11, 36.62, 37.24, 38.39, 32.12, 29.61, 29.57, 30.07, 30.18, 30.68, 27.02, 23.04, 23.37, 24.21, 26.22, 28.11],
    // front (+u) extreme: v, mm
    [-4.23, 2.16, 4.64, 7.05, 7.72, 13.39, 14.22, -0.14, -10.29, -15.21, -10, -3.38, -2.56, -4.71, -3.85, -1.97, 6.23],
    // side (+v) extreme: u, mm
    [-11.29, -11.65, -11.65, -13.68, -15.45, -7.35, -3.19, -3.15, -2.84, -4.51, -7.41, -13.51, -12.68, -10.17, -6.77, 2.13, -4.79],
    // side (+v) extreme: v, mm
    [45.66, 48.03, 50.91, 49.41, 46.89, 42.81, 42.55, 42.4, 42.6, 44.2, 44.94, 40.71, 36.21, 25.73, 23.85, 21.18, 22.25],
    // back (-u) extreme: u, mm
    [-46.82, -46.86, -47.57, -46.85, -45.85, -41.4, -39.84, -38.04, -38.69, -38.53, -40.32, -42.59, -40.82, -31.15, -29.12, -26.43, -26.19],
    // back (-u) extreme: v, mm
    [5.47, 10.14, 11.95, 10.93, 10.64, 8.92, 10.04, 13.27, 15.37, 5.07, 1.03, 10.06, 9.84, 8.82, 6.47, -3.43, 7.5],
    // side (-v) extreme: u, mm
    [-2.21, -1.42, -2.73, -5.09, -5.28, -0.05, 0.69, 1.25, 3.35, 6.04, 4.04, -0.52, -4.7, 1.3, 3.14, 2.44, 3.59],
    // side (-v) extreme: v, mm
    [-48.19, -45.29, -38.91, -35.28, -33.45, -31.25, -31.22, -31.42, -32.05, -33.37, -35.1, -32.38, -28.93, -21.41, -20.25, -18.58, -15.38],
    // shoulder rho of the arc after anchor 0, share
    [0.404, 0.3486, 0.2999, 0.3189, 0.3785, 0.4214, 0.4142, 0.5249, 0.5495, 0.4835, 0.3741, 0.3458, 0.3258, 0.3687, 0.3411, 0.2982, 0.4995],
    // shoulder rho of the arc after anchor 1, share
    [0.4668, 0.4459, 0.4329, 0.4117, 0.3836, 0.4456, 0.462, 0.4122, 0.3231, 0.3891, 0.4853, 0.4444, 0.443, 0.4443, 0.5024, 0.643, 0.4005],
    // shoulder rho of the arc after anchor 2, share
    [0.4015, 0.4158, 0.4154, 0.4235, 0.4179, 0.3677, 0.348, 0.3274, 0.2849, 0.2519, 0.3026, 0.4315, 0.4169, 0.5082, 0.5414, 0.5136, 0.5615],
    // shoulder rho of the arc after anchor 3, share
    [0.4772, 0.4681, 0.4019, 0.3963, 0.4108, 0.4962, 0.5581, 0.5599, 0.4621, 0.3797, 0.3989, 0.3907, 0.439, 0.4149, 0.4159, 0.4411, 0.436],
  ],

  // Reliefs: heights in mm of a uniform cubic B-spline net over a window of the wall's chart, moved along `axis`; they carry the skin that lies inside the tape wall.
  reliefs: [
    {"name":"arm.hollow.0", "stations":[212, 314], "phases":[-0.5719, 0.984], "axis":[-0.94682, -0.07142, 0.31375], "rows":14, "columns":14, "heights":[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.31, 1.14, 0.77, 0.15, -0.38, -0.16, 0.36, 0.79, 0, 0, 0, 0, 0, 0, -0.57, 0.23, 0.46, 0.47, 0.05, -0.27, -0.21, -0.12, 0, 0, 0, 0, 0, 0, 0.17, 1.19, 1.66, 1.91, 1.73, 0.84, -0.23, -0.89, 0, 0, 0, 0, 0, 0, 0.05, 0.7, 1.55, 1.94, 1.85, 1.41, 0.62, 0.05, 0, 0, 0, 0, 0, 0, -0.44, 0.06, 1.02, 1.72, 1.84, 1.67, 0.94, 0.08, 0, 0, 0, 0, 0, 0, -0.99, -0.27, 0.47, 1.24, 1.57, 1.5, 1.06, -0.19, 0, 0, 0, 0, 0, 0, -0.92, -0.31, 0.23, 0.86, 1.33, 1.28, 1.1, 0.25, 0, 0, 0, 0, 0, 0, -0.54, -0.52, -0.03, 0.6, 1.15, 1.31, 1.38, 1.38, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]},
  ],
};
