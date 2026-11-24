import type {
  IAutoMovieLoftCapSource,
  IAutoMovieLoftChain,
  IAutoMovieLoftSectionSource,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieLoftFrameSource } from "./AutoMovieLoftFrameSource";
import { AutoMovieLoftSectionSource } from "./AutoMovieLoftSectionSource";

/** A retained original closed end, with legacy absence still permitted. */
type Pole = NonNullable<IAutoMovieLoftChain["pole"]>;

/** Explicit ownership of original cap intervals beyond principal positive rows. */
export namespace AutoMovieLoftCapSource {
  /** Retain original cap ownership after all principal-row preparation. */
  export function retain(
    chain: IAutoMovieLoftChain,
    axis: IAutoMovieViewPart["axis"],
  ): IAutoMovieLoftChain {
    if (chain.nativeSource === undefined) return chain;
    const copy: IAutoMovieLoftChain = { ...chain };
    for (const key of ["pole", "opposite"] as const) {
      const pole: Pole | undefined = chain[key];
      if (pole === undefined) continue;
      const index: number = pole.end === "bottom" ? 0 : chain.layers.length - 1;
      const layer: IAutoMovieLoftChain.ILayer = chain.layers[index]!;
      const station: number =
        chain.nativeSource.data.domain[pole.end === "bottom" ? 0 : 1];
      copy[key] = {
        ...pole,
        source: {
          station,
          adjacent: layer.y,
          axis,
          point: [...pole.point],
          boundary: binding(layer),
          scalar: JSON.stringify(chain.nativeSource.data),
        },
      };
    }
    bounds(copy);
    // The full check has passed on these very objects; later reads may rely on
    // their identity.
    for (const key of ["pole", "opposite"] as const) {
      const pole: Pole | undefined = copy[key];
      if (pole?.source === undefined) continue;
      const index: number = pole.end === "bottom" ? 0 : chain.layers.length - 1;
      copy[key] = {
        ...pole,
        source: {
          ...pole.source,
          prepared: {
            layer: chain.layers[index]!,
            data: chain.nativeSource.data,
          },
        },
      };
    }
    return copy;
  }

  /** Owned station interval, including only validated surviving original caps. */
  export function bounds(chain: IAutoMovieLoftChain): [number, number] {
    const out: [number, number] = [
      chain.layers[0]!.y,
      chain.layers[chain.layers.length - 1]!.y,
    ];
    for (const pole of [chain.pole, chain.opposite]) {
      if (pole?.source === undefined) continue;
      validate(chain, pole);
      out[pole.end === "bottom" ? 0 : 1] = pole.source.station;
    }
    return out;
  }

  /** Actual cap owner outside the principal rows, or null on ordinary rows. */
  export function at(
    chain: IAutoMovieLoftChain,
    station: number,
  ): IAutoMovieLoftCapSource.ISource | null {
    const first: number = chain.layers[0]!.y;
    const last: number = chain.layers[chain.layers.length - 1]!.y;
    if (station >= first && station <= last) return null;
    for (const pole of [chain.pole, chain.opposite]) {
      if (pole?.source === undefined) continue;
      validate(chain, pole);
      const source: IAutoMovieLoftCapSource.ISource = pole.source;
      if (
        station < Math.min(source.station, source.adjacent) ||
        station > Math.max(source.station, source.adjacent)
      )
        continue;
      return source;
    }
    return null;
  }
}

/**
 * Exact numeric compatibility/frame/lift binding; source callbacks are
 * separate.
 */
function binding(layer: IAutoMovieLoftChain.ILayer): string {
  return JSON.stringify([
    layer.y,
    layer.coefficients,
    layer.slopes,
    layer.curvatures,
    layer.frame,
    layer.frameSlopes,
    layer.frameCurvatures,
    layer.lift,
    layer.liftSlopes,
    layer.liftCurvatures,
    layer.sectionSource,
  ]);
}

/** Reject stale ownership before any actual geometry callback is evaluated. */
function validate(chain: IAutoMovieLoftChain, pole: Pole): void {
  check(chain, pole);
}

/** The full check of a cap source against its chain's end. */
function check(chain: IAutoMovieLoftChain, pole: Pole): void {
  const source: IAutoMovieLoftCapSource.ISource = pole.source!;
  if (source.point.length !== 3)
    throw new Error(
      `The retained original ${pole.end} cap of ${chain.name} is malformed.`,
    );
  const index: number = pole.end === "bottom" ? 0 : chain.layers.length - 1;
  const layer: IAutoMovieLoftChain.ILayer = chain.layers[index]!;
  const native: IAutoMovieLoftSectionSource.ISource | null =
    AutoMovieLoftSectionSource.validate(chain, index, index);
  AutoMovieLoftFrameSource.validate(layer);
  const prepared: boolean =
    source.prepared !== undefined &&
    source.prepared.layer === layer &&
    native !== null &&
    source.prepared.data === native.data;
  if (
    native === null ||
    source.station !== native.data.domain[pole.end === "bottom" ? 0 : 1] ||
    source.adjacent !== layer.y ||
    !(pole.end === "bottom"
      ? source.station < layer.y
      : source.station > layer.y) ||
    typeof source.axis?.at !== "function" ||
    (!prepared && binding(layer) !== source.boundary) ||
    (!prepared && JSON.stringify(native.data) !== source.scalar) ||
    pole.point.some((x: number, k: number): boolean => x !== source.point[k]) ||
    layer.lift !== undefined
  )
    throw new Error(
      `The retained original ${pole.end} cap of ${chain.name} is stale or unsupported.`,
    );
}
