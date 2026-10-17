import { Skin } from "../geometry/Skin.ts";
import { V3 } from "../geometry/V3.ts";
import { add } from "../geometry/add.ts";
import { cross } from "../geometry/cross.ts";
import { dot } from "../geometry/dot.ts";
import { mul } from "../geometry/mul.ts";
import { norm } from "../geometry/norm.ts";
import { sub } from "../geometry/sub.ts";

/**
 * Area-weighted source vertex normal observations; smoothing seams and physical derivatives remain separate judgments.
 *
 * @evidence contracts/common.md#principled-implementation Area-weighted adjacent source faces produce a separate display-normal observation field oriented by signed volume.
 * @evidence contracts/common.md#clear-and-simple-design The field is not a derivative of a fitted reconstruction and smoothing seams require separate comparison.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(vertices + triangles) traversal and O(vertices) output storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated work is reused only inside this operation where source identity is fixed; no cross-call or identity-dependent result cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A new normal array is returned with no persistent cache.
 */
export function sourceNormals(skin: Skin): V3[] {
  const normals: V3[] = skin.vertices.map((): V3 => [0, 0, 0]);
  let volume: number = 0;
  for (const t of skin.triangles) {
    const normal: V3 = cross(
      sub(skin.vertices[t[1]], skin.vertices[t[0]]),
      sub(skin.vertices[t[2]], skin.vertices[t[0]]),
    );
    volume += dot(skin.vertices[t[0]], normal);
    for (const vertex of t) normals[vertex] = add(normals[vertex], normal);
  }
  const outward: number = Math.sign(volume);
  if (!outward)
    throw new Error("Source normal orientation has zero signed volume");
  return normals.map((normal: V3): V3 => mul(norm(normal), outward));
}
