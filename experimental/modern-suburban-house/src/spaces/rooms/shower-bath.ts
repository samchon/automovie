/**
 * `shower-bathroom`: the first upper bathroom off the hall.
 *
 * Design owner: `docs/spaces/rooms/shower-bath.md#shower-bath-plan`. Finished
 * inner X = [0.90, 3.07], Z = [-8.80, -6.06] m. 07 assigns this owner its
 * partitions to the hall (Z = [-6.06, -5.91], carrying `hall-shower-door`
 * X = [1.05, 2.05], Y = [3.06, 5.26] m) and to the primary bedroom
 * (X = [0.75, 0.90]). Fixtures are later models.
 */
import { PALETTE } from "../palette";
import { type IRoomBuild, type IRoomSpace, box, door, partition, roomFloor } from "./shared";

const SHOWER_BATH: IRoomSpace = {
  id: "shower-bathroom",
  owner: "rooms/shower-bath.ts",
  storey: "upper-storey",
  outline: box([0.9, 3.07], [-8.8, -6.06]),
  floor: PALETTE.tile,
};

/** Emit the shower bathroom floor and its two partitions. */
export const buildShowerBath = (): IRoomBuild => ({
  space: SHOWER_BATH,
  parts: [
    roomFloor(SHOWER_BATH),
    partition({
      id: "shower-hall-partition",
      owner: SHOWER_BATH.owner,
      storey: "upper-storey",
      axis: "x",
      across: [-6.06, -5.91],
      along: [0.75, 3.07],
      holes: [door("hall-shower-door", "upper-storey", 1.05, 2.05)],
    }),
    partition({ id: "shower-primary-partition", owner: SHOWER_BATH.owner, storey: "upper-storey", axis: "z", across: [0.75, 0.9], along: [-8.8, -6.06] }),
  ],
});
