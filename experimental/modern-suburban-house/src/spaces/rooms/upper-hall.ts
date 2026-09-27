/**
 * `upper-hall`: the one L-shaped upper-storey corridor and its linen closet.
 *
 * Design owner: `docs/spaces/rooms/upper-hall.md` (`upper-hall-plan`,
 * `upper-linen-storage`). The arrival part X = [1.87, 3.07], Z = [-4.71, -3.41]
 * joins the cross part X = [-3.20, 3.07], Z = [-5.91, -4.71] m. The linen
 * closet keeps a hollow interior X = [1.87, 3.07], Z = [-3.26, -2.66], 2.20 m
 * high from the upper floor, inside 0.15 m side and back partitions
 * (reservation X = [1.72, 3.22], Z = [-3.26, -2.51]). The hall-side boundary
 * Z = [-3.41, -3.26] is cut by `upper-linen-opening` X = [1.97, 2.97] from the
 * floor to 2.20 m; the closet is closed above its 2.20 m interior. Shelves,
 * sliding leaves and their rails are later fit-out and are not emitted.
 */
import { DOOR_HALL_TUB_DOOR } from "./tub-bath";
import { DOOR_HALL_BEDROOM_THREE_DOOR } from "./bedroom-three";
import { DOOR_HALL_BEDROOM_TWO_DOOR } from "./bedroom-two";
import { DOOR_HALL_PRIMARY_DOOR } from "./primary";
import { DOOR_HALL_SHOWER_DOOR } from "./shower-bath";
import { PALETTE } from "../palette";
import { MAIN } from "../building";
import { block } from "../solids";
import { part } from "../solid-records";
import { STOREYS } from "../storeys";
import { STAIR_OPENING } from "../stair";
import {
  door,
  doorFloor,
  partition,
  partitionSpan,
  roomCeiling,
  roomFloor,
  type IRoomBuild,
  type IRoomSpace,
} from "./shared";

const UPPER_HALL: IRoomSpace = {
  id: "upper-hall",
  owner: "rooms/upper-hall.ts",
  storey: "upper-storey",
  outline: [
    { x: STAIR_OPENING.east, z: STAIR_OPENING.turnZ },
    { x: 3.07, z: STAIR_OPENING.turnZ },
    { x: 3.07, z: -5.91 },
    { x: -3.2, z: -5.91 },
    { x: -3.2, z: STAIR_OPENING.guardBack },
    { x: STAIR_OPENING.east, z: STAIR_OPENING.guardBack },
  ],
  floor: PALETTE.carpet,
};

/** Linen closet interior height above the upper floor. */
const LINEN_HEIGHT = 2.2;

/** Emit the hall finishes, its shares under the five room doors and the linen closet boundaries around its hollow interior. */
/**
 * @evidence spaces/rooms/upper-hall.md This builder forms one L-shaped upper corridor and its hollow linen storage.
 * @evidenceReview spaces/rooms/upper-hall.md #43dab97 v-141 L outline (upper-hall.ts:39-46) = upper-hall.md:27 arrival plus cross part. Storage upper-linen-storage and the linen shell parts (upper-hall.ts:68-151); the interior is left empty (upper-hall.md:57).
 * @evidence spaces/rooms/upper-hall.md#upper-hall-plan The joined arrival and cross bands retain floor shares below five direct room doors.
 * @evidenceReview spaces/rooms/upper-hall.md#upper-hall-plan #d1275b5 v-141 Five doorFloors (upper-hall.ts:79-108) use DOOR_ constants imported from bedroom-two/three, primary, shower and tub (upper-hall.ts:14-18); upper-hall.md:27 bands, :29 five direct room doors.
 * @evidence spaces/rooms/upper-hall.md#upper-linen-storage Four closet walls, a door opening, and an upper head enclose the 2.20 m storage volume.
 * @evidenceReview spaces/rooms/upper-hall.md#upper-linen-storage #4925048 v-141 upper-linen-front with upper-linen-opening X[1.97,2.97] up to 2.20, side-west, side-east, back, and upper-linen-head from +2.20 to the ceiling (upper-hall.ts:109-151); storage y upper+2.20 (upper-hall.ts:72); upper-hall.md:57,59.
 * @evidence principles/core/source-units.md#source-scope-preservation The hall does not create bedroom or bathroom partition bodies, and leaves linen shelves/leaves to models.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Only the linen partitions and head are emitted (upper-hall.ts:109-151). The linen perimeter is hall-owned (07:45; upper-hall.md:59). No shelves or leaves are emitted.
 * @evidence principles/core/source-units.md#source-substantive-completion The room, storage record, finish planes, five strips, and closed closet shell are built in a fixed order.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Returns space, storages[1], roomFloor, roomCeiling, 5 doorFloors, 4 linen partitions and the head in a fixed literal array (upper-hall.ts:66-153).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Upper-hall-plan joins its two corridor bands to five room doors, while upper-linen-storage sets the hall closet top; buildUpperHall keeps those contacts in one hall space.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 upper-hall.md:27 arrival and cross parts joined as one L; :29 five room doors; :57 linen interior height 2.20 m. Host outline upper-hall.ts:39-46, five doorFloor shares :79-108, LINEN_HEIGHT 2.2 :51,72.
 */
