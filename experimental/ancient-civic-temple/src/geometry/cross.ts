import { p } from "./p";
import { Point } from "./Point";


/** Cross product of two vectors. */
export const cross = (a: Point, b: Point) => p(
  a.y * b.z - a.z * b.y,
  a.z * b.x - a.x * b.z,
  a.x * b.y - a.y * b.x
);
