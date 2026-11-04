import { AutoMovieHumanLoftAperture } from "../lofting/AutoMovieHumanLoftAperture";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { AutoMovieHumanBodyApertures } from "./AutoMovieHumanBodyApertures";
import { AutoMovieHumanBodyRoots } from "./AutoMovieHumanBodyRoots";

/**
 * The chain an opening is trimmed from: of the chains whose stations hold the
 * opening's margin heights, the one whose trim loop (the outline projected
 * onto the chain along the opening's forward axis, `AutoMovieHumanBodyRoots.trim`)
 * lands on the outline, the nearest when more than one does. The opening is
 * then a trim loop in that chain's chart, and the skin's tessellation has the
 * hole by construction.
 */
export namespace AutoMovieHumanApertureBase {
  /** A base chain and the opening's trim loop on it. */
  export interface IBase {
    /** The chain. */
    chain: IAutoMovieHumanLoftChain;

    /** The trim loop, `[station, phase]` per outline point. */
    loop: [number, number][];
  }

  /**
   * Largest in-plane distance of a trim loop's point from the outline point it
   * solves for, mm: the station step the skin takes round an opening
   * (`AutoMovieHumanBodyApertures`, 0.5 mm) over five, the distance within
   * which a skin point already counted as lying on an opening's outline.
   */
  export const MISS: number = 0.1;

  /**
   * The base of an opening, or null when no single chain holds it.
   *
   * @param prepared The opening, its outline evaluated.
   * @param chains The calibration's chains.
   */
  export function of(
    prepared: AutoMovieHumanBodyApertures.IPrepared,
    chains: readonly IAutoMovieHumanLoftChain[],
  ): IBase | null {
    const range: [number, number] = AutoMovieHumanLoftAperture.range(AutoMovieHumanLoftAperture.polyline(prepared.aperture));
    let best: IBase | null = null;
    let least: number = MISS;
    for (const chain of chains) {
      const first: number = chain.layers[0]!.y;
      const last: number = chain.layers[chain.layers.length - 1]!.y;
      if (!(first <= range[0] && range[1] <= last)) continue;
      const loop: [number, number][] = AutoMovieHumanBodyRoots.trim(chain, prepared.outline, range);
      const miss: number = missOf(chain, prepared.outline, loop);
      if (miss <= least) {
        least = miss;
        best = { chain, loop };
      }
    }
    return best;
  }

  /** The largest in-plane distance of a loop's points from their outline points, mm. */
  function missOf(
    chain: IAutoMovieHumanLoftChain,
    outline: AutoMovieHumanLoftAperture.IOutline,
    loop: readonly [number, number][],
  ): number {
    let miss: number = 0;
    loop.forEach(([s, t]: [number, number], i: number): void => {
      const p: [number, number, number] = AutoMovieHumanLoftChain.ring(chain, s, [t])[0]!;
      const a: number = p[0] * outline.lateral[0] + p[1] * outline.lateral[1] + p[2] * outline.lateral[2];
      const b: number = p[0] * outline.up[0] + p[1] * outline.up[1] + p[2] * outline.up[2];
      const target: [number, number] = outline.points[i]!;
      miss = Math.max(miss, Math.hypot(a - target[0], b - target[1]));
    });
    return miss;
  }
}
