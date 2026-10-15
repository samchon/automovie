import type { PlanPoint } from "./PlanPoint";


/** Plan coordinate across a wall running along `axis`. */
export const across = (axis: "x" | "z", p: PlanPoint): number => axis === "x" ? p.z : p.x;
