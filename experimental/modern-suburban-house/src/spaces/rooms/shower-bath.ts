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
import { part } from "../solid-records";
import { floorOf, STOREYS } from "../storeys";
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
import { blindRecessWall } from "./recess";
/** Shared void owned by this room and consumed at its floor and adjacent finish.
 * @evidence spaces/rooms/shower-bath.md The hall-shower-door void follows the partition assigned to shower-bath.
 * @evidenceReview spaces/rooms/shower-bath.md #9969963 v-141 shower-bath.ts:30-35 door(1.05,2.05) is the hole of shower-hall-partition (shower-bath.ts:86-94); 07:39 assigns shower<->hall; shower-bath.md:27 front wall Z=[-6.06,-5.91].
 * @evidence principles/core/source-units.md#source-scope-preservation The hall-shower-door interval remains with shower-bath while its adjacent room receives the span.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 upper-hall.ts:18 imports DOOR_HALL_SHOWER_DOOR and uses .from/.to (upper-hall.ts:97-102); 05:54 names shower-bath.md as owner.
 * @evidence principles/core/source-units.md#source-substantive-completion The hall-shower-door span cuts its wall and sets floor finish limits on both sides.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Hole at shower-bath.ts:93. Floor shares shower z[-6.06,-5.985] (shower-bath.ts:80-85) and hall z[-5.985,-5.91] (upper-hall.ts:97-102).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-bath-plan locates hall-shower-door on the front corridor wall at X=[1.05, 2.05], Y=[3.06, 5.26]; this export preserves that opening without adding a bedroom door.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 shower-bath.md:27 front Z=[-6.06,-5.91] wall, X=[1.05,2.05], Y=[3.06,5.26], 주침실에 출입문을 추가하지 않는다.
 */
export const DOOR_HALL_SHOWER_DOOR = door(
  "hall-shower-door",
  "upper-storey",
  1.05,
  2.05,
);

const FLOOR = floorOf("upper-storey");

const SHOWER_BATH: IRoomSpace = {
  id: "shower-bathroom",
  owner: "rooms/shower-bath.ts",
  storey: "upper-storey",
  outline: box([0.9, 3.07], [-8.8, -6.06]),
  floor: PALETTE.tile,
  // shower-bath.md#shower-fixture-use; heights above the upper floor (+3.06).
  reservations: [
    // X from the left inner face (0.90) to 2.15, Z from the rear inner face (-8.80) to -7.70; glass top 2.10.
    { id: "shower-bathroom-booth", kind: "fixture", x: [0.9, 2.15], z: [-8.8, -7.7], y: [FLOOR, FLOOR + 2.1] },
    { id: "shower-bathroom-faucet", kind: "fixture", x: [1, 1.3], z: [-8.8, -8.7], y: [FLOOR + 1.05, FLOOR + 1.05] },
    { id: "shower-bathroom-head", kind: "fixture", x: [1, 1.3], z: [-8.8, -8.6], y: [FLOOR + 2.05, FLOOR + 2.05] },
    { id: "shower-bathroom-booth-wait", kind: "use", x: [0.95, 1.85], z: [-7.65, -7.05] },
    // Z from the rear inner face (-8.80) to -8.05; top 0.82.
    { id: "shower-bathroom-toilet", kind: "fixture", x: [2.32, 2.97], z: [-8.8, -8.05], y: [FLOOR, FLOOR + 0.82] },
    { id: "shower-bathroom-toilet-use", kind: "use", x: [2.27, 3.02], z: [-8.05, -7.45] },
    // X from 2.52 to the right inner face (3.07); counter 0.85.
    { id: "shower-bathroom-vanity", kind: "fixture", x: [2.52, 3.07], z: [-6.8, -6.1], y: [FLOOR, FLOOR + 0.85] },
    { id: "shower-bathroom-vanity-use", kind: "use", x: [1.92, 2.52], z: [-6.8, -6.2] },
    // Front wall (Z = -6.06), projection at most 0.08, height 1.10-1.50.
    { id: "shower-bathroom-towel", kind: "fixture", x: [2.2, 2.45], z: [-6.14, -6.06], y: [FLOOR + 1.1, FLOOR + 1.5] },
    // shower-fixture-use: the mirror hangs on the vanity's own right wall (inner face X = 3.07)
    // over the vanity width, 1.10-1.90 m above the upper floor, projecting at most 0.04 m.
    { id: "shower-bathroom-mirror", kind: "fixture", x: [3.03, 3.07], z: [-6.8, -6.1], y: [FLOOR + 1.1, FLOOR + 1.9] },
  ],
};

