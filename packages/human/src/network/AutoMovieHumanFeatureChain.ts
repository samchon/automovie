import { AutoMovieHumanLoftFrame } from "../lofting/AutoMovieHumanLoftFrame";
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
   * Loft chains of a set of feature chains with their jets: every layer
   * carries its plane, the plane's and the coefficients' first and second
   * station derivatives, so its intervals are quintic and a jet is exact
   * (the redesign plan's section 2).
   *
   * Owners expand before the chains that share their keys. A shared end's
   * key is the owner's key, copied before the spline is solved, and its
   * derivatives are the owner's, signed into this chain's station
   * direction; a cap's keys lie in planes at `C + rho cos(theta) n` with
   * that formula's derivatives, and its top key, shared with its owner,
   * takes the owner's derivatives times `ds / dtheta = -rho` (station `s`
   * measured toward the pole, `d2s / dtheta2 = 0` there).
   *
   * @param chains Feature chains; not modified.
   * @returns Their loft chains, in the same order.
   */
  export function compose(
    chains: readonly IAutoMovieHumanFeatureChain[],
  ): IAutoMovieHumanLoftChain[] {
    const named: Map<string, IAutoMovieHumanFeatureChain> = new Map(
      chains.map(
        (c: IAutoMovieHumanFeatureChain): [string, IAutoMovieHumanFeatureChain] => [c.name, c],
      ),
    );
    const done: Map<string, IAutoMovieHumanLoftChain> = new Map();
    const open: Set<string> = new Set();
    const visit = (chain: IAutoMovieHumanFeatureChain): void => {
      if (done.has(chain.name)) return;
      if (open.has(chain.name))
        throw new Error(`Shared keys form a cycle through ${chain.name}`);
      open.add(chain.name);
      for (const share of [chain.ends?.bottom, chain.ends?.top]) {
        if (share === undefined) continue;
        const owner: IAutoMovieHumanFeatureChain | undefined = named.get(share.owner);
        if (owner === undefined)
          throw new Error(`Chain ${chain.name} shares a key with missing ${share.owner}`);
        visit(owner);
      }
      done.set(chain.name, jets(chain, done));
      open.delete(chain.name);
    };
    chains.forEach(visit);
    return chains.map(
      (c: IAutoMovieHumanFeatureChain): IAutoMovieHumanLoftChain => done.get(c.name)!,
    );
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

  /** One chain's layers with their jets, its owners already expanded. */
  function jets(
    chain: IAutoMovieHumanFeatureChain,
    done: ReadonlyMap<string, IAutoMovieHumanLoftChain>,
  ): IAutoMovieHumanLoftChain {
    const keys: readonly IAutoMovieHumanFeatureChain.IKey[] = chain.keys;
    if (keys.length < 2)
      throw new Error(`Feature chain ${chain.name} needs two keys`);
    const last: number = keys.length - 1;
    const t: number[] = keys.map(
      (k: IAutoMovieHumanFeatureChain.IKey): number => k.station,
    );
    const ownerEnd = (
      share: IAutoMovieHumanFeatureChain.IShare,
    ): IAutoMovieHumanLoftChain.ILayer => {
      const owner: IAutoMovieHumanLoftChain = done.get(share.owner)!;
      return share.end === "top"
        ? owner.layers[owner.layers.length - 1]!
        : owner.layers[0]!;
    };

    // Values per key: the coefficients and the plane as nine numbers.
    const coefficients: number[][] = keys.map(
      (k: IAutoMovieHumanFeatureChain.IKey): number[] => [...k.coefficients],
    );
    const planes: number[][] = keys.map(
      (k: IAutoMovieHumanFeatureChain.IKey): number[] =>
        flat(k.frame ?? AutoMovieHumanLoftFrame.horizontal(k.station)),
    );

    // A cap's planes and their derivatives follow C + rho cos(theta) n.
    const cap: ICap | null =
      chain.cap === undefined ? null : capOf(chain, t, ownerEnd);
    if (cap !== null)
      t.forEach((theta: number, k: number): void => {
        planes[k] = cap.plane(theta, 0);
      });

    // Shared ends copy the owner's key before the spline is solved, and
    // keep the owner's derivatives, signed into this chain's station
    // (scaled by ds / dtheta for a cap's top key).
    const overrides: [number, IAutoMovieHumanLoftChain.ILayer, number][] = [];
    for (const which of ["bottom", "top"] as const) {
      const share: IAutoMovieHumanFeatureChain.IShare | undefined = chain.ends?.[which];
      if (share === undefined) continue;
      const end: IAutoMovieHumanLoftChain.ILayer = ownerEnd(share);
      const index: number = which === "bottom" ? 0 : last;
      if (end.coefficients.length !== coefficients[index]!.length)
        throw new Error(`Chain ${chain.name} and ${share.owner} share a key of different control counts`);
      if (end.curvatures === undefined || end.frameSlopes === undefined)
        throw new Error(`Owner ${share.owner} of ${chain.name} carries no jets`);
      coefficients[index] = [...end.coefficients];
      planes[index] = flat(end.frame ?? AutoMovieHumanLoftFrame.horizontal(end.y));
      const factor: number =
        cap !== null && which === "top"
          ? (share.end === "top" ? -1 : 1) * cap.rho
          : which === share.end
            ? -1
            : 1;
      overrides.push([index, end, factor]);
    }

    // Natural splines over the keys, then the shared keys' derivatives.
    const cM: number[][] = curvatures(t, coefficients);
    const cS: number[][] = derivatives(t, coefficients, cM);
    const pM: number[][] =
      cap === null ? curvatures(t, planes) : t.map((x: number): number[] => cap.plane(x, 2));
    const pS: number[][] =
      cap === null ? derivatives(t, planes, pM) : t.map((x: number): number[] => cap.plane(x, 1));
    for (const [index, end, factor] of overrides) {
      cS[index] = end.slopes.map((v: number): number => v * factor);
      cM[index] = end.curvatures!.map((v: number): number => v * factor * factor);
      pS[index] = flat(end.frameSlopes!).map((v: number): number => v * factor);
      pM[index] = flat(end.frameCurvatures!).map((v: number): number => v * factor * factor);
    }

    return {
      name: chain.name,
      basis: "spline",
      order: chain.order,
      rule: chain.rule,
      samples: chain.samples,
      ...(chain.reliefs?.length ? { reliefs: chain.reliefs } : {}),
      ...(chain.cap === undefined ? {} : { pole: chain.cap.pole }),
      layers: keys.map(
        (k: IAutoMovieHumanFeatureChain.IKey, i: number): IAutoMovieHumanLoftChain.ILayer => ({
          y: k.station,
          frame: unflat(planes[i]!),
          coefficients: coefficients[i]!,
          slopes: cS[i]!,
          curvatures: cM[i]!,
          frameSlopes: unflat(pS[i]!),
          frameCurvatures: unflat(pM[i]!),
        }),
      ),
    };
  }

  /** A cap's plane formula: its rho and its planes' value or derivatives at an angle. */
  interface ICap {
    /** The pole's distance from the end plane along n, mm. */
    rho: number;

    /** A plane's nine numbers `[origin, u, v]` at an angle, or their first or second derivative in it. */
    plane: (theta: number, order: 0 | 1 | 2) => number[];
  }

  /**
   * The cap of a chain: C the owner's end key's origin, n that key's plane
   * normal pointing out of the owner (along the owner's station at a top
   * end, against it at a bottom end), rho the pole's height over the end
   * plane; its planes keep the end key's axes.
   */
  function capOf(
    chain: IAutoMovieHumanFeatureChain,
    t: readonly number[],
    ownerEnd: (share: IAutoMovieHumanFeatureChain.IShare) => IAutoMovieHumanLoftChain.ILayer,
  ): ICap {
    const share: IAutoMovieHumanFeatureChain.IShare | undefined = chain.ends?.top;
    if (share === undefined)
      throw new Error(`Cap ${chain.name} names no owner for its top key`);
    if (Math.abs(t[0]!) > 1e-9 || Math.abs(t[t.length - 1]! - Math.PI / 2) > 1e-9)
      throw new Error(`Cap ${chain.name} must run from 0 to pi / 2`);
    const end: IAutoMovieHumanLoftChain.ILayer = ownerEnd(share);
    const f: AutoMovieHumanLoftFrame.IFrame =
      end.frame ?? AutoMovieHumanLoftFrame.horizontal(end.y);
    const w: number[] = [
      f.v[1] * f.u[2] - f.v[2] * f.u[1],
      f.v[2] * f.u[0] - f.v[0] * f.u[2],
      f.v[0] * f.u[1] - f.v[1] * f.u[0],
    ];
    const ahead: readonly number[] = end.frameSlopes?.origin ?? w;
    const along: number = w[0]! * ahead[0]! + w[1]! * ahead[1]! + w[2]! * ahead[2]!;
    const sign: number = (along >= 0 ? 1 : -1) * (share.end === "top" ? 1 : -1);
    const length: number = Math.hypot(w[0]!, w[1]!, w[2]!);
    const n: number[] = w.map((x: number): number => (sign * x) / length);
    const pole: [number, number, number] = chain.cap!.pole;
    const rho: number =
      (pole[0] - f.origin[0]) * n[0]! +
      (pole[1] - f.origin[1]) * n[1]! +
      (pole[2] - f.origin[2]) * n[2]!;
    if (!(rho > 0))
      throw new Error(`Cap ${chain.name}'s pole lies behind its end plane`);
    return {
      rho,
      plane: (theta: number, order: 0 | 1 | 2): number[] => {
        // d^k/dtheta^k of rho cos(theta): cos, -sin, -cos.
        const r: number =
          rho * (order === 0 ? Math.cos(theta) : order === 1 ? -Math.sin(theta) : -Math.cos(theta));
        const origin: number[] = n.map(
          (x: number, k: number): number => (order === 0 ? f.origin[k]! : 0) + r * x,
        );
        return order === 0 ? [...origin, ...f.u, ...f.v] : [...origin, 0, 0, 0, 0, 0, 0];
      },
    };
  }

  /** A plane as nine numbers `[origin, u, v]`. */
  function flat(f: AutoMovieHumanLoftFrame.IFrame): number[] {
    return [...f.origin, ...f.u, ...f.v];
  }

  /** A plane of nine numbers, its axes as given. */
  function unflat(x: readonly number[]): AutoMovieHumanLoftFrame.IFrame {
    return {
      origin: [x[0]!, x[1]!, x[2]!],
      u: [x[3]!, x[4]!, x[5]!],
      v: [x[6]!, x[7]!, x[8]!],
    };
  }
}
