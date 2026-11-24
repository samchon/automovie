import { AutoMovieLoftAdmissionError, decomposeAutoMovieSingularMatrix } from "@automovie/engine";
import type { AutoMovieVector3Tuple, IAutoMovieHumanLandmarkSurface, IAutoMovieSolidSurface } from "@automovie/interface";

/**
 * A dividing surface through landmarks about a centre: the surface two neighbouring parts take complementary sides of, so that no skin
 * is fitted twice and the curve they meet on is one curve.
 *
 * The landmarks' least-squares plane is the surface's base; its normal points toward `toward`. The centre is projected onto that plane.
 * About it, in the plane's own polar chart, the surface stands off the plane by an offset that is the periodic natural cubic through
 * the landmarks' offsets at their phases: a graph over the plane that passes through every landmark. A point is on the far side where
 * its own offset exceeds the surface's at its phase.
 *
 * It is the armscye's landmark loop as `test/src/reference-conics/FamilyConicLoop.ts` builds it for the fit (construction.md, Ports:
 * "The loop passes through the landmarks that define it by their published definitions"), without the reference: the fit clips the
 * trunk and the arm by that surface, and the figure cuts the arm's own skin by the same surface to find where the two meet.
 */
export namespace AutoMovieHumanLandmarkSurface {
  type V = readonly number[];

  /** The canonical landmark divider and base plane. */
  export type ISurface = IAutoMovieHumanLandmarkSurface.ISurface;

