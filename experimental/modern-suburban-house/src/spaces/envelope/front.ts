/**
 * Front elevation: the main front wall with the gable triangle, and the garage
 * front wall, each with its real voids.
 *
 * Design owner: `docs/spaces/envelope/front.md`. The main front wall is
 * Z = [-0.25, 0] m over X = [-5.75, 5.75] m and owns both front corners (07
 * exterior-boundary-junctions). Its top follows the roof undersides at the
 * outer line: the gable triangle F − 0.24 over X = [-5.75, -1.80], the main roof
 * to the split X = 1.60, the right low roof beyond it; wall-head wedges carry
 * the slope across the thickness. Voids (X, Y m):
 * - `living-front-window` [-5.10, -2.30] × [0.70, 2.30];
 * - `bedroom-two-front-window` [-4.80, -2.70] × [3.91, 5.31];
 * - `stair-front-window` [-1.62, -0.84] × [4.11, 5.21];
 * - `bedroom-three-front-window` [2.65, 4.75] × [3.91, 5.31];
 * - `front-door` [0.40, 1.40] × [-0.175, 2.20] (void owned by entry-plan); the
 *   wall leaves the ground base reservation under it (10
 *   ground-threshold-junctions) and `front-door-threshold` fills the finish
 *   zone through the thickness, top 0.02 m above the finished floor.
 * The garage front wall is Z = [-0.55, -0.30] over X = [5.75, 11.70] with the
 * `garage-front-door` void X = [6.10, 11.10], Y = [-0.30, 2.15] (the garage
 * base runs through the thickness below -0.15, 10); the closed
 * panel leaf and rails are later models, so the void is open here.
 */
import { EXTERIOR_WALL_BOTTOM, GARAGE, MAIN } from "../building";
import { PALETTE } from "../palette";
import {
  GABLE,
  gable,
  gFront,
  mFront,
  rFront,
  ROOF_THICKNESS,
  SPLIT_X,
} from "../roof/junctions";
import { block, slopedSlab, wallPanel } from "../solids";
import { part, type IHousePart } from "../solid-records";
import { GROUND_LAYERS, STOREYS } from "../storeys";
import { FRONT_DOOR } from "../rooms/entry";
import { wallHead } from "./wall-head";
import { FRONT_WINDOWS } from "./front-windows";

const OWNER = "envelope/front.ts";
const B = EXTERIOR_WALL_BOTTOM;
const FRONT = MAIN.outer.z[1];
const INNER = FRONT - MAIN.wall;
/** Rough garage opening; room fit-out reserves the guide from this host. */
/**
 * @evidence spaces/envelope/front.md The garage's one broad opening is measured at its front elevation.
 * @evidenceReview spaces/envelope/front.md #65e443e `GARAGE_FRONT_DOOR` is one X [6.10, 11.10] rough opening record; `buildFront` passes it as the garage front wall's sole hole, preserving the single door in the parent.
 * @evidence spaces/envelope/front.md#garage-front-opening The 6.10..11.10 m jambs and 2.15 m head form the garage opening; the wall-cut bottom extends below the garage floor through its support base.
 * @evidenceReview spaces/envelope/front.md#garage-front-opening #39516cd The jambs and head follow `garage-front-opening`; the record's lower wall-cut limit derives `STOREYS.garageFloor - GROUND_LAYERS.garageBase`, allowing the floor base to continue through the void below the parent's finished Y = -0.15 threshold.
 * @evidence principles/core/source-units.md#source-scope-preservation This host leaves the moving panel and guides to later models and garage reservations.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This record sets a rough hole only; `garage-interior.ts` imports its bounds for guide and rail reservations, while no panel leaf or guide solid is constructed here.
 * @evidence principles/core/source-units.md#source-substantive-completion The wall cut, floor base tongue, and interior guide reservations consume its span.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `buildFront` cuts the garage wall with this record, `buildGarageFloorBase` spans its jambs beneath the opening, and garage-interior reservations derive their guide X and height from it.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-front-opening fixes garage-front-door jambs X=6.10..11.10 m and a 2.15 m head; this host keeps that one rough void while panel movement remains a model duty.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `garage-front-opening` fixes one sectional door at X [6.10, 11.10] with head Y = 2.15 and defers panel/rail members; this record realizes the one wall void while preserving those later member roles.
 */
export const GARAGE_FRONT_DOOR = {
  id: "garage-front-door",
  from: 6.1,
  to: 11.1,
  bottom: STOREYS.garageFloor - GROUND_LAYERS.garageBase,
  top: 2.15,
} as const;
/** Bottom of the ground base reservation the wall leaves under the front door (10). */

