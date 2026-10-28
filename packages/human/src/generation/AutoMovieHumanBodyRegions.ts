import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanFeatureChain } from "../network/AutoMovieHumanFeatureChain";
import type { AutoMovieHumanLoftFrame } from "../lofting/AutoMovieHumanLoftFrame";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanFeatureChain } from "../network/IAutoMovieHumanFeatureChain";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanBodyRegion } from "./IAutoMovieHumanBodyRegion";

/**
 * Combination of region calibrations into the one calibration the
 * generator lofts.
 */
export namespace AutoMovieHumanBodyRegions {
  /**
   * Merge regions: concatenate chains, events and poles, then apply trims.
   *
   * Every region's networks are composed in one
   * `AutoMovieHumanFeatureChain.compose`, so a shared key's owner in another
   * region resolves and every module carries jets and its placed anchor.
   * Each shared end becomes a continuation event from its owner, so the
   * sharer inherits the owner's ring instead of closing at a pole.
   * Apertures and eyes that name a chain are placed in the world by that
   * chain's anchor through their own child frames.
   *
   * A trim cuts a chain at a station inside it. The layers beyond the cut are
   * dropped and a new end layer is evaluated from the chain's own Hermite
   * function at the station (coefficients, station derivative and, for a
   * framed chain, the interpolated frame), so the kept part of the chain is
   * the same surface as before. For a framed chain the origin tangents of the
   * layers next to the cut are recomputed from their new neighbours, which can
   * move the origin path inside that one interval. A pole at the trimmed end is
   * dropped unless the trimming region supplies it.
   *
   * Duplicate chain names, a missing or duplicate stature, a trim of an
   * unknown chain and a trim station outside its chain are refused.
   *
   * @param regions Region calibrations, in any order.
   */
  export function merge(
    regions: readonly IAutoMovieHumanBodyRegion[],
  ): IAutoMovieHumanBodyCalibration {
    // Stature comes from exactly one region.
    const statures: number[] = regions
      .map((r: IAutoMovieHumanBodyRegion): number | undefined => r.stature)
      .filter((s: number | undefined): s is number => s !== undefined);
    if (statures.length !== 1)
      throw new Error("Exactly one calibration region must declare stature");

    // Chains by unique name; copies, so trims never touch the region data.
    const networks: IAutoMovieHumanFeatureChain[] = regions.flatMap(
      (r: IAutoMovieHumanBodyRegion): IAutoMovieHumanFeatureChain[] =>
        r.networks ?? [],
    );
    const composed: IAutoMovieHumanLoftChain[] =
      AutoMovieHumanFeatureChain.compose(networks);
    const chains: Map<string, IAutoMovieHumanLoftChain> = new Map();
    for (const chain of [
      ...regions.flatMap(
        (r: IAutoMovieHumanBodyRegion): IAutoMovieHumanLoftChain[] => r.chains,
      ),
      ...composed,
    ]) {
      if (chains.has(chain.name))
        throw new Error(`Chain ${chain.name} is defined by two regions`);
      chains.set(chain.name, { ...chain, layers: [...chain.layers] });
    }

    // A shared end continues its owner's end ring whole.
    const continuations: IAutoMovieHumanBodyCalibration.IEvent[] =
      networks.flatMap(
        (c: IAutoMovieHumanFeatureChain): IAutoMovieHumanBodyCalibration.IEvent[] =>
          [c.ends?.bottom, c.ends?.top]
            .filter(
              (
                s: IAutoMovieHumanFeatureChain.IShare | undefined,
              ): s is IAutoMovieHumanFeatureChain.IShare => s !== undefined,
            )
            .map(
              (
                s: IAutoMovieHumanFeatureChain.IShare,
              ): IAutoMovieHumanBodyCalibration.IEvent => ({
                parent: s.owner,
                direction: s.end === "top" ? "up" : "down",
                splits: [{ child: c.name, arcs: [[0, 2 * Math.PI]] }],
              }),
            ),
      );

    let poles: IAutoMovieHumanBodyCalibration.IPole[] = regions.flatMap(
      (r: IAutoMovieHumanBodyRegion): IAutoMovieHumanBodyCalibration.IPole[] =>
        r.poles,
    );

    for (const trim of regions.flatMap(
      (r: IAutoMovieHumanBodyRegion): IAutoMovieHumanBodyRegion.ITrim[] =>
        r.trims,
    )) {
      const chain: IAutoMovieHumanLoftChain | undefined = chains.get(
        trim.chain,
      );
      if (chain === undefined)
        throw new Error(`Trim of unknown chain ${trim.chain}`);
      chains.set(chain.name, cut(chain, trim));

      // The trimming region closes this end with its own event or pole.
      poles = poles.filter(
        (p: IAutoMovieHumanBodyCalibration.IPole): boolean =>
          !(p.chain === trim.chain && p.end === trim.end) ||
          regions.some(
            (r: IAutoMovieHumanBodyRegion): boolean =>
              r.trims.includes(trim) && r.poles.includes(p),
          ),
      );
    }

    return {
      stature: statures[0]!,
      chains: [...chains.values()],
      events: [
        ...regions.flatMap(
          (
            r: IAutoMovieHumanBodyRegion,
          ): IAutoMovieHumanBodyCalibration.IEvent[] => r.events,
        ),
        ...continuations,
      ],
      poles,
      apertures: regions.flatMap(
        (r: IAutoMovieHumanBodyRegion): IAutoMovieHumanLoftAperture[] =>
          (r.apertures ?? []).map(
            (a: IAutoMovieHumanLoftAperture): IAutoMovieHumanLoftAperture =>
              aperture(a, chains),
          ),
      ),
      eyes: regions.flatMap(
        (r: IAutoMovieHumanBodyRegion): IAutoMovieHumanBodyCalibration.IEye[] =>
          (r.eyes ?? []).map(
            (
              e: IAutoMovieHumanBodyCalibration.IEye,
            ): IAutoMovieHumanBodyCalibration.IEye => eye(e, chains),
          ),
      ),
      appendages: regions.flatMap(
        (
          r: IAutoMovieHumanBodyRegion,
        ): IAutoMovieHumanBodyCalibration.IAppendage[] => r.appendages ?? [],
      ),
    };
  }

