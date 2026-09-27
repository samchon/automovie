/**
 * `garage`: the empty two-car garage interior.
 *
 * Design owner: `docs/spaces/rooms/garage-interior.md#garage-interior-plan`,
 * whose outline and inner faces come from
 * `docs/spaces/00-building.md#attached-garage-extent`: finished inner
 * X = [5.75, 11.45], Z = [-6.45, -0.55] m, floor Y = -0.15 m. The garage stays
 * empty: no car or vehicle silhouette is authored. `garage.ts` emits the floor
 * support, ceiling base and shared wall; this owner authors the exposed concrete
 * floor face and the 0.015 m ceiling finish Y = [2.55, 2.565].
 * Shelves and the workbench are later models.
 */
import { PALETTE } from "../palette";
import { STOREYS } from "../storeys";
import { GARAGE_FRONT_DOOR } from "../envelope/front";
import { GARAGE } from "../building";
import { garageFloorMesh } from "../garage";
import { partitionPlaneFace } from "../face-partition";
import { part } from "../solid-records";
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

/** Emit the garage record, exposed concrete floor and ceiling finish. */
/**
 * @evidence spaces/rooms/garage-interior.md This builder records the empty garage room and authors its exposed floor and ceiling finishes.
 * @evidenceReview spaces/rooms/garage-interior.md #f028c07 `buildGarageInterior` returns the garage record, its exposed concrete floor face, and its ceiling finish; the reservation list contains storage and routes but no vehicle.
 * @evidence spaces/rooms/garage-interior.md#garage-interior-plan Its -0.15 m floor and 2.55 m ceiling come from STOREYS while garage.ts owns structural base and shared wall.
 * @evidenceReview spaces/rooms/garage-interior.md#garage-interior-plan #7615211 `GARAGE_INTERIOR` uses the garage inner outline and `STOREYS` floor and ceiling; this builder takes the top face from `garageFloorMesh` through the front threshold while `garage.ts` retains the lower support and shared wall.
 * @evidence spaces/rooms/garage-interior.md#garage-storage-use Shelf, workbench, drawer, and tool-board occupancy are reserved at the rear wall, without vehicle geometry.
 * @evidenceReview spaces/rooms/garage-interior.md#garage-storage-use #052fc33 `GARAGE_INTERIOR.reservations` places the shelf and workbench against the rear inner Z boundary, a 0.45 m drawer swing in front of the bench, and a higher tool board; their use bands remain separate from the room's empty central floor.
 * @evidence spaces/rooms/garage-interior.md#garage-use-routes West, cross, and window routes remain as clear floor reservations around those storage boxes.
 * @evidenceReview spaces/rooms/garage-interior.md#garage-use-routes The garage's west route starts beside the laundry door, its cross route spans Z [-4.75, -3.85], and its window route ends at `GARAGE.inner.x[1] - 0.06`; their X/Z boxes remain disjoint from the rear shelf and workbench use boxes.
 * @evidence principles/core/source-units.md#source-scope-preservation It emits no car, shelf, or garage structural base; its floor part contains only the top face of the shared slab.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `buildGarageInterior` makes only the exposed upper concrete face and ceiling finish; `buildGarageFloorBase` keeps the disjoint structural triangles, and no shelf or car mesh is emitted here.
 * @evidence principles/core/source-units.md#source-substantive-completion The room record has explicit levels and reservations, and this owner emits its exposed floor and ceiling parts.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The room record fixes levels and twelve spatial reservations; `part` authors `garage-floor-finish` from the shared slab top and `roomCeiling` authors the 0.015 m ceiling finish.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work Adding the designed overhead guide revealed that a planar route test rejected a walkable garage; room-route-network now declares its 2.00 m vertical test band.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work The overhead guide starts at `GARAGE_FRONT_DOOR.top` Y 2.15, while the garage route's 2.00 m walk band ends at Y 1.85 above its -0.15 floor; the repaired `room-route-network` vertical rule lets `checkReservations` exclude this elevated fixture from floor-route collisions.
 */
export const buildGarageInterior = (): IRoomBuild => ({
  space: GARAGE_INTERIOR,
  parts: [
    part(
      "garage-floor-finish",
      GARAGE_INTERIOR.owner,
      "floor",
      PALETTE.concrete,
      partitionPlaneFace(garageFloorMesh(), "y", STOREYS.garageFloor).face,
    ),
    roomCeiling(GARAGE_INTERIOR),
  ],
});
