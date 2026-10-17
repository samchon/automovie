import type { V3 } from "../geometry/V3.ts";
import { cross } from "../geometry/cross.ts";
import { norm } from "../geometry/norm.ts";
import { sub } from "../geometry/sub.ts";

/**
 * Returns a source triangle's winding normal, without interpreting its outward orientation.
 *
 * @evidence contracts/common.md#principled-implementation Normalizes the cross product of two edges in the supplied triangle's declared order.
 * @evidence contracts/common.md#clear-and-simple-design Owns local triangle orientation; global outwardness and source defects remain the consumer's responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not flip selected identities or infer outwardness from a preferred view.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes winding normal from a certified outward or anatomical normal.
 * @evidence contracts/performance.md#efficient-algorithms Reads three vertices and performs constant scalar work independent of mesh size.
 * @evidence contracts/performance.md#reuse-equivalent-work No triangle or normal cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new vector without retaining source data or handles.
 */
export function triNormal(
  surface: { vertices: V3[]; triangles: number[][] },
  index: number,
): V3 {
  const triangle: number[] = surface.triangles[index];
  return norm(
    cross(
      sub(surface.vertices[triangle[1]], surface.vertices[triangle[0]]),
      sub(surface.vertices[triangle[2]], surface.vertices[triangle[0]]),
    ),
  );
}
