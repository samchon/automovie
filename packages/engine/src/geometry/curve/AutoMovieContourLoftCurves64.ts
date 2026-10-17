import { AutoMovieBernstein64 as B } from "./AutoMovieBernstein64";
import { AutoMovieBernsteinSubdivision64 as S } from "./AutoMovieBernsteinSubdivision64";
import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";
import { IAutoMovieCurve64 as C } from "./IAutoMovieCurve64";
import { assertAutoMovieCurve64 } from "./assertAutoMovieCurve64";

/** Local vector aliases preserve the engine's complete binary64 arithmetic. */
const add: typeof M.add = M.add,
  sub: typeof M.sub = M.sub,
  mul: typeof M.scale = M.scale;
/** Three-dimensional projection helpers in one common physical chart. */
const dot: (a: M.V, b: M.V) => number = (a: M.V, b: M.V): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** Euclidean distance, used only within the enclosing millimetre chart. */
const dist: (a: M.V, b: M.V) => number = (a: M.V, b: M.V): number =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * Curve sampling and oriented slit construction for a generic closed-section loft.
 * The input cubic coefficients remain authoritative; emitted polygons are downstream tessellation.
 *
 * @evidence contracts/common.md#principled-implementation Physical arclength correspondence and exact Bernstein subdivision compose the contour-loft helper operations.
 * @evidence contracts/common.md#clear-and-simple-design One stateless namespace groups only the curve operations needed by contour lofting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No Human or reference-source dependency enters the engine.
 * @evidence contracts/common.md#meaningful-documentation Member comments state physical units, sampling and slit behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The namespace computes nothing; members state their costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The namespace owns no memoization table.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No state survives a helper call.
 */
export namespace AutoMovieContourLoftCurves64 {
  /**
   * A closed polygon's physical arclength chart, in millimetres.
   *
   * @evidence contracts/common.md#principled-implementation This record preserves the closed polygon arclength or evaluated parameter chart consumed by the helper namespace.
   * @evidence contracts/common.md#clear-and-simple-design Fields separate physical points from their cumulative or normalized parameters.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This type performs no fitting or geometry validity certification.
   * @evidence contracts/common.md#meaningful-documentation States physical point units and parameter meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record type performs no arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Runtime storage belongs to the caller.
   * @author Samchon
   */
  export interface Curve {
    /** Ordered closed polygon samples in millimetres; the caller keeps them stable during evaluation. */
    points: M.V[];

    /** Chord-length prefixes, including zero and the closing edge's final total. */
    cumulative: number[];

    /** Complete closed chord length in millimetres. */
    length: number;
  }

  /**
   * Builds the cyclic arclength chart without rescaling any physical coordinate.
   *
   * @evidence contracts/common.md#principled-implementation Cyclic chord accumulation preserves a closed polygon in its supplied millimetre frame.
   * @evidence contracts/common.md#clear-and-simple-design This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.
   * @evidence contracts/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/performance.md#efficient-algorithms One linear pass over N points uses N+1 cumulative values.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
   */
  export function curve(points: M.V[]): Curve {
    const cumulative: number[] = [0];
    for (let i: number = 0; i < points.length; i++)
      cumulative.push(
        cumulative[i] + dist(points[i], points[(i + 1) % points.length]),
      );
    return { points, cumulative, length: cumulative[cumulative.length - 1] };
  }

  /**
   * Evaluates one periodic, normalized arclength phase on a closed polygon.
   *
   * @evidence contracts/common.md#principled-implementation Binary search selects one cyclic arclength interval and interpolates its two endpoints.
   * @evidence contracts/common.md#clear-and-simple-design This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.
   * @evidence contracts/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/performance.md#efficient-algorithms The interval search is O(log N) with constant-size vector output.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
   */
  export function at(c: Curve, phase: number): M.V {
    const target: number = (((phase % 1) + 1) % 1) * c.length;
    let lo: number = 0,
      hi: number = c.points.length;
    while (hi - lo > 1) {
      const mid: number = (lo + hi) >> 1;
      if (c.cumulative[mid] <= target) lo = mid;
      else hi = mid;
    }
    const width: number = c.cumulative[lo + 1] - c.cumulative[lo];
    const t: number = width > 0 ? (target - c.cumulative[lo]) / width : 0;
    return add(
      c.points[lo],
      mul(sub(c.points[(lo + 1) % c.points.length], c.points[lo]), t),
    );
  }

  /**
   * Samples equal physical arclengths for geometric correspondence, not curve fitting.
   *
   * @evidence contracts/common.md#principled-implementation Equal normalized arclength phases call the same polygon evaluator.
   * @evidence contracts/common.md#clear-and-simple-design This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.
   * @evidence contracts/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/performance.md#efficient-algorithms M samples require O(M log N) interval queries and O(M) output vectors.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
   */
  export function sample(c: Curve, count: number, offset: number = 0): M.V[] {
    return Array.from(
      { length: count },
      (_: unknown, i: number): M.V => at(c, i / count + offset),
    );
  }

