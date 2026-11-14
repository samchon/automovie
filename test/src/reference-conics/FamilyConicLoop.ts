import type { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * The armscye as a landmark loop on the reference's skin, and the side of it a point lies on.
 *
 * Construction.md, Ports: "The loop passes through the landmarks that define it by their published definitions, such as the armscye over
 * the shoulder joint, the anterior and posterior axillary folds and the axilla" (ASTM D5219 and ISO 8559-1, the armscye girth). The four
 * landmarks are f1's traced points (the skin straight above the shoulder joint; the slit's two upper ends; the slit's apex), each moved
 * onto the skin. The loop is a graph over the least-squares plane through them: from the shoulder joint's projection on that plane, the
 * ray at each phase is lifted along the plane's normal by an offset that is the periodic C2 cubic spline through the four landmarks'
 * offsets, and the loop's point is where the ray meets the skin. The skin's ray lengths jitter across the mesh's facets, so the loop's
 * reach is the least-squares periodic uniform cubic B-spline with a control every 15 degrees through them, held through the four
 * landmarks (lofting.md: "fair each section to the scale of the form"). Measured on f1 (step 2): girth 387.6 mm, mean 0.24 mm from the
 * skin along the rays, worst 2.57 mm behind the saddle, the four landmarks at 0.00 mm.
 *
 * A point is on the arm's side where its offset along the normal exceeds the loop's offset at its phase: the surface swept by the
 * lifted rays divides the shoulder into the arm's skin and the trunk's.
 */
export namespace FamilyConicLoop {
  type V = [number, number, number];

  /** The loop and its side test, for the +Z arm; the -Z arm's is the reflection in `z = 0`. */
  export interface ILoop {
    /** The loop's points on the skin, `SAMPLES` of them at equal phase steps, mm. */
    points: V[];

    /** The four landmarks on the skin: acromion, anterior and posterior axillary points, axilla. */
    landmarks: V[];

    /** How far a point stands past the loop toward the arm, mm along the plane's normal; positive on the arm's side. */
    side: (p: V) => number;

    /**
     * The loop's parallel on the skin `distance` mm from it (negative: toward the trunk), `SAMPLES` points at the loop's own phases: each
     * ray's plane lifted along the normal by at most the distance, so its skin point stands no farther than that from the loop's, and the
     * lifts and the reach faired as the loop's reach is.
     */
    parallel: (distance: number) => V[];
  }

  /** Phases round the loop. */
  export const SAMPLES: number = 720;

  /**
   * f1's traced landmarks, mm: the skin straight above the shoulder joint `upperarm_r` (a ray up from the joint), the axillary slit's
   * front and back upper ends and its apex (the slit-top web of the reference at y 1306 and 1276.5).
   */
  export const LANDMARKS: V[] = [[-16.3, 1406.6, 142.2], [23.3, 1306, 156.6], [-63.1, 1306, 161.6], [-22.0, 1276.5, 148.0]];

  const add = (a: V, b: V, s: number = 1): V => [a[0] + s * b[0], a[1] + s * b[1], a[2] + s * b[2]];
  const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = (a: V): V => {
    const l: number = Math.hypot(a[0], a[1], a[2]);
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  const wrap = (a: number): number => a - 2 * Math.PI * Math.floor(a / (2 * Math.PI));
  const solve = (G: number[][]): number[] => {
    const n: number = G.length;
    for (let c: number = 0; c < n; c++) {
      let piv: number = c;
      for (let r: number = c + 1; r < n; r++) if (Math.abs(G[r]![c]!) > Math.abs(G[piv]![c]!)) piv = r;
      [G[c], G[piv]] = [G[piv]!, G[c]!];
      for (let r: number = 0; r < n; r++) {
        if (r === c) continue;
        const m: number = G[r]![c]! / G[c]![c]!;
        for (let k: number = c; k <= n; k++) G[r]![k]! -= m * G[c]![k]!;
      }
    }
    return G.map((r: number[], i: number): number => r[n]! / r[i]!);
  };

  /** Build the loop on the reference's whole skin. */
  export function build(source: R.ISource): ILoop {
    const body = source.all;
    const shoulder: V = source.joints.get("upperarm_r")!;
    const elbow: V = source.joints.get("lowerarm_r")!;
    const tris: [V, V, V][] = [];
    for (let t: number = 0; t + 2 < body.indices.length; t += 3) {
      const tri = [0, 1, 2].map((k: number): V => [body.positions[body.indices[t + k]! * 3]!, body.positions[body.indices[t + k]! * 3 + 1]!, body.positions[body.indices[t + k]! * 3 + 2]!]) as [V, V, V];
      if (tri.some((p: V): boolean => Math.hypot(...sub(p, shoulder)) < 190)) tris.push(tri);
    }
    const ray = (o: V, d: V): number => {
      let best: number = Infinity;
      for (const [a, b, c] of tris) {
        const e1: V = sub(b, a), e2: V = sub(c, a), p: V = cross(d, e2);
        const det: number = dot(e1, p);
        if (Math.abs(det) < 1e-12) continue;
        const s: V = sub(o, a);
        const u: number = dot(s, p) / det;
        if (u < 0 || u > 1) continue;
        const q: V = cross(s, e1);
        const v: number = dot(d, q) / det;
        if (v < 0 || u + v > 1) continue;
        const l: number = dot(e2, q) / det;
        if (l > 0 && l < best) best = l;
      }
      return best;
    };
    // The closest point on the skin (Ericson, Real-Time Collision Detection 5.1.5).
    const onSkin = (p: V): V => {
      let best: V = p, bd: number = Infinity;
      for (const [a, b, c] of tris) {
        const ab: V = sub(b, a), ac: V = sub(c, a), ap: V = sub(p, a);
        const d1: number = dot(ab, ap), d2: number = dot(ac, ap);
        let q: V;
        if (d1 <= 0 && d2 <= 0) q = a;
        else {
          const bp: V = sub(p, b);
          const d3: number = dot(ab, bp), d4: number = dot(ac, bp);
          if (d3 >= 0 && d4 <= d3) q = b;
          else {
            const vc: number = d1 * d4 - d3 * d2;
            if (vc <= 0 && d1 >= 0 && d3 <= 0) q = add(a, ab, d1 / (d1 - d3));
            else {
              const cp: V = sub(p, c);
              const d5: number = dot(ab, cp), d6: number = dot(ac, cp);
              if (d6 >= 0 && d5 <= d6) q = c;
              else {
                const vb: number = d5 * d2 - d1 * d6;
                if (vb <= 0 && d2 >= 0 && d6 <= 0) q = add(a, ac, d2 / (d2 - d6));
                else {
                  const va: number = d3 * d6 - d5 * d4;
                  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) q = add(b, sub(c, b), (d4 - d3) / (d4 - d3 + (d5 - d6)));
                  else {
                    const den: number = 1 / (va + vb + vc);
                    q = add(add(a, ab, vb * den), ac, vc * den);
                  }
                }
              }
            }
          }
        }
        const d: number = Math.hypot(...sub(q, p));
        if (d < bd) [bd, best] = [d, q];
      }
      return best;
    };
    // The least-squares plane through the four landmarks: its normal the smallest eigenvector of their scatter, toward the arm.
    const centre: V = LANDMARKS.reduce((s: V, p: V): V => add(s, p, 1 / 4), [0, 0, 0]);
    const S: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (const p of LANDMARKS) {
      const q: V = sub(p, centre);
      for (let i: number = 0; i < 3; i++) for (let j: number = 0; j < 3; j++) S[i]![j]! += q[i]! * q[j]!;
    }
    const tr: number = S[0]![0]! + S[1]![1]! + S[2]![2]!;
    let n: V = [0, 0, 1];
    for (let k: number = 0; k < 200; k++) n = unit([0, 1, 2].map((i: number): number => tr * n[i]! - (S[i]![0]! * n[0] + S[i]![1]! * n[1] + S[i]![2]! * n[2])) as V);
    if (dot(n, sub(elbow, centre)) < 0) n = [-n[0], -n[1], -n[2]];
    const pu: V = unit(cross(n, [0, 1, 0]));
    const pv: V = cross(pu, n);
    const o0: V = add(shoulder, n, -dot(sub(shoulder, centre), n));
    const polar = (p: V): { theta: number; off: number; r: number } => {
      const q: V = sub(p, o0);
      return { theta: wrap(Math.atan2(dot(q, pv), dot(q, pu))), off: dot(q, n), r: Math.hypot(dot(q, pu), dot(q, pv)) };
    };
    const landmarks: V[] = LANDMARKS.map(onSkin);
    const knots = landmarks.map(polar).sort((a, b): number => a.theta - b.theta);
    const K: number = knots.length;
    const h: number[] = knots.map((k, i: number): number => (i + 1 < K ? knots[i + 1]!.theta - k.theta : knots[0]!.theta + 2 * Math.PI - k.theta));
    const M: number[] = solve(
      knots.map((_, i: number): number[] => {
        const row: number[] = new Array<number>(K + 1).fill(0);
        const im: number = (i - 1 + K) % K, ip: number = (i + 1) % K;
        row[im]! += h[im]!;
        row[i]! += 2 * (h[im]! + h[i]!);
        row[ip]! += h[i]!;
        row[K] = 6 * ((knots[ip]!.off - knots[i]!.off) / h[i]! - (knots[i]!.off - knots[im]!.off) / h[im]!);
        return row;
      }),
    );
    const delta = (theta: number): number => {
      const t: number = wrap(theta);
      let i: number = K - 1;
      for (let k: number = 0; k < K; k++) if (t >= knots[k]!.theta) i = k;
      let x: number = t - knots[i]!.theta;
      if (x < 0) x += 2 * Math.PI;
      const ip: number = (i + 1) % K, hi: number = h[i]!;
      return (M[i]! * (hi - x) ** 3 + M[ip]! * x ** 3) / (6 * hi) + (knots[i]!.off / hi - (M[i]! * hi) / 6) * (hi - x) + (knots[ip]!.off / hi - (M[ip]! * hi) / 6) * x;
    };
    const dir = (th: number): V => [0, 1, 2].map((i: number): number => Math.cos(th) * pu[i]! + Math.sin(th) * pv[i]!) as V;
    const reach: number[] = Array.from({ length: SAMPLES }, (_, k: number): number => ray(add(o0, n, delta((2 * Math.PI * k) / SAMPLES)), dir((2 * Math.PI * k) / SAMPLES)));
    const NB: number = 24;
    const basis = (th: number): [number, number][] => {
      const u: number = (wrap(th) / (2 * Math.PI)) * NB;
      const i: number = Math.floor(u);
      const t: number = u - i;
      return [[(i - 1 + NB) % NB, (1 - t) ** 3 / 6], [i % NB, (3 * t ** 3 - 6 * t ** 2 + 4) / 6], [(i + 1) % NB, (-3 * t ** 3 + 3 * t ** 2 + 3 * t + 1) / 6], [(i + 2) % NB, t ** 3 / 6]];
    };
    const G: number[][] = Array.from({ length: NB }, (): number[] => new Array<number>(NB + 1).fill(0));
    const put = (th: number, value: number, weight: number): void => {
      const b = basis(th);
      for (const [i, wi] of b) {
        for (const [j, wj] of b) G[i]![j]! += weight * wi * wj;
        G[i]![NB]! += weight * wi * value;
      }
    };
    reach.forEach((r: number, k: number): void => {
      if (Number.isFinite(r)) put((2 * Math.PI * k) / SAMPLES, r, 1);
    });
    for (const kn of knots) put(kn.theta, kn.r, 1e8);
    const ctrl: number[] = solve(G);
    const radius = (th: number): number => basis(th).reduce((s: number, [i, w]): number => s + w * ctrl[i]!, 0);
    const points: V[] = Array.from({ length: SAMPLES }, (_, k: number): V => {
      const th: number = (2 * Math.PI * k) / SAMPLES;
      return add(add(o0, n, delta(th)), dir(th), radius(th));
    });
    // The loop's parallel `distance` mm from it on the skin, toward the trunk for a negative distance: at each phase the ray's plane is
    // lifted along the normal by the amount, at most the distance, whose skin point stands that far from the loop's own (bisection on the
    // raw rays). Over the shoulder's top and the sides the normal runs along the skin and the lift is the whole distance; under the axilla
    // the skin turns level, and a lift of 6 mm there carried the ray past the vault onto the chest 30 mm below the loop. The lifts and
    // then the reach are faired by the loop's own B-spline, no landmark held (none lies on the parallel).
    const fair = (values: readonly number[]): ((th: number) => number) => {
      const F: number[][] = Array.from({ length: NB }, (): number[] => new Array<number>(NB + 1).fill(0));
      values.forEach((value: number, k: number): void => {
        if (!Number.isFinite(value)) return;
        const b = basis((2 * Math.PI * k) / SAMPLES);
        for (const [i, wi] of b) {
          for (const [j, wj] of b) F[i]![j]! += wi * wj;
          F[i]![NB]! += wi * value;
        }
      });
      const c: number[] = solve(F);
      return (th: number): number => basis(th).reduce((s: number, [i, w]): number => s + w * c[i]!, 0);
    };
    const parallel = (distance: number): V[] => {
      const at = (th: number, lift: number): V => add(add(o0, n, delta(th) + lift), dir(th), ray(add(o0, n, delta(th) + lift), dir(th)));
      const lifts: number[] = Array.from({ length: SAMPLES }, (_, k: number): number => {
        const th: number = (2 * Math.PI * k) / SAMPLES;
        const home: V = points[k]!;
        const far = (lift: number): number => Math.hypot(...sub(at(th, lift), home));
        if (!(far(distance) > Math.abs(distance))) return distance;
        let [near, out]: number[] = [0, distance];
        for (let i: number = 0; i < 24; i++) {
          const middle: number = (near! + out!) / 2;
          if (far(middle) > Math.abs(distance)) out = middle;
          else near = middle;
        }
        return near!;
      });
      const lift: (th: number) => number = fair(lifts);
      const reach: (th: number) => number = fair(Array.from({ length: SAMPLES }, (_, k: number): number => {
        const th: number = (2 * Math.PI * k) / SAMPLES;
        return ray(add(o0, n, delta(th) + lift(th)), dir(th));
      }));
      return Array.from({ length: SAMPLES }, (_, k: number): V => {
        const th: number = (2 * Math.PI * k) / SAMPLES;
        return add(add(o0, n, delta(th) + lift(th)), dir(th), reach(th));
      });
    };
    return {
      points,
      landmarks,
      parallel,
      side: (p: V): number => {
        const q = polar(p);
        return q.off - delta(q.theta);
      },
    };
  }
}
