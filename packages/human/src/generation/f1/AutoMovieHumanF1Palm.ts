import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";

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
 * Source: the f1 reference body cut by this course's own planes over stations 2 to 60 mm, 59 sections 1 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.18 mm from it on average and at most 5.06 mm. 105 independent numbers.
 */
export const AutoMovieHumanF1Palm: AutoMovieHumanConicLoft.IFamily = {
  name: "palm",
  centres: [[140.73, 993.53, 427.22], [191.89, 947.98, 468.66]],
  halves: [],
  up: [0, 0, 1],
  layout: AutoMovieHumanConicSection.limb(1),
  knots: [2, 18, 24, 31, 60],
  values: [
    // front (+u) extreme: u, mm
    [17.26, 14.77, 14.12, 13.31, 11.01],
    // front (+u) extreme: v, mm
    [-9.47, -13.08, -13.31, -14.06, -18.76],
    // median fullness f of the arc pair around anchor 1, share
    [0.3595, 0.4216, 0.3899, 0.4013, 0.4093],
    // side (+v) extreme: u, mm
    [-5.67, -19.24, -19.35, -30.25, -36.08],
    // side (+v) extreme: v, mm
    [23.69, 27.43, 29.02, 32.34, 37.69],
    // median fullness f of the arc pair around anchor 3, share
    [0.5779, 0.5536, 0.6194, 0.4458, 0.6895],
    // back (-u) extreme: u, mm
    [-27.55, -40, -43.39, -47.14, -58.23],
    // back (-u) extreme: v, mm
    [9.82, 10.62, 11.63, 19.06, 26.22],
    // median fullness f of the arc pair around anchor 5, share
    [0.3022, 0.2146, 0.165, 0.1492, 0.0519],
    // side (-v) extreme: u, mm
    [-4, -2.7, -3.66, -3.36, -4.62],
    // side (-v) extreme: v, mm
    [-29.23, -35.06, -37.33, -39.14, -44.8],
    // median fullness f of the arc pair around anchor 7, share
    [0.4387, 0.4152, 0.4576, 0.4581, 0.5697],
    // shoulder rho of the arc after anchor 0, share
    [0.3653, 0.4518, 0.4983, 0.5358, 0.6294],
    // shoulder rho of the arc after anchor 1, share
    [0.3885, 0.3184, 0.168, 0.2495, 0.1378],
    // shoulder rho of the arc after anchor 2, share
    [0.6746, 0.6628, 0.8341, 0.5028, 0.9419],
    // shoulder rho of the arc after anchor 3, share
    [0.4523, 0.6679, 0.6708, 0.457, 0.3499],
    // shoulder rho of the arc after anchor 4, share
    [0.3023, 0.079, 0.1009, 0.5224, 0.0599],
    // shoulder rho of the arc after anchor 5, share
    [0.5822, 0.6891, 0.6431, 0.6945, 0.3592],
    // shoulder rho of the arc after anchor 6, share
    [0.51, 0.5397, 0.5944, 0.5317, 0.5658],
    // shoulder rho of the arc after anchor 7, share
    [0.5628, 0.4807, 0.5535, 0.5814, 0.5298],
  ],

  // Reliefs: heights in mm of a uniform cubic B-spline net over a window of the wall's chart, moved along `axis`; they carry the skin that lies inside the tape wall.
  reliefs: [
    {"name":"palm.hollow.0", "stations":[-26, 90], "phases":[1.6523, 4.8899], "axis":[-0.29749, 0.43776, 0.84845], "rows":15, "columns":25, "heights":[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.94, 1.54, -1.52, -1.69, -1.32, -0.3, -0.08, -0.63, -1.1, -1.17, -0.85, -0.36, 0.06, 0.21, 0.15, 0.24, 0.48, 0.47, 0.18, 0, 0, 0, 0, 0, 0, 1.66, -1.13, -1.33, 2.04, 0.07, 0.08, 0.3, 0.09, -0.12, -0.12, 0.21, 0.82, 0.87, 0.34, -0.19, -0.23, 0.18, 0.75, 0.38, 0, 0, 0, 0, 0, 0, -0.48, -4.37, -0.47, 0.57, 0.26, 0.13, -0.09, -0.22, -0.03, 1.17, 1.77, 2.56, 2.4, 1.11, 0.24, -0.58, -0.49, 0.68, 0.56, 0, 0, 0, 0, 0, 0, 0.29, -0.24, 3.99, -0.22, -1.24, 0.06, 0.11, -0.02, 0.62, 2.19, 5.23, 7.07, 6.49, 4.28, 2.45, 0.43, -0.43, 0.48, 0.61, 0, 0, 0, 0, 0, 0, 0.63, -0.01, -2.55, 0.69, 2.44, -0.48, 0.02, 0.11, -0.09, 5.85, 11.38, 10.77, 8.74, 5.97, 3.3, 1.1, -0.47, 0.1, 0.47, 0, 0, 0, 0, 0, 0, 2.6, 0.61, -0.82, 0.89, -1.88, 1.58, -0.49, -1.75, 5.97, 15.14, 14.67, 13.33, 11.87, 9.22, 6.14, 3.12, 0.27, -0.45, -0.06, 0, 0, 0, 0, 0, 0, 7.04, -0.17, -6.25, 4.68, -3.25, 0.41, -1.61, 7.29, 18.13, 18.34, 16.41, 15.8, 13.61, 10.91, 8.06, 4.99, 2.04, -0.15, -0.47, 0, 0, 0, 0, 0, 0, 2.38, -13.88, -19.61, -2.69, 3.08, -1.78, 6.49, 20.33, 19.17, 20.64, 20.35, 18.08, 15.28, 12.68, 9.82, 6.72, 3.18, 0.13, -0.51, 0, 0, 0, 0, 0, 0, -1.76, -9.85, -12.01, -4.61, 0.82, 0.31, 6.37, 12.89, 12.07, 12.29, 11.94, 10.57, 9.03, 7.55, 5.86, 3.93, 1.84, 0.23, -0.22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]},
  ],
};
