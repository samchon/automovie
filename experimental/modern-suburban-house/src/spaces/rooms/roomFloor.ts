import type { IHousePart } from "../../types/IHousePart";
import { part } from "../part";
import { slab } from "../slab";
import { floorOf } from "../floorOf";
import { IRoomSpace } from "./IRoomSpace";
import { finishDepth } from "./finishDepth";

/**
 * Floor finish of one room zone: the main outline or a caller-owned storage inset over the same top finish layer.
 */

export const roomFloor = (room: IRoomSpace, zone: Pick<IRoomSpace, "id" | "outline"> = room): IHousePart => {
  const top = floorOf(room.storey);
  return part(
    `${zone.id}-floor`,
    room.owner,
    "floor",
    room.floor,
    slab({ outline: zone.outline, bottom: top - finishDepth(room.storey), top })
  );
};
