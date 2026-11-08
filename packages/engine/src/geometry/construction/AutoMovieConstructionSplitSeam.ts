import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** World point or direction, mm. */
type Vec3 = AutoMovieSolidVector.Vec3;
const { add, cross, dot, norm, scale, sub, unit } = AutoMovieSolidVector;

/**
 * A split's curved seam (`IAutoMovieConstructionSplit.IProfile`): the curve both bands start from in place of the straight chord, in the seam plane that holds the chord and the host end's outward normal.
 *
 * The curve is the clamped cubic spline, on chord-length parameters (mm), through the seam's first end (the host's end ring at phase `a`), the authored knots and its second end (phase `b`). At each end its unit tangent is the line where the host's tangent plane meets the seam plane: out of the host at the first end, into it at the second. The seam therefore leaves both forks along the host's own surface. Columns read it at equal arclength shares.
 *
 * @evidence contracts/common.md#principled-implementation The end tangent `n_host x n_seam` lies in both the host's tangent plane and the seam plane, the one direction in which a curve of that plane can leave the host G1; the clamped cubic spline solves the C2 tridiagonal system for the interior derivatives with those end derivatives (de Boor 1978, chapter IV), and the arclength comes from 8-point Gauss-Legendre quadrature of the cubic's speed per span.
 * @evidence contracts/common.md#clear-and-simple-design Plane, knots, end tangents, spline and arclength reading; the bands own their columns and ribbons.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored knots only: no fit, no search of the host; knots outside the chord's span, a degenerate plane or an end where the host's tangent plane is the seam plane are refused with the reason.
 * @evidence contracts/common.md#meaningful-documentation States the plane, the curve, its end tangents, its parameter and its refusals.
 * @evidence contracts/performance.md#efficient-algorithms For K knots: two host jets, one O(K) tridiagonal solve per coordinate, 8 speed samples per span for the length, and per reading a span search and 52 bisection steps of an 8-point quadrature.
 * @evidence contracts/performance.md#reuse-equivalent-work The spline's derivatives and its span lengths are solved once and serve every reading of both bands.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains O(K) knots, derivatives and lengths in the returned closure.
 */
export namespace AutoMovieConstructionSplitSeam {
  /**
   * One reading of the seam.
   *
   * @evidence contracts/common.md#principled-implementation A point and its unit tangent fix a column's start and the seam's direction there.
   * @evidence contracts/common.md#clear-and-simple-design Two vectors.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Values only.
   * @evidence contracts/common.md#meaningful-documentation States units and orientation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record runs no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record coordinates no work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Two fresh vectors owned by the caller.
   */
  export interface IPoint {
    /** The seam's point, mm. */
    point: Vec3;

    /** Its unit tangent, toward the seam's second end. */
    tangent: Vec3;
  }

  /**
   * The built seam.
   *
   * @evidence contracts/common.md#principled-implementation Its ends, plane normal and arclength reading are all a band needs to place its chord columns and rule them.
   * @evidence contracts/common.md#clear-and-simple-design Ends, one normal, one length and one reader.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The reader evaluates the solved spline; it never resamples.
   * @evidence contracts/common.md#meaningful-documentation States each member's unit and orientation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record runs no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record coordinates no work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Holds the spline's O(K) arrays.
   */
  export interface ISeam {
    /** The first end (host phase `a`) and the second (phase `b`), mm. */
    ends: [Vec3, Vec3];

    /** The seam plane's unit normal, `e1 x e2` (`e1` along the chord from the first end, `e2` the end normal square to it); unoriented toward either band. */
    normal: Vec3;

    /** The seam's arclength, mm. */
    length: number;

    /**
     * The seam at an arclength share.
     *
     * @param t The share of the length from the first end, in `[0, 1]`.
     */
    at(t: number): IPoint;
  }

