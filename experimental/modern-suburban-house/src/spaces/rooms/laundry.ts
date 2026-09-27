/**
 * `laundry-mudroom`: the buffer room between the service band and the garage.
 *
 * Design owner: `docs/spaces/rooms/laundry.md#laundry-plan`. Finished inner
 * X = [3.22, 5.50], Z = [-4.55, -2.05] m. 07 assigns this owner its partitions
 * to service-access (X = [3.07, 3.22], carrying `service-laundry-door`
 * Z = [-4.40, -3.35], Y = [0, 2.20] m) and to the pantry (Z = [-4.70, -4.55]).
 * The `laundry-garage-door` void in the shared wall is cut by `garage.ts`; this
 * owner fills its finish zone X = [5.50, 5.75], Y = [-0.025, 0] as
 * `laundry-garage-threshold`, whose garage face with the main ground base end
 * below it is the one riser from the garage floor Y = -0.15 to Y = 0 (10).
 */
import type { IAutoMovieMesh } from "@automovie/interface";
import { MAIN } from "../building";
import { partitionPlaneFace } from "../face-partition";
import { PALETTE } from "../palette";
import { block, rect, slab } from "../solids";
import { part } from "../solid-records";
import {
  box,
  door,
  doorFloor,
  partition,
  roomCeiling,
  roomFloor,
  type IRoomBuild,
  type IRoomSpace,
} from "./shared";
import { floorOf, GROUND_LAYERS } from "../storeys";
/** Shared void owned by this room and consumed at its floor and adjacent finish.
 * @evidence spaces/rooms/laundry.md The service-laundry-door void follows the partition assigned to laundry.
 * @evidenceReview spaces/rooms/laundry.md #6b84229 `DOOR_SERVICE_LAUNDRY_DOOR` carries the west passage Z [-4.40, -3.35] at the ground-storey floor with a 2.20 m head; `buildLaundry` cuts it from `laundry-service-partition`, distinct from the east garage door.
 * @evidence principles/core/source-units.md#source-scope-preservation The service-laundry-door interval remains with laundry while its adjacent room receives the span.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `laundry.ts` exports the service opening for its own west partition and threshold half; `service.ts` imports its span to finish X [3.07, 3.145] without declaring another laundry-door value.
 * @evidence principles/core/source-units.md#source-substantive-completion The service-laundry-door span cuts its wall and sets floor finish limits on both sides.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `buildLaundry` puts the exported opening in its service-partition holes and finishes X [3.145, 3.22]; `buildService` uses the same Z span for the adjacent X [3.07, 3.145] strip.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Laundry-plan gives service-laundry-door the west partition's Z=[-4.40, -3.35], Y=[0, 2.20] cut, distinct from the east garage door; this export carries the west span.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `laundry.md#laundry-plan` already distinguishes the west service cut from the east shared-wall cut while giving both Z [-4.40, -3.35], Y [0, 2.20]; this exported value realizes only the west passage, so no parent door decision is missing.
 */
export const DOOR_SERVICE_LAUNDRY_DOOR = door(
  "service-laundry-door",
  "ground-storey",
  -4.4,
  -3.35,
);

