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

/** Original cap ownership of one immutable chain operation. */
interface IReader {
  /** Full physical interval in mm, with surviving original caps. */
  domain: [number, number];
  /** Find the admitted cap at a station outside the ordinary rows. */
  at(station: number): IAutoMovieLoftCapSource.ISource | null;
}

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
    return copy;
  }

  /** Owned station interval, including only validated surviving original caps. */
  export function bounds(chain: IAutoMovieLoftChain): [number, number] {
    return prepare(chain).domain;
  }

  /**
   * Validate the end bindings once and prepare interval queries on their
   * admitted owners.
   */
  export function prepare(chain: IAutoMovieLoftChain): IReader {
    const principal: [number, number] = [
      chain.layers[0]!.y,
      chain.layers[chain.layers.length - 1]!.y,
    ];
    const domain: [number, number] = [...principal];
    const owners: IAutoMovieLoftCapSource.ISource[] = [];
    for (const pole of [chain.pole, chain.opposite]) {
      if (pole?.source === undefined) continue;
      check(chain, pole);
      owners.push(pole.source);
      domain[pole.end === "bottom" ? 0 : 1] = pole.source.station;
    }
    return {
      domain,
      at: (station: number): IAutoMovieLoftCapSource.ISource | null => {
        if (ordinary(station, ...principal)) return null;
        return (
          owners.find((source): boolean => includes(source, station)) ?? null
        );
      },
    };
  }

  /** Actual cap owner outside the principal rows, or null on ordinary rows. */
  export function at(
    chain: IAutoMovieLoftChain,
    station: number,
  ): IAutoMovieLoftCapSource.ISource | null {
    const first: number = chain.layers[0]!.y;
    const last: number = chain.layers[chain.layers.length - 1]!.y;
    if (ordinary(station, first, last)) return null;
    for (const pole of [chain.pole, chain.opposite]) {
      if (pole?.source === undefined) continue;
      check(chain, pole);
      const source: IAutoMovieLoftCapSource.ISource = pole.source;
      if (includes(source, station)) return source;
    }
    return null;
  }
}

/** Admit the coordinate before checking whether the ordinary chain owns it. */
function ordinary(station: number, first: number, last: number): boolean {
  if (!Number.isFinite(station))
    throw new Error("A loft station must be finite.");
  return station >= first && station <= last;
}

/** Test the actual cap coordinate interval, in either end direction. */
function includes(
  source: IAutoMovieLoftCapSource.ISource,
  station: number,
): boolean {
  return (
    station >= Math.min(source.station, source.adjacent) &&
    station <= Math.max(source.station, source.adjacent)
  );
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

/** Reject stale ownership before evaluating any geometry callback. */
function check(chain: IAutoMovieLoftChain, pole: Pole): void {
  const source: IAutoMovieLoftCapSource.ISource = pole.source!;
  if (
    source === null ||
    typeof source !== "object" ||
    !Array.isArray(source.point) ||
    source.point.length !== 3 ||
    !source.point.every(Number.isFinite)
  )
    throw new Error(
      `The retained original ${pole.end} cap of ${chain.name} is malformed.`,
    );
  const index: number = pole.end === "bottom" ? 0 : chain.layers.length - 1;
  const layer: IAutoMovieLoftChain.ILayer = chain.layers[index]!;
  const native: IAutoMovieLoftSectionSource.ISource | null =
    AutoMovieLoftSectionSource.validate(chain, index, index);
  AutoMovieLoftFrameSource.validate(layer);
  if (
    native === null ||
    source.station !== native.data.domain[pole.end === "bottom" ? 0 : 1] ||
    source.adjacent !== layer.y ||
    !Number.isFinite(source.station) ||
    !(pole.end === "bottom"
      ? source.station < layer.y
      : source.station > layer.y) ||
    typeof source.axis?.at !== "function" ||
    binding(layer) !== source.boundary ||
    JSON.stringify(native.data) !== source.scalar ||
    pole.point.some((x: number, k: number): boolean => x !== source.point[k]) ||
    layer.lift !== undefined
  )
    throw new Error(
      `The retained original ${pole.end} cap of ${chain.name} is stale or unsupported.`,
    );
}
