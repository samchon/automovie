/**
 * `kitchen-dining-family`: the one continuous rear common room.
 *
 * Design owner: `docs/spaces/rooms/common.md#common-room-plan`. Finished inner
 * X = [-5.50, 5.50], Z = [-10.45, -6.20] m. 07 assigns this owner the front
 * partition Z = [-6.20, -6.05] facing living-room, service-access and pantry,
 * with two doorless openings of head 2.40 m: `living-common-opening`
 * X = [-5.00, -2.15] and `service-common-opening` X = [-1.35, 3.07]; the part
 * behind the pantry, X = [3.22, 5.50], stays closed.
 *
 * Output: the room record, its wood floor finish and the front partition.
 */
import { PALETTE } from "../palette";
import { FAMILY_REAR_WINDOW } from "../envelope/rear";
import { FAMILY_RIGHT_WINDOW } from "../envelope/right";
import { MAIN } from "../building";
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
import { floorOf } from "../storeys";
/** Shared void owned by this room and consumed at its floor and adjacent finish.
 * @evidence spaces/rooms/common.md The service-common-opening void follows the partition assigned to common.
 * @evidenceReview spaces/rooms/common.md #27b3168 `DOOR_SERVICE_COMMON_OPENING` fixes the service passage at X [-1.35, 3.07] with a 2.40 m head; `buildCommon` passes it to the front partition's holes, whose body belongs to this room under `07-boundary-assembly.md#interior-boundary-ownership`.
 * @evidence principles/core/source-units.md#source-scope-preservation The service-common-opening interval remains with common while its adjacent room receives the span.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The service opening value stays in `common.ts`; `buildCommon` uses its span for the common threshold half and `service.ts` imports that same value for the adjacent half, without making a second opening owner.
 * @evidence principles/core/source-units.md#source-substantive-completion The service-common-opening span cuts its wall and sets floor finish limits on both sides.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `buildCommon` puts `DOOR_SERVICE_COMMON_OPENING` in the partition holes and finishes Z [-6.20, -6.125]; `buildService` uses its exported span to finish the remaining Z [-6.125, -6.05].
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Common-room-plan fixes service-common-opening at X=[-1.35, 3.07], Y=[0, 2.40] without a door leaf; this export supplies that opening span to the front partition.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `common.md#common-room-plan` already places the leafless service passage at X [-1.35, 3.07], Y [0, 2.40]; this export uses those limits and supplies the partition void, so that parent requires no opening revision.
 */
export const DOOR_SERVICE_COMMON_OPENING = door(
  "service-common-opening",
  "ground-storey",
  -1.35,
  3.07,
  2.4,
);

/** Shared void owned by this room and consumed at its floor and adjacent finish.
 * @evidence spaces/rooms/common.md The living-common-opening void follows the partition assigned to common.
 * @evidenceReview spaces/rooms/common.md #27b3168 `DOOR_LIVING_COMMON_OPENING` has the plan's X [-5.00, -2.15] and 2.40 m head; `buildCommon` cuts that opening from its Z [-6.20, -6.05] front partition rather than adding a leaf.
 * @evidence principles/core/source-units.md#source-scope-preservation The living-common-opening interval remains with common while its adjacent room receives the span.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The living opening value is exported by `common.ts`, whose partition owns the cut; `living.ts` consumes its `from` and `to` only to finish the living-side threshold strip.
 * @evidence principles/core/source-units.md#source-substantive-completion The living-common-opening span cuts its wall and sets floor finish limits on both sides.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `buildCommon` puts this value in the wall's holes and finishes the common-side Z [-6.20, -6.125]; `buildLiving` uses the same span for the living-side Z [-6.125, -6.05].
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Common-room-plan fixes living-common-opening at X=[-5.00, -2.15], Y=[0, 2.40] without a leaf; this separate export supplies the left front-partition cut.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `common.md#common-room-plan` already assigns the leafless living passage X [-5.00, -2.15], Y [0, 2.40] to this partition; the separate exported value implements that exact cut without a parent change.
 */
export const DOOR_LIVING_COMMON_OPENING = door(
  "living-common-opening",
  "ground-storey",
  -5.0,
  -2.15,
  2.4,
);

