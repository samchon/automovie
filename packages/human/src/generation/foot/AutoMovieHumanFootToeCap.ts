import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import type { AutoMovieHumanFootToeBreadth } from "./AutoMovieHumanFootToeBreadth";

/**
 * Where a toe's tip starts to close: the length along the line at which the
 * section's equivalent radius, `sqrt(half breadth * depth / 2)`, reaches the
 * length left to the apex, so the dome that closes it leaves the shaft without
 * a step. The search is a bracketed root, not a stepped scan, so the answer
 * moves continuously with the inputs.
 */
export namespace AutoMovieHumanFootToeCap {
  /**
   * The cap's length along a toe's line, mm.
   *
   * @param breadth The toe's line and breadth.
   * @param index Which toe, 0 for the hallux.
   */
  export function of(breadth: AutoMovieHumanFootToeBreadth.IBreadth, index: number): number {
    const t: AutoMovieHumanFootPrior.IToe = AutoMovieHumanFootPrior.PRIOR.toes[index]!;
    const closes = (s: number): boolean =>
      Math.sqrt(0.5 * breadth.half(s) * 2 * breadth.shape(s) * t.depth) >= breadth.length - s;

    return G.root(closes, 0.3 * breadth.length, breadth.length - 1, breadth.length - 1);
  }
}