  /**
   * Returns the arithmetic centre of the supplied samples in their common frame.
   *
   * @evidence contracts/common.md#principled-implementation Component sums divided by the supplied sample count define their arithmetic centre.
   * @evidence contracts/common.md#clear-and-simple-design This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.
   * @evidence contracts/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/performance.md#efficient-algorithms One O(N) traversal creates only a three-component accumulator.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
   */
  export function centroid(points: M.V[]): M.V {
    const sum: M.V = points.reduce(
      (a: M.V, p: M.V): M.V => add(a, p),
      [0, 0, 0],
    );
    return mul(sum, 1 / points.length);
  }

  /**
   * Open oriented loops along one closest continuous segment-to-segment slit.
   *
   * @evidence contracts/common.md#principled-implementation Endpoint projections and the interior segment-pair solution locate a continuous closest slit; oriented boundary walks traverse it in opposite directions.
   * @evidence contracts/common.md#clear-and-simple-design This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
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
    const p: M.V = add(a[ai], mul(sub(a[(ai + 1) % a.length], a[ai]), ta));
    const q: M.V = add(b[bi], mul(sub(b[(bi + 1) % b.length], b[bi]), tb));
    inserted(p, a[ai], a[(ai + 1) % a.length], ta);
    inserted(q, b[bi], b[(bi + 1) % b.length], tb);
    return [
      p,
      ...a.slice(ai + 1),
      ...a.slice(0, ai + 1),
      p,
      q,
      ...b.slice(bi + 1),
      ...b.slice(0, bi + 1),
      q,
    ];
  }

  /**
   * An evaluated curve point and its inherited source phase, distinct from a control.
   *
   * @evidence contracts/common.md#principled-implementation This record preserves the closed polygon arclength or evaluated parameter chart consumed by the helper namespace.
   * @evidence contracts/common.md#clear-and-simple-design Fields separate physical points from their cumulative or normalized parameters.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This type performs no fitting or geometry validity certification.
   * @evidence contracts/common.md#meaningful-documentation States physical point units and parameter meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record type performs no arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Runtime storage belongs to the caller.
   * @author Samchon
   */
  export interface Knot {
    /** Evaluated point in millimetres, distinct from an authored control. */
    p: M.V;

    /** Inherited parameter in the primitive's declared phase chart. */
    phase: number;
  }

  /**
   * Projects onto a finite segment; a zero-length segment remains its endpoint.
   *
   * @evidence contracts/common.md#principled-implementation Clamped orthogonal projection gives the nearest point of a finite segment, retaining its endpoint for zero length.
   * @evidence contracts/common.md#clear-and-simple-design This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
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

  /**
   * De Casteljau subdivision bounds the complete cubic's chord error in mm.
   *
   * @evidence contracts/common.md#principled-implementation Admitted cubic coefficients are split by the existing Bernstein subdivision operator until their control hull lies within the physical chord tolerance.
   * @evidence contracts/common.md#clear-and-simple-design This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.
   * @evidence contracts/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/performance.md#efficient-algorithms Each visited cubic subproblem has constant degree and work; O(K) leaves and at most 30 recursive levels bound temporary depth.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
   */
  export function tessellate(primitive: C.Cubic, toleranceMm: number): Knot[] {
    assertAutoMovieCurve64(primitive);
    if (!primitive.closed || !Number.isFinite(toleranceMm) || toleranceMm <= 0)
      throw new Error(
        "Closed cubic and positive physical chord tolerance required",
      );
    const output: Knot[] = [];
    const visit = (p: M.V[], t0: number, t1: number, depth: number): void => {
      const error: number = Math.max(
        closest(p[1], p[0], p[3]).distance,
        closest(p[2], p[0], p[3]).distance,
      );
      if (error <= toleranceMm) {
        output.push({ p: M.clone(p[0]), phase: t0 });
        return;
      }
      if (depth >= 30)
        throw new Error("Cubic tessellation reached numeric subdivision limit");
      const halves: [B.Poly, B.Poly] = S.split(p, 0.5);
      const mid: number = (t0 + t1) / 2;
      visit(halves[0], t0, mid, depth + 1);
      visit(halves[1], mid, t1, depth + 1);
    };
    let phase: number = 0;
    primitive.spans.forEach((span: C.Span, i: number): void => {
      const width: number = primitive.phaseIntervals[i]!;
      visit(
        span.map((p: C.Vector): M.V => M.clone(p)),
        phase,
        phase + width,
        0,
      );
      phase += width;
    });
    return output;
  }

  /**
   * Start away from duplicated branch slits, whose nearest seam has two sheets.
   *
   * @evidence contracts/common.md#principled-implementation The farthest sampled-boundary point from its arclength centre avoids an ambiguous doubled branch slit.
   * @evidence contracts/common.md#clear-and-simple-design This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.
   * @evidence contracts/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/performance.md#efficient-algorithms Sixty-four logarithmic arclength queries and one O(N) scan choose the seam.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
   */
  export function exterior(points: M.V[]): M.V[] {
    const centre: M.V = centroid(sample(curve(points), 64));
    let offset: number = 0,
      farthest: number = -Infinity;
    points.forEach((p: M.V, i: number): void => {
      const d: number = dist(p, centre);
      if (d > farthest) {
        farthest = d;
        offset = i;
      }
    });
    return [...points.slice(offset), ...points.slice(0, offset)];
  }
}
