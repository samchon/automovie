/**
 * `garage`: the empty two-car garage interior.
 *
 * Design owner: `docs/spaces/rooms/garage-interior.md#garage-interior-plan`,
 * whose outline and inner faces come from
 * `docs/spaces/00-building.md#attached-garage-extent`: finished inner
 * X = [5.75, 11.45], Z = [-6.45, -0.55] m, floor Y = -0.15 m. The garage stays
 * empty: no car or vehicle silhouette is authored. Its concrete floor body,
 * ceiling base and shared wall are emitted by `garage.ts`; this owner emits
 * the 0.015 m ceiling finish Y = [2.55, 2.565] (09 garage-ceiling-closure).
 * Shelves and the workbench are later models.
 */
import { PALETTE } from "../palette";
import { STOREYS } from "../storeys";
import { GARAGE_FRONT_DOOR } from "../envelope/front";
import { GARAGE } from "../building";
import { box, roomCeiling, type IRoomBuild, type IRoomSpace } from "./shared";

const FLOOR = STOREYS.garageFloor;
const SHELF_X = [7.15, 8.85] as const;
const WORKBENCH_X = [9.0, 10.2] as const;
const REAR_STORAGE_Z = [GARAGE.inner.z[0], -5.85] as const;
const WORKBENCH_DRAWERS_Z = [REAR_STORAGE_Z[1], REAR_STORAGE_Z[1] + 0.45] as const;
const TOOL_BOARD_Z = [GARAGE.inner.z[0], GARAGE.inner.z[0] + 0.15] as const;
const WINDOW_ROUTE_RIGHT_X = GARAGE.inner.x[1] - 0.06;
const WEST_ROUTE_X = [5.95, 6.95] as const;

const GARAGE_INTERIOR: IRoomSpace = {
  id: "garage",
  owner: "rooms/garage-interior.ts",
  storey: "ground-storey",
  outline: box(GARAGE.inner.x, GARAGE.inner.z),
  floor: PALETTE.concrete,
  levels: [STOREYS.garageFloor, STOREYS.garageCeiling],
  reservations: [
    { id: "garage-door-overhead-guide", kind: "fixture", x: [GARAGE_FRONT_DOOR.from - 0.1, GARAGE_FRONT_DOOR.to + 0.1], z: [-3.4, GARAGE.inner.z[1]], y: [GARAGE_FRONT_DOOR.top, FLOOR + 2.65] },
    { id: "garage-door-left-rail", kind: "fixture", x: [GARAGE_FRONT_DOOR.from - 0.1, GARAGE_FRONT_DOOR.from + 0.06], z: [GARAGE.inner.z[1] - 0.17, GARAGE.inner.z[1]], y: [FLOOR, FLOOR + 2.65] },
    { id: "garage-door-right-rail", kind: "fixture", x: [GARAGE_FRONT_DOOR.to - 0.06, GARAGE_FRONT_DOOR.to + 0.1], z: [GARAGE.inner.z[1] - 0.17, GARAGE.inner.z[1]], y: [FLOOR, FLOOR + 2.65] },
    // garage-storage-use, heights stated above the garage floor Y = -0.15 and converted to world.
    // Shelf: rear inner face to Z = -5.85, full height 2.05.
    { id: "garage-shelf", kind: "storage", x: SHELF_X, z: REAR_STORAGE_Z, y: [FLOOR, FLOOR + 2.05] },
    { id: "garage-shelf-use", kind: "use", x: SHELF_X, z: [REAR_STORAGE_Z[1], -4.8] },
    // Workbench: same rear depth, top 0.90; drawers pull at most 0.45 m +Z.
    { id: "garage-workbench", kind: "furniture", x: WORKBENCH_X, z: REAR_STORAGE_Z, y: [FLOOR, FLOOR + 0.9] },
    { id: "garage-workbench-drawers", kind: "swing", x: WORKBENCH_X, z: WORKBENCH_DRAWERS_Z },
    { id: "garage-workbench-use", kind: "use", x: WORKBENCH_X, z: [WORKBENCH_DRAWERS_Z[1], -4.8] },
    // Tool board: same X, within 0.15 m of the rear wall, 1.10-2.10 above the garage floor.
    { id: "garage-tool-board", kind: "storage", x: WORKBENCH_X, z: TOOL_BOARD_Z, y: [FLOOR + 1.1, FLOOR + 2.1] },
    // garage-use-routes; the right limit is GARAGE.inner.x[1] less the 0.06 m interior
    // sill/handle projection limit of 06 external-opening-interface.
    { id: "garage-west-route", kind: "route", x: WEST_ROUTE_X, z: [REAR_STORAGE_Z[1], -0.95] },
    { id: "garage-cross-route", kind: "route", x: [WEST_ROUTE_X[0], WINDOW_ROUTE_RIGHT_X], z: [-4.75, -3.85] },
    { id: "garage-window-route", kind: "route", x: [10.35, WINDOW_ROUTE_RIGHT_X], z: [REAR_STORAGE_Z[1], -3.85] },
  ],
};

