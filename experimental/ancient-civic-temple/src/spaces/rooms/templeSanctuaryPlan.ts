import { templePlan as p } from "../templePlan";

/** Plan rectangle of the sanctuary. */
export const templeSanctuaryPlan = {
  west: p.westRing, east: p.eastRing, north: p.northInner, south: p.sanctuaryFront,
} as const;
