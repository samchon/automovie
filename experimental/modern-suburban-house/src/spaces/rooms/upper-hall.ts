
import { DOOR_HALL_TUB_DOOR } from "./tub-bath";
import { DOOR_HALL_BEDROOM_THREE_DOOR } from "./bedroom-three";
import { DOOR_HALL_BEDROOM_TWO_DOOR } from "./bedroom-two";
import { DOOR_HALL_PRIMARY_DOOR } from "./primary";
import { DOOR_HALL_SHOWER_DOOR } from "./shower-bath";
import { PALETTE } from "../palette";
import { MAIN } from "../building";
import { block } from "../solids";
import { part } from "../part";
import { STOREYS } from "../storeys";
import { STAIR_OPENING } from "../stair";
import {
  box,
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
export const buildUpperHall = (): IRoomBuild => {
  const owner = UPPER_HALL.owner;
  const storey = UPPER_HALL.storey;
  const [, top] = partitionSpan(storey);
  const linenStorage = {
    id: "upper-linen-storage",
    x: [STAIR_OPENING.east, 3.07] as const,
    y: [STOREYS.upperFloor, STOREYS.upperFloor + LINEN_HEIGHT] as const,
    z: [-3.26, -2.66] as const,
  };
  return {
    space: UPPER_HALL,
    storages: [linenStorage],
    parts: [
      roomFloor(UPPER_HALL),
      roomFloor(UPPER_HALL, {
        id: linenStorage.id,
        outline: box(linenStorage.x, linenStorage.z),
      }),
      doorFloor(
        UPPER_HALL,
        "upper-linen-opening",
        [1.97, 2.97],
        [STAIR_OPENING.turnZ, linenStorage.z[0]],
      ),
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
