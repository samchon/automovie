import { Point } from "./Point";

/**
 * One emitted triangle with its owning element, part and bounds, as the address and visibility
 * censuses ray-cast against.
 */
export interface Triangle {
  /** First vertex. */
  a: Point;
  /** Second vertex. */
  b: Point;
  /** Third vertex. */
  c: Point;
  /** Element the triangle belongs to. */
  element: string;
  /** Model part, which is its surface identity for surface models. */
  part: string;
  /** Lowest vertex height. */
  minY: number;
  /** Highest vertex height. */
  maxY: number;
  /** Smallest vertex x. */
  minX: number;
  /** Largest vertex x. */
  maxX: number;
  /** Smallest vertex z. */
  minZ: number;
  /** Largest vertex z. */
  maxZ: number;
}
