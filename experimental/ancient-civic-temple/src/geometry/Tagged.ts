import type { PlanRectangle } from "./PlanRectangle";


/** A plan rectangle tagged with the surface it contributes to a grid-cell union. */
export interface Tagged {
  /** Plan rectangle the tag covers. */
  rect: PlanRectangle;
  /** Surface a covered cell takes. */
  surface: string;
  /** Surface owner of the covered cells. */
  owner: string;
  /** Whether this is a wall's own coping core, which wins over projections when tags overlap. */
  core: boolean;
}
