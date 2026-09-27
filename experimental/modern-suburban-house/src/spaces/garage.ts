/**
 * Attached garage structure: the main/garage shared wall, the garage floor
 * base and the garage ceiling base.
 *
 * Design owners: `docs/spaces/00-building.md#attached-garage-extent` (outline
 * X = [5.50, 11.70], Z = [-6.70, -0.30] m; one 0.25 m shared wall
 * X = [5.50, 5.75]; inner limit X = [5.75, 11.45], Z = [-6.45, -0.55]),
 * `03-surface-owners.md` (this file owns the shared wall below the garage roof and the garage
 * floor base), `10-ground-floor.md#garage-ground-floor-base` (0.15 m below the
 * finished floor Y = -0.15) and `09-ceiling-assembly.md#garage-ceiling-closure`
 * (ceiling Y = 2.55 m plus the 0.18 m reservation). The shared wall stops at
 * the garage roof upper weather line; the exposed siding above belongs to right.ts.
 * This lower body carries the `laundry-garage-door` void
 * Z = [-4.40, -3.35], Y = [-0.175, 2.20] m owned by the laundry plan (the main
 * ground base and the laundry threshold fill it below Y = 0, 10). The garage
 * floor base also runs through the garage front wall under `garage-front-door`,
 * X = [6.10, 11.10], Z = [-0.55, -0.30]. The ceiling base starts 0.015 m above
 * the finished ceiling; that finish zone belongs to `rooms/garage-interior.ts`.
 *
 * The garage stays empty: no vehicle is authored.
 */
import { EXTERIOR_WALL_BOTTOM, GARAGE, MAIN } from "./building";
import { PALETTE } from "./palette";
import { GARAGE_RIDGE_Z, garageRoof } from "./roof/junctions";
import { part, type IHousePart } from "./solid-records";
import { rect, slab, wallPanel } from "./solids";
import { LAUNDRY_GARAGE_DOOR } from "./rooms/laundry";
import { GARAGE_FRONT_DOOR } from "./envelope/front";
import {
  CEILING_FINISH,
  CEILING_RESERVATION,
  GROUND_LAYERS,
  STOREYS,
} from "./storeys";

const OWNER = "garage.ts";
/** Ceiling finish zone inside the 0.18 m reservation, owned by the garage interior (09). */

/** Emit the main/garage shared wall with the laundry-garage door void. */
/**
 * @evidence spaces/03-surface-owners.md The garage source emits the shared lower wall body and leaves the exposed upper siding to the right elevation.
 * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 garage-shared-wall up to garageRoof (garage.ts:47-61); right-garage-shared-upper-wall above (right.ts:104-115); 03-surface-owners.md:35.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff garage-shared-wall carries the laundry-garage-door void below the garage roof.
 * @evidenceReview spaces/03-surface-owners.md#exterior-surface-handoff #9f3db3c v-141 holes [LAUNDRY_GARAGE_DOOR] (garage.ts:60) in the lower body; 03-surface-owners.md:35 door-bearing body up to the garage roof weather line is garage.ts.
 * @evidence principles/core/source-units.md#source-scope-preservation The wall uses MAIN/GARAGE contact coordinates and the garageRoof upper weather line; its returned part does not duplicate upper siding.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Across MAIN.inner.x[1]..MAIN.outer.x[1], u from GARAGE.outer.z, top weatherLine=garageRoof(z) with no thickness (garage.ts:47-59); one part returned (62-64); right.ts starts at the same garageRoof.
 * @evidence principles/core/source-units.md#source-substantive-completion wallPanel constructs the sloped top and door hole, and part returns the wall with an interior finish palette.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 wallPanel outline with ridge top and LAUNDRY hole; part(..., "wall", PALETTE.interiorWall, shared) (garage.ts:50-63).
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work The reviewed surface handoff splits the wall at the garage roof: garage retains the door body and right owns exposed siding.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 v-141 Repair exists: fa601efa split the shared wall by height (03-surface-owners.md:35, 07, right.md); df38963f 00-building.md:59; a15c1dd1 set split at the weather line. Bodies say it. Row names outcome/one target, not the exposing case (space-sources.md:9); code split (garage.ts garageRoof top, right.ts upper panel) existed since 04df855f, before the doc repair.
 */
export const buildGarageSharedWall = (): IHousePart[] => {
  const weatherLine = (z: number): number => garageRoof(z);
  const back = GARAGE.outer.z[0];
  const front = GARAGE.outer.z[1];
  const shared = wallPanel({
    axis: "z",
    across: [MAIN.inner.x[1], MAIN.outer.x[1]],
    outline: [
      { u: back, y: EXTERIOR_WALL_BOTTOM },
      { u: front, y: EXTERIOR_WALL_BOTTOM },
      { u: front, y: weatherLine(front) },
      { u: GARAGE_RIDGE_Z, y: weatherLine(GARAGE_RIDGE_Z) },
      { u: back, y: weatherLine(back) },
    ],
    holes: [LAUNDRY_GARAGE_DOOR],
  });
  return [
    part("garage-shared-wall", OWNER, "wall", PALETTE.interiorWall, shared),
  ];
};

