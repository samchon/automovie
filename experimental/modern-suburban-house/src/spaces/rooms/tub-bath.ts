/**
 * `tub-bathroom`: the second upper bathroom at the end of the hall.
 *
 * Design owner: `docs/spaces/rooms/tub-bath.md#tub-bath-plan`. Finished inner
 * X = [3.22, 5.50], Z = [-8.80, -4.71] m. 07 assigns this owner its partitions
 * to the hall and shower bathroom (X = [3.07, 3.22], carrying `hall-tub-door`
 * Z = [-5.86, -4.86], Y = [3.06, 5.26] m) and to bedroom-three
 * (Z = [-4.71, -4.56], from X = 3.22). Under 07 interior-boundary-junctions the
 * X = [3.07, 3.22] run is split: this owner takes the wardrobe corner
 * Z = [-8.95, -8.80], while the shower-bath corner Z = [-6.06, -5.91] and the
 * bedroom-three corner Z = [-4.71, -4.56] belong to those owners. Fixtures are
 * later models.
 */
import { PALETTE } from "../palette";
import { type IRoomBuild, type IRoomSpace, box, door, partition, doorFloor, roomCeiling, roomFloor } from "./shared";

const TUB_BATH: IRoomSpace = {
  id: "tub-bathroom",
  owner: "rooms/tub-bath.ts",
  storey: "upper-storey",
  outline: box([3.22, 5.5], [-8.8, -4.71]),
  floor: PALETTE.tile,
};

/** Emit the tub bathroom floor and its two partitions. */
export const buildTubBath = (): IRoomBuild => ({
  space: TUB_BATH,
  parts: [
    roomFloor(TUB_BATH),
    roomCeiling(TUB_BATH),
    doorFloor(TUB_BATH, "hall-tub-door", [3.145, 3.22], [-5.86, -4.86]),
    partition({
      id: "tub-hall-partition",
      owner: TUB_BATH.owner,
      storey: "upper-storey",
      axis: "z",
      across: [3.07, 3.22],
      along: [-5.91, -4.71],
      holes: [door("hall-tub-door", "upper-storey", -5.86, -4.86)],
    }),
    partition({ id: "tub-shower-partition", owner: TUB_BATH.owner, storey: "upper-storey", axis: "z", across: [3.07, 3.22], along: [-8.95, -6.06] }),
    partition({ id: "tub-bedroom-three-partition", owner: TUB_BATH.owner, storey: "upper-storey", axis: "x", across: [-4.71, -4.56], along: [3.22, 5.5] }),
  ],
});
