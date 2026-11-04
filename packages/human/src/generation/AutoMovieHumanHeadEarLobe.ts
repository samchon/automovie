import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import type { IAutoMovieHumanHeadEarSampler } from "./IAutoMovieHumanHeadEarSampler";
import type { IAutoMovieHumanHeadLoopLayer } from "./IAutoMovieHumanHeadLoopLayer";

/**
 * The lobule: the ear's free lower end, from the subaurale up to the lobe's top
 * (the lowest attachment, otobasion inferius). Its loops are the ear's free
 * path drawn in toward its pole as the lobe narrows (the path shrinks with its
 * chord), and the relief on its anterior face thins with it, so the lobule is a
 * small closed bag with no rings of its own.
 *
 * Reads the ear's sampler (its free loop and the share the lobe has drawn in at
 * a height). Publishes the lobe's layers, 24 of them from 0.02 mm over the
 * subaurale to the lobe's top, and the point that closes its bottom end.
 */
export namespace AutoMovieHumanHeadEarLobe {
  /**
   * The lobe's layers in the left frame, bottom first.
   *
   * @param sampler The ear's fixed input.
   * @returns One loop per height.
   */
  export function layers(sampler: IAutoMovieHumanHeadEarSampler): IAutoMovieHumanHeadLoopLayer[] {
    const ear: IAutoMovieHumanHeadEarSampler["ear"] = sampler.ear;
    return AutoMovieHumanHeadMath.uniform(ear.bottom + 0.02, ear.lower, LAYERS).map(
      (y: number): IAutoMovieHumanHeadLoopLayer => ({
        y,
        loop: sampler.free(y, sampler.sink(y), 1 - sampler.sink(y)),
      }),
    );
  }

  /**
   * The pole that closes the lobe's bottom: the centroid of its lowest loop,
   * 0.03 mm under the subaurale.
   *
   * @param sampler The ear's fixed input.
   * @param lowest The lobe's lowest loop.
   * @param sign 1 for the left side, -1 for the right.
   */
  export function pole(
    sampler: IAutoMovieHumanHeadEarSampler,
    lowest: readonly [number, number][],
    sign: 1 | -1,
  ): [number, number, number] {
    return AutoMovieHumanHeadMath.lifted(
      AutoMovieHumanHeadMath.centroid(lowest),
      sampler.ear.bottom - 0.03,
      sign,
    );
  }

  /** Layers of the lobe: more than the rows the chain carries, so its narrowing is read, not guessed. */
  export const LAYERS: number = 24;
}
