import { AutoMovieHumanRelief } from "../network/AutoMovieHumanRelief";
import { AutoMovieHumanLoftChain } from "./AutoMovieHumanLoftChain";
import { AutoMovieHumanSplineCurve } from "./AutoMovieHumanSplineCurve";
import { AutoMovieHumanStationHermite } from "./AutoMovieHumanStationHermite";
import type { IAutoMovieHumanLoftChain } from "./IAutoMovieHumanLoftChain";

/**
 * A chain's surface point with its exact first and second derivatives in
 * station and phase.
 *
 * A chain expanded with its jets (every layer carrying its plane, the
 * plane's station derivatives and the coefficients' second derivatives)
 * is, between two layers, `P(s, t) = o(s) + x(s, t) u(s) + z(s, t) v(s)`
 * with every factor a quintic in station and the section a periodic cubic
 * B-spline in phase (the redesign plan's section 2), plus a lift along
 * `w = v x u` and its reliefs along their axes. Each derivative is then the
 * product rule over those factors, each factor's derivative exact:
 *
 * ```text
 * P_s  = o' + x_s u + x u' + z_s v + z v'
 * P_ss = o'' + x_ss u + 2 x_s u' + x u'' + (the same in z, v)
 * P_st = x_st u + x_t u' + z_st v + z_t v'
 * P_t  = x_t u + z_t v,   P_tt = x_tt u + z_tt v
 * ```
 *
 * The strips, the trims' and lids' cross derivatives and the shading
 * normals read these instead of differences of sampled points.
 */
export namespace AutoMovieHumanLoftJet {
  /** Point and partial derivatives, world mm per mm of station and per radian of phase. */
  export interface IJet {
    /** Surface point. */
    p: V;

    /** First station derivative. */
    s: V;

    /** First phase derivative. */
    t: V;

    /** Second station derivative. */
    ss: V;

    /** Mixed derivative. */
    st: V;

    /** Second phase derivative. */
    tt: V;
  }

  /**
   * Whether every layer of a chain carries the plane, its station
   * derivatives and the coefficients' second derivatives a jet needs.
   */
  export function carries(chain: IAutoMovieHumanLoftChain): boolean {
    return chain.layers.every(
      (l: IAutoMovieHumanLoftChain.ILayer): boolean =>
        l.curvatures !== undefined &&
        l.frame !== undefined &&
        l.frameSlopes !== undefined &&
        l.frameCurvatures !== undefined,
    );
  }

  /**
   * Jet of a chain at a chart point.
   *
   * @param chain Chain that {@link carries} jets.
   * @param s Station within the chain.
   * @param t Phase, radians.
   */
  export function at(
    chain: IAutoMovieHumanLoftChain,
    s: number,
    t: number,
  ): IJet {
    const [lo, hi] = AutoMovieHumanLoftChain.bracket(chain, s);
    const a: IAutoMovieHumanLoftChain.ILayer = chain.layers[lo]!;
    const b: IAutoMovieHumanLoftChain.ILayer = chain.layers[hi]!;
    const H: number = b.y - a.y;
    const u: number = Math.min(1, Math.max(0, (s - a.y) / H));
    const w: number[][] = [0, 1, 2].map((order: number): number[] =>
      AutoMovieHumanStationHermite.weights(u, H, order as 0 | 1 | 2, true),
    );

    // Section coefficients and plane, each with its two station derivatives.
    const ca: AutoMovieHumanStationHermite.IEnd = {
      value: a.coefficients,
      slope: a.slopes,
      curvature: a.curvatures!,
    };
    const cb: AutoMovieHumanStationHermite.IEnd = {
      value: b.coefficients,
      slope: b.slopes,
      curvature: b.curvatures!,
    };
    const c: number[][] = w.map((x: number[]): number[] =>
      AutoMovieHumanStationHermite.combine(ca, cb, x),
    );
    const fa: AutoMovieHumanStationHermite.IEnd = AutoMovieHumanStationHermite.frameEnd(a);
    const fb: AutoMovieHumanStationHermite.IEnd = AutoMovieHumanStationHermite.frameEnd(b);
    const f: number[][] = w.map((x: number[]): number[] =>
      AutoMovieHumanStationHermite.combine(fa, fb, x),
    );

    // Section values in the plane: x, z and their phase derivatives at the
    // value, the station slope and the station curvature of the coefficients.
    const n: number = chain.order;
    const q0: J = AutoMovieHumanSplineCurve.jet(c[0]!, n, t);
    const q1: J = AutoMovieHumanSplineCurve.jet(c[1]!, n, t);
    const q2: J = AutoMovieHumanSplineCurve.jet(c[2]!, n, t);
    const o: V[] = f.map((x: number[]): V => [x[0]!, x[1]!, x[2]!]);
    const U: V[] = f.map((x: number[]): V => [x[3]!, x[4]!, x[5]!]);
    const W: V[] = f.map((x: number[]): V => [x[6]!, x[7]!, x[8]!]);
    const jet: IJet = {
      p: sum(o[0]!, scale(U[0]!, q0[0]), scale(W[0]!, q0[1])),
      s: sum(
        o[1]!,
        scale(U[0]!, q1[0]),
        scale(U[1]!, q0[0]),
        scale(W[0]!, q1[1]),
        scale(W[1]!, q0[1]),
      ),
      t: sum(scale(U[0]!, q0[2]), scale(W[0]!, q0[3])),
      ss: sum(
        o[2]!,
        scale(U[0]!, q2[0]),
        scale(U[1]!, 2 * q1[0]),
        scale(U[2]!, q0[0]),
        scale(W[0]!, q2[1]),
        scale(W[1]!, 2 * q1[1]),
        scale(W[2]!, q0[1]),
      ),
      st: sum(
        scale(U[0]!, q1[2]),
        scale(U[1]!, q0[2]),
        scale(W[0]!, q1[3]),
        scale(W[1]!, q0[3]),
      ),
      tt: sum(scale(U[0]!, q0[4]), scale(W[0]!, q0[5])),
    };

    // The lift a shape law writes moves points along w = v x u by the cubic
    // Hermite of its values, as in AutoMovieHumanLoftChain.ring.
    if (a.lift !== undefined || b.lift !== undefined) lift(jet, a, b, u, H, n, t, U, W);

    // Reliefs move points along their fixed axes.
    for (const relief of chain.reliefs ?? []) {
      const h: number[] = AutoMovieHumanRelief.jet(relief, s, t);
      if (h.every((x: number): boolean => x === 0)) continue;
      const e: V = relief.axis;
      jet.p = sum(jet.p, scale(e, h[0]!));
      jet.s = sum(jet.s, scale(e, h[1]!));
      jet.t = sum(jet.t, scale(e, h[2]!));
      jet.ss = sum(jet.ss, scale(e, h[3]!));
      jet.st = sum(jet.st, scale(e, h[4]!));
      jet.tt = sum(jet.tt, scale(e, h[5]!));
    }
    return jet;
  }