/** Emit the front elevation walls. */
/**
 * @evidence spaces/envelope/front.md This builder emits the complete front wall bodies with their authored rough voids and threshold support.
 * @evidenceReview spaces/envelope/front.md #65e443e `buildFront` returns main and garage front walls, five roof-contact wedge parts, and the front-door finish threshold with named rough wall holes.
 * @evidence spaces/envelope/front.md#front-roof-closures One wall outline rises under the high gable, main plane, and low right roof, with thickness wedges at those contacts.
 * @evidenceReview spaces/envelope/front.md#front-roof-closures #3ba3591 The main wall outline climbs from low-right to main and gable undersides; two `valleyHead` slabs and `wallHead` runs fill its thickness to the adjacent roof undersides.
 * @evidence spaces/envelope/front.md#front-openings Five named front voids remain in the shared wall face; service and powder receive no invented front window.
 * @evidenceReview spaces/envelope/front.md#front-openings #6277552 The main `wallPanel` holes array contains living, bedroom-two, stair, bedroom-three, and `FRONT_DOOR` once each, with no service or powder opening.
 * @evidence spaces/envelope/front.md#living-front-window The ground living void spans X=-5.10..-2.30 below the porch roof.
 * @evidenceReview spaces/envelope/front.md#living-front-window #db0b3c9 The main panel cuts `FRONT_WINDOWS.living` at X [-5.10, -2.30], Y [0.70, 2.30], in the ground living portion sheltered by the porch roof.
 * @evidence spaces/envelope/front.md#bedroom-two-front-window The left upper bedroom void spans X=-4.80..-2.70 beneath the gable.
 * @evidenceReview spaces/envelope/front.md#bedroom-two-front-window #64a8caf `FRONT_WINDOWS.bedroomTwo` gives the main wall a high X [-4.80, -2.70] cut inside the left gable interval `GABLE.a..b`.
 * @evidence spaces/envelope/front.md#stair-front-window The narrow upper-height void stays in the stair's front-wall span.
 * @evidenceReview spaces/envelope/front.md#stair-front-window #5499e4d The inline `stair-front-window` hole spans X [-1.62, -0.84], Y [4.11, 5.21], inside the stair opening's west leg, rather than being attributed to either upper bedroom.
 * @evidence spaces/envelope/front.md#bedroom-three-front-window The right upper bedroom void lies on the lower-roof portion, not the garage face.
 * @evidenceReview spaces/envelope/front.md#bedroom-three-front-window #5626597 `FRONT_WINDOWS.bedroomThree` cuts the main wall at X [2.65, 4.75] to the right of `SPLIT_X`, beneath the low-right roof and outside the garage wall panel.
 * @evidence spaces/envelope/front.md#front-entry-filling The front-door rough void and finish threshold give the later wood/glass leaf its authored host and porch contact.
 * @evidenceReview spaces/envelope/front.md#front-entry-filling #3fa508b The main wall consumes entry-owned `FRONT_DOOR`; `front-door-threshold` spans its jambs across the wall thickness from finish bottom to 0.02 m above the ground floor, leaving the leaf and glazing to models.
 * @evidence spaces/envelope/front.md#garage-front-opening One wide garage-front-door void and the base beneath it leave room for the later single moving panel door.
 * @evidenceReview spaces/envelope/front.md#garage-front-opening #39516cd The garage wall has one `GARAGE_FRONT_DOOR` hole through the support-base depth; `buildGarageFloorBase` carries a base tongue under those jambs, while the moving panel is deferred.
 * @evidence principles/core/source-units.md#source-scope-preservation This source builds wall/reveal void geometry and threshold only; window frames, door leaves, and rails remain model work.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The returned parts are walls, roof-contact wedges, and the front threshold; the holes are rough cuts and no closed window frame, door leaf, or rail is emitted.
 * @evidence principles/core/source-units.md#source-substantive-completion The result includes main and garage wall solids, roof-contact wedges, six real voids, and a solid front threshold.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Two wall panels contain five main and one garage rough holes; five wedge parts close roof contacts and a solid front threshold completes the returned eight-part front elevation.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-plan sets front-door X=[0.40, 1.40], garage-front-opening sets X=[6.10, 11.10], and the four front-window H2s set their own rough cuts; ground-support-handoff supplies the provisional wall bottom Y=-0.45, while ground-threshold-junctions supplies the two entrance base notches.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `entry-plan` supplies the front door, `garage-front-opening` supplies the garage door, and four front-window H2s supply the main wall cuts; `ground-support-handoff` and `ground-threshold-junctions` give wall bottom and base reservations, all consumed without a new entrance or roof decision.
 */
