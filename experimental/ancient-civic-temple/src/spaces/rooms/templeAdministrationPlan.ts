import { templePlan as p } from "../templePlan";

export const templeAdministrationPlan = {
  west: p.eastRoom, east: p.eastInner, north: p.officeBack, south: p.southInner,
} as const;
