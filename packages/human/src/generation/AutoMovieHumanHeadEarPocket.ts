import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import type { IAutoMovieHumanHeadEarSampler } from "./IAutoMovieHumanHeadEarSampler";
import type { IAutoMovieHumanHeadLoopLayer } from "./IAutoMovieHumanHeadLoopLayer";

/**
 * The pocket under the helix's roll: the small closed cavity between the
 * helix and the scapha, an oval along the anterior skin that opens at the
 * pit, shrinks to 8 percent of its size toward the ear's roof and closes at
 * a pole there. It is its own chain (its phases are the oval's own, the
 * reflected side mirroring them), joined to the helix by the event the ear's
 * chains declare.
 *
 * Reads the ear's sampler (the pocket's oval at a height). Publishes the
 * pocket's layers, 10 of them from the split to 0.02 mm under the roof, and
 * the pole that closes it.
 */
export namespace AutoMovieHumanHeadEarPocket {
  /**
   * The pocket's layers in the left frame, bottom first.
   *
   * @param sampler The ear's fixed input.
   * @returns One loop per height.
   */
  export function layers(sampler: IAutoMovieHumanHeadEarSampler): IAutoMovieHumanHeadLoopLayer[] {
    const ear: IAutoMovieHumanHeadEarSampler["ear"] = sampler.ear;
    return AutoMovieHumanHeadMath.uniform(ear.split, ear.roof - 0.02, LAYERS).map(
      (y: number): IAutoMovieHumanHeadLoopLayer => ({ y, loop: sampler.pocketOval(y) }),
    );
  }

  /**
   * The pole that closes the pocket's top: the centroid of its highest loop,
   * 0.02 mm over the roof.
   *
   * @param sampler The ear's fixed input.
   * @param highest The pocket's highest loop.
   * @param sign 1 for the left side, -1 for the right.
   */
  export function pole(
    sampler: IAutoMovieHumanHeadEarSampler,
    highest: readonly [number, number][],
    sign: 1 | -1,
  ): [number, number, number] {
    return AutoMovieHumanHeadMath.lifted(
      AutoMovieHumanHeadMath.centroid(highest),
      sampler.ear.roof + 0.02,
      sign,
    );
  }

  /** Layers of the pocket between the split and the roof. */
  export const LAYERS: number = 10;
}
