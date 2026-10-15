import type { Height } from "../Height";
import type { Point } from "../Point";


export type Solid = (
  id: string,
  plan: Point[],
  low: Height,
  high: Height,
  material?: string,
  holes?: Point[][],
  blind?: Height
) => string;
