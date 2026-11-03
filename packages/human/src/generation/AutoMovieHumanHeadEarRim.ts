import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import type { IAutoMovieHumanHeadEarSampler } from "./IAutoMovieHumanHeadEarSampler";
import type { IAutoMovieHumanHeadLoopLayer } from "./IAutoMovieHumanHeadLoopLayer";

/**
 * The helix's free rim: the top of the ear above the pocket's split, a loop
 * that is the free path with the anterior relief fading out over the helix's
 * roll (the fold) as the ear rises off the head, to a single pole at the top.
 * The layers climb by a quarter sine, so they are densest where the rim turns
 * over and sparse along its straight run.
 *
 * Reads the ear's sampler (its free loop, the rise off the head and the fold).
 * Publishes the rim's layers, 38 of them from the split to 0.04 mm under the
 * top, and the pole that closes it.
 */
export namespace AutoMovieHumanHeadEarRim {
  /**
   * The rim's layers in the left frame, bottom first.
   *
   * @param sampler The ear's fixed input.
   * @returns One loop per height.
   */
  export function layers(sampler: IAutoMovieHumanHeadEarSampler): IAutoMovieHumanHeadLoopLayer[] {
    const ear: IAutoMovieHumanHeadEarSampler["ear"] = sampler.ear;
    return Array.from(
      { length: LAYERS },
      (_: unknown, i: number): number =>
        ear.split + (ear.top - 0.04 - ear.split) * Math.sin(((i / (LAYERS - 1)) * Math.PI) / 2),
    ).map(
      (y: number): IAutoMovieHumanHeadLoopLayer => ({
        y,
        loop: sampler.free(y, sampler.rise(y), sampler.fold(y)),
      }),
    );
  }

  /**
   * The pole that closes the rim's top: the centroid of its highest loop,
   * 0.03 mm over the ear's top.
   *
   * @param sampler The ear's fixed input.
   * @param highest The rim's highest loop.
   * @param sign 1 for the left side, -1 for the right.
   */
  export function pole(
    sampler: IAutoMovieHumanHeadEarSampler,
    highest: readonly [number, number][],
    sign: 1 | -1,
  ): [number, number, number] {
    return AutoMovieHumanHeadMath.lifted(
      AutoMovieHumanHeadMath.centroid(highest),
      sampler.ear.top + 0.03,
      sign,
    );
  }

  /** Layers of the rim between the split and the top. */
  export const LAYERS: number = 38;
}
