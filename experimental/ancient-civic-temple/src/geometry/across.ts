import type { PlanPoint } from "./PlanPoint";


export const across = (axis: "x" | "z", p: PlanPoint): number => axis === "x" ? p.z : p.x;
