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

  /**
   * The surface.
   *
   * @evidence contracts/development/design.md#principled-representation The base plane's frame and one reading: the signed distance past the surface along the plane's normal.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each member is read by the loop's generator or its test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No radius is stored: where the surface meets a skin is the reader's to find on that skin.
   * @evidence contracts/development/common.md#meaningful-documentation Members state frames and units.
   */
  export interface ISurface {
    /** The centre projected onto the base plane, mm. */
    origin: [number, number, number];

    /** The base plane's unit normal, toward the far side. */
    normal: [number, number, number];

    /** How far a point stands past the surface along the normal, mm; positive on the far side. */
    side: (p: V) => number;
  }

  /**
   * Build the surface.
   *
   * @param centre The point the polar chart turns about, mm: a joint centre between the landmarks.
   * @param landmarks At least three points of the surface, mm, not collinear and at distinct phases about the centre.
   * @param toward A point on the far side, mm.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The plane's normal is the eigenvector of the landmarks' scatter with the least eigenvalue, found by power iteration on `trace I - S`; the offsets are joined by the periodic natural cubic, whose second derivatives solve one cyclic system.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Plane, chart, spline, one closure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Fewer than three landmarks, landmarks at one phase and a centre on a landmark are refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms A fixed 200 iterations for the normal and one elimination in the landmark count; each read is linear in it.
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
    const S: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (const p of landmarks) {
      const q: [number, number, number] = sub(p, mean);
      for (let i: number = 0; i < 3; ++i) for (let j: number = 0; j < 3; ++j) S[i]![j] = S[i]![j]! + q[i]! * q[j]!;
    }
    const trace: number = S[0]![0]! + S[1]![1]! + S[2]![2]!;
    let n: [number, number, number] = [0, 0, 1];
    for (let k: number = 0; k < 200; ++k) n = unit([0, 1, 2].map((i: number): number => trace * n[i]! - (S[i]![0]! * n[0] + S[i]![1]! * n[1] + S[i]![2]! * n[2])));
    if (dot(n, sub(toward, mean)) < 0) n = [-n[0], -n[1], -n[2]];

    // The plane's chart: `pu` level where the normal is not upright, as the fit's.
    const pu: [number, number, number] = unit(cross(n, [0, 1, 0]));
    const pv: [number, number, number] = cross(pu, n);
    const origin: [number, number, number] = [0, 1, 2].map((k: number): number => centre[k]! - dot(sub(centre, mean), n) * n[k]!) as [number, number, number];
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
    const offset = (theta: number): number => {
      const t: number = wrap(theta);
      let i: number = K - 1;
      for (let k: number = 0; k < K; ++k) if (t >= knots[k]!.theta) i = k;
      let x: number = t - knots[i]!.theta;
      if (x < 0) x += 2 * Math.PI;
      const [after, step]: [number, number] = [(i + 1) % K, h[i]!];
      return (M[i]! * (step - x) ** 3 + M[after]! * x ** 3) / (6 * step) + (knots[i]!.off / step - (M[i]! * step) / 6) * (step - x) + (knots[after]!.off / step - (M[after]! * step) / 6) * x;
    };
    return {
      origin,
      normal: n,
      side: (p: V): number => {
        const q: { theta: number; off: number } = polar(p);
        return q.off - offset(q.theta);
      },
    };
  }
}
