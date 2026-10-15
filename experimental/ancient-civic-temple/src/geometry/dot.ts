import { Point } from "./Point";


/** Dot product of two vectors. */
export const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y + a.z * b.z;
