import { templePlan as p } from "../templePlan";

export const templeStoragePlan = {
  west: p.eastRoom, east: p.eastInner, north: p.storageBack, south: p.storageFront,
} as const;
