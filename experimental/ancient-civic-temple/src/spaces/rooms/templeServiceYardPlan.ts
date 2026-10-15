import { templePlan as p } from "../templePlan";

export const templeServiceYardPlan = {
  west: p.eastRoom, east: p.eastInner, north: p.northInner, south: p.yardFront,
} as const;