const FLOOR = floorOf("ground-storey");
const DINING_TABLE_X = [-0.35, 1.35] as const;
const DINING_TABLE_Z = [-8.4, -7.5] as const;
const DINING_SEAT_HALF_WIDTH = 0.325;
const DINING_SEAT_DEPTH = 0.75;

const COMMON: IRoomSpace = {
  id: "kitchen-dining-family",
  owner: "rooms/common.ts",
  storey: "ground-storey",
  outline: box([-5.5, 5.5], [-10.45, -6.2]),
  floor: PALETTE.woodFloor,
  reservations: [
    { id: "family-rear-curtain", kind: "fixture", x: [FAMILY_REAR_WINDOW.from - 0.1, FAMILY_REAR_WINDOW.to + 0.1], z: [MAIN.inner.z[0], MAIN.inner.z[0] + 0.12], y: [FLOOR + 0.1, FAMILY_REAR_WINDOW.top + 0.12] },
    { id: "family-right-curtain", kind: "fixture", x: [MAIN.inner.x[1] - 0.12, MAIN.inner.x[1]], z: [FAMILY_RIGHT_WINDOW.from - 0.1, FAMILY_RIGHT_WINDOW.to + 0.1], y: [FLOOR + 0.1, FAMILY_RIGHT_WINDOW.top + 0.12] },
    // common-kitchen-wall-reservation. The L corner X = [-5.50, -4.85],
    // Z = [-10.45, -9.80] is counted once, in the back band; the left band
    // excludes the range plan Z = [-9.50, -8.70].
    { id: "common-kitchen-back-base", kind: "storage", x: [-5.5, -2.15], z: [-10.45, -9.8], y: [FLOOR, FLOOR + 0.91] },
    { id: "common-kitchen-left-base-rear", kind: "storage", x: [-5.5, -4.85], z: [-9.8, -9.5], y: [FLOOR, FLOOR + 0.91] },
    { id: "common-kitchen-left-base-front", kind: "storage", x: [-5.5, -4.85], z: [-8.7, -7.4], y: [FLOOR, FLOOR + 0.91] },
    { id: "common-fridge", kind: "fixture", x: [-5.5, -4.7], z: [-7.4, -6.45], y: [FLOOR, FLOOR + 1.85] },
    { id: "common-fridge-swing", kind: "swing", x: [-4.7, -4.15], z: [-7.4, -6.45] },
    { id: "common-fridge-use", kind: "use", x: [-4.15, -3.7], z: [-7.4, -6.45] },
    { id: "common-range", kind: "fixture", x: [-5.5, -4.85], z: [-9.5, -8.7], y: [FLOOR, FLOOR + 0.91] },
    { id: "common-oven-swing", kind: "swing", x: [-4.85, -4.3], z: [-9.5, -8.7] },
    { id: "common-oven-use", kind: "use", x: [-4.3, -3.7], z: [-9.5, -8.7] },
    { id: "common-microwave", kind: "fixture", x: [-5.5, -5.1], z: [-9.5, -8.7], y: [FLOOR + 1.45, FLOOR + 1.85] },
    { id: "common-kitchen-left-wall-cabinet", kind: "storage", x: [-5.5, -5.15], z: [-8.7, -7.4], y: [FLOOR + 1.45, FLOOR + 2.35] },
    { id: "common-kitchen-back-wall-cabinet", kind: "storage", x: [-3.0, -2.15], z: [-10.45, -10.1], y: [FLOOR + 1.45, FLOOR + 2.35] },
    // common-island-reservation.
    { id: "common-island", kind: "fixture", x: [-3.65, -2.6], z: [-8.7, -6.45], y: [FLOOR, FLOOR + 0.91] },
    { id: "common-island-sink", kind: "fixture", x: [-3.55, -3.05], z: [-8.6, -8.1], y: [FLOOR + 0.91, FLOOR + 1.31] },
    { id: "common-dishwasher", kind: "fixture", x: [-3.65, -3.05], z: [-8.05, -7.45], y: [FLOOR, FLOOR + 0.91] },
    { id: "common-dishwasher-swing", kind: "swing", x: [-4.25, -3.65], z: [-8.05, -7.45] },
    { id: "common-dishwasher-use", kind: "use", x: [-4.85, -4.25], z: [-8.1, -7.4] },
    ...Array.from({ length: 3 }, (_, i) => {
      const centre = -8.3 + 0.7 * i;
      return {
        id: `common-island-stool-${i + 1}-use`,
        kind: "use" as const,
        x: [-2.6, -1.65] as const,
        z: [Number((centre - 0.325).toFixed(3)), Number((centre + 0.325).toFixed(3))] as const,
      };
    }),
    // common-dining-reservation.
    { id: "common-dining-table", kind: "furniture", x: DINING_TABLE_X, z: DINING_TABLE_Z, y: [FLOOR, FLOOR + 0.75] },
    ...Array.from({ length: 2 }, (_, i) => ({
      id: `common-dining-seat-back-${i + 1}-use`, kind: "use" as const,
      x: [i - DINING_SEAT_HALF_WIDTH, i + DINING_SEAT_HALF_WIDTH] as const,
      z: [DINING_TABLE_Z[0] - DINING_SEAT_DEPTH, DINING_TABLE_Z[0]] as const,
    })),
    ...Array.from({ length: 2 }, (_, i) => ({
      id: `common-dining-seat-front-${i + 1}-use`, kind: "use" as const,
      x: [i - DINING_SEAT_HALF_WIDTH, i + DINING_SEAT_HALF_WIDTH] as const,
      z: [DINING_TABLE_Z[1], DINING_TABLE_Z[1] + DINING_SEAT_DEPTH] as const,
    })),
    ...(["left", "right"] as const).map((side) => ({
      id: `common-dining-seat-${side}-use`, kind: "use" as const,
      x: side === "left"
        ? [DINING_TABLE_X[0] - DINING_SEAT_DEPTH, DINING_TABLE_X[0]] as const
        : [DINING_TABLE_X[1], DINING_TABLE_X[1] + DINING_SEAT_DEPTH] as const,
      z: [(DINING_TABLE_Z[0] + DINING_TABLE_Z[1]) / 2 - DINING_SEAT_HALF_WIDTH,
        (DINING_TABLE_Z[0] + DINING_TABLE_Z[1]) / 2 + DINING_SEAT_HALF_WIDTH] as const,
    })),
    // common-family-reservation.
    { id: "common-family-sofa", kind: "furniture", x: [3.25, 5.35], z: [-7.15, -6.2], y: [FLOOR, FLOOR + 0.9] },
    { id: "common-family-table", kind: "furniture", x: [3.4, 4.45], z: [-8.35, -7.8], y: [FLOOR, FLOOR + 0.42] },
    { id: "common-family-rug", kind: "covering", x: [3, 4.55], z: [-8.55, -6.85], y: [FLOOR, FLOOR + 0.008] },
    // common-clear-routes.
    { id: "common-main-route-right", kind: "route", x: [2.1, 3.07], z: [-9.25, -6.2] },
    { id: "common-main-route-back", kind: "route", x: [-1.5, 3.07], z: [MAIN.inner.z[0] + 0.12, -9.25] },
    { id: "common-garden-door-approach", kind: "route", x: [-1.5, FAMILY_REAR_WINDOW.from - 0.1], z: [MAIN.inner.z[0], MAIN.inner.z[0] + 0.12] },
    { id: "common-kitchen-route", kind: "route", x: [-4.85, -0.35], z: [-9.8, -8.7] },
  ],
};

