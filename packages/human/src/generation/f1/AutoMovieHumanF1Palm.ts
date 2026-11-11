import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's palm tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes and one median point per quarter, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference body cut by this course's own planes over stations 0 to 60 mm, 61 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.15 mm from it on average and at most 4.4 mm. 126 independent numbers.
 */
export const AutoMovieHumanF1Palm: AutoMovieHumanConicLoft.IFamily = {
  name: "palm",
  centres: [AutoMovieHumanF1Joints.hand, AutoMovieHumanF1Joints.middle1],
  halves: [],
  up: [0, 0, 1],
  layout: AutoMovieHumanConicSection.limb(1),
  knots: [0, 8, 24, 36, 48, 60],
  values: [
    // front (+u) extreme: u, mm
    [17.81, 16.15, 14.17, 12.71, 11.89, 10.94],
    // front (+u) extreme: v, mm
    [-8.87, -10.45, -15.36, -14.39, -15.59, -12.8],
    // median fullness f of the arc pair around anchor 1, share
    [0.3949, 0.4207, 0.4154, 0.4124, 0.4104, 0.4334],
    // side (+v) extreme: u, mm
    [-10.35, -14.63, -22.9, -34.81, -42.67, -48.36],
    // side (+v) extreme: v, mm
    [24.29, 24.89, 29.62, 33.47, 37.82, 37.58],
    // median fullness f of the arc pair around anchor 3, share
    [0.3376, 0.5205, 0.5372, 0.5502, 0.4915, 0.1826],
    // back (-u) extreme: u, mm
    [-25.91, -32.6, -43.58, -49.35, -54.12, -57.83],
    // back (-u) extreme: v, mm
    [16.47, 9.78, 13.09, 16.67, 23.79, 32.13],
    // median fullness f of the arc pair around anchor 5, share
    [0.3721, 0.2709, 0.1786, 0.1416, 0.0711, 0.0905],
    // side (-v) extreme: u, mm
    [-2.19, -3.45, -2.96, -2.35, -4.14, -1.15],
    // side (-v) extreme: v, mm
    [-28.81, -31.23, -37.32, -40.25, -42.49, -44.92],
    // median fullness f of the arc pair around anchor 7, share
    [0.4197, 0.4301, 0.4153, 0.4619, 0.5039, 0.596],
    // shoulder rho of the arc after anchor 0, share
    [0.3347, 0.3676, 0.5307, 0.5609, 0.5669, 0.4913],
    // shoulder rho of the arc after anchor 1, share
    [0.6063, 0.4895, 0.2521, 0.3232, 0.2775, 0.2562],
    // shoulder rho of the arc after anchor 2, share
    [0.3034, 0.5472, 0.644, 0.4977, 0.34, 0.0599],
    // shoulder rho of the arc after anchor 3, share
    [0.0596, 0.5885, 0.6213, 0.6984, 0.6431, 0.0599],
    // shoulder rho of the arc after anchor 4, share
    [0.7264, 0.1539, 0.1841, 0.0837, 0.3316, 0.9286],
    // shoulder rho of the arc after anchor 5, share
    [0.5635, 0.6613, 0.6553, 0.7293, 0.7154, 0.7879],
    // shoulder rho of the arc after anchor 6, share
    [0.396, 0.513, 0.5709, 0.4321, 0.5436, 0.317],
    // shoulder rho of the arc after anchor 7, share
    [0.5815, 0.5267, 0.4426, 0.6465, 0.5458, 0.6394],
  ],

  // Reliefs: heights in mm of a uniform cubic B-spline net over a window of the wall's chart, moved along `axis`; they carry the skin that lies inside the tape wall.
  reliefs: [
    {"name":"palm.hollow.0", "stations":[-26, 90], "phases":[1.6523, 4.8899], "axis":[-0.29749, 0.43776, 0.84845], "rows":15, "columns":25, "heights":[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.03, -0.28, -0.89, -0.75, 0, 0.01, -0.8, -0.75, -0.43, -0.35, -0.53, -0.66, -0.58, -0.22, 0, 0.03, 0.01, -0.01, -0.03, 0, 0, 0, 0, 0, 0, -0.73, -1.82, -0.02, 1.19, 0.29, 0.48, 0.03, 0.08, -0.02, 0.11, 0.36, 0.85, 0.74, 0.19, -0.24, -0.21, 0.19, 0.6, 0.24, 0, 0, 0, 0, 0, 0, -0.5, -1.16, 1.54, 0.52, -0.34, 0.03, -0.13, 0.07, -0.27, 0.85, 1.5, 2.45, 2.56, 1.36, 0.38, -0.45, -0.34, 0.91, 0.64, 0, 0, 0, 0, 0, 0, 0.27, -0.6, -1.05, 0.92, -0.18, 0.01, 0.11, -0.24, 0.78, 2.27, 5.11, 6.68, 5.85, 3.75, 2.09, 0.14, -0.67, 0.32, 0.55, 0, 0, 0, 0, 0, 0, 0.58, 1, 0.14, 0.96, 1.19, -0.53, 0.67, -0.11, -0.12, 6.22, 12.39, 12.39, 10.23, 6.98, 4.05, 1.63, -0.11, -0.06, 0.28, 0, 0, 0, 0, 0, 0, 2.15, -0.75, -0.6, -1.07, -1.24, 0.78, -0.14, -1.75, 6.97, 16.56, 16.34, 14.75, 12.7, 9.68, 6.41, 3.23, 0.21, -0.56, -0.12, 0, 0, 0, 0, 0, 0, 7.24, 0.36, -7.05, 4.11, 0.68, -0.12, -1.45, 6.88, 17.5, 17.35, 15.35, 14.72, 12.74, 10.26, 7.5, 4.58, 1.68, -0.16, -0.36, 0, 0, 0, 0, 0, 0, 3.82, -11.23, -19.72, -0.65, 0.12, -2.21, 6.81, 19.52, 18.02, 19.03, 18.68, 16.68, 14.14, 11.74, 9.13, 6.31, 2.93, 0.07, -0.45, 0, 0, 0, 0, 0, 0, -1.13, -9.4, -12.38, -4.2, -1, -0.09, 6.35, 12.36, 11.31, 11.32, 10.89, 9.64, 8.26, 6.95, 5.46, 3.7, 1.73, 0.19, -0.21, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]},
  ],
};
