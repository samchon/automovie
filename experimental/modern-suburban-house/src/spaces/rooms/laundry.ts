/**
 * `laundry-mudroom`: the buffer room between the service band and the garage.
 *
 * Finished inner
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
import { part } from "../part";
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
export const LAUNDRY_GARAGE_DOOR = {
  id: "laundry-garage-door",
  from: -4.4,
  to: -3.35,
  bottom: FLOOR - GROUND_LAYERS.finish - GROUND_LAYERS.base,
  top: FLOOR + 2.2,
} as const;

/** One under-door slab supplies disjoint structural and room-owned faces. */
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
