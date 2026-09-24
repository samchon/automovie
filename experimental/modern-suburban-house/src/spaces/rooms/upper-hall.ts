/**
 * `upper-hall`: the one L-shaped upper-storey corridor and its linen closet.
 *
 * Design owner: `docs/spaces/rooms/upper-hall.md` (`upper-hall-plan`,
 * `upper-linen-storage`). The arrival part X = [1.87, 3.07], Z = [-4.71, -3.41]
 * joins the cross part X = [-3.20, 3.07], Z = [-5.91, -4.71] m. The linen
 * reservation including its side and back partitions is X = [1.72, 3.22],
 * Z = [-3.26, -2.51] m, reached through the 0.15 m band Z = [-3.41, -3.26] that
 * carries its sliding doors; in this blocking pass the closet and that band are
 * one closed volume, and the sliding leaves are later models.
 */
import { PALETTE } from "../palette";
import { block, part } from "../solids";
import { type IRoomBuild, type IRoomSpace, partitionSpan, roomFloor } from "./shared";

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

/** Emit the hall floor and the closed linen volume. */
export const buildUpperHall = (): IRoomBuild => {
  const [bottom, top] = partitionSpan("upper-storey");
  return {
    space: UPPER_HALL,
    parts: [
      roomFloor(UPPER_HALL),
      part("upper-linen-storage", UPPER_HALL.owner, "partition", PALETTE.interiorWall, block([1.72, bottom, -3.41], [3.22, top, -2.51])),
    ],
  };
};
