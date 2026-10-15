import type { PlanPoint } from "./PlanPoint";


export const along = (axis: "x" | "z", p: PlanPoint): number => axis === "x" ? p.x : p.z;
