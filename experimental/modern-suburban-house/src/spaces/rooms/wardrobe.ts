/**
 * `primary-wardrobe`: the walk-in wardrobe behind the upper bathrooms.
 *
 * Design owner: `docs/spaces/rooms/wardrobe.md#primary-wardrobe-plan`.
 * Finished inner X = [0.90, 5.50], Z = [-10.45, -8.95] m. 07 assigns this owner
 * its partitions to the primary bedroom (X = [0.75, 0.90], carrying
 * `primary-wardrobe-door` Z = [-10.20, -9.20], Y = [3.06, 5.26] m) and to the
 * two bathrooms (Z = [-8.95, -8.80], X = [0.90, 3.07] and [3.22, 5.50]; the
 * corners X = [0.75, 0.90] and [3.07, 3.22] belong to the shower-bath and
 * tub-bath owners under 07 interior-boundary-junctions).
 */
import { PALETTE } from "../palette";
import { type IRoomBuild, type IRoomSpace, box, door, partition, doorFloor, roomCeiling, roomFloor } from "./shared";

const WARDROBE: IRoomSpace = {
  id: "primary-wardrobe",
  owner: "rooms/wardrobe.ts",
  storey: "upper-storey",
  outline: box([0.9, 5.5], [-10.45, -8.95]),
  floor: PALETTE.carpet,
  // wardrobe.md#primary-wardrobe-plan and #wardrobe-storage-use; heights above the upper floor (+3.06).
  reservations: [
    // Hanging from the storage's left end (2.10) to 4.25; top shelf surface 2.05.
    { id: "primary-wardrobe-hanging", kind: "storage", x: [2.1, 4.25], z: [-10.45, -9.9], y: [3.06, 5.11] },
    // Shelves from 4.40 to the right end (5.50) of the 0.55-deep rear reservation.
    { id: "primary-wardrobe-shelves", kind: "storage", x: [4.4, 5.5], z: [-10.45, -9.9] },
    // Turning floor kept free of shelves inside the door, X = [0.90, 2.10], full room depth.
    { id: "primary-wardrobe-turning", kind: "use", x: [0.9, 2.1], z: [-10.45, -8.95] },
    // Front aisle: 0.95 m left in front of the storage face Z = -9.90.
    { id: "primary-wardrobe-front-aisle", kind: "route", x: [2.1, 5.5], z: [-9.9, -8.95] },
  ],
};

/** Emit the wardrobe floor and its three partition runs. */
/**
 * @evidence spaces/rooms/wardrobe.md This builder creates the separate walk-in wardrobe behind the bathrooms.
 * @evidence spaces/rooms/wardrobe.md#primary-wardrobe-plan The primary-bedroom door is cut in its west wall while bathroom-facing runs stay closed.
 * @evidence spaces/rooms/wardrobe.md#wardrobe-storage-use Hanging and shelf bands leave the front aisle and left turning area free as reservations.
 * @evidence principles/core/source-units.md#source-scope-preservation The room owns its carpet, door strip, and three partition runs while later models own racks and shelves.
 * @evidence principles/core/source-units.md#source-substantive-completion The return has one room record and six concrete finish/partition parts with the door void present.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The wardrobe parent specifies its bathroom boundary, door, storage, and aisle; the builder needed no invented opening.
 */
export const buildWardrobe = (): IRoomBuild => ({
  space: WARDROBE,
  parts: [
    roomFloor(WARDROBE),
    roomCeiling(WARDROBE),
    doorFloor(WARDROBE, "primary-wardrobe-door", [0.825, 0.9], [-10.2, -9.2]),
    partition({
      id: "wardrobe-primary-partition",
      owner: WARDROBE.owner,
      storey: "upper-storey",
      axis: "z",
      across: [0.75, 0.9],
      along: [-10.45, -8.95],
      holes: [door("primary-wardrobe-door", "upper-storey", -10.2, -9.2)],
    }),
    partition({ id: "wardrobe-bath-partition", owner: WARDROBE.owner, storey: "upper-storey", axis: "x", across: [-8.95, -8.8], along: [0.9, 3.07] }),
    partition({ id: "wardrobe-tub-partition", owner: WARDROBE.owner, storey: "upper-storey", axis: "x", across: [-8.95, -8.8], along: [3.22, 5.5] }),
  ],
});
