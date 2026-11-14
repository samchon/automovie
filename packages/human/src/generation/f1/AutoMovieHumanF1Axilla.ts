import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's axilla tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes and one median point per quarter, with a groove of two inflections and its floor after anchors 0, fitted to the section itself
 * read along rays from the course: the air round the course point, capped under the band it cuts and drawn in from the walls.
 *
 * Source: the f1 reference body cut by this course's own planes over stations 25 to 78 mm, 107 sections 0.5 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.5 mm from it on average and at most 2.21 mm. 87 independent numbers.
 */
export const AutoMovieHumanF1Axilla: AutoMovieHumanConicLoft.IFamily = {
  name: "axilla",
  centres: AutoMovieHumanF1Joints.axilla,
  halves: [8, 5],
  up: AutoMovieHumanF1Placement.direction("axilla.up"),
  layout: AutoMovieHumanConicSection.inflected(1, [0]),
  knots: [25, 51.5, 78],
  values: [
    // front (+u) extreme: u, mm
    [7.6, 6.29, 6.06],
    // front (+u) extreme: v, mm
    [-2.4, -1.15, 0.06],
    // inflection place t on its chord, share
    [0.187, 0.3228, 0.1651],
    // inflection tangent turn from the chord, rad
    [0.4613, 0.4218, 0.8869],
    // median fullness f of the arc pair around anchor 2, share
    [0.837, 0.9642, 0.6836],
    // inflection place t on its chord, share
    [0.8677, 0.9703, 0.8007],
    // inflection tangent turn from the chord, rad
    [-0.8792, -1.2842, -0.6853],
    // median fullness f of the arc pair around anchor 4, share
    [0.2602, 0.2904, 0.2459],
    // side (+v) extreme: u, mm
    [-9.42, -17.07, -3.99],
    // side (+v) extreme: v, mm
    [8.22, 2.04, 8.49],
    // median fullness f of the arc pair around anchor 6, share
    [0.0275, 0.6825, 0.7268],
    // back (-u) extreme: u, mm
    [-10.93, -4.27, -5.07],
    // back (-u) extreme: v, mm
    [2.04, 0.99, -29.15],
    // median fullness f of the arc pair around anchor 8, share
    [0.3959, 0.6698, 0.0432],
    // side (-v) extreme: u, mm
    [-11.38, -3.54, -6.96],
    // side (-v) extreme: v, mm
    [-5.33, -1.18, -5.05],
    // median fullness f of the arc pair around anchor 10, share
    [0.2074, 0.041, 0.0767],
    // shoulder rho of the arc after anchor 0, share
    [0.0554, 0.0619, 0.0412],
    // shoulder rho of the arc after anchor 1, share
    [0.85, 0.648, 0.4847],
    // shoulder rho of the arc after anchor 2, share
    [0.85, 0.85, 0.85],
    // shoulder rho of the arc after anchor 3, share
    [0.1755, 0.0467, 0.1651],
    // shoulder rho of the arc after anchor 4, share
    [0.03, 0.0362, 0.0383],
    // shoulder rho of the arc after anchor 5, share
    [0.0592, 0.85, 0.8231],
    // shoulder rho of the arc after anchor 6, share
    [0.186, 0.85, 0.8023],
    // shoulder rho of the arc after anchor 7, share
    [0.053, 0.85, 0.0343],
    // shoulder rho of the arc after anchor 8, share
    [0.3737, 0.4551, 0.2111],
    // shoulder rho of the arc after anchor 9, share
    [0.3027, 0.0658, 0.0765],
    // shoulder rho of the arc after anchor 10, share
    [0.3058, 0.071, 0.0618],
  ],

  // The part closes in a point at `tip`, a station placed by anatomy; its cap starts at `from`.
  tips: [{from: 25, tip: 15}, {from: 78, tip: 86}],
};
