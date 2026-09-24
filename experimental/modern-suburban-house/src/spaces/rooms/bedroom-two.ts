/**
 * `bedroom-two`: the upper-storey front-left child bedroom (olive bedding).
 *
 * Design owner: `docs/spaces/rooms/bedroom-two.md#bedroom-two-plan`. Finished
 * inner X = [-5.50, -1.95], Z = [-4.56, -0.25] m. 07 assigns this owner its
 * partition to the upper hall, Z = [-4.71, -4.56], carrying
 * `hall-bedroom-two-door` X = [-3.10, -2.10], Y = [3.06, 5.26] m; the run is
 * stopped at X = -1.95: the corner X = [-1.95, -1.80] is the stair owner's
 * junction (07 interior-boundary-junctions).
 */
import { PALETTE } from "../palette";
import { type IRoomBuild, type IRoomSpace, box, door, partition, doorFloor, roomCeiling, roomFloor } from "./shared";

const BEDROOM_TWO: IRoomSpace = {
  id: "bedroom-two",
  owner: "rooms/bedroom-two.ts",
  storey: "upper-storey",
  outline: box([-5.5, -1.95], [-4.56, -0.25]),
  floor: PALETTE.carpet,
};

/** Emit the bedroom floor and its partition to the hall. */
export const buildBedroomTwo = (): IRoomBuild => ({
  space: BEDROOM_TWO,
  parts: [
    roomFloor(BEDROOM_TWO),
    roomCeiling(BEDROOM_TWO),
    doorFloor(BEDROOM_TWO, "hall-bedroom-two-door", [-3.1, -2.1], [-4.635, -4.56]),
    partition({
      id: "bedroom-two-hall-partition",
      owner: BEDROOM_TWO.owner,
      storey: "upper-storey",
      axis: "x",
      across: [-4.71, -4.56],
      along: [-3.35, -1.95],
      holes: [door("hall-bedroom-two-door", "upper-storey", -3.1, -2.1)],
    }),
  ],
});
