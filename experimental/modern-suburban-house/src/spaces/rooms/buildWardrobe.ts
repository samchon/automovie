/**
 * `primary-wardrobe`: the walk-in wardrobe behind the upper bathrooms.
 *
 *
 * Finished inner X = [0.90, 5.50], Z = [-10.45, -8.95] m. 07 assigns this owner
 * its partitions to the primary bedroom (X = [0.75, 0.90], carrying
 * `primary-wardrobe-door` Z = [-10.20, -9.20], Y = [3.06, 5.26] m) and to the
 * two bathrooms (Z = [-8.95, -8.80], X = [0.90, 3.07] and [3.22, 5.50]; the
 * corners X = [0.75, 0.90] and [3.07, 3.22] belong to the shower-bath and
 * tub-bath owners under 07 interior-boundary-junctions).
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
import { DOOR_PRIMARY_WARDROBE_DOOR } from "./DOOR_PRIMARY_WARDROBE_DOOR";
const FLOOR = floorOf("upper-storey");

const WARDROBE: IRoomSpace = {
  id: "primary-wardrobe",
  owner: "rooms/wardrobe.ts",
  storey: "upper-storey",
  outline: box([0.9, 5.5], [-10.45, -8.95]),
  floor: PALETTE.carpet,
  //  and #wardrobe-storage-use; heights above the upper floor (+3.06).
  reservations: [
    // Hanging from the storage's left end (2.10) to 4.25; top shelf surface 2.05.
    { id: "primary-wardrobe-hanging", kind: "storage", x: [2.1, 4.25], z: [-10.45, -9.9], y: [FLOOR, FLOOR + 2.05] },
    // Shelves from 4.40 to the right end (5.50) of the 0.55-deep rear reservation.
    { id: "primary-wardrobe-shelves", kind: "storage", x: [4.4, 5.5], z: [-10.45, -9.9] },
    // Turning floor kept free of shelves inside the door, X = [0.90, 2.10], full room depth.
    { id: "primary-wardrobe-turning", kind: "use", x: [0.9, 2.1], z: [-10.45, -8.95] },
    // Front aisle: 0.95 m left in front of the storage face Z = -9.90.
    { id: "primary-wardrobe-front-aisle", kind: "route", x: [2.1, 5.5], z: [-9.9, -8.95] },
  ],
};

/** Emit the wardrobe floor and its three partition runs. */
export const buildWardrobe = (): IRoomBuild => ({
  space: WARDROBE,
  parts: [
    roomFloor(WARDROBE),
    roomCeiling(WARDROBE),
    doorFloor(
      WARDROBE,
      "primary-wardrobe-door",
      [0.825, 0.9],
      [DOOR_PRIMARY_WARDROBE_DOOR.from, DOOR_PRIMARY_WARDROBE_DOOR.to],
    ),
    partition({
      id: "wardrobe-primary-partition",
      owner: WARDROBE.owner,
      storey: "upper-storey",
      axis: "z",
      across: [0.75, 0.9],
      along: [-10.45, -8.95],
      holes: [DOOR_PRIMARY_WARDROBE_DOOR],
    }),
    partition({
      id: "wardrobe-bath-partition",
      owner: WARDROBE.owner,
      storey: "upper-storey",
      axis: "x",
      across: [-8.95, -8.8],
      along: [0.9, 3.07],
    }),
    partition({
      id: "wardrobe-tub-partition",
      owner: WARDROBE.owner,
      storey: "upper-storey",
      axis: "x",
      across: [-8.95, -8.8],
      along: [3.22, 5.5],
    }),
  ],
});
