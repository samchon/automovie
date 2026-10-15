import type { PlanPoint } from "./PlanPoint";
import type { PlanRectangle } from "./PlanRectangle";

const eps = 1e-7;
/**
 * Whether a plan point lies strictly inside a rectangle, at least the numeric epsilon from every
 * edge.
 */
export const inside = (r: PlanRectangle, p: PlanPoint) => p.x > r.west + eps && p.x < r.east - eps && p.z > r.north + eps && p.z < r.south - eps;
