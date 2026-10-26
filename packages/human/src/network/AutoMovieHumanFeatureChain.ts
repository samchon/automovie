import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanFeatureChain } from "./IAutoMovieHumanFeatureChain";

/**
 * Generation of a chain from its key sections.
 *
 * Every control-point coordinate is the natural cubic spline through its
 * values at the keys: among all twice-differentiable functions through
 * them, the one of least `integral f''^2`, with continuous second
 * derivatives at every key and none at the ends. The loft chain carries
 * the keys as its layers and the spline's derivatives as their station
 * slopes; between two keys the spline is one cubic, which the loft's cubic
 * Hermite rule reproduces exactly from those values and slopes.
 */
export namespace AutoMovieHumanFeatureChain {
  /**
   * Loft chain of a feature chain.
   *
   * @param chain Key sections; not modified.
   * @returns The spline chain whose layers are the keys.
   */
  export function expand(
    chain: IAutoMovieHumanFeatureChain,
  ): IAutoMovieHumanLoftChain {
    const keys: readonly IAutoMovieHumanFeatureChain.IKey[] = chain.keys;
    if (keys.length < 2)
      throw new Error(`Feature chain ${chain.name} needs two keys`);
    const t: number[] = keys.map(
      (k: IAutoMovieHumanFeatureChain.IKey): number => k.station,
    );
    const slopes: number[][] = derivatives(
      t,
      keys.map(
        (k: IAutoMovieHumanFeatureChain.IKey): readonly number[] =>
          k.coefficients,
      ),
    );
    return {
      name: chain.name,
      basis: "spline",
      order: chain.order,
      rule: chain.rule,
      samples: chain.samples,
      ...(chain.reliefs?.length ? { reliefs: chain.reliefs } : {}),
      layers: keys.map(
        (
          k: IAutoMovieHumanFeatureChain.IKey,
          i: number,
        ): IAutoMovieHumanLoftChain.ILayer => ({
          y: k.station,
          ...(k.frame === undefined ? {} : { frame: k.frame }),
          coefficients: [...k.coefficients],
          slopes: slopes[i]!,
        }),
      ),
    };
  }

  /**
   * Second derivatives of the natural cubic spline through values at
   * stations, for every column at once (the tridiagonal system of
   * continuous first derivatives with zero second derivatives at both
   * ends, solved by the Thomas algorithm).
   *
   * @param t Strictly increasing stations, at least two.
   * @param values Values per station.
   * @returns Second derivatives per station.
   */
  export function curvatures(
    t: readonly number[],
    values: readonly (readonly number[])[],
  ): number[][] {
    const n: number = t.length;
    const width: number = values[0]!.length;
    const out: number[][] = t.map((): number[] =>
      new Array<number>(width).fill(0),
    );
    if (n < 3) return out;
    const h: number[] = t
      .slice(1)
      .map((v: number, i: number): number => v - t[i]!);
    const m: number = n - 2;
    const c: number[] = new Array<number>(m);
    const d: number[] = new Array<number>(m);
    for (let col: number = 0; col < width; col++) {
      // Row i (interior): h_{i-1} M_{i-1} + 2 (h_{i-1} + h_i) M_i + h_i M_{i+1}
      // = 6 (secant_i - secant_{i-1}).
      for (let r: number = 0; r < m; r++) {
        const i: number = r + 1;
        const rhs: number =
          6 *
          ((values[i + 1]![col]! - values[i]![col]!) / h[i]! -
            (values[i]![col]! - values[i - 1]![col]!) / h[i - 1]!);
        const diagonal: number = 2 * (h[i - 1]! + h[i]!);
        const lower: number = h[i - 1]!;
        const upper: number = h[i]!;
        const denom: number = r === 0 ? diagonal : diagonal - lower * c[r - 1]!;
        c[r] = upper / denom;
        d[r] = (r === 0 ? rhs : rhs - lower * d[r - 1]!) / denom;
      }
      out[m]![col] = d[m - 1]!;
      for (let r: number = m - 2; r >= 0; r--)
        out[r + 1]![col] = d[r]! - c[r]! * out[r + 2]![col]!;
    }
    return out;
  }

  /** First derivatives of the natural cubic spline at its stations. */
  function derivatives(
    t: readonly number[],
    values: readonly (readonly number[])[],
  ): number[][] {
    const M: number[][] = curvatures(t, values);
    const n: number = t.length;
    return t.map((_: number, i: number): number[] => {
      // Left end of the interval to the right, or right end of the last.
      const lo: number = Math.min(i, n - 2);
      const h: number = t[lo + 1]! - t[lo]!;
      return values[i]!.map((_v: number, col: number): number => {
        const secant: number =
          (values[lo + 1]![col]! - values[lo]![col]!) / h;
        return i === lo
          ? secant - (h * (2 * M[lo]![col]! + M[lo + 1]![col]!)) / 6
          : secant + (h * (M[lo]![col]! + 2 * M[lo + 1]![col]!)) / 6;
      });
    });
  }
}
