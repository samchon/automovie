import type { PlanPoint } from "../geometry/PlanPoint";

/**
 * Rectangular host plans of interior/entrance walls ending at T-junctions, in planar-domain order.
 */

export const templeWallRect = (west: number, east: number, north: number, south: number): PlanPoint[] => [
  { x: west, z: north }, { x: east, z: north }, { x: east, z: south }, { x: west, z: south },
];
