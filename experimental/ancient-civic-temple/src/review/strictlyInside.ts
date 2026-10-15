import type { PlanPoint } from "../geometry/PlanPoint";


/**
 * Whether a plan point lies inside a counter-clockwise convex polygon by more than `margin` from
 * every edge.
 */
export const strictlyInside = (polygon: readonly PlanPoint[], p: PlanPoint, margin: number): boolean => polygon.every((a, i) => {
  const b = polygon[(i + 1) % polygon.length]!;
  const length = Math.hypot(b.x - a.x, b.z - a.z);
  return ((b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x)) / length > margin;
});
