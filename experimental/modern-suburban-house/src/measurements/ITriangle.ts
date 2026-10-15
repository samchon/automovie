import { IPoint } from "./IPoint";



/** One triangle with its plan bounds. */
export interface ITriangle {
  /** First vertex. */
  a: IPoint;
  /** Second vertex. */
  b: IPoint;
  /** Third vertex. */
  c: IPoint;
  /** World x range of the triangle. */
  x: readonly [number, number];
  /** World z range of the triangle. */
  z: readonly [number, number];
}
