/**
 * `pantry`: the store room at the back of the service band.
 *
 * Finished inner
 * X = [3.22, 5.50], Z = [-6.05, -4.70] m. 07 assigns this owner its partition
 * to service-access (X = [3.07, 3.22]) carrying `service-pantry-door`
 * Z = [-5.75, -4.80], Y = [0, 2.20] m. Shelves are later models.
 */
import { PALETTE } from "../PALETTE";
import {
  type IRoomBuild,
} from "./IRoomBuild";
import { box } from "./box";
import { partition } from "./partition";
import { roomCeiling } from "./roomCeiling";
import { doorFloor } from "./doorFloor";
import { roomFloor } from "./roomFloor";
import { type IRoomSpace } from "./IRoomSpace";
import { floorOf } from "../floorOf";
import { DOOR_SERVICE_PANTRY_DOOR } from "./DOOR_SERVICE_PANTRY_DOOR";
const FLOOR = floorOf("ground-storey");
const PANTRY_X = [3.22, 5.5] as const;
const PANTRY_Z = [-6.05, -4.7] as const;
const BACK_SHELF_FRONT_Z = PANTRY_Z[0] + 0.25;
const RIGHT_SHELF_FRONT_X = PANTRY_X[1] - 0.3;
const ROUTE_FRONT_Z = DOOR_SERVICE_PANTRY_DOOR.to - 0.08;
const TURN_X = RIGHT_SHELF_FRONT_X - 0.5;
const TURN_Z = (BACK_SHELF_FRONT_Z + ROUTE_FRONT_Z) / 2;
const TURN_HALF = 0.45;

const PANTRY: IRoomSpace = {
  id: "pantry",
  owner: "rooms/pantry.ts",
  storey: "ground-storey",
  outline: box(PANTRY_X, PANTRY_Z),
  floor: PALETTE.woodFloor,
  reservations: [
    // pantry-plan L-shelf: back band 0.25 m deep from Z = -6.05, right band 0.30 m deep from X = 5.50.
    // pantry-storage-use: one L-shaped shelf; the right band starts at the back band's front
    // so the corner is owned once. Five tops from 0.20 m at 0.40 m (top 1.80) plus the
    // 0.30 m item limit give the body height 2.10 m.
    { id: "pantry-back-shelf", kind: "storage", x: PANTRY_X, z: [PANTRY_Z[0], BACK_SHELF_FRONT_Z], y: [FLOOR, FLOOR + 2.1] },
    { id: "pantry-right-shelf", kind: "storage", x: [RIGHT_SHELF_FRONT_X, PANTRY_X[1]], z: [BACK_SHELF_FRONT_Z, PANTRY_Z[1]], y: [FLOOR, FLOOR + 2.1] },
    // pantry-use-route: entrance X = 3.22 to the right shelf front, back shelf front to the
    // door/handle limit 0.08 m behind the +Z jamb plane Z = -4.80.
    { id: "pantry-use-route", kind: "route", x: [PANTRY_X[0], RIGHT_SHELF_FRONT_X], z: [BACK_SHELF_FRONT_Z, ROUTE_FRONT_Z] },
    // 0.90 m turning square centred 0.50 m -X of the right shelf front (X = 4.70) and on the
    // use band's Z centre (-5.34).
    { id: "pantry-turning", kind: "use", x: [TURN_X - TURN_HALF, TURN_X + TURN_HALF], z: [TURN_Z - TURN_HALF, TURN_Z + TURN_HALF] },
  ],
};

/** Emit the pantry floor and its partition to the service band. */
export const buildPantry = (): IRoomBuild => ({
  space: PANTRY,
  parts: [
    roomFloor(PANTRY),
    roomCeiling(PANTRY),
    doorFloor(
      PANTRY,
      "service-pantry-door",
      [3.145, 3.22],
      [DOOR_SERVICE_PANTRY_DOOR.from, DOOR_SERVICE_PANTRY_DOOR.to],
    ),
    partition({
      id: "pantry-service-partition",
      owner: PANTRY.owner,
      storey: "ground-storey",
      axis: "z",
      across: [3.07, 3.22],
      along: [-6.05, -4.7],
      holes: [DOOR_SERVICE_PANTRY_DOOR],
    }),
  ],
});
