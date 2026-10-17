import type { V3 } from "../geometry/V3.ts";

/**
 * Finds the largest signed (Z,Y) chord distance toward a declared direction.
 *
 * @evidence contracts/common.md#principled-implementation Projection onto the oriented unit chord normal gives physical signed prominence in the midsagittal plane; coincident endpoints fail.
 * @evidence contracts/common.md#clear-and-simple-design One bounded profile-range scan owns selection and the signed-distance calculation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The operation uses declared source endpoints and a direction hint without identity-specific positions or invented degenerate normals.
 * @evidence contracts/common.md#meaningful-documentation States the plane, sign convention and returned source index; the error names the distinct-endpoint requirement.
 * @evidence contracts/performance.md#efficient-algorithms One inclusive scan of K source points takes O(K) time and constant auxiliary storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure geometric selection coordinates no requests or effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a two-number result is returned; no external resources or growing caches are retained.
 */
export function farthest(
  points: V3[],
  first: number,
  last: number,
  hint: [number, number],
): { i: number; d: number } {
  const a: V3 = points[first];
  const b: V3 = points[last];
  const dz: number = b[2] - a[2];
  const dy: number = b[1] - a[1];
  const length: number = Math.hypot(dz, dy);
  if (!length)
    throw new Error(
      "A geometric prominence chord requires distinct endpoints.",
    );
  let nz: number = -dy / length;
  let ny: number = dz / length;
  if (nz * hint[0] + ny * hint[1] < 0) {
    nz = -nz;
    ny = -ny;
  }
  let bestIndex: number = first;
  let bestDistance: number = -Infinity;
  for (let i: number = Math.min(first, last); i <= Math.max(first, last); i++) {
    const distance: number =
      (points[i][2] - a[2]) * nz + (points[i][1] - a[1]) * ny;
    if (distance > bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return { i: bestIndex, d: bestDistance };
}
