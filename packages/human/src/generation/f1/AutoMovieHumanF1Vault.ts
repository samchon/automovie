import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's vault tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes and one median point per quarter, fitted to the section itself
 * read along rays from the course: the air round the course point, capped under the band it cuts and drawn in from the walls.
 *
 * Source: the f1 reference body cut by this course's own planes over stations 2 to 18 mm, 33 sections 0.5 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie
 * 0.23 mm from it on average and at most 1.13 mm. 63 independent numbers.
 */
export const AutoMovieHumanF1Vault: AutoMovieHumanConicLoft.IFamily = {
  name: "vault",
  centres: AutoMovieHumanF1Joints.vault,
  halves: [],
  up: AutoMovieHumanF1Placement.direction("vault.up"),
  layout: AutoMovieHumanConicSection.limb(1),
  knots: [2, 10, 18],
  values: [
    // front (+u) extreme: u, mm
    [9.83, 9.07, 8.34],
    // front (+u) extreme: v, mm
    [-3.35, -3.91, -3.19],
    // median fullness f of the arc pair around anchor 1, share
    [0.0675, 0.0789, 0.077],
    // side (+v) extreme: u, mm
    [-6.43, -9.22, -10.79],
    // side (+v) extreme: v, mm
    [18.32, 16.47, 14.73],
    // median fullness f of the arc pair around anchor 3, share
    [0.5588, 0.4407, 0.3673],
    // back (-u) extreme: u, mm
    [-11.59, -12.14, -12.95],
    // back (-u) extreme: v, mm
    [0, 0, 0],
    // median fullness f of the arc pair around anchor 5, share
    [0.4187, 0.4285, 0.4494],
    // side (-v) extreme: u, mm
    [-9.55, -10.1, -11.28],
    // side (-v) extreme: v, mm
    [-14.6, -13.86, -11.89],
    // median fullness f of the arc pair around anchor 7, share
    [0.1823, 0.1857, 0.1946],
    // shoulder rho of the arc after anchor 0, share
    [0.6616, 0.85, 0.85],
    // shoulder rho of the arc after anchor 1, share
    [0.4231, 0.4058, 0.4359],
    // shoulder rho of the arc after anchor 2, share
    [0.3721, 0.821, 0.5072],
    // shoulder rho of the arc after anchor 3, share
    [0.3456, 0.4019, 0.4884],
    // shoulder rho of the arc after anchor 4, share
    [0.4211, 0.4142, 0.3995],
    // shoulder rho of the arc after anchor 5, share
    [0.7594, 0.7768, 0.7601],
    // shoulder rho of the arc after anchor 6, share
    [0.2736, 0.0872, 0.1711],
    // shoulder rho of the arc after anchor 7, share
    [0.5942, 0.5041, 0.2446],
  ],

  // The part closes in a point at `tip`, a station placed by anatomy; its cap starts at `from`.
  tips: [{from: 2, tip: -1}, {from: 18, tip: 20}],
};
