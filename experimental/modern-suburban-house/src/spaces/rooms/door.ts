import type { IWallHole } from "../../types/IWallHole";
import { floorOf } from "../floorOf";
import { type StoreyId } from "../StoreyId";

/**
 * A door void of standard head 2.20 m above the storey floor.
 */

export const door = (id: string, storey: StoreyId, from: number, to: number, head = 2.2): IWallHole => ({
  id,
  from,
  to,
  bottom: floorOf(storey),
  top: floorOf(storey) + head,
});
