import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";

const add: typeof M.add = M.add,
  sub: typeof M.sub = M.sub,
  mul: typeof M.scale = M.scale;
const dot: (a: M.V, b: M.V) => number = (a: M.V, b: M.V): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const dist: (a: M.V, b: M.V) => number = (a: M.V, b: M.V): number =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * Continuous closest-segment slit construction for declared contour walks.
 *
 * @evidence contracts/common.md#principled-implementation Endpoint projections and the interior segment-pair solution retain the original closest-slit objective and stable traversal order.
 * @evidence contracts/common.md#clear-and-simple-design The contour facade retains its public names while one owner handles slit geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The original admission, arithmetic order, identities and local failure policy are preserved; no source geometry substitutes for engine output.
 * @evidence contracts/common.md#meaningful-documentation States its ownership boundary, unchanged numerical contract and caller-owned inputs.
 * @evidence contracts/performance.md#efficient-algorithms Two polygons with N and M segments require O(NM) candidate comparisons and O(N+M) returned walk storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller reuses this operation for its declared preparation or query lifetime; no new cross-call cache is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the joined walk and inserted points escape; per-call candidate state is released.
 */
export namespace AutoMovieContourSlit64 {
  /**
   * Open oriented loops along one closest continuous segment-to-segment slit.
   *
   * @evidence contracts/common.md#principled-implementation Endpoint projections and the interior segment-pair solution locate a continuous closest slit; oriented boundary walks traverse it in opposite directions. Exact endpoint parameters reuse the existing endpoint object and its cyclic incidence instead of inserting a zero-length walk edge.
   * @evidence contracts/common.md#clear-and-simple-design This helper owns the named curve operation and composes only the shared vector owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.
   * @evidence contracts/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/performance.md#efficient-algorithms N by M segment pairs are examined once; the returned joined walk has O(N+M) points.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
   */
  export function join(
    a: M.V[],
    b: M.V[],
    inserted: (p: M.V, a: M.V, b: M.V, t: number) => void,
  ): M.V[] {
    let ai: number = 0,
      bi: number = 0,
      ta: number = 0,
      tb: number = 0,
      best: number = Infinity;
    const accept = (i: number, j: number, u: number, v: number): void => {
      const p: M.V = add(a[i], mul(sub(a[(i + 1) % a.length], a[i]), u));
      const q: M.V = add(b[j], mul(sub(b[(j + 1) % b.length], b[j]), v));
      const d: number = dist(p, q);
      if (d < best) {
        best = d;
        ai = i;
        bi = j;
        ta = u;
        tb = v;
      }
    };
    for (let i: number = 0; i < a.length; i++)
      for (let j: number = 0; j < b.length; j++) {
        const an: M.V = a[(i + 1) % a.length],
          bn: M.V = b[(j + 1) % b.length];
        accept(i, j, 0, closest(a[i], b[j], bn).t);
        accept(i, j, 1, closest(an, b[j], bn).t);
        accept(i, j, closest(b[j], a[i], an).t, 0);
        accept(i, j, closest(bn, a[i], an).t, 1);
        const x: M.V = sub(an, a[i]),
          y: M.V = sub(bn, b[j]),
          z: M.V = sub(b[j], a[i]);
        const xx: number = dot(x, x),
          yy: number = dot(y, y),
          xy: number = dot(x, y);
        const xz: number = dot(x, z),
          yz: number = dot(y, z),
          den: number = xx * yy - xy * xy;
        if (den > 0) {
          const u: number = (xz * yy - yz * xy) / den,
            v: number = (xz * xy - yz * xx) / den;
          if (u >= 0 && u <= 1 && v >= 0 && v <= 1) accept(i, j, u, v);
        }
      }
    const open = (ring: M.V[], edge: number, t: number): M.V[] => {
      const next: number = (edge + 1) % ring.length;
      if (t === 0 || t === 1) {
        const start: number = t === 0 ? edge : next;
        const walk: M.V[] = [...ring.slice(start), ...ring.slice(0, start)];
        return [...walk, walk[0]];
      }
      const p: M.V = add(ring[edge], mul(sub(ring[next], ring[edge]), t));
      inserted(p, ring[edge], ring[next], t);
      return [p, ...ring.slice(edge + 1), ...ring.slice(0, edge + 1), p];
    };
    return [...open(a, ai, ta), ...open(b, bi, tb)];
  }

  /**
   * Projects onto a finite segment; a zero-length segment remains its endpoint.
   *
   * @evidence contracts/common.md#principled-implementation Clamped orthogonal projection gives the nearest point of a finite segment, retaining its endpoint for zero length.
   * @evidence contracts/common.md#clear-and-simple-design This helper owns the named curve operation and composes only the shared vector owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.
   * @evidence contracts/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/performance.md#efficient-algorithms A fixed number of three-component dot products and affine operations is used.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
   */
  export function closest(
    p: M.V,
    a: M.V,
    b: M.V,
  ): { p: M.V; t: number; distance: number } {
    const ab: M.V = sub(b, a);
    const t: number = Math.max(
      0,
      Math.min(1, dot(sub(p, a), ab) / (dot(ab, ab) || 1)),
    );
    const q: M.V = add(a, mul(ab, t));
    return { p: q, t, distance: dist(p, q) };
  }
}
