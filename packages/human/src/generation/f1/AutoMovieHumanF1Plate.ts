import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";

/**
 * f1's plate tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference head cut by this course's own planes over stations 5.5 to 66 mm, 122 sections 0.5 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.41 mm from it on average and at most 2.43 mm. 77 independent numbers.
 */
export const AutoMovieHumanF1Plate: AutoMovieHumanConicLoft.IFamily = {
  name: "plate",
  centres: AutoMovieHumanF1Joints.plate,
  halves: [4, 8, 4],
  up: AutoMovieHumanF1Placement.direction("plate.up"),
  // The chart's roll about the course, radians at its own knots (`AutoMovieHumanConicLoft.IFamily.roll`).
  roll: { knots: [6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 62, 66], values: [2.0608, 2.0708, 1.9408, 1.7708, 1.6708, 1.6108, 1.5708, 1.5008, 1.4908, 1.5608, 1.6208, 1.7508, 1.9008, 2.0708, 2.2508, 2.3908] },
  layout: AutoMovieHumanConicSection.lens(0),
  knots: [5.5, 19.5, 35.75, 40.5, 48.5, 58.5, 66],
  values: [
    // front (+u) extreme: u, mm
    [1.25, 4.42, 4.39, 4.13, 5.72, 3.67, 2.73],
    // side (+v) extreme: u, mm
    [-0.59, 0.05, 1.5, -0.65, 1.2, 0.77, -0.93],
    // side (+v) extreme: v, mm
    [18.26, 18.8, 20.9, 19.12, 19, 18.08, 18.72],
    // back (-u) extreme: u, mm
    [-6.31, -3.59, -3.43, -4.75, -3.05, -3.99, -6.04],
    // side (-v) extreme: u, mm
    [-3.55, -0.09, 1.45, 0.62, 1.68, -1.54, -3.5],
    // side (-v) extreme: v, mm
    [-6.45, -11.38, -13.4, -14.04, -14.61, -16.14, -13.39],
    // shoulder rho of the arc after anchor 0, share
    [0.7382, 0.7443, 0.6057, 0.6477, 0.7169, 0.5504, 0.4079],
    // shoulder rho of the arc after anchor 1, share
    [0.5685, 0.3109, 0.7178, 0.6376, 0.4437, 0.4457, 0.5833],
    // shoulder rho of the arc after anchor 2, share
    [0.06, 0.2022, 0.5205, 0.5098, 0.2517, 0.3179, 0.3638],
    // shoulder rho of the arc after anchor 3, share
    [0.0773, 0.6021, 0.2744, 0.3816, 0.6657, 0.5838, 0.3189],
  ],

  // Phases round the part stand at most this far apart, mm (`AutoMovieHumanConicLoft.IFamily.pitch`).
  pitch: 1.5,

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [{from: 5.5, tip: 2.5}, {from: 66, tip: 69.13}],
};
