import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieLoftCapRead } from "./AutoMovieLoftCapRead";
import { AutoMovieLoftChain } from "./AutoMovieLoftChain";
import { AutoMovieLoftCoefficientSource } from "./AutoMovieLoftCoefficientSource";
import { AutoMovieLoftFrameSource } from "./AutoMovieLoftFrameSource";
import { AutoMovieLoftRelief } from "./AutoMovieLoftRelief";
import { AutoMovieLoftSection } from "./AutoMovieLoftSection";
import type { AutoMovieLoftSectionLegacy } from "./AutoMovieLoftSectionLegacy";
import { AutoMovieLoftWorldJet } from "./AutoMovieLoftWorldJet";
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
 * and the actual local source/continuation total2 or legacy phase spline, plus a lift along
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
 * @evidence contracts/common.md#principled-implementation The chain's required local total2, actual frame derivatives and lift/relief derivatives combine by one product rule; each owner must admit the requested physical derivatives.
 * @evidence contracts/common.md#clear-and-simple-design One jet record and one evaluation per station and phase; `carries` states when a chain has the jets it needs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No derivative is a finite difference; a chain without its jets is refused by `carries`.
 * @evidence contracts/common.md#meaningful-documentation States each jet component and the terms of its product rule.
 * @evidence contracts/performance.md#efficient-algorithms Native stations pay explicit binding/span/scalar2 validation and fixed native preparation, then one numeric inverse and selected source2 evaluation per phase. Legacy spline stations retain four-control support and O(N) holey storage; lift remains its own basis.
 * @evidence contracts/performance.md#reuse-equivalent-work Each of the last eight inserted stations shares its Hermite weights, frame, visited controls and lift preparation across phases; hits do not reorder this cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A weak chain key owns eight station records with native geometry or legacy O(N) controls and optional lift data; eviction releases one record. External Point samplers and binder rows have separate owners; outputs are fresh.
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
   * Whether the actual local interval owners carry physical2 and every
   * layer carries its frame2. Projection curvatures are required only by
   * actual legacy intervals. This is not complete numeric/regularity validation.
   *
   * @evidence contracts/common.md#principled-implementation Requires recorded native source2 availability or legacy coefficient curvature, plus all frame derivative orders at every layer; actual queries still admit their requested station derivatives.
   * @evidence contracts/common.md#clear-and-simple-design A shared local-capability predicate precedes one frame-presence scan, without another geometry model.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Tests field presence only, including the ordinary every semantics for an empty layer list; it is not a complete chain validator.
   * @evidence contracts/common.md#meaningful-documentation Lists the required fields and the validation this predicate does not perform.
   * @evidence contracts/performance.md#efficient-algorithms Local source-status lookup includes binary searches on clipped rows and O(L*S) law presence for L layers/S laws, followed by O(L) frame checks; no phase/source2 evaluation or cache allocation occurs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure presence predicate coordinates no requests or reusable station preparation; at owns that cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reads the supplied chain and retains nothing after returning its boolean.
   */
  export function carries(chain: IAutoMovieLoftChain): boolean {
    return (
      AutoMovieLoftSection.regular(chain) &&
      chain.layers.every(
        (l: IAutoMovieLoftChain.ILayer): boolean =>
          l.frame !== undefined &&
          l.frameSlopes !== undefined &&
          l.frameCurvatures !== undefined,
      )
    );
  }

  /**
   * Jet of a chain at a chart point.
   *
   * @param chain Chain that {@link carries} jets.
   * @param s Station within the chain.
   * @param t Phase, radians.
   *
   * @evidence contracts/common.md#principled-implementation Combines actual native/continuation total2 or the unchanged legacy station/basis jets with the frame product rule, then adds lift and relief derivatives.
   * @evidence contracts/common.md#clear-and-simple-design One station cache owns local/frame/lift preparation and one extracted world product rule serves both local authorities.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Keeps ordinary interpolation and returned vector ownership; only validated surviving original cap owners bypass row bracketing, reading actual source2/axis2. Truezero or unavailable physical2 fails without a Taylor map or zero fill.
   * @evidence contracts/common.md#meaningful-documentation States station and phase units and the surface product rule above.
   * @evidence contracts/performance.md#efficient-algorithms Native source2 preparation skips unneeded compatibility derivative weights and each phase reads one numeric inverse plus selected AD source; legacy spline phases retain lazy four-control filling. Native lift arrays are prepared eagerly once in O(N).
   * @evidence contracts/performance.md#reuse-equivalent-work Station weights, frame and lift directions are prepared once, and each visited control is combined once while its station remains cached.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Uses the weak-key eight-station insertion cache and returns fresh mutable jet vectors, never a cached output jet.
   */
  export function at(chain: IAutoMovieLoftChain, s: number, t: number): IJet {
    // The station's part (its section coefficients and plane with their two
    // station derivatives) is the same for every phase, so the last stations
    // read per chain are kept; a chain is never changed once built.
    const station: IStation = stationOf(chain, s);
    const { f }: IStation = station;

    // Section values in the plane: x, z and their phase derivatives at the
    // value, the station slope and the station curvature of the coefficients.
    const n: number = chain.order;
    fill(station, n, t);
    const local: ReturnType<typeof AutoMovieLoftSectionLegacy.jet> =
      station.native === null
        ? section(station.controls!, n, t)
        : station.native(t);
    const jet: IJet = AutoMovieLoftWorldJet(local, f);

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
    if (
      !Object.values(jet).every((row: V): boolean => row.every(Number.isFinite))
    )
      throw new AutoMovieLoftAdmissionError(
        "The complete frame/local/lift/relief total2 is nonfinite.",
      );
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
  interface IStation {
    /** Actual basis controls only on the legacy branch; no fabricated rows on a native station. */
    controls: IControls | null;
    /** Actual local total2 generator, absent only on the existing basis branch. */
    native: ReturnType<typeof AutoMovieLoftSection.jet>;
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
    const cap: ReturnType<typeof AutoMovieLoftCapRead.jet> =
      AutoMovieLoftCapRead.jet(chain, s);
    if (cap !== null) {
      const station: IStation = { controls: null, ...cap };
      kept.unshift({ s, station });
      if (kept.length > RECENT) kept.pop();
      return station;
    }
    const [lo, hi]: [number, number] = AutoMovieLoftChain.bracket(chain, s);
    const a: IAutoMovieLoftChain.ILayer = chain.layers[lo]!;
    const b: IAutoMovieLoftChain.ILayer = chain.layers[hi]!;
    const H: number = b.y - a.y;
    const u: number = Math.min(1, Math.max(0, (s - a.y) / H));
    const native: ReturnType<typeof AutoMovieLoftSection.jet> =
      AutoMovieLoftSection.jet(chain, s);
    const w: number[][] = [0, 1, 2].map((order: number): number[] =>
      AutoMovieStationHermite.weights(u, H, order as 0 | 1 | 2, true),
    );

    // Section coefficients and plane, each with its two station derivatives.
    const source: AutoMovieLoftCoefficientSource.IControls | null =
      native === null
        ? AutoMovieLoftCoefficientSource.controls(chain, s)
        : null;
    const coefficientWeights: number[][] =
      native !== null
        ? []
        : source === null
          ? w
          : [0, 1, 2].map((order: number): number[] =>
              AutoMovieLoftCoefficientSource.weights(
                source,
                order as 0 | 1 | 2,
              ),
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
      native === null &&
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
      controls:
        native === null
          ? { a: ca, b: cb, weights: coefficientWeights, c }
          : null,
      native,
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
    const controls: IControls | null = station.controls;
    if (station.filled === undefined || controls === null) return;
    const u: number = ((((t / (2 * Math.PI)) % 1) + 1) % 1) * n;
    const i: number = Math.min(n - 1, Math.floor(u));
    for (let offset: number = -1; offset <= 2; offset++) {
      const j: number = (i + offset + n) % n;
      if (station.filled[j] === 1) continue;
      for (let order: number = 0; order < 3; order++) {
        const w: number[] = controls.weights[order]!;
        controls.c[order]![j] = scalar(controls.a, controls.b, w, j);
        controls.c[order]![n + j] = scalar(controls.a, controls.b, w, n + j);
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

/** Read exactly the required local total2 from the unchanged complete legacy basis. */
function section(
  controls: { c: number[][] },
  n: number,
  t: number,
): ReturnType<typeof AutoMovieLoftSectionLegacy.jet> {
  const q0: J = AutoMovieSplineCurve.jet(controls.c[0]!, n, t);
  const q1: J = AutoMovieSplineCurve.jet(controls.c[1]!, n, t);
  const q2: J = AutoMovieSplineCurve.jet(controls.c[2]!, n, t);
  return {
    p: [q0[0], q0[1]],
    s: [q1[0], q1[1]],
    t: [q0[2], q0[3]],
    ss: [q2[0], q2[1]],
    st: [q1[2], q1[3]],
    tt: [q0[4], q0[5]],
  };
}

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
