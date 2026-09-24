/**
 * `living-room`: the ground-storey front-left room.
 *
 * Design owner: `docs/spaces/rooms/living.md#living-plan`. Finished inner
 * X = [-5.50, -1.95], Z = [-6.05, -0.25] m. 07 assigns this owner the partition
 * body X = [-1.95, -1.80] on the entry side and on the service side outside
 * the stair (the stair's own wall between them belongs to `stair.ts`). The
 * `entry-living-door` void is Z = [-1.35, -0.35], Y = [0, 2.20] m in that wall.
 *
 * Output: the room record, its wood floor finish and its two partition runs.
 */
import { PALETTE } from "../palette";
import type { IHousePart } from "../solids";
import { type IRoomSpace, box, door, partition, roomFloor } from "./shared";

export const LIVING: IRoomSpace = {
  id: "living-room",
  owner: "rooms/living.ts",
  storey: "ground-storey",
  outline: box([-5.5, -1.95], [-6.05, -0.25]),
  floor: PALETTE.woodFloor,
};

/** Emit the living floor and the partitions 07 gives this owner. */
export const buildLiving = (): IHousePart[] => [
  roomFloor(LIVING),
  partition({
    id: "living-entry-partition",
    owner: LIVING.owner,
    storey: "ground-storey",
    axis: "z",
    across: [-1.95, -1.8],
    along: [-1.45, -0.25],
    holes: [door("entry-living-door", "ground-storey", -1.35, -0.35)],
  }),
  partition({
    id: "living-service-partition",
    owner: LIVING.owner,
    storey: "ground-storey",
    axis: "z",
    across: [-1.95, -1.8],
    along: [-6.05, -4.71],
  }),
];
