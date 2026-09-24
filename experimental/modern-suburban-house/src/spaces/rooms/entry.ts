/**
 * `front-entry`: the ground-storey L-shaped distribution space.
 *
 * Design owner: `docs/spaces/rooms/entry.md#entry-plan`. Finished inner
 * outline (X, Z): (-1.80, -0.25), (2.02, -0.25), (2.02, -3.41), (-0.50, -3.41),
 * (-0.50, -1.45), (-1.80, -1.45); it includes the stair's lower waiting area
 * X = [-1.80, -0.65], Z = [-1.45, -0.25]. The front door void belongs to the
 * front wall and is cut by `envelope/front.ts`; no partition is assigned to
 * this owner by 07.
 *
 * Output: the room record and its wood floor finish.
 */
import { PALETTE } from "../palette";
import type { IHousePart } from "../solids";
import { type IRoomSpace, roomFloor } from "./shared";

export const ENTRY: IRoomSpace = {
  id: "front-entry",
  owner: "rooms/entry.ts",
  storey: "ground-storey",
  outline: [
    { x: -1.8, z: -0.25 },
    { x: 2.02, z: -0.25 },
    { x: 2.02, z: -3.41 },
    { x: -0.5, z: -3.41 },
    { x: -0.5, z: -1.45 },
    { x: -1.8, z: -1.45 },
  ],
  floor: PALETTE.woodFloor,
};

/** Emit the entry floor finish. */
export const buildEntry = (): IHousePart[] => [roomFloor(ENTRY)];
