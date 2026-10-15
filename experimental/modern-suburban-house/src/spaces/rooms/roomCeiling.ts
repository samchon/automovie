import type { IHousePart } from "../../types/IHousePart";
import type { IPlanPoint } from "../../types/IPlanPoint";
import { PALETTE } from "../PALETTE";
import { part } from "../part";
import { slab } from "../slab";
import { CEILING_FINISH } from "../CEILING_FINISH";
import { IRoomSpace } from "./IRoomSpace";
import { roomLevels } from "./roomLevels";

/**
 * Visible ceiling finish of one room: its outline over the 0.015 m above its
 * storey's finished ceiling, under the interstorey structure (ground) or the
 * upper ceiling base (upper).
 */

export const roomCeiling = (room: IRoomSpace, outline: readonly IPlanPoint[] = room.outline): IHousePart => {
  const [, bottom] = roomLevels(room);
  return part(
    `${room.id}-ceiling`,
    room.owner,
    "ceiling",
    PALETTE.ceiling,
    slab({ outline, bottom, top: bottom + CEILING_FINISH })
  );
};