const FLOOR = floorOf("ground-storey");
const MACHINE_BACK_Z = -3.35;
const MACHINE_WIDTH_Z = 0.65;
const WASHER_Z = [MACHINE_BACK_Z, MACHINE_BACK_Z + MACHINE_WIDTH_Z] as const;
const DRYER_Z = [WASHER_Z[1], WASHER_Z[1] + MACHINE_WIDTH_Z] as const;
const MACHINE_BAND_Z = [WASHER_Z[0], DRYER_Z[1]] as const;
/** Laundry owns the passage through the main/garage shared wall. */
/**
 * @evidence spaces/rooms/laundry.md The mudroom owns the only interior passage into the attached garage.
 * @evidenceReview spaces/rooms/laundry.md #6b84229 `LAUNDRY_GARAGE_DOOR` names the east passage to the attached garage; `buildGarageSharedWall` uses this one opening in `garage-shared-wall`, leaving the service door on the mudroom's opposite side rather than making a second house-to-garage route.
 * @evidence spaces/rooms/laundry.md#laundry-plan The -4.40..-3.35 m Z void spans the shared wall and preserves the garage's lower floor step.
 * @evidenceReview spaces/rooms/laundry.md#laundry-plan #47360be `LAUNDRY_GARAGE_DOOR` supplies Z [-4.40, -3.35] and a 2.20 m head to the east shared-wall cut; its bottom reaches below the finished floor for the base, while `buildLaundry` tops the threshold at ground-floor Y 0 above the garage's Y -0.15.
 * @evidence principles/core/source-units.md#source-scope-preservation The garage wall receives this cut from laundry rather than declaring another door.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The opening record originates in `laundry.ts`; `garage.ts` imports it as the sole hole in its shared-wall body, so this export supplies the passage identity without taking ownership of the garage wall mesh.
 * @evidence principles/core/source-units.md#source-substantive-completion The shared wall hole, ground base tongue, and laundry threshold use this interval.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `buildGarageSharedWall` cuts with this record, `buildGroundFloor` uses its Z span for `laundry-garage-door-base`, and `buildLaundry` uses the same span for the raised threshold; all three consumers meet at one passage.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Laundry-plan places laundry-garage-door through the shared wall at Z=-4.40..-3.35 m and preserves the garage's lower floor step; this export carries that one mudroom passage.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `laundry.md#laundry-plan` already places this single east passage at Z [-4.40, -3.35] and inherits the 0.15 m step from `ground-threshold-datums`; the export carries that span to the shared wall and ground base without changing the parent's level decision.
 */
export const LAUNDRY_GARAGE_DOOR = {
  id: "laundry-garage-door",
  from: -4.4,
  to: -3.35,
  bottom: FLOOR - GROUND_LAYERS.finish - GROUND_LAYERS.base,
  top: FLOOR + 2.2,
} as const;

/** One under-door slab supplies disjoint structural and room-owned faces. */
/**
 * @evidence spaces/10-ground-floor.md#ground-threshold-junctions The slab continues the ground support through the laundry-garage shared-wall opening.
 * @evidenceReview spaces/10-ground-floor.md#ground-threshold-junctions #4150be7 `laundryGarageDoorBaseMesh` spans `MAIN.inner.x[1]` to the garage-side `MAIN.outer.x[1]` at the exported door's Z interval, while its top and bottom use the ground finish and support depths.
 * @evidence spaces/rooms/laundry.md#laundry-plan Its garage-facing end lies below the room's raised threshold at the designed passage.
 * @evidenceReview spaces/rooms/laundry.md#laundry-plan #47360be The base mesh ends at `FLOOR - GROUND_LAYERS.finish` and its garage-facing end lies on `MAIN.outer.x[1]`; `buildLaundry` selects that end under its threshold to form the lower part of the single step.
 * @evidence principles/core/source-units.md#source-scope-preservation The ground owner and laundry owner partition this one mesh rather than overlapping support and finish solids.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `buildGroundFloor` calls this recipe for the structural body and `buildLaundry` calls it for only the garage-side face, keeping the slab bounds shared while each caller assigns its own actual part owner.
 * @evidence principles/core/source-units.md#source-substantive-completion The shared opening span and ground layer datums produce the full under-door slab for face partitioning.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `rect` joins the shared-wall X interval and `LAUNDRY_GARAGE_DOOR` Z interval; `slab` fills from the ground base bottom to its finish reservation, giving both callers identical input triangles.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The ground threshold and laundry passage parents already fix the shared-wall crossing used here.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `ground-threshold-junctions` assigns support below the laundry opening and `laundry-plan` fixes that opening's span and step; this mesh uses those values without changing either parent.
 */
