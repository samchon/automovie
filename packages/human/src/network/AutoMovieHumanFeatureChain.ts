import { AutoMovieHumanLoftFrame } from "../lofting/AutoMovieHumanLoftFrame";
import { AutoMovieHumanStationHermite } from "../lofting/AutoMovieHumanStationHermite";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanFeatureChain } from "./IAutoMovieHumanFeatureChain";
import type { IAutoMovieHumanRelief } from "./IAutoMovieHumanRelief";

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
   * Loft chain of a feature chain, without jets or placement.
   *
   * @param chain Key sections; not modified.
   * @returns The spline chain whose layers are the keys.
   */
  export function expand(chain: IAutoMovieHumanFeatureChain): IAutoMovieHumanLoftChain {
    const keys: readonly IAutoMovieHumanFeatureChain.IKey[] = chain.keys;
    if (keys.length < 2) throw new Error(`Feature chain ${chain.name} needs two keys`);
    const t: number[] = keys.map((k: IAutoMovieHumanFeatureChain.IKey): number => k.station);
    const slopes: number[][] = derivatives(
      t,
      keys.map((k: IAutoMovieHumanFeatureChain.IKey): readonly number[] => k.coefficients),
    );
    return {
      name: chain.name,
      basis: "spline",
      order: chain.order,
      rule: chain.rule,
      samples: chain.samples,
      ...(chain.reliefs?.length ? { reliefs: chain.reliefs } : {}),
      layers: keys.map(
        (k: IAutoMovieHumanFeatureChain.IKey, i: number): IAutoMovieHumanLoftChain.ILayer => ({
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
   * station derivatives, so its intervals are quintic and a jet is exact.
   *
   * An anchored chain's keys, pole and relief axes are first placed in the
   * world by its anchor (a child anchor through its parent's), which
   * changes no shape: the natural spline and the B-spline sections are
   * affine combinations of their keys (Farin 2002, Curves and Surfaces for
   * CAGD, 5th ed.), so composing in place equals composing in the module's
   * frame and placing the result. The placed anchor, named axes and
   * declared joints ride on the loft chain.
   *
   * Owners compose before the chains that share their keys. A shared end's
   * key is the owner's placed end layer, copied bit for bit before the
   * spline is solved, and its derivatives are the owner's, signed into this
   * chain's station direction; a cap's keys lie in planes at
   * `C + rho cos(theta) n` with that formula's derivatives. An all-cap
   * module, whose only key before the cap is `cap.from`, takes that key's
   * plane slope and curvature from the cap formula as well, since the
   * base's plane spline needs two keys.
   *
   * @param chains Feature chains; not modified.
   * @returns Their loft chains, in the same order.
   */
  export function compose(chains: readonly IAutoMovieHumanFeatureChain[]): IAutoMovieHumanLoftChain[] {
    const named: Map<string, IAutoMovieHumanFeatureChain> = new Map(
      chains.map((c: IAutoMovieHumanFeatureChain): [string, IAutoMovieHumanFeatureChain] => [c.name, c]),
    );
    const done: Map<string, IAutoMovieHumanLoftChain> = new Map();
    const open: Set<string> = new Set();
    const visit = (chain: IAutoMovieHumanFeatureChain): void => {
      if (done.has(chain.name)) return;
      if (open.has(chain.name)) throw new Error(`Shared keys form a cycle through ${chain.name}`);
      open.add(chain.name);
      for (const share of [chain.ends?.bottom, chain.ends?.top]) {
        if (share === undefined) continue;
        const owner: IAutoMovieHumanFeatureChain | undefined = named.get(share.owner);
        if (owner === undefined) throw new Error(`Chain ${chain.name} shares a key with missing ${share.owner}`);
        visit(owner);
      }
      done.set(chain.name, jets(chain, named, done));
      open.delete(chain.name);
    };
    chains.forEach(visit);
    return chains.map((c: IAutoMovieHumanFeatureChain): IAutoMovieHumanLoftChain => done.get(c.name)!);
  }

  /** Weights of a composed chain's coefficients at one station; see {@link weights}. */
  export interface IWeights {
    /** Weight of every key's coefficients for the value and the first and second station derivatives. */
    keys: [number[], number[], number[]];

    /**
     * Weights of the owners' end slopes and curvatures, as stored on the
     * owners' composed end layers, for every shared end of the chain; the
     * sign into this chain's station is included.
     */
    owners: IOwnerWeights[];
  }

  /** The weights of one shared end's owner derivatives. */
  export interface IOwnerWeights {
    /** This chain's end that shares the owner's key. */
    end: "bottom" | "top";

    /** The owning chain. */
    owner: string;

    /** Weight of the owner's end slopes for the value and the two station derivatives. */
    slope: [number, number, number];

    /** Weight of the owner's end curvatures for the value and the two station derivatives. */
    curvature: [number, number, number];
  }

  /**
   * Weights `w_k(s)` of every key's coefficients and of the owners' end
   * derivatives such that the composed chain's coefficients are
   * `sum_k w_k(s) c_k + w_m(s) m_owner + w_M(s) M_owner`, with their first and
   * second station derivatives: the natural-spline system of
   * {@link curvatures}, the shared-end override and the quintic Hermite of
   * `AutoMovieHumanStationHermite` that {@link compose} uses, written as
   * linear maps of the keys. A shared key's own coefficients are the
   * owner's copied end layer.
   *
   * @param chains Feature chains holding the named chain.
   * @param name Chain to weigh.
   * @param s Station or stations inside the chain.
   */
  export function weights(chains: readonly IAutoMovieHumanFeatureChain[], name: string, s: number): IWeights;
  export function weights(chains: readonly IAutoMovieHumanFeatureChain[], name: string, s: readonly number[]): IWeights[];
  export function weights(
    chains: readonly IAutoMovieHumanFeatureChain[],
    name: string,
    s: number | readonly number[],
  ): IWeights | IWeights[] {
    const chain: IAutoMovieHumanFeatureChain | undefined = chains.find((c: IAutoMovieHumanFeatureChain): boolean => c.name === name);
    if (chain === undefined) throw new Error(`No chain ${name} to weigh`);
    const t: number[] = chain.keys.map((k: IAutoMovieHumanFeatureChain.IKey): number => k.station);
    const K: number = t.length;
    if (K < 2) throw new Error(`Feature chain ${name} needs two keys`);
    const identity: number[][] = t.map((_: number, i: number): number[] => t.map((_v: number, k: number): number => (i === k ? 1 : 0)));
    const Q: number[][] = curvatures(t, identity);
    const D: number[][] = derivatives(t, identity, Q);
    const shared: Map<number, IShared> = new Map(
      sharedEnds(chain).map((x: IShared): [number, IShared] => [x.index, x]),
    );
    const at = (x: number): IWeights => {
      const [lo, hi] = bracket(t, x, name);
      const H: number = t[hi]! - t[lo]!;
      const u: number = Math.min(1, Math.max(0, (x - t[lo]!) / H));
      const keys: [number[], number[], number[]] = [[], [], []];
      const owners: IOwnerWeights[] = [...shared.values()].map(
        (e: IShared): IOwnerWeights => ({ end: e.which, owner: e.owner, slope: [0, 0, 0], curvature: [0, 0, 0] }),
      );
      for (const order of [0, 1, 2] as const) {
        const W: number[] = AutoMovieHumanStationHermite.weights(u, H, order, true);
        const row: number[] = new Array<number>(K).fill(0);
        row[lo]! += W[0]!;
        row[hi]! += W[5]!;
        for (const [index, slope, curve] of [
          [lo, W[1]!, W[2]!],
          [hi, W[4]!, W[3]!],
        ] as const) {
          const e: IShared | undefined = shared.get(index);
          if (e === undefined)
            for (let k: number = 0; k < K; k++) row[k]! += slope * D[index]![k]! + curve * Q[index]![k]!;
          else {
            const o: IOwnerWeights = owners.find((w: IOwnerWeights): boolean => w.end === e.which)!;
            o.slope[order] += slope * e.factor;
            o.curvature[order] += curve * e.factor * e.factor;
          }
        }
        keys[order] = row;
      }
      return { keys, owners };
    };
    return typeof s === "number" ? at(s) : s.map(at);
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
  export function curvatures(t: readonly number[], values: readonly (readonly number[])[]): number[][] {
    const n: number = t.length;
    const width: number = values[0]!.length;
    const out: number[][] = t.map((): number[] => new Array<number>(width).fill(0));
    if (n < 3) return out;
    const h: number[] = t.slice(1).map((v: number, i: number): number => v - t[i]!);
    const m: number = n - 2;
    const c: number[] = new Array<number>(m);
    const d: number[] = new Array<number>(m);
    for (let col: number = 0; col < width; col++) {
      // Row i (interior): h_{i-1} M_{i-1} + 2 (h_{i-1} + h_i) M_i + h_i M_{i+1}
      // = 6 (secant_i - secant_{i-1}).
      for (let r: number = 0; r < m; r++) {
        const i: number = r + 1;
        const rhs: number =
          6 * ((values[i + 1]![col]! - values[i]![col]!) / h[i]! - (values[i]![col]! - values[i - 1]![col]!) / h[i - 1]!);
        const diagonal: number = 2 * (h[i - 1]! + h[i]!);
        const lower: number = h[i - 1]!;
        const upper: number = h[i]!;
        const denom: number = r === 0 ? diagonal : diagonal - lower * c[r - 1]!;
        c[r] = upper / denom;
        d[r] = (r === 0 ? rhs : rhs - lower * d[r - 1]!) / denom;
      }
      out[m]![col] = d[m - 1]!;
      for (let r: number = m - 2; r >= 0; r--) out[r + 1]![col] = d[r]! - c[r]! * out[r + 2]![col]!;
    }
    return out;
  }

  /**
   * World point of a point given in a rigid frame's coordinates:
   * `origin + x u + y (v x u) + z v`.
   */
  export function placePoint(frame: AutoMovieHumanLoftFrame.IFrame, p: readonly number[]): V {
    const d: V = placeDirection(frame, p);
    return [frame.origin[0] + d[0], frame.origin[1] + d[1], frame.origin[2] + d[2]];
  }

  /** World direction of a direction given in a rigid frame's coordinates. */
  export function placeDirection(frame: AutoMovieHumanLoftFrame.IFrame, d: readonly number[]): V {
    const w: V = cross(frame.v, frame.u);
    return [0, 1, 2].map((k: number): number => d[0]! * frame.u[k]! + d[1]! * w[k]! + d[2]! * frame.v[k]!) as V;
  }

  /** World frame of a frame given in another rigid frame's coordinates. */
  export function placeFrame(
    frame: AutoMovieHumanLoftFrame.IFrame,
    local: AutoMovieHumanLoftFrame.IFrame,
  ): AutoMovieHumanLoftFrame.IFrame {
    return { origin: placePoint(frame, local.origin), u: placeDirection(frame, local.u), v: placeDirection(frame, local.v) };
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
        const secant: number = (values[lo + 1]![col]! - values[lo]![col]!) / h;
        return i === lo
          ? secant - (h * (2 * M[lo]![col]! + M[lo + 1]![col]!)) / 6
          : secant + (h * (M[lo]![col]! + 2 * M[lo + 1]![col]!)) / 6;
      });
    });
  }

  /** A shared end of a chain: its key's index, the owner, and the sign of the owner's station. */
  interface IShared {
    which: "bottom" | "top";
    index: number;
    owner: string;
    end: "bottom" | "top";
    factor: number;
  }

  /** The shared ends of a chain, refused where an end is both shared and capped. */
  function sharedEnds(chain: IAutoMovieHumanFeatureChain): IShared[] {
    const out: IShared[] = [];
    for (const which of ["bottom", "top"] as const) {
      const share: IAutoMovieHumanFeatureChain.IShare | undefined = chain.ends?.[which];
      if (share === undefined) continue;
      if (chain.cap?.end === which) throw new Error(`Chain ${chain.name} both shares and caps its ${which} end`);
      out.push({
        which,
        index: which === "bottom" ? 0 : chain.keys.length - 1,
        owner: share.owner,
        end: share.end,
        factor: which === share.end ? -1 : 1,
      });
    }
    return out;
  }

  /** Indices of the key interval holding a station, as `AutoMovieHumanLoftChain.bracket` takes them. */
  function bracket(t: readonly number[], s: number, name: string): [number, number] {
    if (s < t[0]! - 1e-9 || s > t[t.length - 1]! + 1e-9) throw new Error(`Station ${s} is outside chain ${name}`);
    let lo: number = 0;
    let hi: number = t.length - 1;
    while (hi - lo > 1) {
      const mid: number = (lo + hi) >> 1;
      if (t[mid]! <= s) lo = mid;
      else hi = mid;
    }
    return [lo, hi];
  }

  /** One chain's layers with their jets, its owners already composed. */
  function jets(
    source: IAutoMovieHumanFeatureChain,
    named: ReadonlyMap<string, IAutoMovieHumanFeatureChain>,
    done: ReadonlyMap<string, IAutoMovieHumanLoftChain>,
  ): IAutoMovieHumanLoftChain {
    const frames: [AutoMovieHumanLoftFrame.IFrame, AutoMovieHumanLoftFrame.IFrame] | null = anchorFrame(source, named);
    const frame: AutoMovieHumanLoftFrame.IFrame | null = frames === null ? null : frames[0];
    const chain: IAutoMovieHumanFeatureChain = frame === null ? source : placed(source, frame);
    const keys: readonly IAutoMovieHumanFeatureChain.IKey[] = chain.keys;
    if (keys.length < 2) throw new Error(`Feature chain ${chain.name} needs two keys`);
    const t: number[] = keys.map((k: IAutoMovieHumanFeatureChain.IKey): number => k.station);

    // Values per key: the coefficients and the plane as nine numbers.
    const coefficients: number[][] = keys.map((k: IAutoMovieHumanFeatureChain.IKey): number[] => [...k.coefficients]);
    const planes: number[][] = keys.map((k: IAutoMovieHumanFeatureChain.IKey): number[] =>
      flat(k.frame ?? AutoMovieHumanLoftFrame.horizontal(k.station)),
    );

    // A cap's keys, past its end key, take their planes from its formula.
    const cap: ICap | null = chain.cap === undefined ? null : capOf(chain);
    const capped: boolean[] = t.map((s: number): boolean => cap !== null && cap.beyond(s));
    t.forEach((s: number, k: number): void => {
      if (capped[k]) planes[k] = cap!.plane(s, 0);
    });

    // Shared ends copy the owner's placed end layer before the spline is
    // solved, and keep the owner's derivatives, signed into this station.
    const overrides: [number, IAutoMovieHumanLoftChain.ILayer, number][] = [];
    for (const e of sharedEnds(chain)) {
      const owner: IAutoMovieHumanLoftChain = done.get(e.owner)!;
      const end: IAutoMovieHumanLoftChain.ILayer = e.end === "top" ? owner.layers[owner.layers.length - 1]! : owner.layers[0]!;
      if (end.coefficients.length !== coefficients[e.index]!.length)
        throw new Error(`Chain ${chain.name} and ${e.owner} share a key of different control counts`);
      if (end.curvatures === undefined || end.frameSlopes === undefined)
        throw new Error(`Owner ${e.owner} of ${chain.name} carries no jets`);
      coefficients[e.index] = [...end.coefficients];
      planes[e.index] = flat(end.frame ?? AutoMovieHumanLoftFrame.horizontal(end.y));
      overrides.push([e.index, end, e.factor]);
    }

    // Natural splines: the control points over every key, base and cap
    // alike, the planes over the base's keys alone (the cap's follow its
    // formula, which meets the base's straight end C2; a base of one key,
    // an all-cap module's `cap.from`, takes the formula's derivatives
    // there); then the shared keys' derivatives.
    const cM: number[][] = curvatures(t, coefficients);
    const cS: number[][] = derivatives(t, coefficients, cM);
    const base: number[] = t.map((_: number, k: number): number => k).filter((k: number): boolean => !capped[k]);
    const single: boolean = base.length === 1;
    const bt: number[] = base.map((k: number): number => t[k]!);
    const bp: number[][] = base.map((k: number): number[] => planes[k]!);
    const bM: number[][] = single ? [] : curvatures(bt, bp);
    const bS: number[][] = single ? [] : derivatives(bt, bp, bM);
    const pM: number[][] = t.map((s: number, k: number): number[] =>
      capped[k] || single ? cap!.plane(s, 2) : bM[base.indexOf(k)]!,
    );
    const pS: number[][] = t.map((s: number, k: number): number[] =>
      capped[k] || single ? cap!.plane(s, 1) : bS[base.indexOf(k)]!,
    );
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
      ...(chain.cap === undefined ? {} : { pole: { end: chain.cap.end, point: chain.cap.pole } }),
      ...(frames === null ? {} : { anchor: placedAnchor(source.anchor!, frames[0], frames[1]) }),
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

  /**
   * The world frames of a chain's anchor and of the frame its named axes
   * are stored in: both the joint's bind frame for a joint anchor; for a
   * child anchor the child frame placed through its parent's anchor, and
   * the parent anchor's frame. Null without an anchor.
   */
  function anchorFrame(
    chain: IAutoMovieHumanFeatureChain,
    named: ReadonlyMap<string, IAutoMovieHumanFeatureChain>,
    seen: ReadonlySet<string> = new Set(),
  ): [AutoMovieHumanLoftFrame.IFrame, AutoMovieHumanLoftFrame.IFrame] | null {
    const anchor: IAutoMovieHumanFeatureChain.IAnchor | undefined = chain.anchor;
    if (anchor === undefined) return null;
    if ("joint" in anchor) return [anchor.frame, anchor.frame];
    if (seen.has(chain.name)) throw new Error(`Child anchors form a cycle through ${chain.name}`);
    const parent: IAutoMovieHumanFeatureChain | undefined = named.get(anchor.parent);
    if (parent === undefined) throw new Error(`Chain ${chain.name} hangs from missing ${anchor.parent}`);
    const outer: [AutoMovieHumanLoftFrame.IFrame, AutoMovieHumanLoftFrame.IFrame] | null = anchorFrame(
      parent,
      named,
      new Set([...seen, chain.name]),
    );
    if (outer === null) throw new Error(`Parent ${anchor.parent} of ${chain.name} has no anchor`);
    return [placeFrame(outer[0], anchor.frame), outer[0]];
  }

  /** An anchored chain with its keys, pole and relief axes placed in the world. */
  function placed(chain: IAutoMovieHumanFeatureChain, frame: AutoMovieHumanLoftFrame.IFrame): IAutoMovieHumanFeatureChain {
    return {
      ...chain,
      keys: chain.keys.map((k: IAutoMovieHumanFeatureChain.IKey): IAutoMovieHumanFeatureChain.IKey => {
        if (k.frame === undefined) throw new Error(`Anchored chain ${chain.name} has a key without a frame`);
        return { ...k, frame: placeFrame(frame, k.frame) };
      }),
      ...(chain.cap === undefined ? {} : { cap: { ...chain.cap, pole: placePoint(frame, chain.cap.pole) } }),
      ...(chain.reliefs === undefined
        ? {}
        : {
            reliefs: chain.reliefs.map(
              (r: IAutoMovieHumanRelief): IAutoMovieHumanRelief => ({ ...r, axis: placeDirection(frame, r.axis) }),
            ),
          }),
    };
  }

  /** A chain's anchor, named axes, named frames and declared joints placed in the world. */
  function placedAnchor(
    anchor: IAutoMovieHumanFeatureChain.IAnchor,
    frame: AutoMovieHumanLoftFrame.IFrame,
    outer: AutoMovieHumanLoftFrame.IFrame,
  ): IAutoMovieHumanLoftChain.IAnchor {
    // A child's axes are stored in its parent anchor's coordinates, so they
    // turn by the parent's frame; a joint anchor's by its own.
    const axes: IAutoMovieHumanLoftChain.IAnchor["axes"] = {
      along: placeDirection(outer, anchor.axes.along),
      front: placeDirection(outer, anchor.axes.front),
      lateral: placeDirection(outer, anchor.axes.lateral),
    };
    if (!("joint" in anchor)) return { parent: anchor.parent, frame, axes, joints: [] };
    return {
      joint: anchor.joint,
      frame,
      axes,
      ...(anchor.frames === undefined
        ? {}
        : {
            frames: Object.fromEntries(
              Object.entries(anchor.frames).map(
                ([name, f]: [string, AutoMovieHumanLoftFrame.IFrame]): [string, AutoMovieHumanLoftFrame.IFrame] => [
                  name,
                  placeFrame(frame, f),
                ],
              ),
            ),
          }),
      joints: anchor.joints.map(
        (j: IAutoMovieHumanFeatureChain.IJoint): IAutoMovieHumanLoftChain.IAnchor["joints"][number] => ({
          name: j.name,
          point: placePoint(frame, j.point),
          ...(j.station === undefined ? {} : { station: j.station }),
        }),
      ),
    };
  }

  /** A cap's plane formula over the chain's station. */
  interface ICap {
    /** Whether a station lies past the end key, on the cap. */
    beyond: (s: number) => boolean;

    /** A plane's nine numbers `[origin, u, v]` at a station, or their first or second station derivative. */
    plane: (s: number, order: 0 | 1 | 2) => number[];
  }

  /**
   * The cap of a chain: C the end key's origin, n its plane normal pointing
   * out of the base (away from the base key beside it, or toward the pole
   * when no base key lies beside it), rho the pole's height over the end
   * plane, and `theta = pi / 2 - sigma (s - s_e) / rho` at station s, so the
   * origin `C + rho cos(theta) n` moves by `sigma sin(theta) n` and
   * `-(cos(theta) / rho) n` per station and the axes stay the end key's.
   */
  function capOf(chain: IAutoMovieHumanFeatureChain): ICap {
    const cap: IAutoMovieHumanFeatureChain.ICap = chain.cap!;
    const sigma: number = cap.end === "top" ? 1 : -1;
    const keys: readonly IAutoMovieHumanFeatureChain.IKey[] = chain.keys;
    const at: number = keys.findIndex((k: IAutoMovieHumanFeatureChain.IKey): boolean => Math.abs(k.station - cap.from) < 1e-9);
    if (at < 0) throw new Error(`Cap of ${chain.name} has no end key`);
    const beside: IAutoMovieHumanFeatureChain.IKey | undefined = keys[at - sigma];
    const frameOf = (k: IAutoMovieHumanFeatureChain.IKey): AutoMovieHumanLoftFrame.IFrame =>
      k.frame ?? AutoMovieHumanLoftFrame.horizontal(k.station);
    const f: AutoMovieHumanLoftFrame.IFrame = frameOf(keys[at]!);
    const w: V = cross(f.v, f.u);
    const toward: readonly number[] = beside === undefined ? cap.pole : f.origin;
    const from: readonly number[] = beside === undefined ? f.origin : frameOf(beside).origin;
    const along: number = w.reduce((a: number, x: number, k: number): number => a + x * (toward[k]! - from[k]!), 0);
    const length: number = Math.hypot(w[0], w[1], w[2]);
    const n: number[] = w.map((x: number): number => ((along >= 0 ? 1 : -1) * x) / length);
    const rho: number = n.reduce((a: number, x: number, k: number): number => a + x * (cap.pole[k]! - f.origin[k]!), 0);
    if (!(rho > 0)) throw new Error(`Cap of ${chain.name} has its pole behind its end plane`);
    const pole: number = cap.from + (sigma * rho * Math.PI) / 2;
    const end: number = sigma > 0 ? keys[keys.length - 1]!.station : keys[0]!.station;
    if (Math.abs(end - pole) > 1e-6) throw new Error(`Cap of ${chain.name} ends at ${end}, not at its pole's station ${pole}`);
    return {
      beyond: (s: number): boolean => sigma * (s - cap.from) > 1e-9,
      plane: (s: number, order: 0 | 1 | 2): number[] => {
        const theta: number = Math.PI / 2 - (sigma * (s - cap.from)) / rho;
        const r: number = order === 0 ? rho * Math.cos(theta) : order === 1 ? sigma * Math.sin(theta) : -Math.cos(theta) / rho;
        const origin: number[] = n.map((x: number, k: number): number => (order === 0 ? f.origin[k]! : 0) + r * x);
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
    return { origin: [x[0]!, x[1]!, x[2]!], u: [x[3]!, x[4]!, x[5]!], v: [x[6]!, x[7]!, x[8]!] };
  }

  /** A world vector, mm. */
  type V = [number, number, number];

  /** Cross product. */
  function cross(a: readonly number[], b: readonly number[]): V {
    return [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
  }
}
