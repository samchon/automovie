import { templePlan as p } from "../templePlan";

/** Plan rectangle of the administration room. */
export const templeAdministrationPlan = {
  west: p.eastRoom, east: p.eastInner, north: p.officeBack, south: p.southInner,
} as const;