export const laundryGarageDoorBaseMesh = (): IAutoMovieMesh => slab({
  outline: rect(
    [MAIN.inner.x[1], MAIN.outer.x[1]],
    [LAUNDRY_GARAGE_DOOR.from, LAUNDRY_GARAGE_DOOR.to],
  ),
  bottom: FLOOR - GROUND_LAYERS.finish - GROUND_LAYERS.base,
  top: FLOOR - GROUND_LAYERS.finish,
});

const LAUNDRY: IRoomSpace = {
  id: "laundry-mudroom",
  owner: "rooms/laundry.ts",
  storey: "ground-storey",
  outline: box([3.22, 5.5], [-4.55, -2.05]),
  floor: PALETTE.utility,
  reservations: [
    // laundry-equipment-use: machine band X = [4.75, 5.50], Z = [-3.35, -2.05]; two 0.65 x 0.75 x 0.88
    // machine centres derive from the rear edge, half-width, and one-width spacing; fronts face -X.
    { id: "laundry-washer", kind: "fixture", x: [4.75, 5.5], z: WASHER_Z, y: [FLOOR, FLOOR + 0.88] },
    { id: "laundry-dryer", kind: "fixture", x: [4.75, 5.5], z: DRYER_Z, y: [FLOOR, FLOOR + 0.88] },
    // Folding top at 0.94 over the same band; its underside cannot go below the 0.88 machine limit.
    { id: "laundry-folding-top", kind: "fixture", x: [4.75, 5.5], z: MACHINE_BAND_Z, y: [FLOOR + 0.88, FLOOR + 0.94] },
    { id: "laundry-upper-storage", kind: "storage", x: [5.2, 5.5], z: MACHINE_BAND_Z, y: [FLOOR + 1.5, FLOOR + 2.3] },
    // Round doors open at most 0.50 m -X from the front X = 4.75, within each machine's width.
    { id: "laundry-washer-door", kind: "swing", x: [4.25, 4.75], z: WASHER_Z },
    { id: "laundry-dryer-door", kind: "swing", x: [4.25, 4.75], z: DRYER_Z },
    { id: "laundry-washer-work", kind: "use", x: [3.8, 4.25], z: [-3.35, -2.6] },
    { id: "laundry-dryer-work", kind: "use", x: [3.8, 4.25], z: [-2.8, -2.05] },
    // Shoe bench from the left inner face to X = 3.62, Z = -2.85 to the front inner face; hooks over it.
    { id: "laundry-shoe-bench", kind: "furniture", x: [3.22, 3.62], z: [-2.85, -2.05], y: [FLOOR, FLOOR + 0.45] },
    { id: "laundry-coat-hooks", kind: "storage", x: [3.22, 3.62], z: [-2.85, -2.05], y: [FLOOR + 1.1, FLOOR + 1.85] },
    { id: "laundry-shoe-use", kind: "use", x: [3.62, 4.25], z: [-2.85, -2.05] },
    // laundry-plan upper (mudroom) waiting zone and laundry-through-route.
    { id: "laundry-upper-waiting", kind: "use", x: [4.45, 5.5], z: [-4.43, -3.38] },
    // laundry-plan decides the garage-side lower waiting too; it lies on the garage floor.
    { id: "laundry-garage-lower-waiting", kind: "use", space: "garage", x: [5.75, 6.8], z: [-4.43, -3.38] },
    { id: "laundry-through-route", kind: "route", x: [3.22, 5.5], z: [-4.32, -3.42] },
  ],
};

