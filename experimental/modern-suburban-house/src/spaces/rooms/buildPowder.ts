/**
 * `powder-room`: the front room of the service band.
 *
 * Finished inner
 * X = [3.22, 5.50], Z = [-1.90, -0.25] m. 07 assigns this owner its partitions
 * to service-access (X = [3.07, 3.22], carrying `service-powder-door`
 * Z = [-1.65, -0.70], Y = [0, 2.20] m, from Z = -1.90; the corner
 * Z = [-2.05, -1.90] is the laundry owner's junction) and to the laundry
 * (Z = [-2.05, -1.90]).
 * Fixtures are models and are not emitted.
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
import { DOOR_SERVICE_POWDER_DOOR } from "./DOOR_SERVICE_POWDER_DOOR";
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
