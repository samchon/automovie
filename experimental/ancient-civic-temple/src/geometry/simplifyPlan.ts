import { PlanPoint } from "./PlanPoint";

/**
 * Cleans pieces to emit as faces: removes duplicate points within 0.1mm and collinear points,
 * and returns an empty array for pieces under 1mm². Shape end lines are not moved.
 */

export const simplifyPlan = (points: readonly PlanPoint[]): PlanPoint[] => {
  let ring = points.filter((p, i) => {
    const next = points[(i + 1) % points.length]!;
    return Math.hypot(p.x - next.x, p.z - next.z) > 1e-4;
  });
  let changed = true;
  while (changed && ring.length >= 3) {
    changed = false;
    for (let i = 0; i < ring.length; ++i) {
      const a = ring[(i + ring.length - 1) % ring.length]!;
      const b = ring[i]!;
      const c = ring[(i + 1) % ring.length]!;
      const cross = (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
      if (Math.abs(cross) < 1e-8) {
        ring = ring.filter((_, j) => j !== i);
        changed = true;
        break;
      }
    }
  }
  if (ring.length < 3) return [];
  const doubleArea = ring.reduce((sum, p, i) => {
    const next = ring[(i + 1) % ring.length]!;
    return sum + p.x * next.z - next.x * p.z;
  }, 0);
  return doubleArea > 2e-6 ? ring : [];
};
