import { AutoMovieLoftChain } from "./AutoMovieLoftChain";
import { AutoMovieLoftCoefficientSource } from "./AutoMovieLoftCoefficientSource";
import { AutoMovieLoftFrameSource } from "./AutoMovieLoftFrameSource";
import { AutoMovieLoftRelief } from "./AutoMovieLoftRelief";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";
import { AutoMovieStationHermite } from "./AutoMovieStationHermite";
import type { AutoMovieViewAxisJet } from "./AutoMovieViewAxisJet";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/**
 * A chain's surface point with its exact first and second derivatives in
 * station and phase.
 *
 * A chain expanded with its jets (every layer carrying its plane, the
 * plane's station derivatives and the coefficients' second derivatives)
 * is, between two layers, `P(s, t) = o(s) + x(s, t) u(s) + z(s, t) v(s)`
 * with coefficient Hermite factors in physical station or a declared pole
 * coordinate, actual analytic frames or the existing component-plane fit,
 * and the unchanged periodic cubic phase spline, plus a lift along
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
 *
 * @evidence contracts/common.md#principled-implementation The chain's surface 2-jet is assembled from the station jets of coefficients, frame and lift by the product rule, so merge, diff and trim read exact first and second derivatives.
 * @evidence contracts/common.md#clear-and-simple-design One jet record and one evaluation per station and phase; `carries` states when a chain has the jets it needs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No derivative is a finite difference; a chain without its jets is refused by `carries`.
 * @evidence contracts/common.md#meaningful-documentation States each jet component and the terms of its product rule.
 * @evidence contracts/performance.md#efficient-algorithms A spline station combines only the four controls needed by a phase, once per visited control; its holey arrays and bitmap still allocate O(N) space. Other inputs retain eager combination.
 * @evidence contracts/performance.md#reuse-equivalent-work Each of the last eight inserted stations shares its Hermite weights, frame, visited controls and lift preparation across phases; hits do not reorder this cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A weak chain key owns at most eight station records, each with O(N) control storage; eviction releases that record, and returned jets own fresh vectors.
 */