  /**
   * Build the seam, or the reason it cannot be built.
   *
   * @param input.host The host face's surface.
   * @param input.station The host's end station, mm.
   * @param input.into The station's sign out of the host.
   * @param input.seam The seam's host phases `[a, b]`, radians.
   * @param input.normal The host end section's unit normal out of the host.
   * @param input.knots The interior knots `[along, depth]`, mm.
   * @returns The seam, or the refusal.
   *
   * @evidence contracts/common.md#principled-implementation Plane from the chord and the end normal, end tangents from the host's tangent planes, then the clamped spline and its arclength.
   * @evidence contracts/common.md#clear-and-simple-design One pass: plane, knots, tangents, solve, lengths.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses a collapsed chord, an end normal along the chord, knots that do not advance inside the chord, and an end whose tangent plane holds no direction of the seam plane.
   * @evidence contracts/common.md#meaningful-documentation States its refusals in its result.
   * @evidence contracts/performance.md#efficient-algorithms Linear in knots.
   * @evidence contracts/performance.md#reuse-equivalent-work The two end jets serve both the ends and their tangents.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned seam retains its arrays.
   */
  export function create(input: { host: IAutoMovieSolidSurface; station: number; into: 1 | -1; seam: [number, number]; normal: Vec3; knots: readonly (readonly [number, number])[] }): ISeam | string {
    const first: IAutoMovieSolidSurface.IJet = input.host.jet(input.station, input.seam[0]);
    const second: IAutoMovieSolidSurface.IJet = input.host.jet(input.station, input.seam[1]);
    const A: Vec3 = [first.p[0]!, first.p[1]!, first.p[2]!];
    const B: Vec3 = [second.p[0]!, second.p[1]!, second.p[2]!];
    const chord: number = norm(sub(B, A));
    const e1: Vec3 | null = unit(sub(B, A));
    if (e1 === null) return "the seam's ends coincide";
    const e2: Vec3 | null = unit(sub(input.normal, scale(e1, dot(input.normal, e1))));
    if (e2 === null) return "the host end's normal runs along the chord, so no seam plane stands";
    const normal: Vec3 = cross(e1, e2);

    // Knots in the plane's coordinates: (along e1 from A, along e2), mm.
    const points: [number, number][] = [[0, 0]];
    for (const [along, depth] of input.knots) {
      if (!(Number.isFinite(along) && Number.isFinite(depth) && along > points[points.length - 1]![0])) return `the seam's knot (${along}, ${depth}) mm does not advance along the chord`;
      points.push([along, depth]);
    }
    if (!(points[points.length - 1]![0] < chord)) return `the seam's last knot stands at or beyond the chord's length ${chord} mm`;
    points.push([chord, 0]);

    // End tangents: the host's tangent plane meets the seam plane along
    // `n_host x n_seam`, oriented along the host's station out of it.
    const tangent: (j: IAutoMovieSolidSurface.IJet, sign: 1 | -1) => [number, number] | null = (j: IAutoMovieSolidSurface.IJet, sign: 1 | -1): [number, number] | null => {
      const u: Vec3 = [j.u[0]!, j.u[1]!, j.u[2]!];
      const v: Vec3 = [j.v[0]!, j.v[1]!, j.v[2]!];
      const along: Vec3 | null = unit(cross(cross(u, v), normal));
      // A direction square to the station derivative runs along the end
      // ring: it cannot leave the host.
      if (along === null || !(Math.abs(dot(along, u)) > 0)) return null;
      const out: Vec3 = scale(along, Math.sign(dot(along, u)) * input.into * sign);
      return [dot(out, e1), dot(out, e2)];
    };
    const start: [number, number] | null = tangent(first, 1);
    const finish: [number, number] | null = tangent(second, -1);
    if (start === null || finish === null) return "the host's tangent plane at a fork holds no direction of the seam plane leaving its end";

    // The clamped cubic spline on chord-length parameters: interior
    // derivatives from the C2 condition, ends the unit tangents.
    const K: number = points.length;
    const h: number[] = Array.from({ length: K - 1 }, (_: unknown, i: number): number => Math.hypot(points[i + 1]![0] - points[i]![0], points[i + 1]![1] - points[i]![1]));
    if (!h.every((x: number): boolean => x > 0)) return "two of the seam's knots coincide";
    const D: [number, number][] = [start, ...Array.from({ length: K - 2 }, (): [number, number] => [0, 0]), finish];
    for (const c of [0, 1] as const) {
      // h_i D_{i-1} + 2 (h_{i-1} + h_i) D_i + h_{i-1} D_{i+1} = 3 (h_i dP_{i-1} / h_{i-1} + h_{i-1} dP_i / h_i), i = 1..K-2.
      const n: number = K - 2;
      if (n === 0) break;
      const lower: number[] = [];
      const diag: number[] = [];
      const upper: number[] = [];
      const rhs: number[] = [];
      for (let i: number = 1; i <= n; ++i) {
        const [hp, hn]: [number, number] = [h[i - 1]!, h[i]!];
        lower.push(hn);
        diag.push(2 * (hp + hn));
        upper.push(hp);
        let r: number = 3 * ((hn * (points[i]![c] - points[i - 1]![c])) / hp + (hp * (points[i + 1]![c] - points[i]![c])) / hn);
        if (i === 1) r -= hn * D[0]![c];
        if (i === n) r -= hp * D[K - 1]![c];
        rhs.push(r);
      }
      // Thomas algorithm (the system is strictly diagonally dominant).
      for (let i: number = 1; i < n; ++i) {
        const w: number = lower[i]! / diag[i - 1]!;
        diag[i] = diag[i]! - w * upper[i - 1]!;
        rhs[i] = rhs[i]! - w * rhs[i - 1]!;
      }
      const x: number[] = new Array<number>(n).fill(0);
      x[n - 1] = rhs[n - 1]! / diag[n - 1]!;
      for (let i: number = n - 2; i >= 0; --i) x[i] = (rhs[i]! - upper[i]! * x[i + 1]!) / diag[i]!;
      for (let i: number = 0; i < n; ++i) D[i + 1]![c] = x[i]!;
    }

    // One span's cubic Hermite on s in [0, h_i]: value and derivative.
    const span: (i: number, s: number) => { p: [number, number]; d: [number, number] } = (i: number, s: number): { p: [number, number]; d: [number, number] } => {
      const H: number = h[i]!;
      const x: number = s / H;
      const [h00, h10, h01, h11]: number[] = [2 * x ** 3 - 3 * x ** 2 + 1, x ** 3 - 2 * x ** 2 + x, -2 * x ** 3 + 3 * x ** 2, x ** 3 - x ** 2];
      const [g00, g10, g01, g11]: number[] = [6 * x ** 2 - 6 * x, 3 * x ** 2 - 4 * x + 1, -6 * x ** 2 + 6 * x, 3 * x ** 2 - 2 * x];
      const out: (c: 0 | 1) => [number, number] = (c: 0 | 1): [number, number] => [
        h00! * points[i]![c] + h10! * H * D[i]![c] + h01! * points[i + 1]![c] + h11! * H * D[i + 1]![c],
        (g00! * points[i]![c]) / H + g10! * D[i]![c] + (g01! * points[i + 1]![c]) / H + g11! * D[i + 1]![c],
      ];
      const [px, dx]: [number, number] = out(0);
      const [py, dy]: [number, number] = out(1);
      return { p: [px, py], d: [dx, dy] };
    };
    // Arclength of span i from 0 to s: 8-point Gauss-Legendre on the speed.
    const partial: (i: number, s: number) => number = (i: number, s: number): number => {
      let total: number = 0;
      for (let q: number = 0; q < 8; ++q) {
        const d: [number, number] = span(i, (s * (1 + GAUSS[q]![0])) / 2).d;
        total += GAUSS[q]![1] * Math.hypot(d[0], d[1]);
      }
      return (total * s) / 2;
    };
    const lengths: number[] = h.map((H: number, i: number): number => partial(i, H));
    const length: number = lengths.reduce((x: number, y: number): number => x + y, 0);
    const world: (p: [number, number]) => Vec3 = (p: [number, number]): Vec3 => add(A, add(scale(e1, p[0]), scale(e2, p[1])));
    return {
      ends: [A, B],
      normal,
      length,
      at: (t: number): IPoint => {
        let target: number = Math.min(1, Math.max(0, t)) * length;
        let i: number = 0;
        while (i < lengths.length - 1 && target > lengths[i]!) target -= lengths[i++]!;
        let lo: number = 0;
        let hi: number = h[i]!;
        for (let step: number = 0; step < 52; ++step) {
          const mid: number = (lo + hi) / 2;
          if (partial(i, mid) < target) lo = mid;
          else hi = mid;
        }
        const at: { p: [number, number]; d: [number, number] } = span(i, (lo + hi) / 2);
        const d: Vec3 | null = unit(add(scale(e1, at.d[0]), scale(e2, at.d[1])));
        return { point: world(at.p), tangent: d ?? e1 };
      },
    };
  }

  /** 8-point Gauss-Legendre nodes and weights on [-1, 1]. */
  const GAUSS: [number, number][] = [
    [-0.9602898564975363, 0.1012285362903763],
    [-0.7966664774136267, 0.2223810344533745],
    [-0.525532409916329, 0.3137066458778873],
    [-0.1834346424956498, 0.362683783378362],
    [0.1834346424956498, 0.362683783378362],
    [0.525532409916329, 0.3137066458778873],
    [0.7966664774136267, 0.2223810344533745],
    [0.9602898564975363, 0.1012285362903763],
  ];
}