export const buildUpperHall = (): IRoomBuild => {
  const owner = UPPER_HALL.owner;
  const storey = UPPER_HALL.storey;
  const [, top] = partitionSpan(storey);
  return {
    space: UPPER_HALL,
    storages: [
      {
        id: "upper-linen-storage",
        x: [STAIR_OPENING.east, 3.07],
        y: [STOREYS.upperFloor, STOREYS.upperFloor + LINEN_HEIGHT],
        z: [-3.26, -2.66],
      },
    ],
    parts: [
      roomFloor(UPPER_HALL),
      roomCeiling(UPPER_HALL),
      doorFloor(
        UPPER_HALL,
        "hall-bedroom-two-door",
        [DOOR_HALL_BEDROOM_TWO_DOOR.from, DOOR_HALL_BEDROOM_TWO_DOOR.to],
        [STAIR_OPENING.guardBack, -4.635],
      ),
      doorFloor(
        UPPER_HALL,
        "hall-bedroom-three-door",
        [3.07, 3.145],
        [DOOR_HALL_BEDROOM_THREE_DOOR.from, DOOR_HALL_BEDROOM_THREE_DOOR.to],
      ),
      doorFloor(
        UPPER_HALL,
        "hall-primary-door",
        [DOOR_HALL_PRIMARY_DOOR.from, DOOR_HALL_PRIMARY_DOOR.to],
        [-5.985, -5.91],
      ),
      doorFloor(
        UPPER_HALL,
        "hall-shower-door",
        [DOOR_HALL_SHOWER_DOOR.from, DOOR_HALL_SHOWER_DOOR.to],
        [-5.985, -5.91],
      ),
      doorFloor(
        UPPER_HALL,
        "hall-tub-door",
        [3.07, 3.145],
        [DOOR_HALL_TUB_DOOR.from, DOOR_HALL_TUB_DOOR.to],
      ),
      partition({
        id: "upper-linen-front",
        owner,
        storey,
        axis: "x",
        across: [STAIR_OPENING.turnZ, -3.26],
        along: [STAIR_OPENING.east - MAIN.partition, 3.22],
        holes: [door("upper-linen-opening", storey, 1.97, 2.97, LINEN_HEIGHT)],
      }),
      partition({
        id: "upper-linen-side-west",
        owner,
        storey,
        axis: "z",
        across: [STAIR_OPENING.east - MAIN.partition, STAIR_OPENING.east],
        along: [-3.26, -2.51],
      }),
      partition({
        id: "upper-linen-side-east",
        owner,
        storey,
        axis: "z",
        across: [3.07, 3.22],
        along: [-3.26, -2.51],
      }),
      partition({
        id: "upper-linen-back",
        owner,
        storey,
        axis: "x",
        across: [-2.66, -2.51],
        along: [STAIR_OPENING.east, 3.07],
      }),
      part(
        "upper-linen-head",
        owner,
        "partition",
        PALETTE.interiorWall,
        block(
          [STAIR_OPENING.east, STOREYS.upperFloor + LINEN_HEIGHT, -3.26],
          [3.07, top, -2.66],
        ),
      ),
    ],
  };
};
