import { templePlan as p } from "../templePlan";

export const templeOfferingPlan = {
  west: p.westInner, east: p.westRoom, north: p.northInner, south: p.southInner,
} as const;
