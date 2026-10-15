import type { PlanPoint } from "./PlanPoint";

/** XZ area (m²) of a CCW polygon. The coverage check is not a camera or visual judgment. */

export const area = (polygon: readonly PlanPoint[]): number => polygon.reduce((sum, a, i) => {
  const b = polygon[(i + 1) % polygon.length]!;
  return sum + a.x * b.z - b.x * a.z;
}, 0) / 2;
