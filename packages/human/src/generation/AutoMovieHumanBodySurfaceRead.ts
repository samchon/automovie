import {
  AutoMovieLoftChain,
  type IAutoMovieLoftChain,
} from "@automovie/engine";

import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanSurfaceContext as IContext } from "./IAutoMovieHumanSurfaceContext";

/** The body surface's readers: a chain by name, a ring's vertices, an end's height and the interval and circular arithmetic of phases. */
export namespace AutoMovieHumanBodySurfaceRead {
  /** Calibration chain by name; a missing chain is a calibration defect. */
  export function chain(context: IContext, name: string): IAutoMovieLoftChain {
    const found: IAutoMovieLoftChain | undefined = context.chains.get(name);
    if (found === undefined)
      throw new Error(`Calibration lacks the ${name} chain`);
    return found;
  }

  /**
   * Group name `<chain>/<k>` of the band between two station heights: k is
   * the principal interval containing the band's middle height.
   */
  export function interval(
    target: IAutoMovieLoftChain,
    lower: number,
    upper: number,
  ): string {
    const middle: number = (lower + upper) / 2;
    let k: number = 0;
    while (k < target.layers.length - 2 && target.layers[k + 1]!.y <= middle)
      k++;
    return target.name + "/" + k.toString();
  }

  /** Forward phase distance from a to b in `[0, 2pi)`. */
  export function forward(a: number, b: number): number {
    const d: number = (b - a) % (2 * Math.PI);
    return d < -1e-12 ? d + 2 * Math.PI : Math.max(0, d);
  }

  /** Shortest circular distance between two phases. */
  export function circular(a: number, b: number): number {
    return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  }

  /** Height of a chain's bottom or top principal layer in mm. */
  export function endHeight(
    target: IAutoMovieLoftChain,
    end: "bottom" | "top",
  ): number {
    return end === "bottom"
      ? target.layers[0]!.y
      : target.layers[target.layers.length - 1]!.y;
  }

  /** Read a retained true tip through the public Point0 owner. Stale or clipped ownership propagates its original failure; no private source domain or guessed endpoint is used. */
  export function capHeight(
    target: IAutoMovieLoftChain,
    end: "bottom" | "top",
  ): number | null {
    const tip: IAutoMovieLoftChain["pole"] =
      target.pole?.end === end
        ? target.pole
        : target.opposite?.end === end
          ? target.opposite
          : undefined;
    if (tip?.source === undefined) return null;
    AutoMovieLoftChain.point(target, tip.source.station, 0);
    return tip.source.station;
  }

  /**
   * Create ring vertices and record their loft coordinates.
   *
   * @returns The new vertex indices, in phase order.
   */
  export function ringVertices(
    context: IContext,
    target: IAutoMovieLoftChain,
    station: number,
    phases: readonly number[],
  ): number[] {
    const chain: number = context.indices.get(target.name)!;
    for (const t of phases) context.coordinates.push(chain, station, t);
    return AutoMovieHumanLoftMesh.vertices(
      context.mesh,
      AutoMovieLoftChain.ring(target, station, phases),
    );
  }
}