  /**
   * World frame of an opening's or a globe's child frame: the frame given in
   * its chain's anchor coordinates, placed by that chain's composed anchor;
   * null for a world record.
   */
  function childFrame(
    what: string,
    chain: string | undefined,
    frame: AutoMovieHumanLoftFrame.IFrame | undefined,
    chains: ReadonlyMap<string, IAutoMovieHumanLoftChain>,
  ): AutoMovieHumanLoftFrame.IFrame | null {
    if (chain === undefined) {
      if (frame !== undefined)
        throw new Error(`${what} has a frame but names no chain`);
      return null;
    }
    const anchor: IAutoMovieHumanLoftChain.IAnchor | undefined =
      chains.get(chain)?.anchor;
    if (anchor === undefined)
      throw new Error(`${what} hangs from ${chain}, which has no anchor`);
    if (frame === undefined)
      throw new Error(`${what} names ${chain} but has no frame`);
    return AutoMovieHumanFeatureChain.placeFrame(anchor.frame, frame);
  }

  /**
   * An opening placed in the world through its child frame: each
   * coordinate series' constant terms form a point, and each harmonic's
   * cosine or sine coefficients a vector, so the map moves the point and
   * turns the vectors and the margin keeps its harmonic count.
   */
  function aperture(
    a: IAutoMovieHumanLoftAperture,
    chains: ReadonlyMap<string, IAutoMovieHumanLoftChain>,
  ): IAutoMovieHumanLoftAperture {
    const frame: AutoMovieHumanLoftFrame.IFrame | null = childFrame(
      `Aperture ${a.name}`,
      a.chain,
      a.frame,
      chains,
    );
    if (frame === null) return a;
    const width: number = 2 * a.order + 1;
    const coefficients: number[] = new Array<number>(3 * width).fill(0);
    for (let i: number = 0; i < width; i++) {
      const local: number[] = [0, 1, 2].map(
        (k: number): number => a.coefficients[k * width + i]!,
      );
      const world: [number, number, number] =
        i === 0
          ? AutoMovieHumanFeatureChain.placePoint(frame, local)
          : AutoMovieHumanFeatureChain.placeDirection(frame, local);
      for (let k: number = 0; k < 3; k++)
        coefficients[k * width + i] = world[k]!;
    }
    return {
      ...a,
      coefficients,
      forward: AutoMovieHumanFeatureChain.placeDirection(frame, a.forward),
      frame,
    };
  }

  /** A globe placed in the world through its child frame. */
  function eye(
    e: IAutoMovieHumanBodyCalibration.IEye,
    chains: ReadonlyMap<string, IAutoMovieHumanLoftChain>,
  ): IAutoMovieHumanBodyCalibration.IEye {
    const frame: AutoMovieHumanLoftFrame.IFrame | null = childFrame(
      `Eye ${e.side}`,
      e.chain,
      e.frame,
      chains,
    );
    if (frame === null) return e;
    return {
      ...e,
      centre: AutoMovieHumanFeatureChain.placePoint(frame, e.centre),
      frame,
    };
  }

  /** Chain cut at a trim station, ending in a layer of its own function. */
  function cut(
    chain: IAutoMovieHumanLoftChain,
    trim: IAutoMovieHumanBodyRegion.ITrim,
  ): IAutoMovieHumanLoftChain {
    const layers: IAutoMovieHumanLoftChain.ILayer[] = chain.layers;
    const s: number = trim.station;
    if (!(s > layers[0]!.y && s < layers[layers.length - 1]!.y))
      throw new Error(`Trim of ${chain.name} at ${s} is not inside the chain`);

    // The new end layer reproduces the function at the cut exactly.
    const framed: boolean = layers.some(
      (l: IAutoMovieHumanLoftChain.ILayer): boolean => l.frame !== undefined,
    );
    const end: IAutoMovieHumanLoftChain.ILayer = {
      y: s,
      coefficients: AutoMovieHumanLoftChain.coefficients(chain, s),
      slopes: AutoMovieHumanLoftChain.derivative(chain, s),
      ...(framed ? { frame: AutoMovieHumanLoftChain.frame(chain, s) } : {}),
    };

    const kept: IAutoMovieHumanLoftChain.ILayer[] =
      trim.end === "bottom"
        ? [end, ...layers.filter((l): boolean => l.y > s + 1e-9)]
        : [...layers.filter((l): boolean => l.y < s - 1e-9), end];
    return { ...chain, layers: kept };
  }
}
