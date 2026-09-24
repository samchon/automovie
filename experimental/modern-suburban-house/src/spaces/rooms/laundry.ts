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
import { PALETTE } from "../palette";
import { block, part } from "../solids";
import { type IRoomBuild, type IRoomSpace, box, door, doorFloor, partition, roomCeiling, roomFloor } from "./shared";

const LAUNDRY: IRoomSpace = {
  id: "laundry-mudroom",
  owner: "rooms/laundry.ts",
  storey: "ground-storey",
  outline: box([3.22, 5.5], [-4.55, -2.05]),
  floor: PALETTE.utility,
};

/** Emit the laundry finishes, its share under service-laundry-door, the garage threshold and its two partitions. */
export const buildLaundry = (): IRoomBuild => ({
  space: LAUNDRY,
  parts: [
    roomFloor(LAUNDRY),
    roomCeiling(LAUNDRY),
    doorFloor(LAUNDRY, "service-laundry-door", [3.145, 3.22], [-4.4, -3.35]),
    partition({
      id: "laundry-service-partition",
      owner: LAUNDRY.owner,
      storey: "ground-storey",
      axis: "z",
      across: [3.07, 3.22],
      along: [-4.7, -1.9],
      holes: [door("service-laundry-door", "ground-storey", -4.4, -3.35)],
    }),
    part("laundry-garage-threshold", LAUNDRY.owner, "floor", PALETTE.utility, block([5.5, -0.025, -4.4], [5.75, 0, -3.35])),
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
