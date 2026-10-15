import { ceilingOf } from "../ceilingOf";
import { floorOf } from "../floorOf";
import { IRoomSpace } from "./IRoomSpace";

/**
 * Finished floor and ceiling heights of a room.
 */

export const roomLevels = (room: IRoomSpace): readonly [number, number] => room.levels ?? [floorOf(room.storey), ceilingOf(room.storey)];
