import { Vec } from "./Vec";


/** Difference `a - b` of two vectors. */
export const minus = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
