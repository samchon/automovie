import type { IPlanPoint } from "../types/IPlanPoint";

/**
 * Plan rectangle helper for caller-supplied X and Z extents.
 */

export const rect = (x: readonly [number, number], z: readonly [number, number]): IPlanPoint[] => [
  { x: x[0], z: z[0] },
  { x: x[1], z: z[0] },
  { x: x[1], z: z[1] },
  { x: x[0], z: z[1] },
];
