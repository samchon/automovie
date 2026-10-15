import { IPoint } from "./IPoint";

/** Difference `a - b` of two points as vectors. */
export const sub = (a: IPoint, b: IPoint): IPoint => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});
