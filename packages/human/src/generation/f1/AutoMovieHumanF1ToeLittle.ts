import type { IAutoMovieHumanConicLoft } from "@automovie/interface";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";

/**
 * f1's toe.little tape wall on the +Z side; the authored geometry is reflected across the body's median plane at z = 0.
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
export const AutoMovieHumanF1ToeLittle: IAutoMovieHumanConicLoft.IFamily = {
  name: "toe.little",
  centres: [AutoMovieHumanF1Joints.littletoe1, AutoMovieHumanF1Joints.littletoe2, AutoMovieHumanF1Joints.littletoeEnd],
  halves: [5],
  up: AutoMovieHumanF1Placement.direction("toe.little.up"),
  layout: {"mirror": false, "anchors": [{"kind": "u", "guide": true, "pick": "max"}, {"kind": "m", "level": 1}, {"kind": "v", "guide": true, "pick": "max"}, {"kind": "m", "level": 1}, {"kind": "u", "guide": true, "pick": "min"}, {"kind": "m", "level": 1}, {"kind": "v", "guide": true, "pick": "min"}, {"kind": "m", "level": 1}], "least": 0.3},
  knots: [6.5, 12.5, 20, 25, 30],
  values: [
    // front (+u) extreme: u, mm
    [4.89, 5.634444444444445, 4.88, 3.82, 1.78],
    // front (+u) extreme: v, mm
    [0.02, 0.6512820512820521, 0.23, -0.22, -0.45],
    // median fullness f of the arc pair around anchor 1, share
    [0.5601, 0.5124162393162394, 0.4994, 0.4993, 0.499],
    // side (+v) extreme: u, mm
    [-0.73, -1.0404273504273478, -3.05, -4.23, -3.57],
    // side (+v) extreme: v, mm
    [6.75, 5.034017094017094, 4.87, 4.93, 4.2],
    // median fullness f of the arc pair around anchor 3, share
    [0.837, 0.5717401709401708, 0.4996, 0.4996, 0.4998],
    // back (-u) extreme: u, mm
    [-11.48, -10.527863247863246, -9.6, -8.74, -6.72],
    // back (-u) extreme: v, mm
    [0.01, -0.7623931623931639, -0.4, 0.08, 0.53],
    // median fullness f of the arc pair around anchor 5, share
    [0.5444, 0.509005982905983, 0.4993, 0.4993, 0.4996],
    // side (-v) extreme: u, mm
    [-3.4, -2.415641025641025, -2.92, -3.45, -3.47],
    // side (-v) extreme: v, mm
    [-7.38, -8.00042735042735, -7.18, -6.2, -4.67],
    // median fullness f of the arc pair around anchor 7, share
    [0.3249, 0.46034871794871807, 0.4983, 0.4988, 0.4974],
    // shoulder rho of the arc after anchor 0, share
    [0.4786, 0.49545042735042744, 0.5, 0.4999, 0.4995],
    // shoulder rho of the arc after anchor 1, share
    [0.0145, 0.3962606837606836, 0.5, 0.5, 0.5],
    // shoulder rho of the arc after anchor 2, share
    [0.0512, 0.4041025641025636, 0.5, 0.5, 0.5],
    // shoulder rho of the arc after anchor 3, share
    [0.9512, 0.5964102564102562, 0.5, 0.5, 0.5],
    // shoulder rho of the arc after anchor 4, share
    [0.9609, 0.5984829059829059, 0.5, 0.5, 0.5],
    // shoulder rho of the arc after anchor 5, share
    [0.6053, 0.5224213675213676, 0.4999, 0.4999, 0.4999],
    // shoulder rho of the arc after anchor 6, share
    [0.4187, 0.4820094017094018, 0.4998, 0.5002, 0.5002],
    // shoulder rho of the arc after anchor 7, share
    [0.2993, 0.45640427350427387, 0.4998, 0.5002, 0.4998],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 30.22, tip: 33.63, rings: 30}],
};
