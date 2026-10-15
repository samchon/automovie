import { IPoint } from "./IPoint";

/** Dot product of two points as vectors. */
export const dot = (a: IPoint, b: IPoint): number => a.x * b.x + a.y * b.y + a.z * b.z;
