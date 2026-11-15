import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";

/**
 * f1's concha tape wall on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly.
 * It is the cutter of the ear's bowl, cut from the figure after the ear is attached.
 *
 * Its sections are not plane cuts of the skin: the bowl's sides open toward the cheek, only 3 to 5 mm above its floor, so no plane
 * holds a loop of it. Each is read from the skin's depth along the course: at station `s` the region round the course where the
 * first skin met along the course lies past `s` (`FamilyConicBody.ts concha --concha-depth=20 --concha-course=16.5,1563,90/16.5,1563,60
 * --concha-up=0,1,0 --concha-domain=21,24 --concha-tip=25 --concha-lead=18`), fitted 65.5 to 69 mm out, where those regions close.
 * It reaches the bowl's floor, past the ear's leaf, which starts 78 mm out: its cut crosses the ear's band from rim to rim and back,
 * which the engine clips as one pair of runs (`AutoMovieSolidClip`). Its outer end is closed 9 mm past its lead's start, so the curve
 * where it meets the leaf never runs along an open end.
 *
 * Hand edits after that fit, so the cut is a bowl and not a prism. The fitted floor section (its first knot, 69 mm out) is held from
 * 87 to 79 mm out and the part closes from there in a rounded cap to 71 mm out, the skull's level beside the ear (`FamilyConicScan.ts ear`:
 * 70 to 74 mm at x -10 to 30): carried straight in to the floor at 65 mm, the cut's lower wall stood 20 mm deep as a flat lit shelf over
 * the lobe. Its back (+v) extreme widens from that section's 8.66 mm to 11.5 and 13.5 mm toward the mouth, so the back wall slopes back
 * toward the antihelix's crest (x 0 to 6 at 88 to 91 mm out, `FamilyConicEar.ts --map`) instead of standing square to the face. Its lower
 * (-u) extreme reads -6 mm across in place of the fit's -10.6; the model holds a guide within 0.92 of its neighbours' box either way. Its
 * front (-v) extreme reaches 8.5 mm forward at the mouth and 7 mm at the floor's level (x 25 to 23.5) in place of the fit's 4.9: the leaf's
 * hull spans the concha's mouth in front, 79 to 80 mm out at x 20 to 25 where the reference's tragus and cheek stand 72 to 74 mm out
 * (`FamilyConicEar.ts --map`), and the narrow cutter left that span as a flat wall seen from the front. Its floor (-u extreme) rises
 * toward the mouth, 7.13 mm under the course at the floor's knot, 5.5 at the middle and 3.5 at the mouth (y 1,556 to 1,559.5), so the
 * bowl's lower wall slopes up to the antitragus (79 to 84 mm out at y 1,556 to 1,560 on the reference's map) instead of standing level
 * the bowl's whole depth as a lit ledge.
 *
 * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs
 * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each
 * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.
 *
 * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between
 * them: the section is a chain of conics through its four extremes, fitted to the convex hull of the reference skin
 * (the path of a taut tape).
 *
 * Source: the f1 reference head's depth over stations 21 to 24 mm of the fitting course, 13 sections 0.25 mm apart, every second
 * one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over all
 * sections). Regenerated through the engine's view loft from these numbers alone, the vertices of each section lie 0.24 mm from it
 * on average and at most 1.05 mm. 39 independent numbers.
 */
export const AutoMovieHumanF1Concha: AutoMovieHumanConicLoft.IFamily = {
  name: "concha",
  centres: [AutoMovieHumanF1Joints.conchaRoot, AutoMovieHumanF1Joints.conchaTip],
  halves: [],
  up: AutoMovieHumanF1Placement.direction("concha.up"),
  layout: AutoMovieHumanConicSection.limb(0),
  knots: [3, 9, 15],
  values: [
    // front (+u) extreme: u, mm
    [6.54, 6.54, 6.54],
    // front (+u) extreme: v, mm
    [1.13, 1.13, 1.13],
    // side (+v) extreme: u, mm
    [3.76, 3.76, 3.76],
    // side (+v) extreme: v, mm
    [13.5, 11.5, 8.66],
    // back (-u) extreme: u, mm
    [-3.5, -5.5, -7.13],
    // back (-u) extreme: v, mm
    [-6, -6, -6],
    // side (-v) extreme: u, mm
    [-8.73, -8.73, -8.73],
    // side (-v) extreme: v, mm
    [-8.5, -7.75, -7],
    // shoulder rho of the arc after anchor 0, share
    [0.4816, 0.4816, 0.4816],
    // shoulder rho of the arc after anchor 1, share
    [0.4396, 0.4396, 0.4396],
    // shoulder rho of the arc after anchor 2, share
    [0.4992, 0.4992, 0.4992],
    // shoulder rho of the arc after anchor 3, share
    [0.4705, 0.4705, 0.4705],
  ],

  // The part closes in a point at `tip`, a station placed by anatomy; its cap starts at `from`.
  tips: [{from: 3, tip: -6}, {from: 11, tip: 19}],
};
