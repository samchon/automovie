import type { IAutoMovieHumanConicLoft } from "@automovie/interface";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";

/**
 * f1's toe.index tape wall on the +Z side; the authored geometry is reflected across the body's median plane at z = 0.
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
export const AutoMovieHumanF1ToeIndex: IAutoMovieHumanConicLoft.IFamily = {
  name: "toe.index",
  centres: [AutoMovieHumanF1Joints.indextoe1, AutoMovieHumanF1Joints.indextoe2, AutoMovieHumanF1Joints.indextoeEnd],
  halves: [5],
  up: AutoMovieHumanF1Placement.direction("toe.index.up"),
  layout: {"mirror": false, "anchors": [{"kind": "u", "guide": true, "pick": "max"}, {"kind": "v", "guide": true, "pick": "max"}, {"kind": "u", "guide": true, "pick": "min"}, {"kind": "v", "guide": true, "pick": "min"}], "least": 0.3},
  knots: [2, 14, 25, 33, 39, 47, 53],
  values: [
    // front (+u) extreme: u, mm
    [6.6, 4.469472750198477, 4.68, 5.02, 4.68, 3.93, 4.43],
    // front (+u) extreme: v, mm
    [-4.83, -4.033152384065754, -1.46, 0.11, -0.17, -0.04, -0.02],
    // side (+v) extreme: u, mm
    [-1.58, -7.182033437631346, -5.87, -4.22, -3.99, -3.17, -2.01],
    // side (+v) extreme: v, mm
    [24.97, 9.652322327558027, 7.36, 7.72, 8, 8.33, 7.71],
    // back (-u) extreme: u, mm
    [-21, -17.557858434907146, -14.64, -12.62, -11.45, -10.16, -7],
    // back (-u) extreme: v, mm
    [2.46, -4.228974672706612, -2.93, -0.75, 0.51, 0.58, -0.1],
    // side (-v) extreme: u, mm
    [-12.57, -3.4128946901415023, -2.17, -2.69, -3.35, -2.97, -2.07],
    // side (-v) extreme: v, mm
    [-19.27, -9.409764130823953, -7.93, -8.15, -8.35, -8.49, -7.05],
    // shoulder rho of the arc after anchor 0, share
    [0.9868, 0.6226787344136738, 0.4644, 0.4131, 0.4428, 0.4007, 0.3773],
    // shoulder rho of the arc after anchor 1, share
    [0.8544, 0.64982697053192, 0.5503, 0.4981, 0.4803, 0.4884, 0.4403],
    // shoulder rho of the arc after anchor 2, share
    [0.9999, 0.6754964230451908, 0.5106, 0.4375, 0.4492, 0.5049, 0.5438],
    // shoulder rho of the arc after anchor 3, share
    [0.1708, 0.3151448363143884, 0.3877, 0.4248, 0.4355, 0.4082, 0.3382],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 51.03, tip: 56.63, own: true, rings: 30}],
};
