import type { PlanPoint } from "./PlanPoint";
import type { PlanRectangle } from "./PlanRectangle";

const eps = 1e-7;
export const inside = (r: PlanRectangle, p: PlanPoint) => p.x > r.west + eps && p.x < r.east - eps && p.z > r.north + eps && p.z < r.south - eps;
