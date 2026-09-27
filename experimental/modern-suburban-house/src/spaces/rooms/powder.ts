/**
 * `powder-room`: the front room of the service band.
 *
 * Design owner: `docs/spaces/rooms/powder.md#powder-plan`. Finished inner
 * X = [3.22, 5.50], Z = [-1.90, -0.25] m. 07 assigns this owner its partitions
 * to service-access (X = [3.07, 3.22], carrying `service-powder-door`
 * Z = [-1.65, -0.70], Y = [0, 2.20] m, from Z = -1.90; the corner
 * Z = [-2.05, -1.90] is the laundry owner's junction) and to the laundry
 * (Z = [-2.05, -1.90]).
 * Fixtures are models and are not emitted.
 */
import { PALETTE } from "../palette";
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
 * @evidence spaces/rooms/powder.md The service-powder-door void follows the partition assigned to powder.
 * @evidenceReview spaces/rooms/powder.md #efbc979 v-141 powder.ts:30-35 door(-1.65,-0.7) is the hole of powder-service-partition (powder.ts:80-88); 07-boundary-assembly.md:33 assigns powder<->service partition to powder.ts; powder.md:27 body puts service-powder-door in the west partition, Z=[-1.65,-0.70].
 * @evidence principles/core/source-units.md#source-scope-preservation The service-powder-door interval remains with powder while its adjacent room receives the span.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Declared in powder.ts:30; service.ts:14 imports DOOR_SERVICE_POWDER_DOOR and uses .from/.to in its doorFloor (service.ts:54-59); 05-route-network.md:41 names powder.md#powder-plan as the door owner.
 * @evidence principles/core/source-units.md#source-substantive-completion The service-powder-door span cuts its wall and sets floor finish limits on both sides.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Hole in powder-service-partition (powder.ts:87). Floor shares powder x[3.145,3.22] (powder.ts:74-79) and service x[3.07,3.145] (service.ts:54-59) both read DOOR_SERVICE_POWDER_DOOR.from/.to; 07:83 midplane rule.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Powder-plan fixes service-powder-door in the west partition at Z=[-1.65, -0.70], Y=[0, 2.20], clear of the washbasin reservation; this export carries the rough span.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 powder.md:27 (#powder-plan) Z=[-1.65,-0.70], Y=[0,2.20]; basin reservation Z=[-0.70,-0.25] adjoins without overlap.
 */
export const DOOR_SERVICE_POWDER_DOOR = door(
  "service-powder-door",
  "ground-storey",
  -1.65,
  -0.7,
);

const FLOOR = floorOf("ground-storey");

const POWDER: IRoomSpace = {
  id: "powder-room",
  owner: "rooms/powder.ts",
  storey: "ground-storey",
  outline: box([3.22, 5.5], [-1.9, -0.25]),
  floor: PALETTE.tile,
  reservations: [
    // powder-plan fixture boxes; heights from powder-fixture-use (toilet max 0.82, basin top 0.85).
    { id: "powder-toilet", kind: "fixture", x: [4.75, 5.5], z: [-1.65, -0.95], y: [FLOOR, FLOOR + 0.82] },
    { id: "powder-basin", kind: "fixture", x: [3.65, 4.25], z: [-0.7, -0.25], y: [FLOOR, FLOOR + 0.85] },
    // powder-fixture-use floors and the door waiting zone.
    { id: "powder-toilet-use", kind: "use", x: [4.15, 4.75], z: [-1.6, -1.0] },
    { id: "powder-basin-use", kind: "use", x: [3.65, 4.25], z: [-1.15, -0.7] },
    { id: "powder-door-waiting", kind: "use", x: [4.25, 4.85], z: [-0.85, -0.4] },
    // Front wall (inner face Z = -0.25) items: mirror over the basin X range, projection 0.04;
    // towel X = [4.40, 4.90], projection 0.08.
    { id: "powder-mirror", kind: "fixture", x: [3.65, 4.25], z: [-0.29, -0.25], y: [FLOOR + 1.1, FLOOR + 1.9] },
    { id: "powder-towel", kind: "fixture", x: [4.4, 4.9], z: [-0.33, -0.25], y: [FLOOR + 1.2, FLOOR + 1.5] },
  ],
};

