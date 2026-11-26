import type { IAutoMovieHumanConicLoft } from "@automovie/interface";

import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";

/**
 * f1's nostril tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference head cut by this course's own planes over stations 9 to 13 mm, 17 sections 0.25 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the vertices of each section's hull lie
 * 0.19 mm from it on average and at most 1.46 mm; what lies inside that hull is not modelled. 39 independent numbers.
 *
 * Corrected knot: the mouth at 9 mm, and the lead at 0 to 6 mm that carries it out of the nose, followed a reference artifact, not the
 * nostril. The reference's nostril is a closed level loop only from 1,551 mm up, about 10 by 8 mm at its mouth and 127.7 mm forward at
 * its front (`FamilyConicScan.ts nostril`, as `FamilyConicBody.ts` records it). The plane of knot 9, normal to a course that rises 20 mm in 21.5 mm and leans 8 mm back, rises forward
 * from 1,546.5 to 1,551.8 mm and is above 1,551 mm only in front of x 129.4 mm, past the loop's front: it cut no nostril, and its hull was
 * the open floor inside the fit's clip box (x 114 to 130 mm), 14.3 by 9.7 mm, its front extreme at x 131.4 mm and 1.25 mm from its +v
 * extreme across `v` (4.86 against 6.11). Drawn in by the rim's blend (`AutoMovieHumanF1.ts`, `drawnIn`, toward the extremes' mean)
 * that quarter closed to 0.35 mm and drew each nostril's opening as a pointed lens (`nose.front`, `nose.low-oblique`). Knot 11 is the
 * first whose plane cuts the loop (its front extreme at x 127.8 mm, the loop's 127.7), so the mouth and the lead carry its
 * section; the flare that `NOSTRIL_SPREAD_MM` drew out over 2 mm is gone with it.
 */
export const AutoMovieHumanF1Nostril: IAutoMovieHumanConicLoft.IFamily = {
  name: "nostril",
  centres: [
    AutoMovieHumanF1Joints.nostrilRoot,
    AutoMovieHumanF1Joints.nostrilTip,
  ],
  halves: [],
  up: AutoMovieHumanF1Placement.direction("nostril.up"),
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [0, 3, 6, 9, 11, 13],
  values: [
    // Knots 0 to 9 carry knot 11's section (the corrected mouth, above); fitted, knot 9 stood at 8.24, 4.86, 3.07, 6.11, -6.08, 2.57,
    // 2.4, -3.59 and shoulders 0.3156, 0.4296, 0.317, 0.3321.
    // front (+u) extreme: u, mm
    [5.14, 5.14, 5.14, 5.14, 5.14, 5.09],
    // front (+u) extreme: v, mm
    [-1.62, -1.62, -1.62, -1.62, -1.62, -2.06],
    // side (+v) extreme: u, mm
    [-3.12, -3.12, -3.12, -3.12, -3.12, -4.01],
    // side (+v) extreme: v, mm
    [3.84, 3.84, 3.84, 3.84, 3.84, 3.72],
    // back (-u) extreme: u, mm
    [-6.49, -6.49, -6.49, -6.49, -6.49, -5.87],
    // back (-u) extreme: v, mm
    [2.04, 2.04, 2.04, 2.04, 2.04, 1.12],
    // side (-v) extreme: u, mm
    [4.09, 4.09, 4.09, 4.09, 4.09, 3.07],
    // side (-v) extreme: v, mm
    [-4.59, -4.59, -4.59, -4.59, -4.59, -4.43],
    // shoulder rho of the arc after anchor 0, share
    [0.3172, 0.3172, 0.3172, 0.3172, 0.3172, 0.3193],
    // shoulder rho of the arc after anchor 1, share
    [0.4779, 0.4779, 0.4779, 0.4779, 0.4779, 0.4724],
    // shoulder rho of the arc after anchor 2, share
    [0.3855, 0.3855, 0.3855, 0.3855, 0.3855, 0.3368],
    // shoulder rho of the arc after anchor 3, share
    [0.283, 0.283, 0.283, 0.283, 0.283, 0.4845],
  ],

  // The part closes in a point at `tip`, a station placed by anatomy; its cap starts at `from`.
  tips: [null, { from: 13, tip: 16 }],
};
