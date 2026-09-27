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
import { floorOf } from "../storeys";
/** Shared void owned by this room and consumed at its floor and adjacent finish.
 * @evidence spaces/rooms/wardrobe.md The primary-wardrobe-door void follows the partition assigned to wardrobe.
 * @evidenceReview spaces/rooms/wardrobe.md #25d2b66 v-141 wardrobe.ts:30-35 door(-10.2,-9.2) is the hole of wardrobe-primary-partition X=[0.75,0.9] (wardrobe.ts:78-86); 07:41; wardrobe.md:29.
 * @evidence principles/core/source-units.md#source-scope-preservation The primary-wardrobe-door interval remains with wardrobe while its adjacent room receives the span.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 primary.ts:11 imports DOOR_PRIMARY_WARDROBE_DOOR and uses .from/.to (primary.ts:92-97); 05:56.
 * @evidence principles/core/source-units.md#source-substantive-completion The primary-wardrobe-door span cuts its wall and sets floor finish limits on both sides.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Hole at wardrobe.ts:85. Shares wardrobe x[0.825,0.9] (wardrobe.ts:72-77) and primary x[0.75,0.825] (primary.ts:92-97).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Primary-wardrobe-plan fixes the door in the shared bedroom wall at Z=[-10.20, -9.20], Y=[3.06, 5.26], with no bathroom passage; this export carries its Z span.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 wardrobe.md:29 (#primary-wardrobe-plan) X=[0.75,0.90] shared wall, Z=[-10.20,-9.20], Y=[3.06,5.26], 욕실 쪽에는 문을 만들지 않는다.
 */
export const DOOR_PRIMARY_WARDROBE_DOOR = door(
  "primary-wardrobe-door",
  "upper-storey",
  -10.2,
  -9.2,
);

const FLOOR = floorOf("upper-storey");

const WARDROBE: IRoomSpace = {
  id: "primary-wardrobe",
  owner: "rooms/wardrobe.ts",
  storey: "upper-storey",
  outline: box([0.9, 5.5], [-10.45, -8.95]),
  floor: PALETTE.carpet,
  // wardrobe.md#primary-wardrobe-plan and #wardrobe-storage-use; heights above the upper floor (+3.06).
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
/**
 * @evidence spaces/rooms/wardrobe.md This builder creates the separate walk-in wardrobe behind the bathrooms.
 * @evidenceReview spaces/rooms/wardrobe.md #25d2b66 v-141 box([0.9,5.5],[-10.45,-8.95]) = wardrobe.md:27; front partitions face both bathrooms.
 * @evidence spaces/rooms/wardrobe.md#primary-wardrobe-plan The primary-bedroom door is cut in its west wall while bathroom-facing runs stay closed.
 * @evidenceReview spaces/rooms/wardrobe.md#primary-wardrobe-plan #e8b8646 v-141 The only hole is in the X=[0.75,0.9] partition (-X/west, "왼쪽" in wardrobe.md:27); the bath partitions (wardrobe.ts:87-102) have no holes. wardrobe.md:29: no door on the bathroom side.
 * @evidence spaces/rooms/wardrobe.md#wardrobe-storage-use Hanging and shelf bands leave the front aisle and left turning area free as reservations.
 * @evidenceReview spaces/rooms/wardrobe.md#wardrobe-storage-use #65b5487 v-141 Hanging [2.1,4.25] top 2.05; shelves [4.4,5.5], depth [-10.45,-9.9]; turning use [0.9,2.1]; front-aisle route [2.1,5.5]x[-9.9,-8.95] (wardrobe.ts:48-54); wardrobe.md:31,55,57.
 * @evidence principles/core/source-units.md#source-scope-preservation The room owns its carpet, door strip, and three partition runs while later models own racks and shelves.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Parts: carpet floor, ceiling, doorFloor and 3 partitions (wardrobe.ts:70-102); storage entries are reservation records only.
 * @evidence principles/core/source-units.md#source-substantive-completion The return has one room record and six concrete finish/partition parts with the door void present.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 6 parts: roomFloor, roomCeiling, doorFloor and 3 partitions, with the DOOR hole (wardrobe.ts:69-103).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Primary-wardrobe-plan fixes the primary-bedroom door and closed shower-bath boundary, while wardrobe-storage-use assigns hanger/folded-storage bands and their aisle inside that room.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 wardrobe.md:29 primary-wardrobe-door Z=[-10.20,-9.20], no door toward the bathrooms; :55 hanging to X=4.25, folded shelves from X=4.40; :57 front aisle. Host wardrobe.ts:30-35, :48-54; bath partitions without holes :87-102.
 */
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
