import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";

/**
 * f1's scapha tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 * It is the cutter of the ear's upper hollow, the scapha and the fossa above the bowl, cut from the ear's leaf alone before the ear is
 * attached. Its course runs along the auricle shell's normal, 33 degrees off the sagittal plane, through the hollow's middle: a course
 * that ran along the shell instead met the leaf at a graze where its cap began and its walk was lost there. Each section is the
 * pocket between the ear's loop and its hull, read only above 1,574 mm, where the bowl's pocket has ended (`FamilyConicBody.ts concha
 * --concha-course=9.5,1585,100/-3.5,1585,80 --concha-domain=10.75,13.25 --concha-tip=15 --concha-lead=10 --concha-floor=77
 * --concha-box=-10,26,1574,1602`); the scapha is a groove about 3 mm deep in a thin shell, so the course reads it over 2.5 mm.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference head cut by this course's own planes over stations 10.75 to 13.25 mm, 9 sections 0.25 mm apart, every
 * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over
 * all sections). Regenerated through the engine's view loft from these numbers alone, the vertices of each section's hull lie
 * 0.26 mm from it on average and at most 1.37 mm; what lies inside that hull is not modelled. 39 independent numbers.
 */
export const AutoMovieHumanF1Scapha: AutoMovieHumanConicLoft.IFamily = {
  name: "scapha",
  centres: [AutoMovieHumanF1Joints.scaphaRoot, AutoMovieHumanF1Joints.scaphaTip],
  halves: [],
  up: [0, 1, 0],
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [0.75, 4.08, 7.42, 10.75, 12, 13.25],
  values: [
    // front (+u) extreme: u, mm
    [12.56, 12.56, 12.56, 12.56, 12.02, 10.49],
    // front (+u) extreme: v, mm
    [-5.17, -5.17, -5.17, -5.17, -4.03, -3.43],
    // side (+v) extreme: u, mm
    [-7.33, -7.33, -7.33, -7.33, -1.67, -1.99],
    // side (+v) extreme: v, mm
    [7.44, 7.44, 7.44, 7.44, 6.44, 5.75],
    // back (-u) extreme: u, mm
    [-3.67, -3.67, -3.67, -3.67, -9.88, -11.08],
    // back (-u) extreme: v, mm
    [-1.35, -1.35, -1.35, -1.35, 2.99, -3.01],
    // side (-v) extreme: u, mm
    [8.35, 8.35, 8.35, 8.35, 4.73, -1.53],
    // side (-v) extreme: v, mm
    [-16.93, -16.93, -16.93, -16.93, -18.47, -20.78],
    // shoulder rho of the arc after anchor 0, share
    [0.4267, 0.4267, 0.4267, 0.4267, 0.4592, 0.4394],
    // shoulder rho of the arc after anchor 1, share
    [0.5053, 0.5053, 0.5053, 0.5053, 0.4837, 0.5193],
    // shoulder rho of the arc after anchor 2, share
    [0.3631, 0.3631, 0.3631, 0.3631, 0.4279, 0.5201],
    // shoulder rho of the arc after anchor 3, share
    [0.4557, 0.4557, 0.4557, 0.4557, 0.422, 0.4792],
  ],

  // The part closes in a point at `tip`, a station placed by anatomy; its cap starts at `from`.
  tips: [null, {from: 13.25, tip: 18}],
};
