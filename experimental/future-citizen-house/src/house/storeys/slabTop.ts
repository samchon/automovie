
import { datum } from "../datum";
import { finishDepth } from "./finishDepth";

/** Top of a storey's structural slab: its finished floor height less the floor finish depth. */
export const slabTop = (level: 0 | 1): number =>
  datum.floors[level] - finishDepth;
