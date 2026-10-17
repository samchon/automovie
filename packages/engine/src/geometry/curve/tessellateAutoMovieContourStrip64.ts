import { AutoMovieContourLoftCurves64 } from "./AutoMovieContourLoftCurves64";
import { AutoMovieCurveMath64 } from "./AutoMovieCurveMath64";

/**
 * Emits the fixed-seam minimum-area elementary tiles between two oriented contour walks.
 * The first seam lies on its exterior; the other starts at its nearest existing knot.
 * This discrete dynamic-program optimum does not certify a global cyclic optimum or injectivity.
 * Each walk may contain an explicitly doubled branch slit with distinct sheet ownership.
 *
 * @evidence contracts/common.md#principled-implementation The Fuchs elementary-tile recurrence selects the least accumulated triangle area at one declared pair of contour seams.
 * @evidence contracts/common.md#clear-and-simple-design Two oriented walks and a triangle receiver define the operation; vertex identity belongs to the receiver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The emitter consumes no original mesh connectivity, shading normals or anatomical defaults.
 * @evidence contracts/common.md#meaningful-documentation States seam selection, branch-walk support and the absence of a global cyclic or fold guarantee.
 * @evidence contracts/performance.md#efficient-algorithms The recurrence uses O(nm) time and O(nm) temporary storage for n and m contour points.
 * @evidence contracts/performance.md#reuse-equivalent-work Every accumulated cell is evaluated once and reused while backtracking the emitted tiling.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Cost and predecessor arrays are local to one strip and expire after emission; no global cache is retained.
 */
export function tessellateAutoMovieContourStrip64(
  rawA: AutoMovieCurveMath64.V[],
  rawB: AutoMovieCurveMath64.V[],
  emit: (
    a: AutoMovieCurveMath64.V,
    b: AutoMovieCurveMath64.V,
    c: AutoMovieCurveMath64.V,
  ) => void,
): void {
  const a: AutoMovieCurveMath64.V[] =
    AutoMovieContourLoftCurves64.exterior(rawA);
  let offset: number = 0;
  let best: number = Infinity;
  rawB.forEach((p: AutoMovieCurveMath64.V, i: number): void => {
    const d: number = Math.hypot(
      p[0] - a[0][0],
      p[1] - a[0][1],
      p[2] - a[0][2],
    );
    if (d < best) {
      best = d;
      offset = i;
    }
  });
  const b: AutoMovieCurveMath64.V[] = [
    ...rawB.slice(offset),
    ...rawB.slice(0, offset),
  ];
  const n: number = a.length;
  const m: number = b.length;
  const stride: number = m + 1;
  const cost: Float64Array = new Float64Array((n + 1) * stride).fill(Infinity);
  const way: Uint8Array = new Uint8Array(cost.length);
  const area = (
    p: AutoMovieCurveMath64.V,
    q: AutoMovieCurveMath64.V,
    r: AutoMovieCurveMath64.V,
  ): number => {
    const u: AutoMovieCurveMath64.V = AutoMovieCurveMath64.sub(q, p);
    const v: AutoMovieCurveMath64.V = AutoMovieCurveMath64.sub(r, p);
    const value: number =
      Math.hypot(
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ) / 2;
    if (!Number.isFinite(value))
      throw new Error("Unresolved contour tile area");
    return value;
  };
  cost[0] = 0;
  for (let i: number = 0; i <= n; i++)
    for (let j: number = 0; j <= m; j++) {
      if (!i && !j) continue;
      const cell: number = i * stride + j;
      const ca: number = i
        ? cost[cell - stride] + area(a[(i - 1) % n], a[i % n], b[j % m])
        : Infinity;
      const cb: number = j
        ? cost[cell - 1] + area(a[i % n], b[j % m], b[(j - 1) % m])
        : Infinity;
      cost[cell] = Math.min(ca, cb);
      way[cell] = ca <= cb ? 1 : 2;
    }
  let i: number = n;
  let j: number = m;
  while (i || j) {
    if (way[i * stride + j] === 1) {
      emit(a[(i - 1) % n], a[i % n], b[j % m]);
      i--;
    } else {
      emit(a[i % n], b[j % m], b[(j - 1) % m]);
      j--;
    }
  }
}
