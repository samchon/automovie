import type { HeightPlane } from "./HeightPlane";
import type { PlanRectangle } from "./PlanRectangle";

/** One cell of a grid union: the solid between bottom and top planes over a plan rectangle. */

export interface TrimCell {
  /** Plan rectangle of the cell. */
  rect: PlanRectangle;
  /** Height field of the cell's underside. */
  bottom: HeightPlane;
  /** Height field of the cell's top. */
  top: HeightPlane;
  /** Surface identity of the cell's exposed faces. */
  surface: string;
  /** Wall owner the trim belongs to. */
  owner: string;
  /** Whether the coping cell's underside rests on the wall's bearing face and is hidden. */
  onBed: boolean;
}
