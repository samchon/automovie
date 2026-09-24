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
import { type IRoomBuild, type IRoomSpace, box, door, partition, doorFloor, roomCeiling, roomFloor } from "./shared";

const POWDER: IRoomSpace = {
  id: "powder-room",
  owner: "rooms/powder.ts",
  storey: "ground-storey",
  outline: box([3.22, 5.5], [-1.9, -0.25]),
  floor: PALETTE.tile,
};

/** Emit the powder room floor and its two partitions. */
export const buildPowder = (): IRoomBuild => ({
  space: POWDER,
  parts: [
    roomFloor(POWDER),
    roomCeiling(POWDER),
    doorFloor(POWDER, "service-powder-door", [3.145, 3.22], [-1.65, -0.7]),
    partition({
      id: "powder-service-partition",
      owner: POWDER.owner,
      storey: "ground-storey",
      axis: "z",
      across: [3.07, 3.22],
      along: [-1.9, -0.25],
      holes: [door("service-powder-door", "ground-storey", -1.65, -0.7)],
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
