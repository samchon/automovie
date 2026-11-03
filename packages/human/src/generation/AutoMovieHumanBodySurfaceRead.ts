import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanSurfaceContext as IContext } from "./IAutoMovieHumanSurfaceContext";

/** The body surface's readers: a chain by name, a ring's vertices, an end's height and the interval and circular arithmetic of phases. */
export namespace AutoMovieHumanBodySurfaceRead {
  /** Calibration chain by name; a missing chain is a calibration defect. */
  export function chain(context: IContext, name: string): IAutoMovieHumanLoftChain {
    const found: IAutoMovieHumanLoftChain | undefined =
      context.chains.get(name);
    if (found === undefined)
      throw new Error(`Calibration lacks the ${name} chain`);
    return found;
  }

  /**
   * Group name `<chain>/<k>` of the band between two station heights: k is
   * the principal interval containing the band's middle height.
   */
  export function interval(
    target: IAutoMovieHumanLoftChain,
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
    target: IAutoMovieHumanLoftChain,
    end: "bottom" | "top",
  ): number {
    return end === "bottom"
      ? target.layers[0]!.y
      : target.layers[target.layers.length - 1]!.y;
  }

  /**
   * Create ring vertices and record their loft coordinates.
   *
   * @returns The new vertex indices, in phase order.
   */
  export function ringVertices(
    context: IContext,
    target: IAutoMovieHumanLoftChain,
    station: number,
    phases: readonly number[],
  ): number[] {
    const chain: number = context.indices.get(target.name)!;
    for (const t of phases) context.coordinates.push(chain, station, t);
    return AutoMovieHumanLoftMesh.vertices(
      context.mesh,
      AutoMovieHumanLoftChain.ring(target, station, phases),
    );
  }
}
