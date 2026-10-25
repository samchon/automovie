import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Continuity of the section family along each chain's stations.
 *
 * The layer fitter chose each chain's principal layers and their station
 * slopes by least squares, which keeps every layer's value but lets the
 * station curvature jump at every layer: on the f1 trunk the front
 * midline's second difference changes from -0.6 to +1.5 per 100 mm² at the
 * 1044 mm layer, which shades as the horizontal band across the abdomen,
 * and the auricle chains, whose layers lie 0.1 mm apart, carry each row's
 * fitting noise as stair steps along the helix. Two rules restore
 * continuity without moving the chains away from their observations:
 *
 * 1. Dense layers. Interior layer values are replaced by the Gaussian
 *    weighted least-squares line through their neighbours in station, read
 *    at the layer, `w = exp(-d^2 / (2 s^2))` with s = {@link SIGMA} mm.
 *    Layers 1.5 mm or more apart weigh under 0.1 percent, so the rule acts
 *    only where layers are denser than the observation noise. End layers,
 *    which events share, are kept.
 * 2. C2 slopes. Each chain's interior slopes move toward those of the
 *    clamped cubic spline through its layer values, which makes the
 *    station curvature continuous at every layer; the end slopes, which
 *    `AutoMovieHumanEventJoin` sets afterwards, are kept. Every slope change
 *    is clamped so that no section moves more than {@link BOUND} mm from
 *    its fitted shape between layers, bounded by `H |dm_a - dm_b| / 8`
 *    per coefficient (the Hermite midpoint, where the change peaks); the
 *    rule never trades an observed shape for smoothness. Lifted layers are
 *    interpolated the same way.
 */
