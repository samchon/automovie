import type { IAutoMovieHumanConicLoft } from "@automovie/interface";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";

/**
 * f1's toe.ring tape wall on the +Z side; the authored geometry is reflected across the body's median plane at z = 0.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes and one median point per quarter, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: a measured proximal field and its exact carried distal source. The independent native wall and cap checked the input geometry.
 * The assembled attachment and its retained ownership still require inspection on the complete figure.
 */
export const AutoMovieHumanF1ToeRing: IAutoMovieHumanConicLoft.IFamily = {
  name: "toe.ring",
  centres: [AutoMovieHumanF1Joints.ringtoe1, AutoMovieHumanF1Joints.ringtoe2, AutoMovieHumanF1Joints.ringtoeEnd],
  halves: [5],
  up: AutoMovieHumanF1Placement.direction("toe.ring.up"),
  layout: {"mirror": false, "anchors": [{"kind": "u", "guide": true, "pick": "max"}, {"kind": "m", "level": 1}, {"kind": "v", "guide": true, "pick": "max"}, {"kind": "m", "level": 1}, {"kind": "u", "guide": true, "pick": "min"}, {"kind": "m", "level": 1}, {"kind": "v", "guide": true, "pick": "min"}, {"kind": "m", "level": 1}], "least": 0.3},
  knots: [2, 14, 23, 30.5, 38],
  values: [
    // front (+u) extreme: u, mm
    [4.21, 5.36916883116883, 4.27, 2.9, 1.12],
    // front (+u) extreme: v, mm
    [1.13, 3.4672467532467532, 2.86, 1.96, 1.17],
    // median fullness f of the arc pair around anchor 1, share
    [0.4816, 0.5031106493506493, 0.5003, 0.495, 0.4914],
    // side (+v) extreme: u, mm
    [-1.76, -1.6622337662337658, -1.59, -2.21, -5.55],
    // side (+v) extreme: v, mm
    [8.02, 6.3336623376623375, 6.78, 7.28, 7.07],
    // median fullness f of the arc pair around anchor 3, share
    [0.8546, 0.5484535064935064, 0.5003, 0.495, 0.4994],
    // back (-u) extreme: u, mm
    [-12.64, -11.578701298701299, -11.08, -10.42, -8.57],
    // back (-u) extreme: v, mm
    [-0.65, -1.4594545454545467, -0.44, 0.46, 0.4],
    // median fullness f of the arc pair around anchor 5, share
    [0.6266, 0.5128898701298701, 0.497, 0.4969, 0.4998],
    // side (-v) extreme: u, mm
    [-5.55, -5.411194805194804, -5.21, -5.11, -5.35],
    // side (-v) extreme: v, mm
    [-6.31, -6.076649350649351, -5.9, -5.49, -4.03],
    // median fullness f of the arc pair around anchor 7, share
    [0.4375, 0.4882283116883117, 0.4943, 0.4939, 0.4945],
    // shoulder rho of the arc after anchor 0, share
    [0.743, 0.5294290909090908, 0.5001, 0.499, 0.4978],
    // shoulder rho of the arc after anchor 1, share
    [0.1454, 0.4585958441558442, 0.4999, 0.5, 0.5011],
    // shoulder rho of the arc after anchor 2, share
    [0.9425, 0.5538838961038961, 0.5003, 0.4989, 0.5006],
    // shoulder rho of the arc after anchor 3, share
    [0.9531, 0.554054805194805, 0.5004, 0.4998, 0.5002],
    // shoulder rho of the arc after anchor 4, share
    [0.9682, 0.5589335064935065, 0.5019, 0.4997, 0.5003],
    // shoulder rho of the arc after anchor 5, share
    [0.0305, 0.44446571428571424, 0.4997, 0.5, 0.4997],
    // shoulder rho of the arc after anchor 6, share
    [0.8048, 0.5318129870129871, 0.4984, 0.5005, 0.5],
    // shoulder rho of the arc after anchor 7, share
    [0.4097, 0.4901446753246753, 0.5001, 0.4993, 0.4981],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 36.77, tip: 41.13, rings: 30}],
};
