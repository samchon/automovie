import { partitionPlaneFace } from "../partitionPlaneFace";
import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { PALETTE } from "../PALETTE";
import { part } from "../part";
import { block } from "../block";
import { DOOR_SERVICE_LAUNDRY_DOOR } from "./DOOR_SERVICE_LAUNDRY_DOOR";
import { LAUNDRY_GARAGE_DOOR } from "./LAUNDRY_GARAGE_DOOR";
import { LAUNDRY_FLOOR } from "./LAUNDRY_FLOOR";
import { laundryGarageDoorBaseMesh } from "./laundryGarageDoorBaseMesh";
import { type IRoomBuild } from "./IRoomBuild";
import { box } from "./box";
import { partition } from "./partition";
import { roomCeiling } from "./roomCeiling";
import { doorFloor } from "./doorFloor";
import { roomFloor } from "./roomFloor";
import { type IRoomSpace } from "./IRoomSpace";
import { DRYER_Z } from "./DRYER_Z";
import { WASHER_Z } from "./WASHER_Z";

const MACHINE_BAND_Z = [WASHER_Z[0], DRYER_Z[1]] as const;
const LAUNDRY_ROOM: IRoomSpace = {
  id: "laundry-mudroom",
  owner: "rooms/laundry.ts",
  storey: "ground-storey",
  outline: box([3.22, 5.5], [-4.55, -2.05]),
  floor: PALETTE.utility,
  reservations: [
    // laundry-equipment-use: machine band X = [4.75, 5.50], Z = [-3.35, -2.05]; two 0.65 x 0.75 x 0.88
    // machine centres derive from the rear edge, half-width, and one-width spacing; fronts face -X.
    { id: "laundry-washer", kind: "fixture", x: [4.75, 5.5], z: WASHER_Z, y: [LAUNDRY_FLOOR, LAUNDRY_FLOOR + 0.88] },
    { id: "laundry-dryer", kind: "fixture", x: [4.75, 5.5], z: DRYER_Z, y: [LAUNDRY_FLOOR, LAUNDRY_FLOOR + 0.88] },
    // Folding top at 0.94 over the same band; its underside cannot go below the 0.88 machine limit.
    { id: "laundry-folding-top", kind: "fixture", x: [4.75, 5.5], z: MACHINE_BAND_Z, y: [LAUNDRY_FLOOR + 0.88, LAUNDRY_FLOOR + 0.94] },
    { id: "laundry-upper-storage", kind: "storage", x: [5.2, 5.5], z: MACHINE_BAND_Z, y: [LAUNDRY_FLOOR + 1.5, LAUNDRY_FLOOR + 2.3] },
    // Round doors open at most 0.50 m -X from the front X = 4.75, within each machine's width.
    { id: "laundry-washer-door", kind: "swing", x: [4.25, 4.75], z: WASHER_Z },
    { id: "laundry-dryer-door", kind: "swing", x: [4.25, 4.75], z: DRYER_Z },
    { id: "laundry-washer-work", kind: "use", x: [3.8, 4.25], z: [-3.35, -2.6] },
    { id: "laundry-dryer-work", kind: "use", x: [3.8, 4.25], z: [-2.8, -2.05] },
    // Shoe bench from the left inner face to X = 3.62, Z = -2.85 to the front inner face; hooks over it.
    { id: "laundry-shoe-bench", kind: "furniture", x: [3.22, 3.62], z: [-2.85, -2.05], y: [LAUNDRY_FLOOR, LAUNDRY_FLOOR + 0.45] },
    { id: "laundry-coat-hooks", kind: "storage", x: [3.22, 3.62], z: [-2.85, -2.05], y: [LAUNDRY_FLOOR + 1.1, LAUNDRY_FLOOR + 1.85] },
    { id: "laundry-shoe-use", kind: "use", x: [3.62, 4.25], z: [-2.85, -2.05] },
    // laundry-plan upper (mudroom) waiting zone and laundry-through-route.
    { id: "laundry-upper-waiting", kind: "use", x: [4.45, 5.5], z: [-4.43, -3.38] },
    // laundry-plan decides the garage-side lower waiting too; it lies on the garage floor.
    { id: "laundry-garage-lower-waiting", kind: "use", space: "garage", x: [5.75, 6.8], z: [-4.43, -3.38] },
    { id: "laundry-through-route", kind: "route", x: [3.22, 5.5], z: [-4.32, -3.42] },
  ],
};
/** Emit laundry finishes, both garage riser faces, and the two partitions. */

export const buildLaundry = (): IRoomBuild => ({
  space: LAUNDRY_ROOM,
  parts: [
    roomFloor(LAUNDRY_ROOM),
    roomCeiling(LAUNDRY_ROOM),
    doorFloor(
      LAUNDRY_ROOM,
      "service-laundry-door",
      [3.145, 3.22],
      [DOOR_SERVICE_LAUNDRY_DOOR.from, DOOR_SERVICE_LAUNDRY_DOOR.to]
    ),
    partition({
      id: "laundry-service-partition",
      owner: LAUNDRY_ROOM.owner,
      storey: "ground-storey",
      axis: "z",
      across: [3.07, 3.22],
      along: [-4.7, -1.9],
      holes: [DOOR_SERVICE_LAUNDRY_DOOR],
    }),
    part(
      "laundry-garage-threshold",
      LAUNDRY_ROOM.owner,
      "floor",
      PALETTE.utility,
      block(
        [5.5, LAUNDRY_FLOOR - 0.025, LAUNDRY_GARAGE_DOOR.from],
        [5.75, LAUNDRY_FLOOR, LAUNDRY_GARAGE_DOOR.to]
      )
    ),
    part(
      "laundry-garage-riser-lower",
      LAUNDRY_ROOM.owner,
      "floor",
      PALETTE.structure,
      partitionPlaneFace(laundryGarageDoorBaseMesh(), "x", MAIN_OUTLINE.outer.x[1]).face
    ),
    partition({
      id: "laundry-pantry-partition",
      owner: LAUNDRY_ROOM.owner,
      storey: "ground-storey",
      axis: "x",
      across: [-4.7, -4.55],
      along: [3.22, 5.5],
    }),
  ],
});
