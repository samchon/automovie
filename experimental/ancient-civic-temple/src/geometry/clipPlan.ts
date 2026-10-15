import { HeightPlane } from "./HeightPlane";
import { planeHeight } from "./planeHeight";
import { PlanPoint } from "./PlanPoint";

/** Numeric cancellation limit. End lines are never moved by this amount. */
const epsilon = 1e-9;

/** Clips with the closed half-plane a*x+b*z+c >= 0. An empty result is an empty array. */
export const clipPlan = (
  polygon: readonly PlanPoint[],
  halfPlane: HeightPlane,
): PlanPoint[] => {
  const result: PlanPoint[] = [];
  for (let i = 0; i < polygon.length; ++i) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % polygon.length]!;
    const da = planeHeight(halfPlane, a);
    const db = planeHeight(halfPlane, b);
    if (da >= 0) result.push({ ...a });
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      const t = da / (da - db);
      result.push({ x: a.x + t * (b.x - a.x), z: a.z + t * (b.z - a.z) });
    }
  }
  return cleanPlan(result);
};

/** Removes duplicate end points and zero area, and does not turn an empty region into a triangle. */
const cleanPlan = (points: PlanPoint[]): PlanPoint[] => {
  const result = points.filter((p, i) => {
    const next = points[(i + 1) % points.length]!;
    return Math.hypot(p.x - next.x, p.z - next.z) > epsilon;
  });
  const doubleArea = result.reduce((sum, p, i) => {
    const next = result[(i + 1) % result.length]!;
    return sum + p.x * next.z - next.x * p.z;
  }, 0);
  return doubleArea > epsilon ? result : [];
};
