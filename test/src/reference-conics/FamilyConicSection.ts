import { AutoMovieViewChain as Q } from "../../../packages/engine/src/geometry/construction/AutoMovieViewChain";

/**
 * One section of a conic family as a short vector of named shape numbers.
 *
 * The section touches its box at four guides, as in classical conic lofting.
 * Each quarter between two guides starts as the control triangle of its two
 * guide points `P0`, `P2` and the box corner `A` where their tangent lines
 * meet. A triangle is either one conic with shoulder `rho`, or it is split at
 * its median: the point `S = M + f (A - M)` on the segment from the chord
 * midpoint `M` to `A`, with the tangent there parallel to the chord. That
 * tangent is the one every conic has at its own median point (the chord's
 * conjugate diameter passes through `A` and `M`), so a split with matching
 * values reproduces the single conic, and other values depart from it. The
 * two halves `(P0, P0 + f (A - P0), S)` and `(S, P2 + f (A - P2), P2)` are
 * again control triangles, split the same way down to `depth`.
 *
 * Every number is a share in (0, 1), every triangle of a convex quarter is
 * proper for any such shares, and no contact slides along the curve, so the
 * joint fit is well conditioned and its fields vary smoothly along the
 * station.
 *
 * Layout: `0..3` the supports `front.positive`, `front.negative`,
 * `side.positive`, `side.negative` in chart millimetres; `4..7` the touch
 * offsets of the `+u`, `+v`, `-u`, `-v` guides, millimetres along their
 * support lines; then each quarter's tree in preorder, a split's fullness `f`
 * before its two halves and a leaf's shoulder `rho`: `2^(depth + 1) - 1`
 * numbers per quarter.
 */
export namespace FamilyConicSection {
  /** A planar chart point, millimetres. */
  export type P = [number, number];

  /** Numbers of one quarter's tree. */
  export function quarter(depth: number): number {
    return 2 ** (depth + 1) - 1;
  }

  /** Number of scalar fields of a family split to `depth`. */
  export function count(depth: number): number {
    return 8 + 4 * quarter(depth);
  }

  /** The four guide points of a field vector, in increasing phase. */
  export function guides(values: readonly number[]): P[] {
    return [[values[0]!, values[4]!], [values[5]!, values[2]!], [values[1]!, values[6]!], [values[7]!, values[3]!]];
  }

  /** The four box corners of a field vector, the corner after each guide. */
  export function corners(values: readonly number[]): P[] {
    return [[values[0]!, values[2]!], [values[1]!, values[2]!], [values[1]!, values[3]!], [values[0]!, values[3]!]];
  }

  /**
   * The native chain input of a field vector: every guide and split point
   * with its tangent, and every leaf's shoulder, in increasing phase. The
   * runtime derives the engine's `pieces` outlines from the same function.
   */
  export function input(values: readonly number[], depth: number): Q.IInput {
    const out: Q.IInput = { points: [], tangents: [], shoulders: [] };
    const G: P[] = guides(values);
    const A: P[] = corners(values);
    const size: number = quarter(depth);
    for (let q: number = 0; q < 4; ++q) {
      let at: number = 8 + q * size;

      // Emit the triangle's start point, its tangent toward the control point, and its leaves.
      const walk = (p0: P, a: P, p2: P, level: number): void => {
        if (level === depth) {
          out.points.push(p0);
          out.tangents.push([a[0] - p0[0], a[1] - p0[1]]);
          out.shoulders.push(values[at++]!);
          return;
        }
        const f: number = values[at++]!;
        const s: P = [(p0[0] + p2[0]) / 2 + f * (a[0] - (p0[0] + p2[0]) / 2), (p0[1] + p2[1]) / 2 + f * (a[1] - (p0[1] + p2[1]) / 2)];
        walk(p0, [p0[0] + f * (a[0] - p0[0]), p0[1] + f * (a[1] - p0[1])], s, level + 1);
        walk(s, [p2[0] + f * (a[0] - p2[0]), p2[1] + f * (a[1] - p2[1])], p2, level + 1);
      };
      walk(G[q]!, A[q]!, G[(q + 1) % 4]!, 0);
    }
    return out;
  }

  /**
   * The same section one split deeper.
   *
   * A conic of middle weight `w = rho / (1 - rho)` cut at its median point
   * `S = M + rho (A - M)` leaves two conics of middle weight
   * `sqrt((1 + w) / 2)` (the rational de Casteljau step at `t = 1/2` with the
   * end weights renormalised to one; Farin, "Curves and Surfaces for CAGD",
   * rational subdivision). So every leaf `rho` becomes a split of fullness
   * `rho` with that shoulder on both halves, and the curve is unchanged.
   */
  export function deepen(values: readonly number[], depth: number): number[] {
    const out: number[] = values.slice(0, 8);
    let at: number = 8;
    const walk = (level: number): void => {
      const value: number = values[at++]!;
      out.push(value);
      if (level < depth) {
        walk(level + 1);
        walk(level + 1);
        return;
      }
      const w: number = Math.sqrt((1 + value / (1 - value)) / 2);
      out.push(w / (1 + w), w / (1 + w));
    };
    for (let q: number = 0; q < 4; ++q) walk(0);
    return out;
  }

