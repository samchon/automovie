import type { IAutoMovieHumanConicLoft } from "@automovie/interface";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";

/**
 * f1's finger.index tape wall on the +Z side; the authored geometry is reflected across the body's median plane at z = 0.
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
export const AutoMovieHumanF1FingerIndex: IAutoMovieHumanConicLoft.IFamily = {
  name: "finger.index",
  centres: [AutoMovieHumanF1Joints.index1, AutoMovieHumanF1Joints.index2, AutoMovieHumanF1Joints.index3, AutoMovieHumanF1Joints.indexEnd],
  halves: [5, 5],
  up: AutoMovieHumanF1Placement.direction("finger.index.up"),
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [2, 8, 14, 18, 49.5, 56, 68, 81],
  values: [
    // front (+u) extreme: u, mm
    [10.47, 10.050052880447092, 9.305075147112523, 9.2, 8.33, 7.87, 7.65, 5.35],
    // front (+u) extreme: v, mm
    [2.06, 2.208631936953454, 1.1450854071756111, 1.14, 2.16, 2.21, 2.62, 1.18],
    // side (+v) extreme: u, mm
    [0.03, 0.3422723945210644, 0.5969907853847921, 0.75, 1.73, 1.69, 0.58, 0.74],
    // side (+v) extreme: v, mm
    [12.93, 11.085742863173289, 9.645827342005846, 9.53, 8.61, 7.9, 7.5, 5.43],
    // back (-u) extreme: u, mm
    [-26.8, -17.945365063608474, -9.990350630861935, -9.07, -7.92, -7.28, -7.16, -5.66],
    // back (-u) extreme: v, mm
    [-7.7, 1.7671627407997768, 1.55290729900144, 1.21, 1.22, 1.34, 1.23, 0.96],
    // side (-v) extreme: u, mm
    [0.09, 0.6812223891982927, 0.35793873642769203, 0.01, -1.07, -0.7, -1.28, 1.29],
    // side (-v) extreme: v, mm
    [-10.41, -9.699769229448577, -8.781490393144598, -8.43, -6.11, -5.62, -4.65, -2.62],
    // shoulder rho of the arc after anchor 0, share
    [0.499, 0.4203043917421026, 0.4487883033322541, 0.4517, 0.433, 0.4333, 0.4244, 0.5364],
    // shoulder rho of the arc after anchor 1, share
    [0.3673, 0.2797457734122777, 0.376529380045707, 0.3937, 0.4382, 0.4547, 0.3926, 0.4919],
    // shoulder rho of the arc after anchor 2, share
    [0.2927, 0.2734284654355818, 0.4053744940618677, 0.4302, 0.4232, 0.3975, 0.3946, 0.5378],
    // shoulder rho of the arc after anchor 3, share
    [0.3394, 0.3487373630680226, 0.40065453018568736, 0.4091, 0.4107, 0.4181, 0.4632, 0.1675],
  ],

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 81, tip: 84.38, own: true}],
};
