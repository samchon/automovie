import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's ear tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference head cut by this course's own planes over stations 4 to 22 mm, 37 sections 0.5 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the vertices of each section's hull lie
 * 0.15 mm from it on average and at most 0.97 mm; what lies inside that hull is not modelled. 65 independent numbers.
 *
 * The course leans back with the auricle's shell (`AutoMovieHumanF1Joints.earTip`), so the wall is the shell's hull at every depth and
 * its pole stands on the helix's back. What lies inside that hull on the outer face, the scapha, the fossa and the antihelix, is the relief
 * `ear.face`: heights cast from the wall's forward half along the shell's outer normal onto the reference, stations 8 to 23.6 mm, with
 * casts deeper than 7 mm (the concha's bowl, which is a cut of its own) left to the net's fairness (`FamilyConicBody.ts`, `EAR_FACE`).
 * Re-emitted from `test` by `node .shots/esbuild/FamilyConicBody.cjs ear --emit`, with this paragraph kept.
 */
export const AutoMovieHumanF1Ear: AutoMovieHumanConicLoft.IFamily = {
  name: "ear",
  centres: [AutoMovieHumanF1Joints.earRoot, AutoMovieHumanF1Joints.earTip],
  halves: [],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [4, 10, 13, 16, 22],
  values: [
    // front (+u) extreme: u, mm
    [15.61, 17.62, 17.53, 16.74, 11.24],
    // front (+u) extreme: v, mm
    [12.84, 8.2, 7.31, 6.5, 3.08],
    // side (+v) extreme: u, mm
    [15.18, 18.42, 21.03, 24.69, 33.97],
    // side (+v) extreme: v, mm
    [15.87, 13.31, 11.41, 9.18, 3.35],
    // back (-u) extreme: u, mm
    [-33.27, -27.84, -23.4, -18.57, -6.42],
    // back (-u) extreme: v, mm
    [5.21, 3.96, 3.22, 1.71, -2.59],
    // side (-v) extreme: u, mm
    [-7.16, -5, -6.1, -2.71, -5.84],
    // side (-v) extreme: v, mm
    [-6, -2.41, -2.47, -3.31, -3.76],
    // shoulder rho of the arc after anchor 0, share
    [0.4614, 0.4909, 0.489, 0.477, 0.5232],
    // shoulder rho of the arc after anchor 1, share
    [0.436, 0.1333, 0.0916, 0.1145, 0.6796],
    // shoulder rho of the arc after anchor 2, share
    [0.2042, 0.4249, 0.4579, 0.4954, 0.5595],
    // shoulder rho of the arc after anchor 3, share
    [0.2757, 0.2297, 0.3599, 0.3898, 0.4402],
  ],

  // Phases round the part stand at most this far apart, mm (`AutoMovieHumanConicLoft.IFamily.pitch`).
  pitch: 1.5,

  // The part closes in a point at `tip`, a station placed by anatomy; its cap starts at `from`.
  tips: [null, {from: 22, tip: 24}],

  // Reliefs: heights in mm of a uniform cubic B-spline net over a window of the wall's chart, moved along `axis`; they carry the skin that lies inside the tape wall.
  reliefs: [
    {"name":"ear.face", "stations":[8, 23.6], "phases":[0.15, 3], "axis":[-0.6, 0, -0.8], "rows":13, "columns":13, "heights":[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.35, 9.53, 8.54, 7.24, 5.54, 6.15, 5.47, 0, 0, 0, 0, 0, 0, 1.48, 4.82, 1.59, 1.74, 0.86, 0.5, 1.1, 0, 0, 0, 0, 0, 0, 3.22, 5.31, 3.29, 3.13, 2.3, 1.6, 0.57, 0, 0, 0, 0, 0, 0, 4.59, 3.97, 2.65, 2.31, 1.76, 1.07, 0.95, 0, 0, 0, 0, 0, 0, 6.2, 4.75, 4.5, 3.97, 3.81, 2.7, 3.93, 0, 0, 0, 0, 0, 0, 5.92, 3.3, 4.07, 3.51, 3.79, 2.28, 5.74, 0, 0, 0, 0, 0, 0, 11.3, 8.72, 9.54, 9.33, 9.6, 8.19, 11.61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]},
  ],
};