/** Emit laundry finishes, both garage riser faces, and the two partitions. */
/**
 * @evidence spaces/rooms/laundry.md This export builds the laundry-mudroom between service access and the lower garage.
 * @evidenceReview spaces/rooms/laundry.md #6b84229 `buildLaundry` returns the ground-storey `laundry-mudroom` with X [3.22, 5.50], Z [-4.55, -2.05] between its service-side partition and the garage shared wall, plus its own finish and crossing parts.
 * @evidence spaces/rooms/laundry.md#laundry-plan It emits service/pantry partitions and the full exposed garage-side riser across the shared-wall void.
 * @evidenceReview spaces/rooms/laundry.md#laundry-plan #47360be `buildLaundry` cuts the west service partition, places the east threshold at Y [-0.025, 0], and authors the lower garage-facing base end from `laundryGarageDoorBaseMesh`; together its two faces close the one garage step without a second step plate.
 * @evidence spaces/rooms/laundry.md#laundry-equipment-use Two machine boxes, folding top, upper storage, shoe bench, hooks, and their work areas remain separately reserved.
 * @evidenceReview spaces/rooms/laundry.md#laundry-equipment-use #fd0c2d5 `MACHINE_BACK_Z` and `MACHINE_WIDTH_Z` derive adjoining washer/dryer reservations in one band; separate -X door swings and work boxes, a 0.94 m folding top, upper storage, and left-side shoe bench/hooks keep the tasks distinct.
 * @evidence spaces/rooms/laundry.md#laundry-through-route The upper waiting, lower garage-side waiting, and through-route retain the 0.15 m level change.
 * @evidenceReview spaces/rooms/laundry.md#laundry-through-route #d457f0c The upper waiting reservation, lower `garage` waiting reservation, and Z [-4.32, -3.42] through-route occupy the same door span; the room-authored riser meets the garage floor below its threshold.
 * @evidence principles/core/source-units.md#source-scope-preservation The garage shared-wall body and its cut stay with garage.ts; this builder owns room finishes, the service and pantry partitions, and the higher garage threshold.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `buildLaundry` authors the threshold and lower garage-facing riser as room parts, while `buildGroundFloor` keeps the disjoint base body and `buildGarageSharedWall` alone cuts the wall using this room's exported opening.
 * @evidence principles/core/source-units.md#source-substantive-completion The room, floor, ceiling, door strip, two walls, threshold, and lower exposed riser are returned with stable ids.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `buildLaundry` returns its room record and seven parts: floor, ceiling, service door strip, service partition, garage threshold, lower riser face, and pantry partition; each crossing receives a stable id.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Laundry-plan fixes both door spans and the garage step, laundry-equipment-use assigns one band to two machines, and laundry-through-route keeps their rear crossing clear; buildLaundry consumes these decisions without a parent revision.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `laundry-plan` fixes the two opposing doors and single step, `laundry-equipment-use` fixes the two machine bands, and `laundry-through-route` fixes waiting on both levels; the seven parts and reservations consume those decisions without a new level or route.
 */
export const buildLaundry = (): IRoomBuild => ({
  space: LAUNDRY,
  parts: [
    roomFloor(LAUNDRY),
    roomCeiling(LAUNDRY),
    doorFloor(
      LAUNDRY,
      "service-laundry-door",
      [3.145, 3.22],
      [DOOR_SERVICE_LAUNDRY_DOOR.from, DOOR_SERVICE_LAUNDRY_DOOR.to],
    ),
    partition({
      id: "laundry-service-partition",
      owner: LAUNDRY.owner,
      storey: "ground-storey",
      axis: "z",
      across: [3.07, 3.22],
      along: [-4.7, -1.9],
      holes: [DOOR_SERVICE_LAUNDRY_DOOR],
    }),
    part(
      "laundry-garage-threshold",
      LAUNDRY.owner,
      "floor",
      PALETTE.utility,
      block(
        [5.5, FLOOR - 0.025, LAUNDRY_GARAGE_DOOR.from],
        [5.75, FLOOR, LAUNDRY_GARAGE_DOOR.to],
      ),
    ),
    part(
      "laundry-garage-riser-lower",
      LAUNDRY.owner,
      "floor",
      PALETTE.structure,
      partitionPlaneFace(laundryGarageDoorBaseMesh(), "x", MAIN.outer.x[1]).face,
    ),
    partition({
      id: "laundry-pantry-partition",
      owner: LAUNDRY.owner,
      storey: "ground-storey",
      axis: "x",
      across: [-4.7, -4.55],
      along: [3.22, 5.5],
    }),
  ],
});