  /** Unit normal `P_t x P_s` of a jet, or null where the surface is singular. */
  export function normal(jet: IJet): V | null {
    const n: V = cross(jet.t, jet.s);
    const l: number = Math.hypot(n[0], n[1], n[2]);
    return l > 1e-12 ? [n[0] / l, n[1] / l, n[2] / l] : null;
  }
}

/** A world vector, mm. */
type V = [number, number, number];

/** A section's `[x, z, x_t, z_t, x_tt, z_tt]` at one phase. */
type J = [number, number, number, number, number, number];

/**
 * Add the lift `h(s, t) w(s)` and its derivatives to a jet, `w = v x u`
 * with `w' = v' x u + v x u'` and `w'' = v'' x u + 2 v' x u' + v x u''`.
 */
function lift(
  jet: AutoMovieHumanLoftJet.IJet,
  a: IAutoMovieHumanLoftChain.ILayer,
  b: IAutoMovieHumanLoftChain.ILayer,
  u: number,
  H: number,
  n: number,
  t: number,
  U: V[],
  W: V[],
): void {
  const zero: number[] = new Array<number>(n).fill(0);
  const ea: AutoMovieHumanStationHermite.IEnd = {
    value: a.lift ?? zero,
    slope: a.liftSlopes ?? zero,
  };
  const eb: AutoMovieHumanStationHermite.IEnd = {
    value: b.lift ?? zero,
    slope: b.liftSlopes ?? zero,
  };
  const l: number[][] = [0, 1, 2].map((order: number): number[] =>
    AutoMovieHumanStationHermite.combine(
      ea,
      eb,
      AutoMovieHumanStationHermite.weights(u, H, order as 0 | 1 | 2, false),
    ),
  );

  // The lift values interpolate over phase as the x block of a section.
  const h: J[] = l.map(
    (x: number[]): J => AutoMovieHumanSplineCurve.jet([...x, ...x], n, t),
  );
  const w0: V = cross(W[0]!, U[0]!);
  const w1: V = sum(cross(W[1]!, U[0]!), cross(W[0]!, U[1]!));
  const w2: V = sum(cross(W[2]!, U[0]!), scale(cross(W[1]!, U[1]!), 2), cross(W[0]!, U[2]!));
  jet.p = sum(jet.p, scale(w0, h[0]![0]));
  jet.s = sum(jet.s, scale(w0, h[1]![0]), scale(w1, h[0]![0]));
  jet.t = sum(jet.t, scale(w0, h[0]![2]));
  jet.ss = sum(jet.ss, scale(w0, h[2]![0]), scale(w1, 2 * h[1]![0]), scale(w2, h[0]![0]));
  jet.st = sum(jet.st, scale(w0, h[1]![2]), scale(w1, h[0]![2]));
  jet.tt = sum(jet.tt, scale(w0, h[0]![4]));
}

/** Sum of vectors. */
function sum(...vs: V[]): V {
  const out: V = [0, 0, 0];
  for (const v of vs) for (let k: number = 0; k < 3; k++) out[k] += v[k]!;
  return out;
}

/** Vector times a scalar. */
function scale(v: readonly number[], k: number): V {
  return [v[0]! * k, v[1]! * k, v[2]! * k];
}

/** Cross product. */
function cross(a: V, b: V): V {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