export namespace AutoMovieLoftJet {
  /**
   * Point and partial derivatives, world mm per mm of station and per radian of phase.
   *
   * @evidence contracts/common.md#principled-implementation Names the point and all five first/second partial derivatives of one surface chart reading.
   * @evidence contracts/common.md#clear-and-simple-design Six vector fields carry value and derivative orders without hidden computed state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Describes exact chart derivatives; the type itself does not validate their numerical correctness or finiteness.
   * @evidence contracts/common.md#meaningful-documentation Each field names its derivative; station uses mm and phase radians.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This interface has no runtime algorithm; at owns its computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This value record coordinates no operations and owns no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns six returned vectors; the interface acquires no resource.
   */
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
   * This presence predicate does not validate basis, lengths or numeric values.
   *
   * @evidence contracts/common.md#principled-implementation Requires curvature and all three frame derivative orders on every layer before a caller chooses analytic jets.
   * @evidence contracts/common.md#clear-and-simple-design One short-circuiting every over the layer fields, without constructing a parallel model.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Tests field presence only, including the ordinary every semantics for an empty layer list; it is not a complete chain validator.
   * @evidence contracts/common.md#meaningful-documentation Lists the required fields and the validation this predicate does not perform.
   * @evidence contracts/performance.md#efficient-algorithms At most O(L) presence checks for L layers, stopping at the first incomplete layer and allocating no result collection.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure presence predicate coordinates no requests or reusable station preparation; at owns that cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reads the supplied chain and retains nothing after returning its boolean.
   */
  export function carries(chain: IAutoMovieLoftChain): boolean {
    return chain.layers.every(
      (l: IAutoMovieLoftChain.ILayer): boolean =>
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
   *
   * @evidence contracts/common.md#principled-implementation Combines the station Hermite and periodic cubic section jets with the written product rule, then adds lift and relief derivatives.
   * @evidence contracts/common.md#clear-and-simple-design Station preparation is shared; phase evaluation still uses the existing spline jet reader.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Keeps ordinary Hermite summation, phase wrapping, regular-layer bounds and returned vector ownership; explicit cap data changes only coefficient weights and actual-axis records supply their own frame derivatives.
   * @evidence contracts/common.md#meaningful-documentation States station and phase units and the surface product rule above.
   * @evidence contracts/performance.md#efficient-algorithms On a spline, a phase fills at most four previously unread controls in three derivative rows, including lift when present; array allocation remains linear in order.
   * @evidence contracts/performance.md#reuse-equivalent-work Station weights, frame and lift directions are prepared once, and each visited control is combined once while its station remains cached.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Uses the weak-key eight-station insertion cache and returns fresh mutable jet vectors, never a cached output jet.
   */
  export function at(chain: IAutoMovieLoftChain, s: number, t: number): IJet {
    // The station's part (its section coefficients and plane with their two
    // station derivatives) is the same for every phase, so the last stations
    // read per chain are kept; a chain is never changed once built.
    const station: IStation = stationOf(chain, s);
    const { c, f }: IStation = station;

    // Section values in the plane: x, z and their phase derivatives at the
    // value, the station slope and the station curvature of the coefficients.
    const n: number = chain.order;
    fill(station, n, t);
    const q0: J = AutoMovieSplineCurve.jet(c[0]!, n, t);
    const q1: J = AutoMovieSplineCurve.jet(c[1]!, n, t);
    const q2: J = AutoMovieSplineCurve.jet(c[2]!, n, t);
    const [f0, f1, f2] = f as [number[], number[], number[]];
    const o: V[] = [
      [f0[0]!, f0[1]!, f0[2]!],
      [f1[0]!, f1[1]!, f1[2]!],
      [f2[0]!, f2[1]!, f2[2]!],
    ];
    const U: V[] = [
      [f0[3]!, f0[4]!, f0[5]!],
      [f1[3]!, f1[4]!, f1[5]!],
      [f2[3]!, f2[4]!, f2[5]!],
    ];
    const W: V[] = [
      [f0[6]!, f0[7]!, f0[8]!],
      [f1[6]!, f1[7]!, f1[8]!],
      [f2[6]!, f2[7]!, f2[8]!],
    ];

    // Each component written out: the product rule over the plane's axes
    // and the section's values, with no intermediate vectors.
    const p: V = [0, 0, 0];
    const ds: V = [0, 0, 0];
    const dt: V = [0, 0, 0];
    const dss: V = [0, 0, 0];
    const dst: V = [0, 0, 0];
    const dtt: V = [0, 0, 0];
    for (let k: number = 0; k < 3; k++) {
      const u0: number = U[0]![k]!;
      const u1: number = U[1]![k]!;
      const u2: number = U[2]![k]!;
      const w0: number = W[0]![k]!;
      const w1: number = W[1]![k]!;
      const w2: number = W[2]![k]!;
      p[k] = o[0]![k]! + u0 * q0[0] + w0 * q0[1];
      ds[k] = o[1]![k]! + u0 * q1[0] + u1 * q0[0] + w0 * q1[1] + w1 * q0[1];
      dt[k] = u0 * q0[2] + w0 * q0[3];
      dss[k] =
        o[2]![k]! +
        u0 * q2[0] +
        2 * u1 * q1[0] +
        u2 * q0[0] +
        w0 * q2[1] +
        2 * w1 * q1[1] +
        w2 * q0[1];
      dst[k] = u0 * q1[2] + u1 * q0[2] + w0 * q1[3] + w1 * q0[3];
      dtt[k] = u0 * q0[4] + w0 * q0[5];
    }
    const jet: IJet = {
      p,
      s: ds,
      t: dt,
      ss: dss,
      st: dst,
      tt: dtt,
    };

    // The lift a shape law writes moves points along w = v x u by the station
    // Hermite of its values, quintic where it carries curvatures, as in AutoMovieLoftChain.ring.
    if (station.lift !== undefined) lift(jet, station.lift, n, t);

    // Reliefs move points along their fixed axes.
    for (const relief of chain.reliefs ?? []) {
      const h: number[] = AutoMovieLoftRelief.jet(relief, s, t);
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

  /** One interval's endpoint arrays, weights and combined derivative rows. */
  interface IControls {
    /** Lower endpoint, unchanged for the immutable chain's lifetime. */
    a: AutoMovieStationHermite.IEnd;
    /** Upper endpoint. */
    b: AutoMovieStationHermite.IEnd;
    /** Value, slope and curvature interpolation weights. */
    weights: number[][];
    /** Three coefficient rows; lazy rows contain holes until their support is read. */
    c: number[][];
  }

  /** A station's plane, section controls and optional lift controls. */
  interface IStation extends IControls {
    /** Plane and its first and second station derivatives. */
    f: number[][];
    /** One byte per spline control; absent for the original eager path. */
    filled?: Uint8Array;
    /** Lift preparation, independent of phase. */
    lift?: ILift;
  }

  /** Lift rows use identical x/z blocks for the existing spline reader. */
  interface ILift extends IControls {
    /** Normal direction and its first two station derivatives. */
    directions: V[];
  }

  /** Stations kept per chain. */
  const RECENT: number = 8;

  /** The kept stations, by chain. */
  const STATIONS: WeakMap<
    IAutoMovieLoftChain,
    { s: number; station: IStation }[]
  > = new WeakMap();

  /** A station's part of a jet, kept for the chain's last stations. */
  function stationOf(chain: IAutoMovieLoftChain, s: number): IStation {
    let kept: { s: number; station: IStation }[] | undefined =
      STATIONS.get(chain);
    if (kept === undefined) STATIONS.set(chain, (kept = []));
    for (const entry of kept) if (entry.s === s) return entry.station;
    const [lo, hi]: [number, number] = AutoMovieLoftChain.bracket(chain, s);
    const a: IAutoMovieLoftChain.ILayer = chain.layers[lo]!;
    const b: IAutoMovieLoftChain.ILayer = chain.layers[hi]!;
    const H: number = b.y - a.y;
    const u: number = Math.min(1, Math.max(0, (s - a.y) / H));
    const w: number[][] = [0, 1, 2].map((order: number): number[] =>
      AutoMovieStationHermite.weights(u, H, order as 0 | 1 | 2, true),
    );

    // Section coefficients and plane, each with its two station derivatives.
    const source: AutoMovieLoftCoefficientSource.IControls | null =
      AutoMovieLoftCoefficientSource.controls(chain, s);
    const coefficientWeights: number[][] =
      source === null
        ? w
        : [0, 1, 2].map((order: number): number[] =>
            AutoMovieLoftCoefficientSource.weights(source, order as 0 | 1 | 2),
          );
    const ca: AutoMovieStationHermite.IEnd = source?.a ?? {
      value: a.coefficients,
      slope: a.slopes,
      curvature: a.curvatures!,
    };
    const cb: AutoMovieStationHermite.IEnd = source?.b ?? {
      value: b.coefficients,
      slope: b.slopes,
      curvature: b.curvatures!,
    };
    const n: number = chain.order;
    const lazy: boolean =
      chain.basis === "spline" &&
      Number.isInteger(n) &&
      n > 0 &&
      a.coefficients.length === 2 * n &&
      b.coefficients.length === 2 * n &&
      liftFits(a, n) &&
      liftFits(b, n);
    const c: number[][] = coefficientWeights.map((x: number[]): number[] =>
      lazy
        ? new Array<number>(2 * n)
        : AutoMovieStationHermite.combine(ca, cb, x),
    );
    const actual: AutoMovieViewAxisJet.IJet | null =
      AutoMovieLoftFrameSource.actual(a, b, s);
    let f: number[][];
    if (actual !== null)
      f = [actual.value, actual.first, actual.second].map(
        (value: AutoMovieViewAxisJet.IJet["value"]): number[] => [
          ...value.origin,
          ...value.u,
          ...value.v,
        ],
      );
    else {
      const fa: AutoMovieStationHermite.IEnd =
        AutoMovieStationHermite.frameEnd(a);
      const fb: AutoMovieStationHermite.IEnd =
        AutoMovieStationHermite.frameEnd(b);
      f = w.map((x: number[]): number[] =>
        AutoMovieStationHermite.combine(fa, fb, x),
      );
    }
    const station: IStation = {
      a: ca,
      b: cb,
      weights: coefficientWeights,
      c,
      f,
    };
    if (lazy) station.filled = new Uint8Array(n);
    if (a.lift !== undefined || b.lift !== undefined) {
      const zero: number[] = new Array<number>(n).fill(0);
      const quintic: boolean =
        a.liftCurvatures !== undefined && b.liftCurvatures !== undefined;
      const ea: AutoMovieStationHermite.IEnd = {
        value: a.lift ?? zero,
        slope: a.liftSlopes ?? zero,
        ...(quintic ? { curvature: a.liftCurvatures! } : {}),
      };
      const eb: AutoMovieStationHermite.IEnd = {
        value: b.lift ?? zero,
        slope: b.liftSlopes ?? zero,
        ...(quintic ? { curvature: b.liftCurvatures! } : {}),
      };
      const weights: number[][] = [0, 1, 2].map((order: number): number[] =>
        AutoMovieStationHermite.weights(u, H, order as 0 | 1 | 2, quintic),
      );
      const rows: number[][] = weights.map((x: number[]): number[] => {
        if (lazy) return new Array<number>(2 * n);
        const row: number[] = AutoMovieStationHermite.combine(ea, eb, x);
        return [...row, ...row];
      });
      const U: V[] = f.map((x: number[]): V => [x[3]!, x[4]!, x[5]!]);
      const W: V[] = f.map((x: number[]): V => [x[6]!, x[7]!, x[8]!]);
      station.lift = {
        a: ea,
        b: eb,
        weights,
        c: rows,
        directions: [
          cross(W[0]!, U[0]!),
          sum(cross(W[1]!, U[0]!), cross(W[0]!, U[1]!)),
          sum(
            cross(W[2]!, U[0]!),
            scale(cross(W[1]!, U[1]!), 2),
            cross(W[0]!, U[2]!),
          ),
        ],
      };
    }
    kept.unshift({ s, station });
    if (kept.length > RECENT) kept.pop();
    return station;
  }

  /** Keep malformed lift layouts on the old doubled-row path; this does not reject an input. */
  function liftFits(layer: IAutoMovieLoftChain.ILayer, n: number): boolean {
    return (
      (layer.lift === undefined || layer.lift.length === n) &&
      (layer.liftSlopes === undefined || layer.liftSlopes.length === n) &&
      (layer.liftCurvatures === undefined || layer.liftCurvatures.length === n)
    );
  }

  /** Fill the same periodic support read by SplineCurve.jet, without changing its arithmetic. */
  function fill(station: IStation, n: number, t: number): void {
    if (station.filled === undefined) return;
    const u: number = ((((t / (2 * Math.PI)) % 1) + 1) % 1) * n;
    const i: number = Math.min(n - 1, Math.floor(u));
    for (let offset: number = -1; offset <= 2; offset++) {
      const j: number = (i + offset + n) % n;
      if (station.filled[j] === 1) continue;
      for (let order: number = 0; order < 3; order++) {
        const w: number[] = station.weights[order]!;
        station.c[order]![j] = scalar(station.a, station.b, w, j);
        station.c[order]![n + j] = scalar(station.a, station.b, w, n + j);
        if (station.lift !== undefined) {
          const l: ILift = station.lift;
          const value: number = scalar(l.a, l.b, l.weights[order]!, j);
          l.c[order]![j] = value;
          l.c[order]![n + j] = value;
        }
      }
      station.filled[j] = 1;
    }
  }

  /** One component, in exactly StationHermite.combine's left-associated summation order. */
  function scalar(
    a: AutoMovieStationHermite.IEnd,
    b: AutoMovieStationHermite.IEnd,
    w: readonly number[],
    k: number,
  ): number {
    return (
      w[0]! * a.value[k]! +
      w[1]! * a.slope[k]! +
      (a.curvature === undefined ? 0 : w[2]! * a.curvature[k]!) +
      (b.curvature === undefined ? 0 : w[3]! * b.curvature[k]!) +
      w[4]! * b.slope[k]! +
      w[5]! * b.value[k]!
    );
  }

  /**
   * Unit normal `P_t x P_s` of a finite jet, or null when its length is at most 1e-12.
   *
   * @evidence contracts/common.md#principled-implementation Normalizes the chart tangent cross product in its existing t-cross-s orientation.
   * @evidence contracts/common.md#clear-and-simple-design One cross product and length test return a fresh unit vector or null.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Keeps the 1e-12 singularity threshold and does not invent a direction at a collapsed pole; the caller supplies finite derivatives.
   * @evidence contracts/common.md#meaningful-documentation States orientation, the finite-input premise and the numerical singularity test.
   * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic on two three-component derivatives, independent of chain order.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure vector operation coordinates no repeated work and returns no cached mutable vector.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns no retained state or handles; its returned vector belongs to the caller.
   */
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
 * Add the lift `h(s, t) w(s)` and its derivatives to a jet, `w = v x u`;
 * the lift takes the quintic rule where both layers carry its curvatures,
 * with `w' = v' x u + v x u'` and `w'' = v'' x u + 2 v' x u' + v x u''`.
 */
function lift(
  jet: AutoMovieLoftJet.IJet,
  prepared: { c: number[][]; directions: V[] },
  n: number,
  t: number,
): void {
  // The lift values interpolate over phase as the x block of a section.
  const h: J[] = prepared.c.map(
    (x: number[]): J => AutoMovieSplineCurve.jet(x, n, t),
  );
  const [w0, w1, w2] = prepared.directions as [V, V, V];
  jet.p = sum(jet.p, scale(w0, h[0]![0]));
  jet.s = sum(jet.s, scale(w0, h[1]![0]), scale(w1, h[0]![0]));
  jet.t = sum(jet.t, scale(w0, h[0]![2]));
  jet.ss = sum(
    jet.ss,
    scale(w0, h[2]![0]),
    scale(w1, 2 * h[1]![0]),
    scale(w2, h[0]![0]),
  );
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
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
