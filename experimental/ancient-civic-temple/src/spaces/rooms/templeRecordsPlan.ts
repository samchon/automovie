import { templePlan as p } from "../templePlan";

/** Plan rectangle of the records room. */
export const templeRecordsPlan = {
  west: p.eastRoom, east: p.eastInner, north: p.recordsBack, south: p.recordsFront,
} as const;
