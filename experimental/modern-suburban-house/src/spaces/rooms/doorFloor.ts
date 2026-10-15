import type { IHousePart } from "../../types/IHousePart";
import { part } from "../part";
import { slab } from "../slab";
import { floorOf } from "../floorOf";
import { IRoomSpace } from "./IRoomSpace";
import { finishDepth } from "./finishDepth";
import { box } from "./box";

/**
 * The room's share of the floor finish under one interior door void: the
 * rectangle from the room's partition face to the partition mid-plane across
 * the door width, in the room's finish layer.
 */

export const doorFloor = (room: IRoomSpace, doorId: string, x: readonly [number, number], z: readonly [number, number]): IHousePart => {
  const top = floorOf(room.storey);
  return part(
    `${room.id}-${doorId}-floor`,
    room.owner,
    "floor",
    room.floor,
    slab({ outline: box(x, z), bottom: top - finishDepth(room.storey), top })
  );
};
