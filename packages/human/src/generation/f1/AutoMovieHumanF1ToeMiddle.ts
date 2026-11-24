import type { IAutoMovieHumanConicLoft } from "@automovie/interface";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";

/**
 * f1's toe.middle tape wall on the +Z side; the authored geometry is reflected across the body's median plane at z = 0.
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
export const AutoMovieHumanF1ToeMiddle: IAutoMovieHumanConicLoft.IFamily = {
  name: "toe.middle",
  centres: [AutoMovieHumanF1Joints.middletoe1, AutoMovieHumanF1Joints.middletoe2, AutoMovieHumanF1Joints.middletoeEnd],
  halves: [5],
  up: AutoMovieHumanF1Placement.direction("toe.middle.up"),
  layout: {"mirror": false, "anchors": [{"kind": "u", "guide": true, "pick": "max"}, {"kind": "m", "level": 1}, {"kind": "v", "guide": true, "pick": "max"}, {"kind": "m", "level": 1}, {"kind": "u", "guide": true, "pick": "min"}, {"kind": "m", "level": 1}, {"kind": "v", "guide": true, "pick": "min"}, {"kind": "m", "level": 1}], "least": 0.3},
  knots: [2, 14, 20, 24, 34, 44],
  values: [
    // front (+u) extreme: u, mm
    [5.43, 5.278013363028953, 6.168895322939867, 5.82, 4.54, 3.84],
    // front (+u) extreme: v, mm
    [0.56, 0.3509110022271714, 1.4411971492204902, 1.48, 1.12, 0.66],
    // median fullness f of the arc pair around anchor 1, share
    [0.5609, 0.539541940311804, 0.4786548008908686, 0.4735, 0.4768, 0.4585],
    // side (+v) extreme: u, mm
    [-3.17, -4.519024142538975, -0.850977550111359, -1.02, -2.47, -1.51],
    // side (+v) extreme: v, mm
    [7.62, 7.184746726057906, 6.236150645879733, 6.44, 7.01, 5.89],
    // median fullness f of the arc pair around anchor 3, share
    [0.8567, 0.6096689995545657, 0.517876170155902, 0.497, 0.4729, 0.4837],
    // back (-u) extreme: u, mm
    [-13.31, -13.201865122494432, -11.67872320712695, -11.14, -9.74, -6.78],
    // back (-u) extreme: v, mm
    [-0.78, -0.18769158129175947, 0.6435840534521158, 0.31, -0.72, -0.54],
    // median fullness f of the arc pair around anchor 5, share
    [0.6641, 0.5515556757238307, 0.48321387349665923, 0.473, 0.4719, 0.4913],
    // side (-v) extreme: u, mm
    [-2.5, -3.0498653006681513, -2.0360551447661472, -2.97, -4.98, -2],
    // side (-v) extreme: v, mm
    [-6.69, -6.483461024498887, -6.11788864142539, -6.31, -6.76, -6.11],
    // median fullness f of the arc pair around anchor 7, share
    [0.3636, 0.34606419064587973, 0.3870971732739421, 0.4223, 0.4824, 0.426],
    // shoulder rho of the arc after anchor 0, share
    [0.6344, 0.5605540080178174, 0.4871269371937639, 0.4855, 0.5016, 0.4902],
    // shoulder rho of the arc after anchor 1, share
    [0.9849, 0.5763896267260579, 0.5054645906458797, 0.5009, 0.5026, 0.498],
    // shoulder rho of the arc after anchor 2, share
    [0.5269, 0.5981409318485524, 0.5123460338530067, 0.4994, 0.4978, 0.4977],
    // shoulder rho of the arc after anchor 3, share
    [0.9932, 0.8236535964365256, 0.544830161247216, 0.5053, 0.4978, 0.5021],
    // shoulder rho of the arc after anchor 4, share
    [0.9454, 0.792239706013363, 0.5654723028953229, 0.5243, 0.496, 0.4995],
    // shoulder rho of the arc after anchor 5, share
    [0.9798, 0.6704163224944321, 0.5228888071269489, 0.5047, 0.4997, 0.4895],
    // shoulder rho of the arc after anchor 6, share
    [0.7781, 0.4507149452115813, 0.4871329291759466, 0.4968, 0.4997, 0.4951],
    // shoulder rho of the arc after anchor 7, share
    [0.3426, 0.34003748953229396, 0.4612229986636971, 0.4841, 0.4979, 0.4887],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 42.98, tip: 47.63, own: true, rings: 30}],
};
