import type { PlanPoint } from "./PlanPoint";

/** Underside classification regions, consumed in order; what remains is soffit. Surfaces are per roof owner. */

export interface UndersideRegion {
  polygon: PlanPoint[];
  surface: (owner: string) => string;
}
