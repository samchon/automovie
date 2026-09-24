/**
 * `kitchen-dining-family`: the one continuous rear common room.
 *
 * Design owner: `docs/spaces/rooms/common.md#common-room-plan`. Finished inner
 * X = [-5.50, 5.50], Z = [-10.45, -6.20] m. 07 assigns this owner the front
 * partition Z = [-6.20, -6.05] facing living-room, service-access and pantry,
 * with two doorless openings of head 2.40 m: `living-common-opening`
 * X = [-5.00, -2.15] and `service-common-opening` X = [-1.35, 3.07]; the part
 * behind the pantry, X = [3.22, 5.50], stays closed.
 *
 * Output: the room record, its wood floor finish and the front partition.
 */
import { PALETTE } from "../palette";
import { type IRoomBuild, type IRoomSpace, box, door, partition, roomFloor } from "./shared";

const COMMON: IRoomSpace = {
  id: "kitchen-dining-family",
  owner: "rooms/common.ts",
  storey: "ground-storey",
  outline: box([-5.5, 5.5], [-10.45, -6.2]),
  floor: PALETTE.woodFloor,
};

/** Emit the common room floor and its front partition with two open voids. */
export const buildCommon = (): IRoomBuild => ({
  space: COMMON,
  parts: [
    roomFloor(COMMON),
    partition({
      id: "common-front-partition",
      owner: COMMON.owner,
      storey: "ground-storey",
      axis: "x",
      across: [-6.2, -6.05],
      along: [-5.5, 5.5],
      holes: [
        door("living-common-opening", "ground-storey", -5.0, -2.15, 2.4),
        door("service-common-opening", "ground-storey", -1.35, 3.07, 2.4),
      ],
    }),
  ],
});
