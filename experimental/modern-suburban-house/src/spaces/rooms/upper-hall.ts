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
import { PALETTE } from "../palette";
import { block, part } from "../solids";
import { STOREYS } from "../storeys";
import { type IRoomBuild, type IRoomSpace, door, doorFloor, partition, partitionSpan, roomCeiling, roomFloor } from "./shared";

const UPPER_HALL: IRoomSpace = {
  id: "upper-hall",
  owner: "rooms/upper-hall.ts",
  storey: "upper-storey",
  outline: [
    { x: 1.87, z: -3.41 },
    { x: 3.07, z: -3.41 },
    { x: 3.07, z: -5.91 },
    { x: -3.2, z: -5.91 },
    { x: -3.2, z: -4.71 },
    { x: 1.87, z: -4.71 },
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
  return {
    space: UPPER_HALL,
    parts: [
      roomFloor(UPPER_HALL),
      roomCeiling(UPPER_HALL),
      doorFloor(UPPER_HALL, "hall-bedroom-two-door", [-3.1, -2.1], [-4.71, -4.635]),
      doorFloor(UPPER_HALL, "hall-bedroom-three-door", [3.07, 3.145], [-4.46, -3.51]),
      doorFloor(UPPER_HALL, "hall-primary-door", [-2.7, -1.7], [-5.985, -5.91]),
      doorFloor(UPPER_HALL, "hall-shower-door", [1.05, 2.05], [-5.985, -5.91]),
      doorFloor(UPPER_HALL, "hall-tub-door", [3.07, 3.145], [-5.86, -4.86]),
      partition({
        id: "upper-linen-front",
        owner,
        storey,
        axis: "x",
        across: [-3.41, -3.26],
        along: [1.72, 3.22],
        holes: [door("upper-linen-opening", storey, 1.97, 2.97, LINEN_HEIGHT)],
      }),
      partition({ id: "upper-linen-side-west", owner, storey, axis: "z", across: [1.72, 1.87], along: [-3.26, -2.51] }),
      partition({ id: "upper-linen-side-east", owner, storey, axis: "z", across: [3.07, 3.22], along: [-3.26, -2.51] }),
      partition({ id: "upper-linen-back", owner, storey, axis: "x", across: [-2.66, -2.51], along: [1.87, 3.07] }),
      part("upper-linen-head", owner, "partition", PALETTE.interiorWall, block([1.87, STOREYS.upperFloor + LINEN_HEIGHT, -3.26], [3.07, top, -2.66])),
    ],
  };
};
