import type {
  AutoMovieVector3Tuple,
  IAutoMovieLoftCapRead,
  IAutoMovieLoftChain,
  IAutoMovieLoftCoefficientSource,
  IAutoMovieLoftSectionJet,
  IAutoMovieLoftSurfaceJet,
  IAutoMovieStationHermite,
  IAutoMovieViewAxisJet,
} from "@automovie/interface";

import { AutoMovieLoftCapRead } from "./AutoMovieLoftCapRead";
import { AutoMovieLoftChain } from "./AutoMovieLoftChain";
import { AutoMovieLoftCoefficientSource } from "./AutoMovieLoftCoefficientSource";
import { AutoMovieLoftFrameSource } from "./AutoMovieLoftFrameSource";
import { AutoMovieLoftReliefCompose } from "./AutoMovieLoftReliefCompose";
import { AutoMovieLoftSection } from "./AutoMovieLoftSection";
import { AutoMovieLoftWorldJet } from "./construction/internal/AutoMovieLoftWorldJet";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";
import { AutoMovieStationHermite } from "./AutoMovieStationHermite";

/**
 * A chain's surface point with its exact first and second derivatives in
 * station and phase.
 *
 * A chain expanded with its jets (every layer carrying its plane, the plane's
 * station derivatives and the coefficients' second derivatives) is, between two
 * layers, `P(s, t) = o(s) + x(s, t) u(s) + z(s, t) v(s)` with coefficient
 * Hermite factors in physical station or a declared pole coordinate, actual
 * analytic frames or the existing component-plane fit, and the actual local
 * source/continuation total2 or legacy phase spline, plus a lift along `w = v x
 * u` and its reliefs along their axes. Each derivative is then the product rule
 * over those factors, each factor's derivative exact:
 *
 * ```text
 * P_s  = o' + x_s u + x u' + z_s v + z v'
 * P_ss = o'' + x_ss u + 2 x_s u' + x u'' + (the same in z, v)
 * P_st = x_st u + x_t u' + z_st v + z_t v'
 * P_t  = x_t u + z_t v,   P_tt = x_tt u + z_tt v
 * ```
 *
 * The strips, the trims' and lids' cross derivatives and the shading normals
 * read these instead of differences of sampled points.
 */
export namespace AutoMovieLoftJet {
  /**
   * Whether the actual local interval owners carry physical2 and every layer
   * carries its frame2. Projection curvatures are required only by actual
   * legacy intervals. This is not complete numeric/regularity validation.
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
   */
  export function at(
    chain: IAutoMovieLoftChain,
    s: number,
    t: number,
  ): IAutoMovieLoftSurfaceJet {
    // The station's part (its section coefficients and plane with their two
    // station derivatives) is the same for every phase of one jet.
    const station: IStation = stationOf(chain, s);
    const { f }: IStation = station;

    // Section values in the plane: x, z and their phase derivatives at the
    // value, the station slope and the station curvature of the coefficients.
    const n: number = chain.order;
    fill(station, n, t);
    const local: IAutoMovieLoftSectionJet =
      station.native === null
        ? section(station.controls!, n, t)
        : station.native(t);
    const jet: IAutoMovieLoftSurfaceJet = AutoMovieLoftWorldJet(local, f);

    // The lift a shape law writes moves points along w = v x u by the station
    // Hermite of its values, quintic where it carries curvatures, as in AutoMovieLoftChain.ring.
    if (station.lift !== undefined) lift(jet, station.lift, n, t);

    // Original native readers and chains add the same reliefs after lift.
    AutoMovieLoftReliefCompose.jet(jet, chain.reliefs ?? [], s, t);
    return jet;
  }

  /**
   * Unit normal `P_t x P_s` of a finite jet, or null when its length is at most
   * 1e-12.
   */
  export function normal(
    jet: IAutoMovieLoftSurfaceJet,
  ): AutoMovieVector3Tuple | null {
    const n: AutoMovieVector3Tuple = cross(jet.t, jet.s);
    const l: number = Math.hypot(n[0], n[1], n[2]);
    return l > 1e-12 ? [n[0] / l, n[1] / l, n[2] / l] : null;
  }

  /** One interval's endpoint arrays, weights and combined derivative rows. */
  interface IControls {
    /** Lower endpoint, unchanged for the immutable chain's lifetime. */
    a: IAutoMovieStationHermite.IEnd;
    /** Upper endpoint. */
    b: IAutoMovieStationHermite.IEnd;
    /** Value, slope and curvature interpolation weights. */
    weights: number[][];
    /**
     * Three coefficient rows; lazy rows contain holes until their support is
     * read.
     */
    c: number[][];
  }

  /** A station's plane, section controls and optional lift controls. */
  interface IStation {
    /**
     * Actual basis controls only on the legacy branch; no fabricated rows on a
     * native station.
     */
    controls: IControls | null;
    /** Actual local total2 generator, absent only on the existing basis branch. */
    native: ((phi: number) => IAutoMovieLoftSectionJet) | null;
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
    directions: AutoMovieVector3Tuple[];
  }

