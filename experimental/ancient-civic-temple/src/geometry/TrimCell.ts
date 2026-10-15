import type { HeightPlane } from "./HeightPlane";
import type { PlanRectangle } from "./PlanRectangle";

/** One cell of a grid union: the solid between bottom and top planes over a plan rectangle. */

export interface TrimCell {
  rect: PlanRectangle;
  bottom: HeightPlane;
  top: HeightPlane;
  surface: string;
  owner: string;
  /** Whether the coping cell's underside rests on the wall's bearing face and is hidden. */
  onBed: boolean;
}
