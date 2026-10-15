import type { Height } from "../Height";
import type { Point } from "../Point";


/**
 * Builder of one roof solid extruded from a plan polygon between two height functions, with
 * optional through holes or blind holes ending at `blind`; returns its element id.
 */
export type Solid = (
  id: string,
  plan: Point[],
  low: Height,
  high: Height,
  material?: string,
  holes?: Point[][],
  blind?: Height
) => string;
