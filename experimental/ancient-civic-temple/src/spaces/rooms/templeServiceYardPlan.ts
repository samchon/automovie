import { templePlan as p } from "../templePlan";

/** Plan rectangle of the open service yard. */
export const templeServiceYardPlan = {
  west: p.eastRoom, east: p.eastInner, north: p.northInner, south: p.yardFront,
} as const;
