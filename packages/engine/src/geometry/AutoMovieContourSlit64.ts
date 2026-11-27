import type {
  AutoMovieVector3Tuple,
  IAutoMovieContourSlit64,
} from "@automovie/interface";

import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";

const add: typeof M.add = M.add,
  sub: typeof M.sub = M.sub,
  mul: typeof M.scale = M.scale;
const dot: (a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple) => number = (
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const dist: (a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple) => number = (
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Continuous closest-segment slit construction for declared contour walks. */
export namespace AutoMovieContourSlit64 {
  /** Open oriented loops along one closest continuous segment-to-segment slit. */
  export function join(
    a: AutoMovieVector3Tuple[],
    b: AutoMovieVector3Tuple[],
    inserted: (
      p: AutoMovieVector3Tuple,
      a: AutoMovieVector3Tuple,
      b: AutoMovieVector3Tuple,
      t: number,
    ) => void,
  ): AutoMovieVector3Tuple[] {
    let ai: number = 0,
      bi: number = 0,
      ta: number = 0,
      tb: number = 0,
      best: number = Infinity;
    const accept = (i: number, j: number, u: number, v: number): void => {
      const p: AutoMovieVector3Tuple = add(
        a[i],
        mul(sub(a[(i + 1) % a.length], a[i]), u),
      );
      const q: AutoMovieVector3Tuple = add(
        b[j],
        mul(sub(b[(j + 1) % b.length], b[j]), v),
      );
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
        const an: AutoMovieVector3Tuple = a[(i + 1) % a.length],
          bn: AutoMovieVector3Tuple = b[(j + 1) % b.length];
        accept(i, j, 0, closest(a[i], b[j], bn).t);
        accept(i, j, 1, closest(an, b[j], bn).t);
        accept(i, j, closest(b[j], a[i], an).t, 0);
        accept(i, j, closest(bn, a[i], an).t, 1);
        const x: AutoMovieVector3Tuple = sub(an, a[i]),
          y: AutoMovieVector3Tuple = sub(bn, b[j]),
          z: AutoMovieVector3Tuple = sub(b[j], a[i]);
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
    const open = (
      ring: AutoMovieVector3Tuple[],
      edge: number,
      t: number,
    ): AutoMovieVector3Tuple[] => {
      const next: number = (edge + 1) % ring.length;
      if (t === 0 || t === 1) {
        const start: number = t === 0 ? edge : next;
        const walk: AutoMovieVector3Tuple[] = [
          ...ring.slice(start),
          ...ring.slice(0, start),
        ];
        return [...walk, walk[0]];
      }
      const p: AutoMovieVector3Tuple = add(
        ring[edge],
        mul(sub(ring[next], ring[edge]), t),
      );
      inserted(p, ring[edge], ring[next], t);
      return [p, ...ring.slice(edge + 1), ...ring.slice(0, edge + 1), p];
    };
    return [...open(a, ai, ta), ...open(b, bi, tb)];
  }

  /** Projects onto a finite segment; a zero-length segment remains its endpoint. */
  export function closest(
    p: AutoMovieVector3Tuple,
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): IAutoMovieContourSlit64.IClosestResult {
    const ab: AutoMovieVector3Tuple = sub(b, a);
    const t: number = Math.max(
      0,
      Math.min(1, dot(sub(p, a), ab) / (dot(ab, ab) || 1)),
    );
    const q: AutoMovieVector3Tuple = add(a, mul(ab, t));
    return { p: q, t, distance: dist(p, q) };
  }
}