export const buildFront = (): IHousePart[] => {
  const mainTop = mFront(FRONT) - ROOF_THICKNESS;
  const rightTop = rFront(FRONT) - ROOF_THICKNESS;
  const peak = gable(GABLE.center) - ROOF_THICKNESS;
  const main = wallPanel({
    axis: "x",
    across: [INNER, FRONT],
    outline: [
      { u: MAIN.outer.x[0], y: B },
      { u: MAIN.outer.x[1], y: B },
      { u: MAIN.outer.x[1], y: rightTop },
      { u: SPLIT_X, y: rightTop },
      { u: SPLIT_X, y: mainTop },
      { u: GABLE.b, y: mainTop },
      { u: GABLE.center, y: peak },
      { u: GABLE.a, y: mainTop },
    ],
    holes: [
      FRONT_WINDOWS.living,
      FRONT_WINDOWS.bedroomTwo,
      {
        id: "stair-front-window",
        from: -1.62,
        to: -0.84,
        bottom: 4.11,
        top: 5.21,
      },
      FRONT_WINDOWS.bedroomThree,
      FRONT_DOOR,
    ],
  });
  const garageTop = gFront(GARAGE.outer.z[1]) - ROOF_THICKNESS;
  const garage = wallPanel({
    axis: "x",
    across: [GARAGE.inner.z[1], GARAGE.outer.z[1]],
    outline: [
      { u: GARAGE.inner.x[0], y: B },
      { u: GARAGE.outer.x[1], y: B },
      { u: GARAGE.outer.x[1], y: garageTop },
      { u: GARAGE.inner.x[0], y: garageTop },
    ],
    holes: [GARAGE_FRONT_DOOR],
  });
  // Over the gable ends the valley Z = -(9/8)·min(X - a, b - X) crosses the wall
  // thickness: between it and the inner face the main front roof is the higher
  // surface, so its underside, not the gable's, closes the wall there
  // (roof-wall-head-junctions). Each end gets one wedge from the gable underside
  // up to the main front underside; the wedge vanishes along the valley.
  const slope = (gable(GABLE.center) - gable(GABLE.a)) / (GABLE.center - GABLE.a);
  const reach = (mFront(INNER) - gable(GABLE.a)) / slope;
  const valleyHead = (id: string, plan: { x: number; z: number }[]): IHousePart =>
    part(
      id,
      OWNER,
      "wall",
      PALETTE.siding,
      slopedSlab({
        plan,
        top: (_x, z) => mFront(z) - ROOF_THICKNESS,
        floor: (x) => gable(x) - ROOF_THICKNESS,
      }),
    );
  return [
    part("front-main-wall", OWNER, "wall", PALETTE.siding, main),
    valleyHead("front-gable-left-valley-head", [
      { x: GABLE.a, z: FRONT },
      { x: GABLE.a, z: INNER },
      { x: GABLE.a + reach, z: INNER },
    ]),
    valleyHead("front-gable-right-valley-head", [
      { x: GABLE.b, z: FRONT },
      { x: GABLE.b - reach, z: INNER },
      { x: GABLE.b, z: INNER },
    ]),
    wallHead({
      id: "front-main-wall-head",
      owner: OWNER,
      x: [GABLE.b, SPLIT_X],
      z: [INNER, FRONT],
      roof: mFront,
      outerZ: FRONT,
    }),
    wallHead({
      id: "front-right-wall-head",
      owner: OWNER,
      x: [SPLIT_X, MAIN.outer.x[1]],
      z: [INNER, FRONT],
      roof: rFront,
      outerZ: FRONT,
    }),
    part(
      "front-door-threshold",
      OWNER,
      "floor",
      PALETTE.structure,
      block(
        [FRONT_DOOR.from, STOREYS.groundFloor - GROUND_LAYERS.finish, INNER],
        [FRONT_DOOR.to, STOREYS.groundFloor + 0.02, FRONT],
      ),
    ),
    part("front-garage-wall", OWNER, "wall", PALETTE.siding, garage),
    wallHead({
      id: "front-garage-wall-head",
      owner: OWNER,
      x: [GARAGE.inner.x[0], GARAGE.outer.x[1]],
      z: [GARAGE.inner.z[1], GARAGE.outer.z[1]],
      roof: gFront,
      outerZ: GARAGE.outer.z[1],
    }),
  ];
};