/** Emit the garage record and its ceiling finish (09 garage-ceiling-closure). */
/**
 * @evidence spaces/rooms/garage-interior.md This builder records the empty garage room and its visible ceiling finish.
 * @evidenceReview spaces/rooms/garage-interior.md #f028c07 v-141 garage-interior.ts:60-63 returns space GARAGE_INTERIOR + roomCeiling only; no vehicle reservation; garage-interior.md:29,33.
 * @evidence spaces/rooms/garage-interior.md#garage-interior-plan Its -0.15 m floor and 2.55 m ceiling come from STOREYS while garage.ts owns structural base and shared wall.
 * @evidenceReview spaces/rooms/garage-interior.md#garage-interior-plan #7615211 v-141 levels [STOREYS.garageFloor(-0.15), garageCeiling(2.55)] L27 (storeys.ts:36-38); garage.ts emits garage-shared-wall (L63) and garage-floor-base (L74-96); garage-interior.md:27,33,35.
 * @evidence spaces/rooms/garage-interior.md#garage-storage-use Shelf, workbench, drawer, and tool-board occupancy are reserved at the rear wall, without vehicle geometry.
 * @evidenceReview spaces/rooms/garage-interior.md#garage-storage-use #052fc33 v-141 L34-41: shelf X[7.15,8.85] Z[-6.45,-5.85] h2.05, shelf use Z[-5.85,-4.80], workbench h0.90, drawers Z[-5.85,-5.40], use Z[-5.40,-4.80], tool board Z[-6.45,-6.30] h1.10-2.10 = garage-interior.md:59-61; no vehicle.
 * @evidence spaces/rooms/garage-interior.md#garage-use-routes West, cross, and window routes remain as clear floor reservations around those storage boxes.
 * @evidenceReview spaces/rooms/garage-interior.md#garage-use-routes #1de060f v-141 west X[5.95,6.95] Z[-5.85,-0.95], cross X[5.95,11.39] Z[-4.75,-3.85], window X[10.35,11.39] Z[-5.85,-3.85] L44-46 = garage-interior.md:91 (11.39 = 11.45-0.06, 06-openings external-opening-interface); checkReservations bars route/storage overlap.
 * @evidence principles/core/source-units.md#source-scope-preservation It emits no car, shelf, or garage base; only its logical interior and ceiling finish leave this builder.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 parts only [roomCeiling] L62: no car, shelf or base. (Observation: garage-interior.md:35 says this owner finishes the floor; no floor part is emitted, see notes.)
 * @evidence principles/core/source-units.md#source-substantive-completion The room record has explicit levels, reservations, and a real ceiling finish part.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Garage levels and reservations are room-authored here; shared.ts roomCeiling uses the 2.55 m garage ceiling datum and adds its 0.015 m finish.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work Adding the designed overhead guide revealed that a planar route test rejected a walkable garage; room-route-network now declares its 2.00 m vertical test band.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The route-network parent declares the 2.00 m band and garage-door overhead guide; this room puts its guide at Y=2.15 above the garage route floor of -0.15, while reservations.ts checkReservations applies the 2.00 m test.
 */
export const buildGarageInterior = (): IRoomBuild => ({
  space: GARAGE_INTERIOR,
  parts: [roomCeiling(GARAGE_INTERIOR)],
});
