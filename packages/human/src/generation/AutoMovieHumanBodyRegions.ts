import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanFeatureChain } from "../network/AutoMovieHumanFeatureChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
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
    const chains: Map<string, IAutoMovieHumanLoftChain> = new Map();
    for (const region of regions)
      for (const chain of [
        ...region.chains,
        ...(region.networks ?? []).map(AutoMovieHumanFeatureChain.expand),
      ]) {
        if (chains.has(chain.name))
          throw new Error(`Chain ${chain.name} is defined by two regions`);
        chains.set(chain.name, { ...chain, layers: [...chain.layers] });
      }

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
      events: regions.flatMap(
        (
          r: IAutoMovieHumanBodyRegion,
        ): IAutoMovieHumanBodyCalibration.IEvent[] => r.events,
      ),
      poles,
      apertures: regions.flatMap(
        (r: IAutoMovieHumanBodyRegion): IAutoMovieHumanLoftAperture[] =>
          r.apertures ?? [],
      ),
      eyes: regions.flatMap(
        (r: IAutoMovieHumanBodyRegion): IAutoMovieHumanBodyCalibration.IEye[] =>
          r.eyes ?? [],
      ),
      appendages: regions.flatMap(
        (
          r: IAutoMovieHumanBodyRegion,
        ): IAutoMovieHumanBodyCalibration.IAppendage[] => r.appendages ?? [],
      ),
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
