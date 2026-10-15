import { datum } from "../datum";


/**
 * Sill and head of a full-height window on a storey: 0.12 m above its floor and 0.1 m below its
 * ceiling.
 */
export const standardWindowHeight = (level: 0 | 1) => ({
  sill: datum.floors[level] + 0.12,
  head: datum.ceilings[level] - 0.1,
});
