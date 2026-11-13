import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";

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
 * 0.34 mm from it on average and at most 2 mm. 87 independent numbers.
 */
export const AutoMovieHumanF1Axilla: AutoMovieHumanConicLoft.IFamily = {
  name: "axilla",
  centres: [[16, 1287, 147.5], [-25, 1262, 150.5], [-45, 1269.5, 151], [-56, 1283, 151.5]],
  halves: [8,5],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.inflected(1, [0]),
  knots: [25, 51.5, 78],
  values: [
    // front (+u) extreme: u, mm
    [8.54, 6.18, 6.02],
    // front (+u) extreme: v, mm
    [-2.33, -1.05, -0.14],
    // inflection place t on its chord, share
    [0.2179, 0.267, 0.1234],
    // inflection tangent turn from the chord, rad
    [0.2173, 0.2711, 0.5301],
    // median fullness f of the arc pair around anchor 2, share
    [0.4221, 0.5448, 0.0209],
    // inflection place t on its chord, share
    [0.9434, 0.951, 0.9417],
    // inflection tangent turn from the chord, rad
    [-0.7322, -0.8311, -0.0227],
    // median fullness f of the arc pair around anchor 4, share
    [-0.0271, 0.1088, 0.0184],
    // side (+v) extreme: u, mm
    [-7.7, -7.17, -3.88],
    // side (+v) extreme: v, mm
    [8.35, 2.15, 8.41],
    // median fullness f of the arc pair around anchor 6, share
    [0.0386, 0.9289, 0.6027],
    // back (-u) extreme: u, mm
    [-11.02, -3.96, -4.89],
    // back (-u) extreme: v, mm
    [-2.44, 2.53, -81.27],
    // median fullness f of the arc pair around anchor 8, share
    [0.2687, 0.934, 0.3317],
    // side (-v) extreme: u, mm
    [-7.37, -15.24, -2.5],
    // side (-v) extreme: v, mm
    [-5.17, -1.13, -4.96],
    // median fullness f of the arc pair around anchor 10, share
    [0.1629, 0.0566, 0.0422],
    // shoulder rho of the arc after anchor 0, share
    [0.9839, 0.2298, -1.3443],
    // shoulder rho of the arc after anchor 1, share
    [0.6147, 0.7913, 0.6377],
    // shoulder rho of the arc after anchor 2, share
    [0.7405, 0.7634, 0.7463],
    // shoulder rho of the arc after anchor 3, share
    [0.3421, 0.241, 0.3538],
    // shoulder rho of the arc after anchor 4, share
    [0.0313, 0.0367, 0.327],
    // shoulder rho of the arc after anchor 5, share
    [0.5486, 0.7867, 0.8487],
    // shoulder rho of the arc after anchor 6, share
    [0.0647, 0.0511, 0.0725],
    // shoulder rho of the arc after anchor 7, share
    [0.045, 0.8709, 0.1653],
    // shoulder rho of the arc after anchor 8, share
    [0.6139, 0.9253, 0.0389],
    // shoulder rho of the arc after anchor 9, share
    [0.6269, 0.1855, 0.3669],
    // shoulder rho of the arc after anchor 10, share
    [0.143, 0.0412, 0.3689],
  ],

  // The part closes in a point at `tip`, a station placed by anatomy; its cap starts at `from`.
  tips: [{from: 25, tip: 21}, {from: 78, tip: 81}],
};
