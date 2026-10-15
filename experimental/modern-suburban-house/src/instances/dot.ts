import { Vec } from "./Vec";


/** Dot product of two vectors. */
export const dot = (a: Vec, b: Vec): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
