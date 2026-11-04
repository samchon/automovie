import { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import type { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/**
 * The station rule along a chain and the copy of a shared layer (rule J3).
 *
 * Along a chain every coefficient follows the natural cubic spline through
 * its values at the layers: among all twice-differentiable functions through
 * them, the one of least `integral f''^2`, continuous in its second
 * derivative at every layer. Each layer carries the spline's first and
 * second derivatives as its `slopes` and `curvatures`, so its intervals take
 * the quintic Hermite rule, which reproduces the spline's cubic exactly and
 * is C2 at every layer whatever the derivatives a layer carries. Three-point
 * slopes, as `AutoMovieHumanHorizontalChain.build` gives, leave the cubic
 * spans meeting at a corner in curvature, a line at every layer.
 *
 * A layer shared with another chain is the owner's: the neighbour copies the
 * owner's layer and its derivatives, signed into its own station direction
 * ({@link copy}), and keeps them through the solve.
 */
export namespace AutoMovieSeamStation {
  /**
   * Second derivatives of the natural cubic spline through values at
   * stations, for every column at once (the tridiagonal system of continuous
   * first derivatives with zero second derivatives at both ends, solved by
   * the Thomas algorithm).
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

  /**
   * First derivatives of the natural cubic spline at its stations, from its
   * second derivatives `M`: the derivative of the interval to the right of a
   * station, or of the last interval at the last station.
   *
   * @param t Strictly increasing stations, at least two.
   * @param values Values per station.
   * @param M Second derivatives from {@link curvatures}.
   */
  export function slopes(
    t: readonly number[],
    values: readonly (readonly number[])[],
    M: readonly (readonly number[])[] = curvatures(t, values),
  ): number[][] {
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

  /** A shared layer's jet as the neighbour copies it. */
  export interface ICopy {
    /** The owner's coefficients. */
    coefficients: number[];

    /** The owner's plane as nine numbers `[origin, u, v]`; horizontal at its station when the owner's layer has no frame. */
    plane: number[];

    /** Station slopes, signed into the neighbour's direction. */
    slopes: number[];

    /** Second station derivatives; the sign squared leaves them as they are. */
    curvatures: number[];

    /** The plane's station slopes, signed. */
    frameSlopes: number[];

    /** The plane's second station derivatives. */
    frameCurvatures: number[];
  }

  /**
   * The copy of an owner's layer for a neighbour that shares it.
   *
   * A neighbour whose station runs the same way as the owner's at the ring
   * (the owner's top is its bottom) takes `factor` 1; one that runs the
   * other way (both chains end there, or both start) takes -1, which flips
   * every first derivative and leaves the second ones.
   *
   * @param owner The owner's layer, carrying its jets (curvatures and plane slopes).
   * @param factor Station direction of the neighbour relative to the owner, 1 or -1.
   */
  export function copy(
    owner: IAutoMovieLoftChain.ILayer,
    factor: number,
  ): ICopy {
    if (owner.curvatures === undefined || owner.frameSlopes === undefined)
      throw new Error("A shared layer's owner carries no jets");
    return {
      coefficients: [...owner.coefficients],
      plane: flat(owner.frame ?? horizontal(owner.y)),
      slopes: owner.slopes.map((v: number): number => v * factor),
      curvatures: owner.curvatures.map((v: number): number => v * factor * factor),
      frameSlopes: flat(owner.frameSlopes).map((v: number): number => v * factor),
      frameCurvatures: flat(owner.frameCurvatures!).map(
        (v: number): number => v * factor * factor,
      ),
    };
  }

  /**
   * A chain made C2 along its stations by the natural spline of every
   * coefficient, its lift and, when every layer is framed, its plane.
   *
   * Layers named in `keep` are shared with an owner and keep the slopes and
   * curvatures they carry (their copies); their values enter the spline like
   * any other layer's. The section, plane and lift values are unchanged, so
   * every principal section stays where it was; only the shape between
   * layers becomes the spline's.
   *
   * @param chain Chain to solve; not modified.
   * @param keep Indices of layers whose derivatives are owned elsewhere.
   * @returns A copy whose layers carry slopes and curvatures (and plane jets when framed).
   */
  export function continuous(
    chain: IAutoMovieLoftChain,
    keep: readonly number[] = [],
  ): IAutoMovieLoftChain {
    const rows: readonly IAutoMovieLoftChain.ILayer[] = chain.layers;
    const t: AutoMovieLoftContract.Stations = AutoMovieLoftContract.stations(
      chain.name,
      rows.map((l: IAutoMovieLoftChain.ILayer): number => l.y),
      AutoMovieLoftContract.LEAST_SPLINE_GAP,
    );
    const kept: Set<number> = new Set(keep);
    const values: number[][] = rows.map((l: IAutoMovieLoftChain.ILayer): number[] => [...l.coefficients]);
    const cM: number[][] = curvatures(t, values);
    const cS: number[][] = slopes(t, values, cM);

    // A lift absent on a layer is zero there, as the chain reads it.
    const lifted: boolean = rows.some((l: IAutoMovieLoftChain.ILayer): boolean => l.lift !== undefined);
    const lifts: number[][] = rows.map((l: IAutoMovieLoftChain.ILayer): number[] =>
      l.lift !== undefined ? [...l.lift] : new Array<number>(l.coefficients.length / 2).fill(0),
    );
    const lS: number[][] = lifted ? slopes(t, lifts) : [];

    // Planes move by the spline only when every layer states its plane.
    const framed: boolean = rows.every((l: IAutoMovieLoftChain.ILayer): boolean => l.frame !== undefined);
    const planes: number[][] = framed ? rows.map((l: IAutoMovieLoftChain.ILayer): number[] => flat(l.frame!)) : [];
    const pM: number[][] = framed ? curvatures(t, planes) : [];
    const pS: number[][] = framed ? slopes(t, planes, pM) : [];

    return {
      ...chain,
      layers: rows.map((l: IAutoMovieLoftChain.ILayer, k: number): IAutoMovieLoftChain.ILayer => {
        if (kept.has(k)) {
          if (l.curvatures === undefined)
            throw new Error(`Kept layer ${k} of ${chain.name} carries no curvatures`);
          return l;
        }
        AutoMovieLoftContract.jet(`${chain.name} layer ${k} slopes`, cS[k]!, AutoMovieLoftContract.FINITE);
        AutoMovieLoftContract.jet(`${chain.name} layer ${k} curvatures`, cM[k]!, AutoMovieLoftContract.FINITE);
        return {
          ...l,
          slopes: cS[k]!,
          curvatures: cM[k]!,
          ...(lifted ? { lift: lifts[k]!, liftSlopes: lS[k]! } : {}),
          ...(framed ? { frameSlopes: unflat(pS[k]!), frameCurvatures: unflat(pM[k]!) } : {}),
        };
      }),
    };
  }

  /** A plane as nine numbers `[origin, u, v]`. */
  export function flat(f: AutoMovieLoftFrame.IFrame): number[] {
    return [...f.origin, ...f.u, ...f.v];
  }

  /** A plane of nine numbers, its axes as given. */
  export function unflat(x: readonly number[]): AutoMovieLoftFrame.IFrame {
    return {
      origin: [x[0]!, x[1]!, x[2]!],
      u: [x[3]!, x[4]!, x[5]!],
      v: [x[6]!, x[7]!, x[8]!],
    };
  }
}

/** Horizontal plane at a station, the default of an unframed layer. */
function horizontal(y: number): AutoMovieLoftFrame.IFrame {
  return { origin: [0, y, 0], u: [1, 0, 0], v: [0, 0, 1] };
}
