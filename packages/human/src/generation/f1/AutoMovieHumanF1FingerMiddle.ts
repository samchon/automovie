import type { IAutoMovieHumanConicLoft } from "@automovie/interface";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";

/**
 * f1's finger.middle tape wall on the +Z side; the authored geometry is reflected across the body's median plane at z = 0.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: a measured proximal field and its exact carried distal source. The independent native wall and cap checked the input geometry.
 * The assembled attachment and its retained ownership still require inspection on the complete figure.
 */
export const AutoMovieHumanF1FingerMiddle: IAutoMovieHumanConicLoft.IFamily = {
  name: "finger.middle",
  centres: [AutoMovieHumanF1Joints.middle1, AutoMovieHumanF1Joints.middle2, AutoMovieHumanF1Joints.middle3, AutoMovieHumanF1Joints.middleEnd],
  halves: [5, 5],
  up: AutoMovieHumanF1Placement.direction("finger.middle.up"),
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [2.5, 14.5, 21, 33, 41, 49, 61, 69, 81, 89],
  values: [
    // front (+u) extreme: u, mm
    [9.32, 8.369731645083396, 8.42, 8.79, 9.08, 8.76, 8.13, 7.85, 7.32, 5.56],
    // front (+u) extreme: v, mm
    [-0.21, 4.334548417169202, 2.77, -0.26, 0.01, -0.18, 0.23, 0.14, 1.36, 1.28],
    // side (+v) extreme: u, mm
    [7.51, 6.606493641531912, 3.63, -0.37, 1.36, 1.29, 0.61, 0.43, -0.01, 0.45],
    // side (+v) extreme: v, mm
    [17.79, 10.509542000614262, 9.88, 9.61, 8.8, 7.38, 7.08, 6.51, 7.06, 5.38],
    // back (-u) extreme: u, mm
    [-10.64, -9.364859395737797, -9.14, -9.02, -9.07, -8.48, -7.71, -7.35, -7.19, -6.16],
    // back (-u) extreme: v, mm
    [1.84, 1.0152399435309256, 1.5, 1.43, -0.67, -0.4, 0.21, 0.35, 0.87, 1.15],
    // side (-v) extreme: u, mm
    [0.2, -0.5115492993147442, 0.01, -0.03, -1.86, -0.41, 0.07, -0.08, -0.21, 0.81],
    // side (-v) extreme: v, mm
    [-7.57, -7.448066110702833, -7.74, -8.39, -8.59, -7.98, -7.27, -6.61, -4.54, -3.28],
    // shoulder rho of the arc after anchor 0, share
    [0.9472, 0.3660129670687247, 0.4011, 0.4937, 0.4067, 0.4344, 0.4502, 0.4534, 0.3903, 0.4633],
    // shoulder rho of the arc after anchor 1, share
    [0.9215, 0.7511035682944096, 0.5972, 0.3991, 0.4683, 0.4561, 0.4413, 0.4228, 0.4044, 0.4044],
    // shoulder rho of the arc after anchor 2, share
    [0.4626, 0.30700913792347395, 0.3743, 0.4548, 0.3586, 0.4198, 0.4311, 0.4611, 0.3764, 0.3866],
    // shoulder rho of the arc after anchor 3, share
    [0.3656, 0.4863745951244304, 0.453, 0.4257, 0.507, 0.4429, 0.4281, 0.4854, 0.4198, 0.2515],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 89, tip: 92.88, own: true}],
};