  /** A station's part of a jet: its section, plane and lift controls. */
  function stationOf(chain: IAutoMovieLoftChain, s: number): IStation {
    const cap: IAutoMovieLoftCapRead.IJetResult = AutoMovieLoftCapRead.jet(
      chain,
      s,
    );
    if (cap !== null) {
      return { controls: null, ...cap };
    }
    const [lo, hi]: [number, number] = AutoMovieLoftChain.bracket(chain, s);
    const a: IAutoMovieLoftChain.ILayer = chain.layers[lo]!;
    const b: IAutoMovieLoftChain.ILayer = chain.layers[hi]!;
    const H: number = b.y - a.y;
    const u: number = Math.min(1, Math.max(0, (s - a.y) / H));
    const native: ((phi: number) => IAutoMovieLoftSectionJet) | null =
      AutoMovieLoftSection.jet(chain, s);
    const w: number[][] = [0, 1, 2].map((order: number): number[] =>
      AutoMovieStationHermite.weights(u, H, order as 0 | 1 | 2, true),
    );

    // Section coefficients and plane, each with its two station derivatives.
    const source: IAutoMovieLoftCoefficientSource.IControls | null =
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
    const ca: IAutoMovieStationHermite.IEnd = source?.a ?? {
      value: a.coefficients,
      slope: a.slopes,
      curvature: a.curvatures!,
    };
    const cb: IAutoMovieStationHermite.IEnd = source?.b ?? {
      value: b.coefficients,
      slope: b.slopes,
      curvature: b.curvatures!,
    };
    const n: number = chain.order;
    const lazy: boolean =
      native === null &&
      chain.basis === "spline" &&
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
    const actual: IAutoMovieViewAxisJet.IJet | null =
      AutoMovieLoftFrameSource.actual(a, b, s);
    let f: number[][];
    if (actual !== null)
      f = [actual.value, actual.first, actual.second].map(
        (value: IAutoMovieViewAxisJet.IJet["value"]): number[] => [
          ...value.origin,
          ...value.u,
          ...value.v,
        ],
      );
    else {
      const fa: IAutoMovieStationHermite.IEnd =
        AutoMovieStationHermite.frameEnd(a);
      const fb: IAutoMovieStationHermite.IEnd =
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
      const ea: IAutoMovieStationHermite.IEnd = {
        value: a.lift ?? zero,
        slope: a.liftSlopes ?? zero,
        ...(quintic ? { curvature: a.liftCurvatures! } : {}),
      };
      const eb: IAutoMovieStationHermite.IEnd = {
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
      const U: AutoMovieVector3Tuple[] = f.map(
        (x: number[]): AutoMovieVector3Tuple => [x[3]!, x[4]!, x[5]!],
      );
      const W: AutoMovieVector3Tuple[] = f.map(
        (x: number[]): AutoMovieVector3Tuple => [x[6]!, x[7]!, x[8]!],
      );
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
    return station;
  }

  /**
   * Keep malformed lift layouts on the old doubled-row path; this does not
   * reject an input.
   */
  function liftFits(layer: IAutoMovieLoftChain.ILayer, n: number): boolean {
    return (
      (layer.lift === undefined || layer.lift.length === n) &&
      (layer.liftSlopes === undefined || layer.liftSlopes.length === n) &&
      (layer.liftCurvatures === undefined || layer.liftCurvatures.length === n)
    );
  }

  /**
   * Fill the same periodic support read by SplineCurve.jet, without changing
   * its arithmetic.
   */
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

  /**
   * One component, in exactly StationHermite.combine's left-associated
   * summation order.
   */
  function scalar(
    a: IAutoMovieStationHermite.IEnd,
    b: IAutoMovieStationHermite.IEnd,
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
}

/** A section's `[x, z, x_t, z_t, x_tt, z_tt]` at one phase. */
type J = [number, number, number, number, number, number];

/**
 * Read exactly the required local total2 from the unchanged complete legacy
 * basis.
 */
function section(
  controls: { c: number[][] },
  n: number,
  t: number,
): IAutoMovieLoftSectionJet {
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
 * Add the lift `h(s, t) w(s)` and its derivatives to a jet, `w = v x u`; the
 * lift takes the quintic rule where both layers carry its curvatures, with `w'
 * = v' x u + v x u'` and `w'' = v'' x u + 2 v' x u' + v x u''`.
 */
function lift(
  jet: IAutoMovieLoftSurfaceJet,
  prepared: { c: number[][]; directions: AutoMovieVector3Tuple[] },
  n: number,
  t: number,
): void {
  // The lift values interpolate over phase as the x block of a section.
  const h: J[] = prepared.c.map(
    (x: number[]): J => AutoMovieSplineCurve.jet(x, n, t),
  );
  const [w0, w1, w2] = prepared.directions as [
    AutoMovieVector3Tuple,
    AutoMovieVector3Tuple,
    AutoMovieVector3Tuple,
  ];
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
function sum(...vs: AutoMovieVector3Tuple[]): AutoMovieVector3Tuple {
  const out: AutoMovieVector3Tuple = [0, 0, 0];
  for (const v of vs) for (let k: number = 0; k < 3; k++) out[k] += v[k]!;
  return out;
}

/** Vector times a scalar. */
function scale(v: readonly number[], k: number): AutoMovieVector3Tuple {
  return [v[0]! * k, v[1]! * k, v[2]! * k];
}

/** Cross product. */
function cross(
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
): AutoMovieVector3Tuple {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
