import type { Skin } from "../geometry/Skin.ts";
import type { SurfaceIndex } from "../geometry/SurfaceIndex.ts";
import type { V3 } from "../geometry/V3.ts";
import { add } from "../geometry/add.ts";
import { dot } from "../geometry/dot.ts";
import { len } from "../geometry/len.ts";
import { mul } from "../geometry/mul.ts";
import { norm } from "../geometry/norm.ts";
import { sub } from "../geometry/sub.ts";
import { surfacePathOnce } from "./surfacePathOnce.ts";
import { triNormal } from "./triNormal.ts";

/**
 * Selects a short source-plane arc through two rounded source observations.
 * Mean local normals and world axes provide a finite set of plane candidates, not a geodesic solution.
 * Failure returns null so a course retains an explicit gap instead of a fabricated chord.
 *
 * @evidence contracts/common.md#principled-implementation Uses observed triangle normals and a finite set of declared plane hints, selects a short successful source arc and returns null when all candidates fail.
 * @evidence contracts/common.md#clear-and-simple-design Owns plane selection; one-plane cutting and endpoint tracing remain in surfacePathOnce.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never replaces an absent arc with a chord, copies a preferred identity or claims a global geodesic optimum.
 * @evidence contracts/common.md#meaningful-documentation States the finite plane search, rounding premise and explicit gap outcome.
 * @evidence contracts/performance.md#efficient-algorithms Makes two nearest-triangle queries and at most six plane-cut attempts; worst-case query and cut work depend on source triangle and contour-point populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the supplied surface index for both endpoint queries; distinct cutting planes are evaluated separately and no cross-call cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only the best current path and local plane hints until return, without external resources or persistent module state.
 */
export function surfacePath(
  skin: Skin,
  index: SurfaceIndex,
  a: V3,
  b: V3,
  options: { maxRatio?: number; normal?: V3 } = {},
): V3[] | null {
  const length: number = len(sub(b, a));
  if (length < 1e-6) return [a];
  const hints: V3[] = [];
  if (options.normal) hints.push(options.normal);
  else {
    const first: V3 = triNormal(index, index.closest(a).tri);
    const second: V3 = triNormal(index, index.closest(b).tri);
    const aligned: V3 = dot(first, second) < 0 ? mul(second, -1) : second;
    hints.push(norm(add(first, aligned)), first, aligned);
  }
  hints.push([1, 0, 0], [0, 1, 0], [0, 0, 1]);
  let best: { path: V3[]; len: number } | null = null;
  for (const hint of hints) {
    const candidate: { path: V3[]; len: number } | null = surfacePathOnce(
      skin,
      a,
      b,
      hint,
      options.maxRatio ?? 3,
    );
    if (candidate && (!best || candidate.len < best.len)) best = candidate;
    if (best && best.len < 1.05 * length) break;
  }
  return best?.path ?? null;
}