/** Emit the shower bathroom floor and its two partitions. */
/**
 * @evidence spaces/rooms/shower-bath.md This builder owns the upper shower room reached directly from the hall.
 * @evidenceReview spaces/rooms/shower-bath.md #9969963 v-141 SHOWER_BATH box([0.9,3.07],[-8.8,-6.06]) on the upper storey (shower-bath.ts:39-44) = shower-bath.md:25; single door from the hall (:27).
 * @evidence spaces/rooms/shower-bath.md#shower-bath-plan The hall wall contains hall-shower-door and the primary-side wall has its bounded blind recess.
 * @evidenceReview spaces/rooms/shower-bath.md#shower-bath-plan #2fb7a85 v-141 Hall-wall hole (shower-bath.ts:86-94) matches shower-bath.md:27. The blind recess (shower-bath.ts:95-108) is real, but its decision is only in the #shower-fixture-use body (shower-bath.md:61); the #shower-bath-plan body (shower-bath.md:25-29) has no recess.
 * @evidence spaces/rooms/shower-bath.md#shower-fixture-use Booth, toilet, vanity, mirror, towel, and their access areas stay as typed room reservations.
 * @evidenceReview spaces/rooms/shower-bath.md#shower-fixture-use #3a48d97 v-141 shower-bath.ts:48-62: booth [0.9,2.15]x[-8.8,-7.7] h2.1; booth-wait; toilet [2.32,2.97]x[-8.8,-8.05] .82; toilet-use; vanity [2.52,3.07]x[-6.8,-6.1] .85; vanity-use; towel [2.2,2.45] proj .08; mirror on X=3.07 wall 1.10-1.90 proj .04. shower-bath.md:55-61 match.
 * @evidence principles/core/source-units.md#source-scope-preservation The function builds tile finishes and two allocated walls while leaving glass and plumbing fixtures to models.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Parts: tile roomFloor/doorFloor, roomCeiling, shower-hall-partition and shower-primary-partition (shower-bath.ts:77-109). No fixture parts; reservations only.
 * @evidence principles/core/source-units.md#source-substantive-completion It returns room surfaces, under-door finish, the cut hall wall, and the recessed primary wall solid.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 roomFloor, roomCeiling, doorFloor, shower-hall-partition with hole, and the blindRecessWall part (shower-bath.ts:77-109).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-bath-plan gives one hall-shower-door with no primary-bedroom door, and shower-fixture-use fixes a blind niche plus booth, basin, and toilet use areas inside the bathroom.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 shower-bath.md:27 one hall-shower-door, '주침실에 출입문을 추가하지 않는다'; :57-61 booth wait, toilet use, vanity (basin) use, blind niche. Host shower-bath.ts:30-35, reservations :46-63, niche wall :95-107.
 */
export const buildShowerBath = (): IRoomBuild => ({
  space: SHOWER_BATH,
  parts: [
    roomFloor(SHOWER_BATH),
    roomCeiling(SHOWER_BATH),
    doorFloor(
      SHOWER_BATH,
      "hall-shower-door",
      [DOOR_HALL_SHOWER_DOOR.from, DOOR_HALL_SHOWER_DOOR.to],
      [-6.06, -5.985],
    ),
    partition({
      id: "shower-hall-partition",
      owner: SHOWER_BATH.owner,
      storey: "upper-storey",
      axis: "x",
      across: [-6.06, -5.91],
      along: [0.9, 3.22],
      holes: [DOOR_HALL_SHOWER_DOOR],
    }),
    part(
      "shower-primary-partition",
      SHOWER_BATH.owner,
      "partition",
      PALETTE.interiorWall,
      blindRecessWall({
        wallX: [0.75, 0.9],
        wallY: [STOREYS.upperFloor, STOREYS.upperCeiling],
        wallZ: [-8.95, -6.06],
        openingY: [STOREYS.upperFloor + 1.10, STOREYS.upperFloor + 1.50],
        openingZ: [-8.55, -8.15],
        depth: 0.08,
      }),
    ),
  ],
});
