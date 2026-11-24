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

import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieLoftCapRead } from "./AutoMovieLoftCapRead";
import { AutoMovieLoftChain } from "./AutoMovieLoftChain";
import { AutoMovieLoftCoefficientSource } from "./AutoMovieLoftCoefficientSource";
import { AutoMovieLoftFrameSource } from "./AutoMovieLoftFrameSource";
import { AutoMovieLoftReliefCompose } from "./AutoMovieLoftReliefCompose";
import { AutoMovieLoftSection } from "./AutoMovieLoftSection";
import { AutoMovieLoftWorldJet } from "./AutoMovieLoftWorldJet";
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
  /** Prepare a chain's total2 station readers after its immutable bind checks. */
  export function prepare(
    chain: IAutoMovieLoftChain,
    sections: ReturnType<typeof AutoMovieLoftSection.prepare>,
    caps: ReturnType<typeof AutoMovieLoftCapRead.prepare>,
  ): (
    station: number,
    sweep?: boolean,
  ) => (phase: number) => IAutoMovieLoftSurfaceJet {
    return (
      station: number,
      sweep: boolean = false,
    ): ((phase: number) => IAutoMovieLoftSurfaceJet) =>
      sample(chain, station, sweep, sections, caps);
  }

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
    return sample(chain, s, false)(t);
  }

  /** Prepare a fixed station for callers reading its multiple phases. */
  export function sampler(
    chain: IAutoMovieLoftChain,
    s: number,
  ): (phase: number) => IAutoMovieLoftSurfaceJet {
    return sample(chain, s, true);
  }

  /** Bind the fixed station, preparing the full legacy row for a phase sweep. */
  function sample(
    chain: IAutoMovieLoftChain,
    s: number,
    sweep: boolean,
    sections?: ReturnType<typeof AutoMovieLoftSection.prepare>,
    caps?: ReturnType<typeof AutoMovieLoftCapRead.prepare>,
  ): (phase: number) => IAutoMovieLoftSurfaceJet {
    const station: IStation = stationOf(chain, s, sweep, sections, caps);
    const { f }: IStation = station;
    const n: number = chain.order;

    return (t: number): IAutoMovieLoftSurfaceJet => {
      // Combine only the active controls of the legacy spline, or read the native law.
      const local: IAutoMovieLoftSectionJet =
        station.native === null
          ? section(station.controls!, n, t)
          : station.native(t);
      const jet: IAutoMovieLoftSurfaceJet = AutoMovieLoftWorldJet(local, f);

      // Add the station-Hermite lift along w = v x u before the reliefs.
      if (station.lift !== undefined) lift(jet, station.lift, n, t);
      AutoMovieLoftReliefCompose.jet(jet, chain.reliefs ?? [], s, t);
      if (
        !Object.values(jet).every((row: AutoMovieVector3Tuple): boolean =>
          row.every(Number.isFinite),
        )
      )
        throw new AutoMovieLoftAdmissionError(
          "The complete frame/local/lift/relief total2 is nonfinite.",
        );
      return jet;
    };
  }

  /** A station's plane, section controls and optional lift controls. */
  interface IStation {
    /**
     * Actual basis controls only on the legacy branch; no fabricated rows on a
     * native station.
     */
    controls: Row[] | null;
    /** Actual local total2 generator, absent only on the existing basis branch. */
    native: ((phi: number) => IAutoMovieLoftSectionJet) | null;
    /** Plane and its first and second station derivatives. */
    f: number[][];
    /** Lift preparation, independent of phase. */
    lift?: ILift;
  }

  /** Scalar lift and its physical station derivatives. */
  interface ILift {
    /** Lift value and its two physical station derivative rows. */
    c: Row[];
    /** Normal direction and its first two station derivatives. */
    directions: AutoMovieVector3Tuple[];
  }

  /** Form the derivatives and endpoint factors specific to a single station. */
  function stationOf(
    chain: IAutoMovieLoftChain,
    s: number,
    sweep: boolean,
    sections?: ReturnType<typeof AutoMovieLoftSection.prepare>,
    caps?: ReturnType<typeof AutoMovieLoftCapRead.prepare>,
  ): IStation {
    const cap: IAutoMovieLoftCapRead.IJetResult =
      caps === undefined ? AutoMovieLoftCapRead.jet(chain, s) : caps.jet(s);
    if (cap !== null) return { controls: null, ...cap };
    const [lo, hi]: [number, number] = AutoMovieLoftChain.bracket(chain, s);
    const a: IAutoMovieLoftChain.ILayer = chain.layers[lo]!;
    const b: IAutoMovieLoftChain.ILayer = chain.layers[hi]!;
    const H: number = b.y - a.y;
    const u: number = Math.min(1, Math.max(0, (s - a.y) / H));
    const native: ((phi: number) => IAutoMovieLoftSectionJet) | null =
      sections === undefined
        ? AutoMovieLoftSection.jet(chain, s)
        : sections.jet(s);
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
      !sweep &&
      native === null &&
      chain.basis === "spline" &&
      Number.isInteger(n) &&
      n > 0 &&
      a.coefficients.length === 2 * n &&
      b.coefficients.length === 2 * n &&
      liftFits(a, n) &&
      liftFits(b, n);
    const controls: Row[] | null =
      native !== null
        ? null
        : coefficientWeights.map(
            (x: number[]): Row =>
              lazy
                ? (k: number): number => scalar(ca, cb, x, k)
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
      controls,
      native,
      f,
    };
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
      const rows: Row[] = weights.map((x: number[]): Row => {
        if (lazy) return (k: number): number => scalar(ea, eb, x, k);
        const row: number[] = AutoMovieStationHermite.combine(ea, eb, x);
        return row.length === n ? row : [...row, ...row];
      });
      const U: AutoMovieVector3Tuple[] = f.map(
        (x: number[]): AutoMovieVector3Tuple => [x[3]!, x[4]!, x[5]!],
      );
      const W: AutoMovieVector3Tuple[] = f.map(
        (x: number[]): AutoMovieVector3Tuple => [x[6]!, x[7]!, x[8]!],
      );
      station.lift = {
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
}

/** A section's `[x, z, x_t, z_t, x_tt, z_tt]` at one phase. */
type J = [number, number, number, number, number, number];

/** One spline control row or its equivalent endpoint expression. */
type Row = Parameters<typeof AutoMovieSplineCurve.jet>[0];

/**
 * Read exactly the required local total2 from the unchanged complete legacy
 * basis.
 */
function section(
  controls: Row[],
  n: number,
  t: number,
): IAutoMovieLoftSectionJet {
  const q0: J = AutoMovieSplineCurve.jet(controls[0]!, n, t);
  const q1: J = AutoMovieSplineCurve.jet(controls[1]!, n, t);
  const q2: J = AutoMovieSplineCurve.jet(controls[2]!, n, t);
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
  prepared: { c: Row[]; directions: AutoMovieVector3Tuple[] },
  n: number,
  t: number,
): void {
  // The lift is one scalar row at each station derivative order.
  const [h, hs, hss] = prepared.c.map((x: Row): [number, number, number] =>
    AutoMovieSplineCurve.scalarJet(x, n, t),
  );
  const [w0, w1, w2] = prepared.directions as [
    AutoMovieVector3Tuple,
    AutoMovieVector3Tuple,
    AutoMovieVector3Tuple,
  ];
  jet.p = sum(jet.p, scale(w0, h![0]));
  jet.s = sum(jet.s, scale(w0, hs![0]), scale(w1, h![0]));
  jet.t = sum(jet.t, scale(w0, h![1]));
  jet.ss = sum(
    jet.ss,
    scale(w0, hss![0]),
    scale(w1, 2 * hs![0]),
    scale(w2, h![0]),
  );
  jet.st = sum(jet.st, scale(w0, hs![1]), scale(w1, h![1]));
  jet.tt = sum(jet.tt, scale(w0, h![2]));
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
