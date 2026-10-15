
import { DOOR_HALL_TUB_DOOR } from "./DOOR_HALL_TUB_DOOR";
import { DOOR_HALL_BEDROOM_THREE_DOOR } from "./DOOR_HALL_BEDROOM_THREE_DOOR";
import { DOOR_HALL_BEDROOM_TWO_DOOR } from "./DOOR_HALL_BEDROOM_TWO_DOOR";
import { DOOR_HALL_PRIMARY_DOOR } from "./DOOR_HALL_PRIMARY_DOOR";
import { DOOR_HALL_SHOWER_DOOR } from "./DOOR_HALL_SHOWER_DOOR";
import { PALETTE } from "../PALETTE";
import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { block } from "../block";
import { part } from "../part";
import { STOREYS } from "../STOREYS";
import { STAIR_OPENING } from "../STAIR_OPENING";
import {
  type IRoomBuild,
} from "./IRoomBuild";
import { box } from "./box";
import { door } from "./door";
import { partition } from "./partition";
import { partitionSpan } from "./partitionSpan";
import { roomCeiling } from "./roomCeiling";
import { doorFloor } from "./doorFloor";
import { roomFloor } from "./roomFloor";
import { type IRoomSpace } from "./IRoomSpace";

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
        along: [STAIR_OPENING.east - MAIN_OUTLINE.partition, 3.22],
        holes: [door("upper-linen-opening", storey, 1.97, 2.97, LINEN_HEIGHT)],
      }),
      partition({
        id: "upper-linen-side-west",
        owner,
        storey,
        axis: "z",
        across: [STAIR_OPENING.east - MAIN_OUTLINE.partition, STAIR_OPENING.east],
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
