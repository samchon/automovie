import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";

/**
 * f1's antihelix on the +Z side, the ridge inside the helix with its superior crus, merged onto the ear's plate; the other side is its
 * mirror image in the median plane.
 *
 * A round tube swept along the ridge's crest (`AutoMovieHumanF1Joints.antihelix`): from inside the plate at the antitragus, up the body
 * behind the concha and on along the superior crus to under the helix's top, short of the helix's tube and blend, turning 2 mm either
 * side of each centre. Its course is the
 * crest sunk by the tube's radius along the auricle's mean normal, so the tube's top stands on the crest; that course runs within a
 * millimetre of the plate's face, so the tube lies half in the plate and the curve where they meet is one closed loop round both of
 * its buried ends; it is merged after the helix and keeps more than 2.5 mm from the helix's blend, since two tubes' blends must not
 * meet. At mid heights the plate runs from 6 mm inside the head out to the rim, so its front face is the concha's back wall and
 * the ridge needs no keel toward the head; one that reached into the head crossed the root merge's blend, where the walk was lost.
 *
 * Every section is a circle: four extremes on the chart's axes at the radius and shoulders of 0.4142, a quarter circle as a conic. The radius
 * is 1.5 mm along the body, within half the ridge's width between the scapha's floor and the concha's rim (4 to 6 mm, `FamilyConicScan.ts
 * helix 79 7 ridges`): at 1,566 to 1,572 mm the scapha is narrow and the helix's centre stands 5.9 mm off, so at 2.4 mm the two tubes'
 * blends met and the merge's walk was lost there (measured along both whole courses, they overlapped by up to 0.7 mm; at 1.5 mm with
 * the course moved 2 mm in along the plate they stay 2.95 mm apart everywhere). 2 mm along the superior crus, which is narrower, and 1.6 mm toward each buried end.
 *
 * Frame and model: as `AutoMovieHumanF1Plate`. The course is 35.64 mm long; each end closes in a point at its end of the course from 2 mm in.
 */
export const AutoMovieHumanF1Antihelix: AutoMovieHumanConicLoft.IFamily = {
  name: "antihelix",
  centres: AutoMovieHumanF1Joints.antihelix,
  halves: [2, 2, 2, 2, 2],
  up: AutoMovieHumanF1Placement.direction("antihelix.up"),
  layout: AutoMovieHumanConicSection.limb(0),
  // At the lower end, the body's middle, the fork of the inferior crus, the superior crus and the upper end.
  knots: [2, 9, 20, 30, 33.64],
  values: [
    // front (+u) extreme: u, mm
    [1.6, 1.5, 1.5, 2, 1.6],
    // front (+u) extreme: v, mm
    [0, 0, 0, 0, 0],
    // side (+v) extreme: u, mm
    [0, 0, 0, 0, 0],
    // side (+v) extreme: v, mm
    [1.6, 1.5, 1.5, 2, 1.6],
    // back (-u) extreme: u, mm
    [-1.6, -1.5, -1.5, -2, -1.6],
    // back (-u) extreme: v, mm
    [0, 0, 0, 0, 0],
    // side (-v) extreme: u, mm
    [0, 0, 0, 0, 0],
    // side (-v) extreme: v, mm
    [-1.6, -1.5, -1.5, -2, -1.6],
    // shoulder rho of the arc after anchor 0, share
    [0.4142, 0.4142, 0.4142, 0.4142, 0.4142],
    // shoulder rho of the arc after anchor 1, share
    [0.4142, 0.4142, 0.4142, 0.4142, 0.4142],
    // shoulder rho of the arc after anchor 2, share
    [0.4142, 0.4142, 0.4142, 0.4142, 0.4142],
    // shoulder rho of the arc after anchor 3, share
    [0.4142, 0.4142, 0.4142, 0.4142, 0.4142],
  ],

  // Both ends are buried in the plate.
  tips: [{ from: 2, tip: 0 }, { from: 33.64, tip: 35.64 }],
};