  /**
   * Build the surface.
   *
   * @param centre The point the polar chart turns about, mm: a joint centre between the landmarks.
   * @param landmarks At least three points of the surface, mm, not collinear and at distinct phases about the centre.
   * @param toward A point on the far side, mm.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The plane's normal is the least right singular direction of the centred landmark rows; the offsets are joined by the periodic natural cubic, whose second derivatives solve one cyclic system.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Plane, chart, spline, one closure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Collinear landmarks, an unresolved least singular direction, a coplanar facing datum, duplicate phases and a centre on a landmark are refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms A bounded three-column Jacobi decomposition and one elimination in the landmark count; each read is linear in it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The plane, the chart and the spline are prepared once and serve every read.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure retains the knots and their second derivatives.
   * @evidence contracts/development/common.md#meaningful-documentation States each input's role and each refusal.
   */
  export function create(centre: V, landmarks: readonly V[], toward: V): ISurface {
    if (landmarks.length < 3) throw new Error("landmark surface needs at least three landmarks");
    const sub = (a: V, b: V): [number, number, number] => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
    const dot = (a: V, b: V): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
    const cross = (a: V, b: V): [number, number, number] => [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
    const unit = (a: V): [number, number, number] => {
      const l: number = Math.hypot(a[0]!, a[1]!, a[2]!);
      return [a[0]! / l, a[1]! / l, a[2]! / l];
    };
    const wrap = (a: number): number => a - 2 * Math.PI * Math.floor(a / (2 * Math.PI));

    const mean: [number, number, number] = [0, 1, 2].map((k: number): number => landmarks.reduce((sum: number, p: V): number => sum + p[k]!, 0) / landmarks.length) as [number, number, number];
    const plane = decomposeAutoMovieSingularMatrix(
      landmarks.map((point: V): number[] => sub(point, mean)),
      { maxEntries: 3 * landmarks.length, maxSweeps: 32, orthogonalityTolerance: 64 * Number.EPSILON },
    );
    const [first, second, third] = plane.singularValues;
    if (plane.numericalRank < 2)
      throw new Error("landmark surface: collinear landmarks");
    if (!(second! - third! > first! * plane.relativeNullCutoff))
      throw new Error("landmark surface: no unique least-squares normal");
    let n: [number, number, number] = unit(plane.rightColumns[2]!);
    const target = sub(toward, mean);
    const facing: number = dot(n, target);
    if (!(Math.abs(facing) > Math.hypot(...target) * plane.relativeNullCutoff))
      throw new Error("landmark surface: the facing datum lies in the plane");
    if (facing < 0) n = [-n[0], -n[1], -n[2]];

    const offsetOfCentre: number = dot(sub(centre, mean), n);
    const origin: [number, number, number] = [
      centre[0]! - offsetOfCentre * n[0],
      centre[1]! - offsetOfCentre * n[1],
      centre[2]! - offsetOfCentre * n[2],
    ];
    // Use an authored direction in its own plane so the gauge follows a rotated landmark set.
    const firstLandmark = sub(landmarks[0]!, origin);
    const miss: number = dot(firstLandmark, n);
    const gauge: [number, number, number] = [
      firstLandmark[0] - miss * n[0],
      firstLandmark[1] - miss * n[1],
      firstLandmark[2] - miss * n[2],
    ];
    if (!(Math.hypot(...gauge) > Math.hypot(...firstLandmark) * plane.relativeNullCutoff))
      throw new Error("landmark surface: the centre stands on a landmark");
    const pu: [number, number, number] = unit(gauge);
    const pv: [number, number, number] = cross(pu, n);
    const polar = (p: V): { theta: number; off: number; r: number } => {
      const q: [number, number, number] = sub(p, origin);
      return { theta: wrap(Math.atan2(dot(q, pv), dot(q, pu))), off: dot(q, n), r: Math.hypot(dot(q, pu), dot(q, pv)) };
    };
    const knots: { theta: number; off: number; r: number }[] = landmarks.map(polar).sort((a: { theta: number }, b: { theta: number }): number => a.theta - b.theta);
    const K: number = knots.length;
    if (knots.some((k: { r: number }): boolean => !(k.r > 0))) throw new Error("landmark surface: the centre stands on a landmark");
    const h: number[] = knots.map((k: { theta: number }, i: number): number => (i + 1 < K ? knots[i + 1]!.theta - k.theta : knots[0]!.theta + 2 * Math.PI - k.theta));
    if (h.some((step: number): boolean => !(step > 0))) throw new Error("landmark surface: two landmarks stand at one phase about the centre");

    // The periodic natural cubic's second derivatives: one cyclic tridiagonal system, by elimination.
    const G: number[][] = knots.map((_: unknown, i: number): number[] => {
      const row: number[] = new Array<number>(K + 1).fill(0);
      const [before, after]: [number, number] = [(i - 1 + K) % K, (i + 1) % K];
      row[before] = row[before]! + h[before]!;
      row[i] = row[i]! + 2 * (h[before]! + h[i]!);
      row[after] = row[after]! + h[i]!;
      row[K] = 6 * ((knots[after]!.off - knots[i]!.off) / h[i]! - (knots[i]!.off - knots[before]!.off) / h[before]!);
      return row;
    });
    for (let c: number = 0; c < K; ++c) {
      let pivot: number = c;
      for (let r: number = c + 1; r < K; ++r) if (Math.abs(G[r]![c]!) > Math.abs(G[pivot]![c]!)) pivot = r;
      [G[c], G[pivot]] = [G[pivot]!, G[c]!];
      for (let r: number = 0; r < K; ++r) {
        if (r === c) continue;
        const m: number = G[r]![c]! / G[c]![c]!;
        for (let k: number = c; k <= K; ++k) G[r]![k] = G[r]![k]! - m * G[c]![k]!;
      }
    }
    const M: number[] = G.map((row: number[], i: number): number => row[K]! / row[i]!);
    const derivatives = (theta: number): [number, number, number] => {
      const t: number = wrap(theta);
      let i: number = K - 1;
      for (let k: number = 0; k < K; ++k) if (t >= knots[k]!.theta) i = k;
      let x: number = t - knots[i]!.theta;
      if (x < 0) x += 2 * Math.PI;
      const [after, step]: [number, number] = [(i + 1) % K, h[i]!];
      const left: number = step - x;
      const m0: number = M[i]!, m1: number = M[after]!;
      const a: number = knots[i]!.off / step - m0 * step / 6;
      const b: number = knots[after]!.off / step - m1 * step / 6;
      return [(m0 * left ** 3 + m1 * x ** 3) / (6 * step) + a * left + b * x,
        (-m0 * left ** 2 + m1 * x ** 2) / (2 * step) - a + b, (m0 * left + m1 * x) / step];
    };
    return {
      origin,
      normal: n,
      address: (p: V): [number, number] => { const q = polar(p); return [q.r, q.theta]; },
      jet: (r: number, theta: number): IAutoMovieSolidSurface.IJet => {
        if (r === 0 && Number.isFinite(theta))
          throw new AutoMovieLoftAdmissionError("the landmark divider has no regular polar jet at its centre");
        if (!(Number.isFinite(r) && r > 0 && Number.isFinite(theta))) throw new Error("the landmark divider needs a positive finite polar radius and phase");
        const [height, rise, bend] = derivatives(theta);
        const c: number = Math.cos(theta), s: number = Math.sin(theta);
        const e: AutoMovieVector3Tuple = [0, 1, 2].map((j): number => c * pu[j]! + s * pv[j]!) as AutoMovieVector3Tuple;
        const d: AutoMovieVector3Tuple = [0, 1, 2].map((j): number => -s * pu[j]! + c * pv[j]!) as AutoMovieVector3Tuple;
        const sum = (a: V, b: V, k: number, t: number): AutoMovieVector3Tuple =>
          [k * a[0]! + t * b[0]!, k * a[1]! + t * b[1]!, k * a[2]! + t * b[2]!];
        const q: AutoMovieVector3Tuple = sum(e, n, r, height);
        return { p: sum(origin, q, 1, 1), u: e, v: sum(d, n, r, rise),
          uu: [0, 0, 0], uv: d, vv: sum(e, n, -r, bend) };
      },
      side: (p: V): number => {
        const q: { theta: number; off: number } = polar(p);
        return q.off - derivatives(q.theta)[0];
      },
    };
  }

  /**
   * A plane as a divider: the same polar chart about `origin` as `create` gives, with no offset off the base plane.
   *
   * @param origin The point the polar chart turns about, mm.
   * @param normal The plane's normal, toward the far side; any length.
   * @param gauge A direction not along the normal: its part in the plane is phase 0.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The plane's polar chart with `create`'s conventions: phase 0 along the gauge, the parameter cross product against the normal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame and one closure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A zero normal, a gauge along the normal and a jet at the centre are refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The joint loop's master reads it as it reads a landmark surface.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure retains the frame only.
   * @evidence contracts/development/common.md#meaningful-documentation States the chart and its refusals.
   */
  export function plane(origin: V, normal: V, gauge: V): ISurface {
    const length: number = Math.hypot(normal[0]!, normal[1]!, normal[2]!);
    if (!(length > 0)) throw new Error("plane divider: the normal has no length");
    const n: AutoMovieVector3Tuple = [normal[0]! / length, normal[1]! / length, normal[2]! / length];
    const along: number = gauge[0]! * n[0] + gauge[1]! * n[1] + gauge[2]! * n[2];
    const g: AutoMovieVector3Tuple = [gauge[0]! - along * n[0], gauge[1]! - along * n[1], gauge[2]! - along * n[2]];
    const gl: number = Math.hypot(...g);
    if (!(gl > 1e-9 * Math.hypot(gauge[0]!, gauge[1]!, gauge[2]!))) throw new Error("plane divider: the gauge lies along the normal");
    const pu: AutoMovieVector3Tuple = [g[0] / gl, g[1] / gl, g[2] / gl];
    const pv: AutoMovieVector3Tuple = [pu[1] * n[2] - pu[2] * n[1], pu[2] * n[0] - pu[0] * n[2], pu[0] * n[1] - pu[1] * n[0]];
    const o: AutoMovieVector3Tuple = [origin[0]!, origin[1]!, origin[2]!];
    const dot = (a: V, b: V): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
    const sub = (p: V): AutoMovieVector3Tuple => [p[0]! - o[0], p[1]! - o[1], p[2]! - o[2]];
    return {
      origin: o,
      normal: n,
      address: (p: V): [number, number] => {
        const q = sub(p), theta: number = Math.atan2(dot(q, pv), dot(q, pu));
        return [Math.hypot(dot(q, pu), dot(q, pv)), theta - 2 * Math.PI * Math.floor(theta / (2 * Math.PI))];
      },
      jet: (r: number, theta: number): IAutoMovieSolidSurface.IJet => {
        if (r === 0 && Number.isFinite(theta)) throw new AutoMovieLoftAdmissionError("the plane divider has no regular polar jet at its centre");
        if (!(Number.isFinite(r) && r > 0 && Number.isFinite(theta))) throw new Error("the plane divider needs a positive finite polar radius and phase");
        const c: number = Math.cos(theta), s: number = Math.sin(theta);
        const e: AutoMovieVector3Tuple = [c * pu[0] + s * pv[0], c * pu[1] + s * pv[1], c * pu[2] + s * pv[2]];
        const d: AutoMovieVector3Tuple = [-s * pu[0] + c * pv[0], -s * pu[1] + c * pv[1], -s * pu[2] + c * pv[2]];
        return { p: [o[0] + r * e[0], o[1] + r * e[1], o[2] + r * e[2]], u: e, v: [r * d[0], r * d[1], r * d[2]],
          uu: [0, 0, 0], uv: d, vv: [-r * e[0], -r * e[1], -r * e[2]] };
      },
      side: (p: V): number => dot(sub(p), n),
    };
  }
}
