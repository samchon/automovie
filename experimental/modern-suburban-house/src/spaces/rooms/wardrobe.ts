/**
 * `primary-wardrobe`: the walk-in wardrobe behind the upper bathrooms.
 *
 * Design owner: `docs/spaces/rooms/wardrobe.md#primary-wardrobe-plan`.
 * Finished inner X = [0.90, 5.50], Z = [-10.45, -8.95] m. 07 assigns this owner
 * its partitions to the primary bedroom (X = [0.75, 0.90], carrying
 * `primary-wardrobe-door` Z = [-10.20, -9.20], Y = [3.06, 5.26] m) and to the
 * two bathrooms (Z = [-8.95, -8.80]).
 */
import { PALETTE } from "../palette";
import { type IRoomBuild, type IRoomSpace, box, door, partition, roomFloor } from "./shared";

const WARDROBE: IRoomSpace = {
  id: "primary-wardrobe",
  owner: "rooms/wardrobe.ts",
  storey: "upper-storey",
  outline: box([0.9, 5.5], [-10.45, -8.95]),
  floor: PALETTE.carpet,
};

/** Emit the wardrobe floor and its two partitions. */
export const buildWardrobe = (): IRoomBuild => ({
  space: WARDROBE,
  parts: [
    roomFloor(WARDROBE),
    partition({
      id: "wardrobe-primary-partition",
      owner: WARDROBE.owner,
      storey: "upper-storey",
      axis: "z",
      across: [0.75, 0.9],
      along: [-10.45, -8.8],
      holes: [door("primary-wardrobe-door", "upper-storey", -10.2, -9.2)],
    }),
    partition({ id: "wardrobe-bath-partition", owner: WARDROBE.owner, storey: "upper-storey", axis: "x", across: [-8.95, -8.8], along: [0.9, 5.5] }),
  ],
});
