import { ITriangle } from "./ITriangle";


/** One roof solid's triangles with their bounds, prepared for vertical-line probing. */
export interface ISolid {
  /** Solid identity. */
  id: string;
  /** Triangles of the solid. */
  triangles: ITriangle[];
  /** World x range of the solid. */
  x: readonly [number, number];
  /** Height range of the solid. */
  y: readonly [number, number];
  /** World z range of the solid. */
  z: readonly [number, number];
}
