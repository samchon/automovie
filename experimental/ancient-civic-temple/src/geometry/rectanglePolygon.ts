import { PlanPoint } from "./PlanPoint";
import { PlanRectangle } from "./PlanRectangle";

/** Four CCW corners in XZ. Reversed or zero-area ranges are refused. */

export const rectanglePolygon = (r: PlanRectangle): PlanPoint[] => {
  if (![r.west, r.east, r.north, r.south].every(Number.isFinite) ||
    r.west >= r.east || r.north >= r.south) {
    throw new Error("planar-domain: a rectangle with finite positive area is required.");
  }
  return [
    { x: r.west, z: r.north }, { x: r.east, z: r.north },
    { x: r.east, z: r.south }, { x: r.west, z: r.south },
  ];
};
