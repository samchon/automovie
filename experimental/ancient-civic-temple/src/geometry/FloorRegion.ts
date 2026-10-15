import type { PlanRectangle } from "./PlanRectangle";


/** A plan rectangle of floor at one finished height. */
export interface FloorRegion extends PlanRectangle {
  /** Region identity. */
  id: string;
  /** Finished floor height in world metres. */
  floor: number;
}