/** Emit the common room floor and its front partition with two open voids. */
/**
 * @evidence spaces/rooms/common.md This export builds one continuous kitchen-dining-family room with a front wall cut for two open passages.
 * @evidenceReview spaces/rooms/common.md #27b3168 `buildCommon` returns the single `kitchen-dining-family` space, its floor and ceiling, and one `common-front-partition` pierced by the living and service openings; the kitchen, dining, and family areas remain reservations in that room.
 * @evidence spaces/rooms/common.md#common-room-plan COMMON uses the full rear X/Z outline and one partition with living and service opening ids.
 * @evidenceReview spaces/rooms/common.md#common-room-plan #004bed1 `COMMON.outline` uses X [-5.50, 5.50], Z [-10.45, -6.20], while its front partition spans Z [-6.20, -6.05] and takes the two opening values named in the plan; the rest stays wall.
 * @evidence spaces/rooms/common.md#common-kitchen-wall-reservation Back/left cabinet bands and fridge, range, oven, and microwave boxes retain distinct work/swing areas.
 * @evidenceReview spaces/rooms/common.md#common-kitchen-wall-reservation #3f3352e `COMMON.reservations` gives the L base a single back corner and separated left runs around the range; fridge and oven each have +X swing and use boxes, while microwave and the two upper cabinets retain distinct height ranges.
 * @evidence spaces/rooms/common.md#common-island-reservation The sink/dishwasher island and three stool use boxes are recorded without furniture geometry.
 * @evidenceReview spaces/rooms/common.md#common-island-reservation #c7d8452 The island, sink, dishwasher, its westward swing and work area are distinct reservations; `Array.from` derives three stool-use centres from -8.30 m at 0.70 m pitch and gives each a 0.325 m half-width, without emitting stools.
 * @evidence spaces/rooms/common.md#common-dining-reservation Six separate seat-use rectangles surround one dining table reserve.
 * @evidenceReview spaces/rooms/common.md#common-dining-reservation #3ca8e68 The table reserve supplies its X/Z edges; two loops place back and front use boxes at X centres 0 and 1 m with 0.325 m half-width, and the end-seat loop extends each X edge 0.75 m with Z centred on the table, giving six separate seats.
 * @evidence spaces/rooms/common.md#common-family-reservation The right-side sofa and table have their own reserved footprints toward the family zone.
 * @evidenceReview spaces/rooms/common.md#common-family-reservation #5ef953f The family sofa reserves X [3.25, 5.35] to the front inside face, while the table stops at X 4.45. The remaining 1.05 m to the right interior face exceeds the curtain and baseboard projection by 0.915 m; the rug is a separate covering rather than a raised barrier on that route.
 * @evidence spaces/rooms/common.md#common-clear-routes Four clear route bands cover the right edge, rear, garden-door approach, and kitchen side of the work boxes.
 * @evidenceReview spaces/rooms/common.md#common-clear-routes #139bcdc Four `route` reservations keep the right band beyond the dining end seat, turn along the back from Z -9.25 to -10.33, approach the garden door left of the family curtain, and provide a separate X [-4.85, -0.35] kitchen-side band.
 * @evidence principles/core/source-units.md#source-scope-preservation The builder emits room finishes and its front partition, leaving cabinet/appliance and seating bodies to models.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `buildCommon.parts` emits floor, ceiling, two threshold halves, and the one assigned partition; the kitchen fixtures and dining/family seats remain `COMMON.reservations`, leaving their physical bodies to the later model and instance owners.
 * @evidence principles/core/source-units.md#source-substantive-completion A floor, ceiling, two threshold strips, and one wall with real doorless voids are returned with the reservations.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Calling `buildCommon` returns the complete room record and five parts: floor, ceiling, living and service threshold halves, and a front wall with both declared voids; consumers need no second room or wall builder for this scope.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work Building this room exposed a collision between family-rear-curtain and common-main-route-back; rooms/common.md#common-clear-routes was revised in fa601efa to stop the rear band at Z=-10.33 and add common-garden-door-approach.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `common.md#common-clear-routes` separates the back route at Z -10.33 and ends the garden-door approach at the family-curtain start X 2.65; `COMMON.reservations` derives those edges from `MAIN.inner` and `FAMILY_REAR_WINDOW`, closing the curtain/route overlap that prompted the route revision.
 */
export const buildCommon = (): IRoomBuild => ({
  space: COMMON,
  parts: [
    roomFloor(COMMON),
    roomCeiling(COMMON),
    doorFloor(
      COMMON,
      "living-common-opening",
      [DOOR_LIVING_COMMON_OPENING.from, DOOR_LIVING_COMMON_OPENING.to],
      [-6.2, -6.125],
    ),
    doorFloor(
      COMMON,
      "service-common-opening",
      [DOOR_SERVICE_COMMON_OPENING.from, DOOR_SERVICE_COMMON_OPENING.to],
      [-6.2, -6.125],
    ),
    partition({
      id: "common-front-partition",
      owner: COMMON.owner,
      storey: "ground-storey",
      axis: "x",
      across: [-6.2, -6.05],
      along: [-5.5, 5.5],
      holes: [DOOR_LIVING_COMMON_OPENING, DOOR_SERVICE_COMMON_OPENING],
    }),
  ],
});