  /** Build the engine's native conic chain from a field vector. */
  export function chain(values: readonly number[], depth: number): Q.ISection {
    return Q.of(input(values, depth));
  }

  /**
   * Radius of a closed polygon along one ray from the chart origin.
   *
   * A star-shaped section meets every ray once. Where a faceted source meets
   * it more than once the outermost hit is returned and `folds` counts the
   * event, so the caller reports the non-star interval instead of losing it.
   */
  export function radius(points: readonly P[], phi: number, folds?: { count: number }): number {
    const d: P = [Math.cos(phi), Math.sin(phi)];
    let best: number = NaN;
    let hits: number = 0;
    for (let i: number = 0; i < points.length; ++i) {
      const a: P = points[i]!;
      const b: P = points[(i + 1) % points.length]!;
      const sa: number = a[0] * d[1] - a[1] * d[0];
      const sb: number = b[0] * d[1] - b[1] * d[0];
      if ((sa > 0) === (sb > 0)) continue;
      const t: number = sa / (sa - sb);
      const r: number = (1 - t) * (a[0] * d[0] + a[1] * d[1]) + t * (b[0] * d[0] + b[1] * d[1]);
      if (!(r > 0)) continue;
      ++hits;
      if (!(best >= r)) best = r;
    }
    if (hits > 1 && folds !== undefined) ++folds.count;
    return best;
  }

  /**
   * A starting field vector read from one observed polygon: its four extremes
   * with their touch offsets, and every split's fullness and every leaf's
   * shoulder where the polygon crosses that triangle's median. The joint fit
   * owns the final values; this only has to be admissible.
   */
  export function seed(points: readonly P[], depth: number): number[] {
    const pick = (better: (a: P, b: P) => boolean): P => points.reduce((a: P, b: P): P => (better(b, a) ? b : a));
    const ext: P[] = [pick((b, a) => b[0] > a[0]), pick((b, a) => b[1] > a[1]), pick((b, a) => b[0] < a[0]), pick((b, a) => b[1] < a[1])];
    const values: number[] = [ext[0]![0], ext[2]![0], ext[1]![1], ext[3]![1], ext[0]![1], ext[1]![0], ext[2]![1], ext[3]![0]];
    const G: P[] = guides(values);
    const A: P[] = corners(values);
    for (let q: number = 0; q < 4; ++q) {
      const walk = (p0: P, a: P, p2: P, level: number): void => {
        const f: number = median(points, p0, a, p2);
        values.push(f);
        if (level === depth) return;
        const s: P = [(p0[0] + p2[0]) / 2 + f * (a[0] - (p0[0] + p2[0]) / 2), (p0[1] + p2[1]) / 2 + f * (a[1] - (p0[1] + p2[1]) / 2)];
        walk(p0, [p0[0] + f * (a[0] - p0[0]), p0[1] + f * (a[1] - p0[1])], s, level + 1);
        walk(s, [p2[0] + f * (a[0] - p2[0]), p2[1] + f * (a[1] - p2[1])], p2, level + 1);
      };
      walk(G[q]!, A[q]!, G[(q + 1) % 4]!, 0);
    }
    return values;
  }

  /** Share of a triangle's median, from the chord midpoint to the control point, where the polygon crosses it; the parabola's half when it does not. */
  function median(points: readonly P[], p0: P, a: P, p2: P): number {
    const middle: P = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2];
    const dir: P = [a[0] - middle[0], a[1] - middle[1]];
    let best: number = Infinity;
    for (let i: number = 0; i < points.length; ++i) {
      const s: P = points[i]!;
      const e: P = points[(i + 1) % points.length]!;
      const edge: P = [e[0] - s[0], e[1] - s[1]];
      const div: number = dir[0] * edge[1] - dir[1] * edge[0];
      if (div === 0) continue;
      const delta: P = [s[0] - middle[0], s[1] - middle[1]];
      const share: number = (delta[0] * edge[1] - delta[1] * edge[0]) / div;
      const along: number = (delta[0] * dir[1] - delta[1] * dir[0]) / div;
      if (share > 0.05 && share < 0.95 && along >= 0 && along <= 1 && share < best) best = share;
    }
    return Number.isFinite(best) ? best : 0.5;
  }
}
