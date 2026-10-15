import { roomFloorInput } from "../../geometry/roomFloorInput";
import { templePlan as p } from "../templePlan";
import { templeLevels as y } from "../templeLevels";
import { templeDoorPassages } from "../templeDoorPassages";
import { templeEntranceFloors } from "./templeEntranceFloors";

/**
 * Returns actual step heights, side column supports and the recessed-wall threshold together.
 * Compartments touching site ground at south-outer extend structure to the common exterior-wall bottom.
 */

export const templeEntranceFloor = (exteriorBottom: number | null) => {
  const input = roomFloorInput("entrance", templeEntranceFloors(), templeDoorPassages, y.slabThickness, y.floor);
  if (exteriorBottom === null) return input;
  return {
    ...input,
    slabs: input.slabs.map((slab) => slab.south === p.southOuter
      ? { ...slab, bottom: Math.min(slab.bottom, exteriorBottom) } : slab),
  };
};
