import { V3 } from "./V3.ts";
import { add } from "./add.ts";
import { cross } from "./cross.ts";
import { dot } from "./dot.ts";
import { mul } from "./mul.ts";
import { sub } from "./sub.ts";

/**
 * Closest Euclidean point through triangle Voronoi regions; a degenerate triangle uses its edge segments.
 *
 * @evidence contracts/common.md#principled-implementation Triangle Voronoi regions locate the Euclidean closest point; degenerate triangles reduce to closest edge segments.
 * @evidence contracts/common.md#clear-and-simple-design One primitive query handles all geometric degeneracies before a BVH uses its distance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic and bounded temporary triples.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a vertex reference or fresh projected point; no state or source cache is retained.
 */
export function closestOnTri(point: V3, a: V3, b: V3, c: V3): V3 {
  const ab: V3 = sub(b, a),
    ac: V3 = sub(c, a),
    ap: V3 = sub(point, a);
  const normal: V3 = cross(ab, ac);
  if (dot(normal, normal) === 0) {
    let best: number = Infinity;
    let result: V3 = a;
    for (const [start, end] of [
      [a, b],
      [b, c],
      [c, a],
    ] as [V3, V3][]) {
      const edge: V3 = sub(end, start);
      const t: number = Math.max(
        0,
        Math.min(1, dot(sub(point, start), edge) / (dot(edge, edge) || 1)),
      );
      const q: V3 = add(start, mul(edge, t));
      const difference: V3 = sub(point, q);
      const distance: number = dot(difference, difference);
      if (distance < best) {
        best = distance;
        result = q;
      }
    }
    return result;
  }
  const d1: number = dot(ab, ap),
    d2: number = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return a;
  const bp: V3 = sub(point, b),
    d3: number = dot(ab, bp),
    d4: number = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return b;
  const vc: number = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) return add(a, mul(ab, d1 / (d1 - d3)));
  const cp: V3 = sub(point, c),
    d5: number = dot(ab, cp),
    d6: number = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return c;
  const vb: number = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) return add(a, mul(ac, d2 / (d2 - d6)));
  const va: number = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0)
    return add(b, mul(sub(c, b), (d4 - d3) / (d4 - d3 + d5 - d6)));
  const denominator: number = 1 / (va + vb + vc);
  return add(a, add(mul(ab, vb * denominator), mul(ac, vc * denominator)));
}
