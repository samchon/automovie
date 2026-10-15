import { datum } from "../datum";


export const standardWindowHeight = (level: 0 | 1) => ({
  sill: datum.floors[level] + 0.12,
  head: datum.ceilings[level] - 0.1,
});
