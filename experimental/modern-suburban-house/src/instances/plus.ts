import { Vec } from "./Vec";


/** Sum of two vectors. */
export const plus = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
