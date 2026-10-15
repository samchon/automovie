import { p } from "./p";
import { Point } from "./Point";


/** Difference `a - b` of two vectors. */
export const sub = (a: Point, b: Point) => p(a.x - b.x, a.y - b.y, a.z - b.z);
