import type { PlanPoint } from "./PlanPoint";

/** Underside classification regions, consumed in order; what remains is soffit. Surfaces are per roof owner. */

export interface UndersideRegion {
  /** Convex plan region whose roof underside takes this classification. */
  polygon: PlanPoint[];
  /** Surface identity of the underside within the region for a given roof owner. */
  surface: (owner: string) => string;
}