/** Emit the independent garage floor base under the garage finished floor. */
/**
 * @evidence spaces/10-ground-floor.md This export builds the separate lower garage base under its finished floor.
 * @evidenceReview spaces/10-ground-floor.md #9f27f8e v-141 garage-floor-base slab garage.ts:75-96; 10-ground-floor.md:55,57.
 * @evidence spaces/10-ground-floor.md#garage-ground-floor-base Its slab extends beneath the front-door threshold while ending at the garage inner-wall limits elsewhere.
 * @evidenceReview spaces/10-ground-floor.md#garage-ground-floor-base #c3227ca v-141 Host tongue X=GARAGE_FRONT_DOOR.from/to to GARAGE.outer.z[1] (garage.ts:86-89), rest at GARAGE.inner, OK. But the #garage-ground-floor-base body (10-ground-floor.md:55-59) only says the base receives the garage inner outline; the extension under the door is in #ground-threshold-junctions (10-ground-floor.md:89) / 03:46.
 * @evidence principles/core/source-units.md#source-scope-preservation The base ends at STOREYS.garageFloor with a visible concrete top; garage-interior records the same floor level and emits the ceiling finish.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 garage.ts:92-93 top=STOREYS.garageFloor with PALETTE.concrete (:80); garage-interior.ts:33-34 records floor concrete/levels garageFloor and emits only roomCeiling (:69). v141 FALSE fixed.
 * @evidence principles/core/source-units.md#source-substantive-completion The eight-point outline and 0.15 m depth produce a closed garage-floor-base solid.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Eight-point outline garage.ts:82-91; depth garageBase 0.15 (garage.ts:92-93).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-ground-floor-base sets the top at garage finished floor -0.15 m and the base 0.15 m below, with a tongue under garage-front-door; this slab uses those bounds.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Top/0.15 base = 10-ground-floor.md:55 (datum -0.15 via 01-storeys.md:63); slab garage.ts:92-93. But the tongue under garage-front-door is authored in sibling ground-threshold-junctions :89, not garage-ground-floor-base (:55-59).
 */
export const buildGarageFloorBase = (): IHousePart[] => [
  part(
    "garage-floor-base",
    OWNER,
    "floor",
    PALETTE.concrete,
    slab({
      outline: [
        { x: GARAGE.inner.x[0], z: GARAGE.inner.z[0] },
        { x: GARAGE.inner.x[1], z: GARAGE.inner.z[0] },
        { x: GARAGE.inner.x[1], z: GARAGE.inner.z[1] },
        { x: GARAGE_FRONT_DOOR.to, z: GARAGE.inner.z[1] },
        { x: GARAGE_FRONT_DOOR.to, z: GARAGE.outer.z[1] },
        { x: GARAGE_FRONT_DOOR.from, z: GARAGE.outer.z[1] },
        { x: GARAGE_FRONT_DOOR.from, z: GARAGE.inner.z[1] },
        { x: GARAGE.inner.x[0], z: GARAGE.inner.z[1] },
      ],
      bottom: STOREYS.garageFloor - GROUND_LAYERS.garageBase,
      top: STOREYS.garageFloor,
    }),
  ),
];

/** Emit the garage ceiling base above the garage finished ceiling. */
/**
 * @evidence spaces/09-ceiling-assembly.md This export builds garage ceiling support over the finished garage height.
 * @evidenceReview spaces/09-ceiling-assembly.md #403d803 v-141 garage-ceiling-base garage.ts:106-118; 09-ceiling-assembly.md:57-59.
 * @evidence spaces/09-ceiling-assembly.md#garage-ceiling-closure The slab spans GARAGE.inner and fills Y from garageCeiling plus finish to garageCeiling plus reservation.
 * @evidenceReview spaces/09-ceiling-assembly.md#garage-ceiling-closure #0ce5421 v-141 rect(GARAGE.inner), bottom garageCeiling+CEILING_FINISH, top +CEILING_RESERVATION (garage.ts:113-115); 09-ceiling-assembly.md:57.
 * @evidence principles/core/source-units.md#source-scope-preservation It omits the visible ceiling finish assigned to garage-interior and does not raise the roof or garage datum.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Finish [2.55,2.565] emitted by garage-interior roomCeiling (garage-interior.ts:62); host starts at +0.015; no roof/datum edit.
 * @evidence principles/core/source-units.md#source-substantive-completion rect and slab return a closed, stable garage-ceiling-base part with its support depth.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 rect + slab, stable id garage-ceiling-base (garage.ts:107-116).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-ceiling-closure puts support above the 2.55 m finished ceiling inside GARAGE.inner while garage-interior owns the finish; this builder emits that support footprint only.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 09-ceiling-assembly.md:57 base covers garage inner and consumes the 0.18 reservation; :59 base garage.ts, finish garage-interior; garage.ts:113-115; 2.55 = 01-storeys.md:63.
 */
export const buildGarageCeiling = (): IHousePart[] => [
  part(
    "garage-ceiling-base",
    OWNER,
    "ceiling",
    PALETTE.ceiling,
    slab({
      outline: rect(GARAGE.inner.x, GARAGE.inner.z),
      bottom: STOREYS.garageCeiling + CEILING_FINISH,
      top: STOREYS.garageCeiling + CEILING_RESERVATION,
    }),
  ),
];
