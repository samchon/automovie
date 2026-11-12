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
 * 0.14 mm from it on average and at most 0.97 mm; what lies inside that hull is not modelled. 65 independent numbers.
 *
 * The course runs straight out of the head to `AutoMovieHumanF1Joints.earTurn` and then turns, over 6 mm either side of it, to lean back and
 * up with the auricle's shell, so the root's sections to 78 mm out stand in sagittal planes and the ring the head's band lands on is the
 * auricle's whole footprint, its front and its lobule included, while the outer sections follow the shell to the helix's back, where the
 * pole stands. On a course leaning from the root the band owned the auricle's front third and the lobule's lower half. The rolled rim is
 * the helix merged onto this leaf (`AutoMovieHumanF1Helix`) and the hollows are cuts, so the leaf carries no relief: a net over its outer
 * face converged with the dome's phases and drew a fan of creases on the upper inner face. Re-emitted from `test` by
 * `node .shots/esbuild/FamilyConicBody.cjs ear --emit`, with this paragraph and the next kept.
 *
 * Hand edit after that fit: the front (+u) extreme's `v` at the knots at 19 and 22 mm is -0.8 and -1.5 mm in place of the fit's 0.78 and
 * 0.12. The fit put the front extreme within 0.5 to 1.8 mm of the side (+v) extreme's `v` there, so the arc between them, which leaves the
 * front extreme square to `u`, turned by about 80 degrees within 0.15 mm of the wall (read every 0.003 rad of phase across the front
 * extreme at stations 21.5 to 23.5): a crease along the rim's top, over which the helix is merged. The curve where the tube crosses it
 * turned as sharply, and the merge was lost or its blend folded at that crossing for one setting in two of the tube's buried end, its
 * radius's knots or its columns (192 columns passed, 256 folded). Held 3.4 and 2.1 mm apart, every one of those settings merges on both
 * ears, the ear's own subtree realized from the construction's sources.
 */
export const AutoMovieHumanF1Ear: AutoMovieHumanConicLoft.IFamily = {
  name: "ear",
  centres: [AutoMovieHumanF1Joints.earRoot, AutoMovieHumanF1Joints.earTurn, AutoMovieHumanF1Joints.earTip],
  halves: [6],
  up: [0.3, 0.95, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [4, 8, 13, 19, 22],
  values: [
    // front (+u) extreme: u, mm
    [17.68, 20.13, 19.87, 16.71, 13.27],
    // front (+u) extreme: v, mm; at the last two knots a hand edit after the fit (above)
    [8.15, 3.98, 2.56, -0.8, -1.5],
    // side (+v) extreme: u, mm
    [-20.77, -46.35, -22.66, -9.9, 3.47],
    // side (+v) extreme: v, mm
    [26.11, 12.62, 6.86, 2.58, 0.64],
    // back (-u) extreme: u, mm
    [-34.38, -29.14, -20.57, -13.26, -7.41],
    // back (-u) extreme: v, mm
    [20.68, 10.83, 6.76, 2.27, 4.36],
    // side (-v) extreme: u, mm
    [-7.38, -3.26, 2.98, 7.34, 2.17],
    // side (-v) extreme: v, mm
    [-5.44, -4.35, -4.15, -4.94, -4.79],
    // shoulder rho of the arc after anchor 0, share
    [0.2235, 0.5153, 0.5532, 0.5518, 0.4003],
    // shoulder rho of the arc after anchor 1, share
    [0.4643, 0.5027, 0.4702, 0.4828, 0.498],
    // shoulder rho of the arc after anchor 2, share
    [0.19, 0.2297, 0.331, 0.4355, 0.5641],
    // shoulder rho of the arc after anchor 3, share
    [0.422, 0.3885, 0.4985, 0.4627, 0.514],
  ],

  // Phases round the part stand at most this far apart, mm (`AutoMovieHumanConicLoft.IFamily.pitch`).
  pitch: 1.5,

  // The part closes in a point at `tip`, the station where the reference's own loop vanishes; its cap starts at `from`.
  tips: [null, {from: 22, tip: 24.13}],
};
