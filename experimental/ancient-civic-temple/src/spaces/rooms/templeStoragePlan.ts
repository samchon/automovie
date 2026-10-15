import { templePlan as p } from "../templePlan";

/** Plan rectangle of the storage room. */
export const templeStoragePlan = {
  west: p.eastRoom, east: p.eastInner, north: p.storageBack, south: p.storageFront,
} as const;
