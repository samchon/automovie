
import { PALETTE } from "../palette";
import { STOREYS } from "../storeys";
import { GARAGE_FRONT_DOOR } from "../envelope/front";
import { GARAGE } from "../building";
import { garageFloorMesh } from "../garage";
import { partitionPlaneFace } from "../face-partition";
import { part } from "../part";
import { box, roomCeiling, type IRoomBuild, type IRoomSpace } from "./shared";

const FLOOR = STOREYS.garageFloor;
const SHELF_X = [7.15, 8.85] as const;
const WORKBENCH_X = [9.0, 10.2] as const;
const REAR_STORAGE_Z = [GARAGE.inner.z[0], -5.85] as const;
const WORKBENCH_DRAWERS_Z = [
  REAR_STORAGE_Z[1],
  REAR_STORAGE_Z[1] + 0.45,
] as const;
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