/** Emit the powder room floor and its two partitions. */
/**
 * @evidence spaces/rooms/powder.md This builder returns the front service-band powder room and its two partition bodies.
 * @evidenceReview spaces/rooms/powder.md #efbc979 v-141 buildPowder returns POWDER plus powder-service-partition and powder-laundry-partition (powder.ts:80-96). powder.md:25 body: front room of the service band, rear laundry partition Z=[-2.05,-1.90], west service partition; 07:33 assigns both to powder.ts.
 * @evidence spaces/rooms/powder.md#powder-plan The service-side wall holds service-powder-door while the rear wall closes against laundry.
 * @evidenceReview spaces/rooms/powder.md#powder-plan #b8a94cc v-141 powder-service-partition has holes [DOOR_SERVICE_POWDER_DOOR] (powder.ts:80-88); powder-laundry-partition across [-2.05,-1.9] has no holes (powder.ts:89-96). powder.md:25: rear laundry partition, no door to any other room; :27: door in the west partition.
 * @evidence spaces/rooms/powder.md#powder-fixture-use Toilet, basin, mirror, towel, and the separate approach/waiting rectangles remain reservations for later fills.
 * @evidenceReview spaces/rooms/powder.md#powder-fixture-use #fb29ae0 v-141 powder.ts:47-56: toilet [4.75,5.5]x[-1.65,-0.95] top .82; basin [3.65,4.25]x[-0.7,-0.25] top .85; toilet-use, basin-use, door-waiting [4.25,4.85]x[-0.85,-0.4]; mirror 1.10-1.90 proj .04; towel X[4.4,4.9] 1.2-1.5 proj .08. All match powder.md:27,55,57,59.
 * @evidence principles/core/source-units.md#source-scope-preservation It creates room surfaces and partition voids, not a toilet, basin, mirror, or towel mesh.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Parts are roomFloor, roomCeiling, doorFloor and two partition() calls (powder.ts:71-97). Reservations are records only; no fixture part is emitted.
 * @evidence principles/core/source-units.md#source-substantive-completion The room record, tile floor, ceiling, under-door strip, and two walls form an executable builder result.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Space POWDER (floor PALETTE.tile, powder.ts:44) plus roomFloor, roomCeiling, doorFloor and 2 partitions (powder.ts:69-98).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Powder-plan has one service-powder-door from service access, and powder-fixture-use assigns basin and toilet bodies and their use boxes; buildPowder emits that one-room boundary.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 powder.md:25-27 one service-powder-door, no other door; holds. The toilet/basin body X/Z boxes are fixed in powder-plan :27; powder-fixture-use :55 serves '두 기구(#powder-plan)' and adds heights, facing and use floors. Host comment powder.ts:46 says 'powder-plan fixture boxes; heights from powder-fixture-use'. Same-file sibling attribution.
 */
export const buildPowder = (): IRoomBuild => ({
  space: POWDER,
  parts: [
    roomFloor(POWDER),
    roomCeiling(POWDER),
    doorFloor(
      POWDER,
      "service-powder-door",
      [3.145, 3.22],
      [DOOR_SERVICE_POWDER_DOOR.from, DOOR_SERVICE_POWDER_DOOR.to],
    ),
    partition({
      id: "powder-service-partition",
      owner: POWDER.owner,
      storey: "ground-storey",
      axis: "z",
      across: [3.07, 3.22],
      along: [-1.9, -0.25],
      holes: [DOOR_SERVICE_POWDER_DOOR],
    }),
    partition({
      id: "powder-laundry-partition",
      owner: POWDER.owner,
      storey: "ground-storey",
      axis: "x",
      across: [-2.05, -1.9],
      along: [3.22, 5.5],
    }),
  ],
});
