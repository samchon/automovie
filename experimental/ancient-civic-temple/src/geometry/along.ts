import type { PlanPoint } from "./PlanPoint";


/** Plan coordinate along a wall running along `axis`. */
export const along = (axis: "x" | "z", p: PlanPoint): number => axis === "x" ? p.x : p.z;
