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
 * @evidenceReview spaces/envelope/front.md #9ea9268 v-141 GARAGE_FRONT_DOOR (front.ts:53-59) is the single hole of front-garage-wall (front.ts:118); front.md:209 one broad opening in the garage front wall.
 * @evidence spaces/envelope/front.md#garage-front-opening The 6.10..11.10 m jambs, garage-base sill, and 2.15 m head form one rough void.
 * @evidenceReview spaces/envelope/front.md#garage-front-opening #39516cd v-141 Host bottom = garageFloor-garageBase = -0.30 (front.ts:57). Target body front.md:209 gives Y=[-0.15,2.15] ("bottom is the garage datum"); the base-bottom sill comes from 10-ground-floor.md:89,92 (wall leaves the base reservation under door voids), not #garage-front-opening. Jambs 6.10/11.10 and head 2.15 match.
 * @evidence principles/core/source-units.md#source-scope-preservation This host leaves the moving panel and guides to later models and garage reservations.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Export is data only (front.ts:53-59); no panel/rail part; guide/rail reservations in garage-interior.ts:29-31 read it; front.md:211-213 leaves panel/rails to later members.
 * @evidence principles/core/source-units.md#source-substantive-completion The wall cut, floor base tongue, and interior guide reservations consume its span.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Wall hole front.ts:118; floor-base tongue garage.ts:86-89 (X from .from/.to); guide/rail reservations garage-interior.ts:29-31 read .from/.to/.top.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-front-opening fixes garage-front-door jambs X=6.10..11.10 m and a 2.15 m head; this host keeps that one rough void while panel movement remains a model duty.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 front.md:209 X=[6.10,11.10], head 2.15, one sectional door; :211 frame/panels/rails/guides to later members. front.ts:55-58 and one hole front.ts:118.
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
 * @evidenceReview spaces/envelope/front.md #9ea9268 front.ts:139-186 returns front-main-wall, front-garage-wall, valley/wall-head wedges and front-door-threshold.
 * @evidence spaces/envelope/front.md#front-roof-closures One wall outline rises under the high gable, main plane, and low right roof, with thickness wedges at those contacts.
 * @evidenceReview spaces/envelope/front.md#front-roof-closures #3ba3591 Main outline front.ts:84-93 (rightTop, mainTop, gable peak); wedges front.ts:141-150 (gable valleys), :151 (main), :159 (right low roof); front.md:25,:27.
 * @evidence spaces/envelope/front.md#front-openings Five named front voids remain in the shared wall face; service and powder receive no invented front window.
 * @evidenceReview spaces/envelope/front.md#front-openings #6277552 Five holes front.ts:94-106 (living, bedroom-two, stair, bedroom-three, FRONT_DOOR); front.md:57 adds no powder/service front window.
 * @evidence spaces/envelope/front.md#living-front-window The ground living void spans X=-5.10..-2.30 below the porch roof.
 * @evidenceReview spaces/envelope/front.md#living-front-window #db0b3c9 FRONT_WINDOWS.living -5.1..-2.3 (front-windows.ts:12-13) = front.md:83, which places it under the porch roof.
 * @evidence spaces/envelope/front.md#bedroom-two-front-window The left upper bedroom void spans X=-4.80..-2.70 beneath the gable.
 * @evidenceReview spaces/envelope/front.md#bedroom-two-front-window #64a8caf -4.8..-2.7 (front-windows.ts:19-20) inside GABLE a..b [-5.75,-1.80] (roof/junctions.ts:75-77); front.md:107.
 * @evidence spaces/envelope/front.md#stair-front-window The narrow upper-height void stays in the stair's front-wall span.
 * @evidenceReview spaces/envelope/front.md#stair-front-window #5499e4d front.ts:97-103 X=-1.62..-0.84 Y=4.11..5.21 = front.md:133, inside the stair west leg X=[-1.80,-0.65] (02-stair.md:89).
 * @evidence spaces/envelope/front.md#bedroom-three-front-window The right upper bedroom void lies on the lower-roof portion, not the garage face.
 * @evidenceReview spaces/envelope/front.md#bedroom-three-front-window #5626597 2.65..4.75 lies right of SPLIT_X=1.60 on the main wall (front.ts:88,104), not on the garage panel (:118); front.md:157.
 * @evidence spaces/envelope/front.md#front-entry-filling The front-door rough void and finish threshold give the later wood/glass leaf its authored host and porch contact.
 * @evidenceReview spaces/envelope/front.md#front-entry-filling #db962b2 FRONT_DOOR hole front.ts:105 + front-door-threshold :167-176 (finish bottom to +0.02, INNER..FRONT); front.md:183 keeps the void with entry and fills it later; 10-ground-floor.md:87 threshold limit.
 * @evidence spaces/envelope/front.md#garage-front-opening One wide garage-front-door void and the base beneath it leave room for the later single moving panel door.
 * @evidenceReview spaces/envelope/front.md#garage-front-opening #39516cd One GARAGE_FRONT_DOOR hole front.ts:118; void bottom = garage base bottom (:57) so the garage.ts:86-89 tongue runs beneath; front.md:209-211 single panel door later.
 * @evidence principles/core/source-units.md#source-scope-preservation This source builds wall/reveal void geometry and threshold only; window frames, door leaves, and rails remain model work.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 buildFront returns walls, wedges and threshold only (front.ts:139-186); no frame, leaf or rail parts.
 * @evidence principles/core/source-units.md#source-substantive-completion The result includes main and garage wall solids, roof-contact wedges, six real voids, and a solid front threshold.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f front-main-wall + front-garage-wall solids, five wedge parts, 5+1 holes (front.ts:94-106,:118), front-door-threshold block (:167-176).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-plan sets front-door X=[0.40, 1.40], garage-front-opening sets X=[6.10, 11.10], and the four front-window H2s set their own rough cuts; ground-support-handoff supplies the provisional wall bottom Y=-0.45, while ground-threshold-junctions supplies the two entrance base notches.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 entry.md:31 (#entry-plan) front-door X=[0.40,1.40]; front.md:209 (#garage-front-opening) X=[6.10,11.10]; four window H2s front.md:83,107,133,157 give X/Y; 10-ground-floor.md:120 (#ground-support-handoff) Y=-0.45; #ground-threshold-junctions table rows front-door/garage-front-door + ":85-86 벽 owner는 그 예약을 제외" = base notches. buildFront holes = FRONT_WINDOWS x3 + stair literal (= front.md:133) + FRONT_DOOR; garage panel GARAGE_FRONT_DOOR. v-143 F1 closed.
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