export namespace AutoMovieHumanStationContinuity {
  /**
   * Calibration with continuous station families.
   *
   * @param calibration Merged calibration; not modified.
   * @returns A copy with smoothed interior layers.
   */
  export function apply(
    calibration: IAutoMovieHumanBodyCalibration,
  ): IAutoMovieHumanBodyCalibration {
    return {
      ...calibration,
      chains: calibration.chains.map(
        (chain: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain =>
          spline(dense(chain)),
      ),
    };
  }
}

/** Gaussian width of the dense-layer average, mm. */
const SIGMA: number = 0.4;

/**
 * Largest section change the C2 slopes may make between layers, mm: the
 * torso fitter's own bisection tolerance, so the smoothed family stays as
 * close to the observations as the fitted one was allowed to be.
 */
const BOUND: number = 1;

/** A chain with its interior layer values averaged over close neighbours. */
function dense(chain: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain {
  const layers: readonly IAutoMovieHumanLoftChain.ILayer[] = chain.layers;
  const n: number = layers.length;
  const reach: number = 4 * SIGMA;
  if (
    !layers.some(
      (l: IAutoMovieHumanLoftChain.ILayer, k: number): boolean =>
        k > 0 && l.y - layers[k - 1]!.y < reach,
    )
  )
    return chain;
  return {
    ...chain,
    layers: layers.map(
      (
        layer: IAutoMovieHumanLoftChain.ILayer,
        k: number,
      ): IAutoMovieHumanLoftChain.ILayer => {
        if (k === 0 || k === n - 1) return layer;
        // Weighted least-squares line through the neighbours, read at the
        // layer: a plain average of an uneven or one-sided window pulls a
        // layer off the chain's trend toward its denser side (beside the
        // helix's kept end layer the last 0.1 mm interval's plan change grew
        // from 0.23 to 0.73 mm, a flat shelf at the ear's top), while the
        // line keeps any linear trend and removes only the noise about it.
        let w0: number = 0;
        let w1: number = 0;
        let w2: number = 0;
        const s0: number[] = new Array<number>(layer.coefficients.length).fill(
          0,
        );
        const s1: number[] = new Array<number>(layer.coefficients.length).fill(
          0,
        );
        for (let j: number = 0; j < n; j++) {
          const d: number = layers[j]!.y - layer.y;
          if (Math.abs(d) > reach) continue;
          const w: number = Math.exp(-(d * d) / (2 * SIGMA * SIGMA));
          w0 += w;
          w1 += w * d;
          w2 += w * d * d;
          layers[j]!.coefficients.forEach((c: number, i: number): void => {
            s0[i]! += w * c;
            s1[i]! += w * d * c;
          });
        }
        const det: number = w0 * w2 - w1 * w1;
        return {
          ...layer,
          coefficients: s0.map((v: number, i: number): number =>
            det > 1e-12 * w0 * w2 ? (w2 * v - w1 * s1[i]!) / det : v / w0,
          ),
        };
      },
    ),
  };
}

/** A chain with clamped C2 spline slopes, when the change stays bounded. */
function spline(chain: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain {
  const layers: readonly IAutoMovieHumanLoftChain.ILayer[] = chain.layers;
  const n: number = layers.length;
  if (n < 3) return chain;
  const slopes: number[][] = solve(
    layers.map((l: IAutoMovieHumanLoftChain.ILayer): number => l.y),
    layers.map(
      (l: IAutoMovieHumanLoftChain.ILayer): readonly number[] => l.coefficients,
    ),
    layers[0]!.slopes,
    layers[n - 1]!.slopes,
  );
  const lifted: boolean = layers.every(
    (l: IAutoMovieHumanLoftChain.ILayer): boolean => l.lift !== undefined,
  );
  const liftSlopes: number[][] | null = lifted
    ? solve(
        layers.map((l: IAutoMovieHumanLoftChain.ILayer): number => l.y),
        layers.map(
          (l: IAutoMovieHumanLoftChain.ILayer): readonly number[] => l.lift!,
        ),
        layers[0]!.liftSlopes!,
        layers[n - 1]!.liftSlopes!,
      )
    : null;

  // Each slope change is clamped to 4 BOUND / H, H the longer interval at
  // the layer: an interval's midpoint change H |dm_a - dm_b| / 8 then stays
  // within BOUND whatever its two ends do.
  const blend: (
    k: number,
    fitted: readonly number[],
    c2: readonly number[],
  ) => number[] = (
    k: number,
    fitted: readonly number[],
    c2: readonly number[],
  ): number[] => {
    const H: number = Math.max(
      layers[k]!.y - layers[k - 1]!.y,
      layers[k + 1]!.y - layers[k]!.y,
    );
    const limit: number = (4 * BOUND) / H;
    return fitted.map(
      (v: number, i: number): number =>
        v + Math.max(-limit, Math.min(limit, c2[i]! - v)),
    );
  };
  return {
    ...chain,
    layers: layers.map(
      (
        layer: IAutoMovieHumanLoftChain.ILayer,
        k: number,
      ): IAutoMovieHumanLoftChain.ILayer =>
        k === 0 || k === n - 1
          ? layer
          : {
              ...layer,
              slopes: blend(k, layer.slopes, slopes[k]!),
              ...(liftSlopes === null
                ? {}
                : {
                    liftSlopes: blend(k, layer.liftSlopes!, liftSlopes[k]!),
                  }),
            },
    ),
  };
}

/**
 * Slopes of the clamped cubic spline through values at stations, for every
 * coefficient at once (the tridiagonal system of continuous second
 * derivatives, solved by the Thomas algorithm).
 *
 * @param y Strictly increasing stations, at least three.
 * @param values Values per station.
 * @param first Slopes at the first station, kept.
 * @param last Slopes at the last station, kept.
 * @returns Slopes per station.
 */
function solve(
  y: readonly number[],
  values: readonly (readonly number[])[],
  first: readonly number[],
  last: readonly number[],
): number[][] {
  const n: number = y.length;
  const width: number = values[0]!.length;
  const h: number[] = Array.from(
    { length: n - 1 },
    (_: unknown, k: number): number => y[k + 1]! - y[k]!,
  );
  const out: number[][] = values.map((): number[] =>
    new Array<number>(width).fill(0),
  );
  out[0] = [...first];
  out[n - 1] = [...last];
  if (n === 2) return out;

  // Row k (interior): h_k m_{k-1} + 2 (h_{k-1} + h_k) m_k + h_{k-1} m_{k+1}
  // = 3 (h_k d_{k-1} + h_{k-1} d_k), d the interval secants.
  const lower: number[] = [];
  const diagonal: number[] = [];
  const upper: number[] = [];
  for (let k: number = 1; k < n - 1; k++) {
    lower.push(h[k]!);
    diagonal.push(2 * (h[k - 1]! + h[k]!));
    upper.push(h[k - 1]!);
  }
  const m: number = n - 2;
  for (let i: number = 0; i < width; i++) {
    const rhs: number[] = [];
    for (let k: number = 1; k < n - 1; k++) {
      const d0: number = (values[k]![i]! - values[k - 1]![i]!) / h[k - 1]!;
      const d1: number = (values[k + 1]![i]! - values[k]![i]!) / h[k]!;
      rhs.push(3 * (h[k]! * d0 + h[k - 1]! * d1));
    }
    rhs[0]! -= lower[0]! * first[i]!;
    rhs[m - 1]! -= upper[m - 1]! * last[i]!;

    // Thomas algorithm.
    const c: number[] = new Array<number>(m);
    const d: number[] = new Array<number>(m);
    c[0] = upper[0]! / diagonal[0]!;
    d[0] = rhs[0]! / diagonal[0]!;
    for (let k: number = 1; k < m; k++) {
      const denom: number = diagonal[k]! - lower[k]! * c[k - 1]!;
      c[k] = upper[k]! / denom;
      d[k] = (rhs[k]! - lower[k]! * d[k - 1]!) / denom;
    }
    out[m]![i] = d[m - 1]!;
    for (let k: number = m - 2; k >= 0; k--)
      out[k + 1]![i] = d[k]! - c[k]! * out[k + 2]![i]!;
  }
  return out;
}
