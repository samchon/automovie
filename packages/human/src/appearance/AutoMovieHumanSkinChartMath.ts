import type { AutoMovieHumanSkinChart } from "./AutoMovieHumanSkinChart";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/** The skin chart arithmetic: periodic indices, gap filling, smoothing and the directions a chain axis falls back on. */
export namespace AutoMovieHumanSkinChartMath {
  /** Point or direction in mm. */
  export type Vec3 = AutoMovieHumanSkinVector.Vec3;

  /** Vector arithmetic. */
  export const V: typeof AutoMovieHumanSkinVector = AutoMovieHumanSkinVector;

  /**
   * Non-negative remainder.
   *
   * @param i Integer
   * @param n Positive modulus
   * @returns `i mod n` in `[0, n)`
   */
  export function wrap(i: number, n: number): number {
    return ((i % n) + n) % n;
  }

  /**
   * Linear fill of NaN gaps in a sequence, holding the ends.
   *
   * @param values Sequence with gaps
   * @returns Filled copy; all NaN becomes zeros
   */
  export function fill(values: readonly number[]): number[] {
    const out: number[] = [...values];
    const known: number[] = [];
    out.forEach((v: number, i: number): void => {
      if (!Number.isNaN(v)) known.push(i);
    });
    if (known.length === 0) return out.map((): number => 0);
    let k: number = 0;
    for (let i: number = 0; i < out.length; ++i) {
      if (!Number.isNaN(out[i]!)) continue;
      while (k < known.length && known[k]! < i) ++k;
      if (k === 0) out[i] = values[known[0]!]!;
      else if (k === known.length) out[i] = values[known[known.length - 1]!]!;
      else {
        const a: number = known[k - 1]!;
        const b: number = known[k]!;
        out[i] = values[a]! + ((values[b]! - values[a]!) * (i - a)) / (b - a);
      }
    }
    return out;
  }

  /**
   * Circular linear fill of NaN gaps.
   *
   * @param values Circular sequence with gaps
   * @returns Filled copy; an all-NaN sequence stays NaN
   */
  export function fillCircular(values: readonly number[]): number[] {
    const n: number = values.length;
    const out: number[] = [...values];
    const known: number[] = [];
    out.forEach((v: number, i: number): void => {
      if (!Number.isNaN(v)) known.push(i);
    });
    if (known.length === 0) return out;

    // Each gap lies between consecutive known entries, the last gap wrapping
    // from the last known entry to the first one a turn later.
    for (let k: number = 0; k < known.length; ++k) {
      const a: number = known[k]!;
      const b: number = k + 1 < known.length ? known[k + 1]! : known[0]! + n;
      for (let i: number = a + 1; i < b; ++i)
        out[i % n] =
          values[a]! + ((values[b % n]! - values[a]!) * (i - a)) / (b - a);
    }
    return out;
  }

  /**
   * Moving average with a half-width, holding the ends.
   *
   * @param values Sequence
   * @param half Half-width in samples
   * @returns Smoothed copy
   */
  export function smooth(values: readonly number[], half: number): number[] {
    return values.map((_: number, i: number): number => {
      let s: number = 0;
      let n: number = 0;
      for (let k: number = -half; k <= half; ++k) {
        s += values[Math.min(values.length - 1, Math.max(0, i + k))]!;
        n += 1;
      }
      return s / n;
    });
  }

  /**
   * Root-mean-square distance of a chain's vertices from their band centroids.
   *
   * @param pieces One chain's pieces
   * @returns Typical radius in mm
   */
  export function spread(pieces: readonly AutoMovieHumanSkinChart.IPiece[]): number {
    let sum: number = 0;
    let count: number = 0;
    for (const piece of pieces) {
      const c: Vec3 = V.centroid(piece.positions);
      for (let i: number = 0; i < piece.positions.length / 3; ++i) {
        const d: Vec3 = V.sub(V.at(piece.positions, i), c);
        sum += V.dot(d, d);
        count += 1;
      }
    }
    return Math.sqrt(sum / Math.max(1, count));
  }

  /**
   * Direction the vertex normals of some pieces are most nearly perpendicular
   * to: the eigenvector of the least eigenvalue of their scatter matrix, by
   * power iteration on its complement.
   *
   * @param pieces Pieces
   * @returns Unit direction
   */
  export function leastNormal(pieces: readonly AutoMovieHumanSkinChart.IPiece[]): Vec3 {
    const m: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (const piece of pieces)
      for (let i: number = 0; i < piece.normals.length / 3; ++i) {
        const n: Vec3 = V.at(piece.normals, i);
        for (let a: number = 0; a < 3; ++a)
          for (let b: number = 0; b < 3; ++b) m[a * 3 + b]! += n[a]! * n[b]!;
      }
    const trace: number = m[0]! + m[4]! + m[8]!;
    let v: Vec3 = [0.577, 0.577, 0.577];
    for (let k: number = 0; k < 64; ++k) {
      const w: Vec3 = [
        trace * v[0] - (m[0]! * v[0] + m[1]! * v[1] + m[2]! * v[2]),
        trace * v[1] - (m[3]! * v[0] + m[4]! * v[1] + m[5]! * v[2]),
        trace * v[2] - (m[6]! * v[0] + m[7]! * v[1] + m[8]! * v[2]),
      ];
      if (V.norm(w) < 1e-12) return [0, 1, 0];
      v = V.normalize(w);
    }
    return v;
  }

  /**
   * Any unit vector perpendicular to a unit vector.
   *
   * @param t Unit vector
   * @returns Perpendicular unit vector
   */
  export function perpendicular(t: Vec3): Vec3 {
    const other: Vec3 = Math.abs(t[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    return V.normalize(V.cross(t, other));
  }
}
